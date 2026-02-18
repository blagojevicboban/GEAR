
import axios from 'axios';

async function testDetailedFields() {
  const API_KEY = 'JW5B5OrElJKt1JurUIQvvqAHu7RGUaUb';

  try {
    console.log('--- Fetching Detailed Fields for Si (mp-149) ---');
    const response = await axios.get(
        'https://api.materialsproject.org/materials/summary/',
        {
            headers: {
                'X-API-KEY': API_KEY,
                'User-Agent': 'GEAR-App/1.0',
            },
            params: {
                material_ids: 'mp-149',
                _fields: 'material_id,formula_pretty,structure,symmetry,energy_above_hull,band_gap,formation_energy_per_atom,ordering,total_magnetization,is_stable,density,nsites,volume,theoretical',
            },
        }
    );

    if (response.data && response.data.data && response.data.data.length > 0) {
        const item = response.data.data[0];
        // Print everything except long structure data
        const { structure, ...rest } = item;
        console.log('Fields:', JSON.stringify(rest, null, 2));
        console.log('Structure lattice:', JSON.stringify(structure?.lattice, null, 2).substring(0, 500));
        console.log('Structure sites count:', structure?.sites?.length);
        // Show first site
        if (structure?.sites?.[0]) {
            console.log('First site:', JSON.stringify(structure.sites[0], null, 2));
        }
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testDetailedFields();
