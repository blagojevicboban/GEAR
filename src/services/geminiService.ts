import { GoogleGenAI, Type } from '@google/genai';

/**
 * Fallback training tasks in case the Gemini API is rate-limited or unavailable.
 */
const getFallbackTasks = (name: string) => [
    {
        taskName: 'Visual Inspection',
        description: `Perform a detailed 360-degree inspection of the ${name} to identify key mechanical components and potential wear points.`,
        difficulty: 'Basic',
    },
    {
        taskName: 'Operational Safety Audit',
        description: `Identify all safety labels and emergency stop locations on this equipment model.`,
        difficulty: 'Intermediate',
    },
    {
        taskName: 'Component Identification',
        description: `Locate the primary power interface and control modules as described in the technical manual for the ${name}.`,
        difficulty: 'Basic',
    },
];

/**
 * Analyzes the model description and suggests training tasks.
 * Uses gemini-3-flash-preview for efficiency and higher quota limits.
 */
export const analyzeModelDescription = async (
    name: string,
    description: string
) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Suggest 3 interactive training tasks for a VET student using a 3D model of ${name}. Context: ${description}`,
            config: {
                systemInstruction:
                    'You are an expert VET curriculum designer. Provide a JSON array of objects with taskName, description, and difficulty. Ensure the response is strictly valid JSON.',
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            taskName: { type: Type.STRING },
                            description: { type: Type.STRING },
                            difficulty: { type: Type.STRING },
                        },
                        required: ['taskName', 'description', 'difficulty'],
                    },
                },
            },
        });

        const text = response.text;
        if (!text) return getFallbackTasks(name);

        try {
            const parsed = JSON.parse(text.trim());
            return Array.isArray(parsed) ? parsed : getFallbackTasks(name);
        } catch (parseError) {
            console.warn('Failed to parse Gemini JSON, using fallback.');
            return getFallbackTasks(name);
        }
    } catch (error) {
        // Only log the message to avoid circular structure serialization errors in some environments
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('Gemini Task Error (using fallback):', errorMsg);
        return getFallbackTasks(name);
    }
};

/**
 * Generates optimization suggestions for 3D models.
 */
export const generateOptimizationSuggestions = async (
    fileSize: number,
    sector: string
) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `I have a 3D model in the ${sector} sector. File size is ${Math.round(fileSize / 1024 / 1024)}MB. Provide 3 specific tips to optimize this for Meta Quest 3 standalone browser.`,
            config: {
                systemInstruction:
                    'You are a WebXR performance expert. Respond with clear, concise optimization tips as plain text list.',
            },
        });

        const text = response.text;
        return (
            text ||
            '1. Use Draco mesh compression.\n2. Limit texture resolution to 2K.\n3. Reduce draw calls by merging static meshes.'
        );
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('Gemini Optimization Error (using default):', errorMsg);
        return '1. Enable Draco mesh compression for faster transmission.\n2. Ensure all textures are power-of-two (e.g., 1024x1024).\n3. Keep the total polygon count below 100k for mobile XR performance.';
    }
};
