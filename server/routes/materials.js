import pool from "../db.js";

import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

/**
 * Interface MaterialProperty {
 *   id: string; // e.g. "mp-149"
 *   name: string; // e.g. "Silicon"
 *   formula: string; // "Si"
 *   density: number; // g/cm³
 *   type: 'metal' | 'semiconductor' | 'insulator';
 *   // ... other physics props
 * }
 */

// MOCK DATA for Fallback (if API Key is missing or quota exceeded)
const MOCK_MATERIALS = [
    {
        id: 'mock-1',
        name: 'Silicon (Mock)',
        formula: 'Si',
        density: 2.33,
        type: 'semiconductor',
        bandGap: 1.12,
    },
    {
        id: 'mock-2',
        name: 'Gold (Mock)',
        formula: 'Au',
        density: 19.3,
        type: 'metal',
        bandGap: 0,
    },
];

// Helper to determine type based on band gap
const getMaterialType = (bandGap) => {
    if (bandGap === 0) return 'metal';
    if (bandGap > 0 && bandGap < 4) return 'semiconductor';
    return 'insulator';
};


// GET /api/materials/search?query=Formula
router.get('/search', async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter required' });
    }

    // 0. Fetch Config from DB
    let API_KEY = process.env.MP_API_KEY;
    try {
        const [rows] = await pool.query(
            "SELECT setting_value FROM system_settings WHERE setting_key = 'material_project_api_key'"
        );
        if (rows.length > 0 && rows[0].setting_value) {
            API_KEY = rows[0].setting_value;
        }
    } catch (e) {
        console.warn('Failed to fetch config from DB, using env fallback');
    }

    // 1. Check if API Key is configured
    if (!API_KEY || API_KEY.trim() === '' || API_KEY === 'your_key_here' || API_KEY === 'YOUR_API_KEY_HERE') {
        console.warn('[Materials API] No valid API Key found. Using Mock Data.');
        // Filter mock data
        const results = MOCK_MATERIALS.filter(
            (m) =>
                m.formula.toLowerCase().includes(query.toLowerCase()) ||
                m.name.toLowerCase().includes(query.toLowerCase())
        );
        return res.json({ source: 'mock', data: results });
    }

    API_KEY = API_KEY.trim();

    // 2. Query Real API (Materials Project Next-Gen)
    try {
        // Using the 'summary' endpoint which is best for general properties
        // First try exact formula match
        let response = await axios.get(
            'https://api.materialsproject.org/materials/summary/',
            {
                headers: {
                    'X-API-KEY': API_KEY,
                    'User-Agent': 'GEAR-App/1.0',
                },
                params: {
                    formula: query, 
                    _fields: 'material_id,formula_pretty,density,band_gap,volume',
                },
            }
        );

        // If no results, try partial/wildcard search if the query looks like an element list (e.g. "Si-O")
        // Note: The MP API is strict. We might need to handle element-based search if formula fails.
        // For now, we will stick to exact formula, but adding error handling for 404s to fallback to elements search could be next step.

        if (response.data && response.data.data && response.data.data.length > 0) {
            // Map MP response to our simplified format
            const materials = response.data.data.map((item) => ({
                id: item.material_id,
                name: item.formula_pretty, // Uses pretty formula as name
                formula: item.formula_pretty,
                density: item.density,
                type: getMaterialType(item.band_gap),
                bandGap: item.band_gap,
                volume: item.volume,
            }));

            return res.json({ source: 'api', data: materials });
        } else {
             // If Exact Formula returned nothing, try fuzzy search in Mock Data as a backup-backup?
             // Or tell user "No material found".
             // Let's try to search by elements if the query contains a hyphen or comma
             if (query.includes('-') || query.includes(',')) {
                 // Elements search (e.g. Si,O)
                  const elements = query.split(/[-,\s]+/).join(',');
                  try {
                      response = await axios.get(
                        'https://api.materialsproject.org/materials/summary/',
                        {
                            headers: { 'X-API-KEY': API_KEY },
                            params: {
                                elements: elements,
                                _fields: 'material_id,formula_pretty,density,band_gap,volume',
                                _limit: 5 // Limit results for broad searches
                            }
                        }
                    );
                     if (response.data && response.data.data && response.data.data.length > 0) {
                             const materials = response.data.data.map((item) => ({
                                id: item.material_id,
                                name: item.formula_pretty,
                                formula: item.formula_pretty,
                                density: item.density,
                                type: getMaterialType(item.band_gap),
                                bandGap: item.band_gap,
                                volume: item.volume,
                            }));
                            return res.json({ source: 'api_elements', data: materials });
                     }
                  } catch (e) {
                      console.log("Elements search failed too");
                  }
             }
            
            return res.json({ source: 'api', data: [] });
        }
    } catch (error) {
        console.error(
            '[Materials API] Error fetching from MP:',
            error.response?.data || error.message
        );
        
        let errorMessage = 'API Error';
        // Check for specific API error messages
        if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        // Fallback to mock if API fails
        const results = MOCK_MATERIALS.filter(
            (m) =>
                m.formula.toLowerCase().includes(query.toLowerCase()) ||
                m.name.toLowerCase().includes(query.toLowerCase())
        );
        return res.json({
            source: 'mock_fallback',
            error: errorMessage,
            data: results,
        });
    }
});

// GET /api/materials/structure/:materialId - Detailed material info
router.get('/structure/:materialId', async (req, res) => {
    const { materialId } = req.params;

    if (!materialId) {
        return res.status(400).json({ error: 'Material ID required' });
    }

    // Fetch API Key (same logic as search)
    let API_KEY = process.env.MP_API_KEY;
    try {
        const [rows] = await pool.query(
            "SELECT setting_value FROM system_settings WHERE setting_key = 'material_project_api_key'"
        );
        if (rows.length > 0 && rows[0].setting_value) {
            API_KEY = rows[0].setting_value;
        }
    } catch (e) {
        console.warn('Failed to fetch config from DB for structure endpoint');
    }

    if (!API_KEY || API_KEY.trim() === '') {
        return res.status(400).json({ error: 'No API Key configured' });
    }

    API_KEY = API_KEY.trim();

    try {
        const response = await axios.get(
            'https://api.materialsproject.org/materials/summary/',
            {
                headers: {
                    'X-API-KEY': API_KEY,
                    'User-Agent': 'GEAR-App/1.0',
                },
                params: {
                    material_ids: materialId,
                    _fields: 'material_id,formula_pretty,structure,symmetry,energy_above_hull,band_gap,formation_energy_per_atom,ordering,total_magnetization,is_stable,density,nsites,volume,theoretical',
                },
            }
        );

        if (response.data && response.data.data && response.data.data.length > 0) {
            const item = response.data.data[0];
            const structure = item.structure;

            // Build complete result
            const result = {
                materialId: item.material_id,
                formula: item.formula_pretty,
                // Summary properties
                energy_above_hull: item.energy_above_hull,
                band_gap: item.band_gap,
                formation_energy_per_atom: item.formation_energy_per_atom,
                ordering: item.ordering,
                total_magnetization: item.total_magnetization,
                is_stable: item.is_stable,
                density: item.density,
                nsites: item.nsites,
                volume: item.volume,
                theoretical: item.theoretical,
                // Symmetry
                symmetry: item.symmetry ? {
                    crystal_system: item.symmetry.crystal_system,
                    symbol: item.symmetry.symbol,
                    number: item.symmetry.number,
                    point_group: item.symmetry.point_group,
                } : null,
                // Structure (lattice + sites)
                lattice: structure ? {
                    matrix: structure.lattice.matrix,
                    a: structure.lattice.a,
                    b: structure.lattice.b,
                    c: structure.lattice.c,
                    alpha: structure.lattice.alpha,
                    beta: structure.lattice.beta,
                    gamma: structure.lattice.gamma,
                    volume: structure.lattice.volume,
                } : null,
                sites: structure ? structure.sites.map((site) => ({
                    element: site.label,
                    xyz: site.xyz,
                    abc: site.abc,
                })) : [],
            };

            return res.json({ data: result });
        } else {
            return res.json({ error: 'Material not found', data: null });
        }
    } catch (error) {
        console.error('[Materials API] Structure fetch error:', error.response?.data || error.message);
        return res.status(500).json({ error: error.response?.data?.message || 'Failed to fetch structure' });
    }
});

export default router;
