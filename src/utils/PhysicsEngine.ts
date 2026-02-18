/**
 * PhysicsEngine.ts
 * Core logic for "Antigravity" Data-Driven Simulations.
 * Calculates real-world manufacturing parameters based on material properties.
 */

export interface MaterialProperties {
    density: number; // g/cm³
    thermalConductivity: number; // W/(m·K)
    meltingPoint: number | null; // K
    heatCapacity: number; // J/(g·K)
}

export interface LaserConfig {
    power: number; // Watts
    speed: number; // mm/s
    thickness: number; // mm
}

export const PhysicsEngine = {
    /**
     * Calculates the estimated cutting speed for a CO2 laser.
     * Formula: Speed ∝ (Power * Efficiency) / (Thickness * Density * HeatCapacity)
     * Note: This is a simplified engineering approximation for the prototype.
     */
    calculateLaserCuttingSpeed: (
        properties: MaterialProperties,
        config: LaserConfig
    ): number => {
        const efficiency = 0.85; // Machine efficiency factor

        // Energy required to vaporize/melt a unit volume approx proportional to Density * HeatCapacity
        // We add a baseline resistance based on thickness squared for non-linear cutting difficulty
        const materialResistance = properties.density * properties.heatCapacity;

        // Base speed calculation
        // Speed = Power / (Thickness * Resistance) * ScalingFactor
        const scalingFactor = 50; // Calibration constant to match real-world mm/s

        let estimatedSpeed =
            ((config.power * efficiency) /
                (config.thickness * materialResistance)) *
            scalingFactor;

        // Thermal conductivity penalty (heat dissipates instead of cutting)
        if (properties.thermalConductivity > 100) {
            estimatedSpeed *= 0.1; // Metals reflect/dissipate CO2 laser energy drastically
        }

        return Math.max(0, parseFloat(estimatedSpeed.toFixed(1)));
    },

    /**
     * Estimates UV Curing time for printing.
     * Stub for future implementation.
     */
    calculateUVCuringTime: (
        layerThickness: number,
        uvIntensity: number
    ): number => {
        return (layerThickness * 10) / uvIntensity;
    },
};
