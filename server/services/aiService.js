import { GoogleGenAI } from '@google/genai';
import { spawn } from 'child_process';
import pool from '../db.js';
import path from 'path';
import fs from 'fs';
import { uploadDir } from './fileService.js';
import { getSetting } from './settingsService.js';

const getApiKey = async () => {
    const dbKey = await getSetting('gemini_api_key', '');
    return dbKey || process.env.API_KEY || process.env.GEMINI_API_KEY;
};

export const optimizeModel = async (id) => {
    console.log(`Starting AI Optimization for model ${id}...`);
    const [rows] = await pool.query('SELECT * FROM models WHERE id = ?', [id]);
    if (rows.length === 0) throw new Error('Model not found');

    const model = rows[0];

    let localPath;
    if (model.modelUrl.startsWith('/api/uploads/')) {
        localPath = path.join(
            uploadDir,
            model.modelUrl.replace('/api/uploads/', '')
        );
    } else {
        localPath = path.join(uploadDir, path.basename(model.modelUrl));
    }

    if (!fs.existsSync(localPath)) {
        throw new Error('Source file not found on server');
    }

    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', [
            'server/scripts/optimize.py',
            localPath,
        ]);
        let dataString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.on('close', async (code) => {
            if (code !== 0)
                return reject(new Error('Optimization script failed'));

            try {
                const result = JSON.parse(dataString);
                let aiVerdict = 'AI Verification Skipped';

                const apiKey = await getApiKey();
                if (apiKey) {
                    try {
                        const ai = new GoogleGenAI({
                            apiKey: apiKey,
                        });
                        const prompt = `CAD Optimization Audit:\nStats: ${JSON.stringify(result)}\nContext: Is this safe for training? Returns JSON {status, reason}`;

                        const aiRes = await ai.models.generateContent({
                            model: 'gemini-2.0-flash-exp',
                            contents: prompt,
                            config: { responseMimeType: 'application/json' },
                        });
                        aiVerdict = aiRes.text;
                    } catch (e) {
                        console.error('AI Error', e);
                    }
                }

                await pool.query(
                    'UPDATE models SET optimizedUrl = ?, optimizationStats = ?, aiAnalysis = ?, optimized = 1 WHERE id = ?',
                    [result.output_path, JSON.stringify(result), aiVerdict, id]
                );

                resolve({ stats: result, ai: aiVerdict });
            } catch (err) {
                reject(err);
            }
        });
    });
};

export const generateLesson = async ({
    modelName,
    modelDescription,
    level,
    topic,
    stepCount = 5,
}) => {
    const apiKey = await getApiKey();
    if (!apiKey) {
        throw new Error('AI Service Unavailable (Missing Key)');
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    const systemPrompt = `You are an expert vocational teacher creating a lesson for a 3D interactive workbook.
    Create a ${stepCount}-step lesson plan for a 3D model of "${modelName}".
    
    Context/Description of model: ${modelDescription || 'Standard industrial component'}
    Target Audience Level: ${level || 'Intermediate'}
    Specific Topic Focus: ${topic || 'General Overview'}
    
    Return STRICT JSON array of objects. No markdown formatting outside the content field.
    Schema:
    [
      {
        "title": "Step Title",
        "content": "Educational content in Markdown format. Keep it concise (2-3 sentences).",
        "interaction_type": "read" | "find_part"
      }
    ]
    
    For 'find_part' interaction, only suggest it if the step asks the user to identify a specific component mentioned in the title.
    Avoid 'quiz' type for now.
    Start with an Introduction step. End with a Summary step.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: systemPrompt,
        config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
        },
    });

    const text = response.text();
    const cleanJson = text.replace(/```json|```/g, '').trim();
    const steps = JSON.parse(cleanJson);

    return steps.map((s, i) => ({
        id: `step-ai-${Date.now()}-${i}`,
        title: s.title,
        content: s.content,
        interaction_type: s.interaction_type || 'read',
        step_order: i + 1,
        model_id: '',
    }));
};
