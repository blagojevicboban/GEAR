/**
 * LODManager.ts
 * "Antigravity" Hardware-Agnostic Optimization Pipeline.
 * Detects device capabilities to serve the appropriate Asset Tier.
 */

export enum PerformanceTier {
    HIGH = 'HIGH', // Desktop Gaming PC
    MEDIUM = 'MEDIUM', // Laptop / High-end Mobile
    LOW = 'LOW', // Average Mobile / Integrated Graphics
    ECO = 'ECO', // Low-end Mobile / Tablet
}

export interface RenderConfig {
    pixelRatio: number;
    shadows: boolean;
    antialiasing: boolean;
    postProcessing: boolean;
    textureSizeCap: number;
    modelLOD: 'original' | 'optimized' | 'mobile'; // Which file to load
}

export class LODManager {
    static getTier(): PerformanceTier {
        const cores = navigator.hardwareConcurrency || 4;
        const userAgent = navigator.userAgent;

        // 1. Detect Mobile
        const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent);

        // 2. Detect Graphics Card (Heuristic)
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        let rendererString = '';
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                rendererString = gl.getParameter(
                    debugInfo.UNMASKED_RENDERER_WEBGL
                );
            }
        }

        const isAdreno = /Adreno/i.test(rendererString);
        const isMali = /Mali/i.test(rendererString);
        const isIntel = /Intel/i.test(rendererString);
        const isNvidia =
            /NVIDIA/i.test(rendererString) || /GeForce/i.test(rendererString);
        const isRadeon = /Radeon/i.test(rendererString);

        // Tier Logic
        if (isMobile) {
            if (
                cores <= 4 ||
                textIncludes(rendererString, ['Mali-G5', 'Adreno 5', 'PowerVR'])
            ) {
                return PerformanceTier.ECO;
            }
            return PerformanceTier.LOW;
        }

        // Desktop / Laptop
        if (
            isNvidia ||
            (isRadeon && !textIncludes(rendererString, ['Integrated']))
        ) {
            return PerformanceTier.HIGH;
        }

        if (
            isIntel ||
            textIncludes(rendererString, ['Integrated', 'UHD', 'Iris'])
        ) {
            // High-end integrated (Apple M1/M2 usually shows as Apple GPU)
            if (/Apple/i.test(rendererString) || cores >= 8) {
                return PerformanceTier.MEDIUM;
            }
            return PerformanceTier.LOW;
        }

        // Fallback based on cores
        if (cores >= 12) return PerformanceTier.HIGH;
        if (cores >= 6) return PerformanceTier.MEDIUM;
        return PerformanceTier.LOW;
    }

    static getConfig(tier: PerformanceTier): RenderConfig {
        switch (tier) {
            case PerformanceTier.HIGH:
                return {
                    pixelRatio: Math.min(window.devicePixelRatio, 2),
                    shadows: true,
                    antialiasing: true,
                    postProcessing: true,
                    textureSizeCap: 4096,
                    modelLOD: 'original',
                };
            case PerformanceTier.MEDIUM:
                return {
                    pixelRatio: Math.min(window.devicePixelRatio, 1.5),
                    shadows: true, // Lower resolution shadows in viewer logic
                    antialiasing: true,
                    postProcessing: false,
                    textureSizeCap: 2048,
                    modelLOD: 'optimized',
                };
            case PerformanceTier.LOW:
                return {
                    pixelRatio: 1.0,
                    shadows: false,
                    antialiasing: false,
                    postProcessing: false,
                    textureSizeCap: 1024,
                    modelLOD: 'mobile',
                };
            case PerformanceTier.ECO:
                return {
                    pixelRatio: 0.75, // Undersample for framerate
                    shadows: false,
                    antialiasing: false,
                    postProcessing: false,
                    textureSizeCap: 512,
                    modelLOD: 'mobile',
                };
        }
    }
}

function textIncludes(text: string, terms: string[]): boolean {
    return terms.some((term) =>
        text.toLowerCase().includes(term.toLowerCase())
    );
}
