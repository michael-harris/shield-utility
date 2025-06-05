// Data generation script for shield optimization pre-calculations
// Run this script to generate the external data file with all core configurations

// Import required modules (simulated for Node.js environment)
// In actual use, this would be run in Node.js to generate the data file

const fs = require('fs');
const path = require('path');

// Simulated components data (in real implementation, this would import from data.js)
const components = {
    generators: {
        compact: { name: "Compact Shield Generator", capacity: 6000, recharge: 300, power: 10000, cpu: 20000 },
        standard: { name: "Shield Generator", capacity: 12000, recharge: 300, power: 17500, cpu: 30000 },
        advanced: { name: "Advanced Shield Generator", capacity: 24000, recharge: 600, power: 25000, cpu: 45000 }
    },
    powerGenerators: {
        basicLarge: { name: "Basic Large Generator", capacity: 0, recharge: 0, powerOutput: 10000, power: -10000, cpu: 12500 },
        improvedLarge: { name: "Improved Large Generator", capacity: 0, recharge: 0, powerOutput: 25000, power: -25000, cpu: 25000 },
        advancedLarge: { name: "Advanced Large Generator", capacity: 0, recharge: 0, powerOutput: 100000, power: -100000, cpu: 50000 }
    },
    reactors: {
        small: { name: "Small Fusion Reactor", capacity: 0, recharge: 250, powerOutput: 300000, power: -300000, cpu: 100000 },
        large: { name: "Large Fusion Reactor", capacity: 0, recharge: 1000, powerOutput: 1000000, power: -1000000, cpu: 200000 }
    }
};

// Simulated calculator class for data generation
class DataGenCalculator {
    calculateStats(config) {
        let stats = {
            capacity: 0,
            recharge: 0,
            power: 0,
            cpu: 0
        };
        
        // Add generator stats
        if (config.generator && components.generators[config.generator]) {
            const gen = components.generators[config.generator];
            stats.capacity += gen.capacity;
            stats.recharge += gen.recharge;
            stats.power += gen.power;
            stats.cpu += gen.cpu;
        }
        
        // Add reactor stats
        if (config.reactors) {
            if (config.reactors.small > 0) {
                const reactor = components.reactors.small;
                stats.capacity += reactor.capacity * config.reactors.small;
                stats.recharge += reactor.recharge * config.reactors.small;
                stats.power += reactor.power * config.reactors.small;
                stats.cpu += reactor.cpu * config.reactors.small;
            }
            if (config.reactors.large > 0) {
                const reactor = components.reactors.large;
                stats.capacity += reactor.capacity * config.reactors.large;
                stats.recharge += reactor.recharge * config.reactors.large;
                stats.power += reactor.power * config.reactors.large;
                stats.cpu += reactor.cpu * config.reactors.large;
            }
        }
        
        // Add power generator stats
        if (config.powerGenerators) {
            for (const [type, count] of Object.entries(config.powerGenerators)) {
                if (count > 0 && components.powerGenerators[type]) {
                    const gen = components.powerGenerators[type];
                    stats.capacity += gen.capacity * count;
                    stats.recharge += gen.recharge * count;
                    stats.power += gen.power * count;
                    stats.cpu += gen.cpu * count;
                }
            }
        }
        
        return stats;
    }
}

// Generate core configurations
function generateCoreConfigurations() {
    console.log('Generating core configurations for shield optimization...');
    const start = Date.now();
    
    const calculator = new DataGenCalculator();
    const configurations = [];
    let configId = 0;
    
    const generators = ['compact', 'standard', 'advanced'];
    const maxPowerGens = 4;
    const maxSmallReactors = 4;
    const maxLargeReactors = 2;
    
    for (const generator of generators) {
        // Fusion reactor configurations
        for (let smallReactors = 0; smallReactors <= maxSmallReactors; smallReactors++) {
            for (let largeReactors = 0; largeReactors <= maxLargeReactors; largeReactors++) {
                
                if (smallReactors > 0 || largeReactors > 0) {
                    const config = {
                        id: configId++,
                        generator: generator,
                        reactors: { small: smallReactors, large: largeReactors },
                        powerGenerators: { basicLarge: 0, improvedLarge: 0, advancedLarge: 0 }
                    };
                    
                    const stats = calculator.calculateStats(config);
                    configurations.push({
                        id: config.id,
                        config: config,
                        baseStats: stats,
                        type: 'fusion'
                    });
                }
                
                // Power generator configurations (no fusion)
                if (smallReactors === 0 && largeReactors === 0) {
                    for (let basicGens = 0; basicGens <= maxPowerGens; basicGens++) {
                        for (let improvedGens = 0; improvedGens <= maxPowerGens; improvedGens++) {
                            for (let advancedGens = 0; advancedGens <= maxPowerGens; advancedGens++) {
                                if (basicGens === 0 && improvedGens === 0 && advancedGens === 0) continue;
                                
                                const config = {
                                    id: configId++,
                                    generator: generator,
                                    reactors: { small: 0, large: 0 },
                                    powerGenerators: { 
                                        basicLarge: basicGens, 
                                        improvedLarge: improvedGens, 
                                        advancedLarge: advancedGens 
                                    }
                                };
                                
                                const stats = calculator.calculateStats(config);
                                
                                // Only include if power is sustainable
                                if (stats.power <= 0) {
                                    const totalPowerGeneration = (advancedGens * 100000) + (improvedGens * 25000) + (basicGens * 10000);
                                    if (totalPowerGeneration > 0) {
                                        const shieldPowerRequirement = totalPowerGeneration + stats.power;
                                        const utilizationPercent = shieldPowerRequirement / totalPowerGeneration;
                                        
                                        if (utilizationPercent <= 0.5) {
                                            configurations.push({
                                                id: config.id,
                                                config: config,
                                                baseStats: stats,
                                                type: 'generator'
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    const end = Date.now();
    console.log(`Generated ${configurations.length} core configurations in ${end - start}ms`);
    
    return configurations;
}

// Create the data file
function createDataFile() {
    const configurations = generateCoreConfigurations();
    
    const data = {
        coreConfigurations: configurations,
        generatedAt: new Date().toISOString(),
        version: '1.0',
        metadata: {
            totalConfigurations: configurations.length,
            fusionConfigs: configurations.filter(c => c.type === 'fusion').length,
            generatorConfigs: configurations.filter(c => c.type === 'generator').length
        }
    };
    
    // Write to file
    const outputPath = path.join(__dirname, 'data', 'shield-optimization-cache.json');
    
    // Ensure data directory exists
    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    
    console.log(`Data file created: ${outputPath}`);
    console.log(`Total configurations: ${data.metadata.totalConfigurations}`);
    console.log(`Fusion configs: ${data.metadata.fusionConfigs}`);
    console.log(`Generator configs: ${data.metadata.generatorConfigs}`);
    
    return outputPath;
}

// For browser environment, create a simplified version
function createBrowserDataFile() {
    const configurations = generateCoreConfigurations();
    
    const data = {
        coreConfigurations: configurations,
        generatedAt: new Date().toISOString(),
        version: '1.0'
    };
    
    // Return the data as a string that can be saved as a .js file
    const jsContent = `// Pre-calculated shield optimization data
// Generated automatically - do not edit manually
const SHIELD_OPTIMIZATION_CACHE = ${JSON.stringify(data, null, 2)};`;
    
    console.log('Browser-compatible data generated');
    return jsContent;
}

// Export for use in both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = { generateCoreConfigurations, createDataFile, createBrowserDataFile };
    
    // Run if executed directly
    if (require.main === module) {
        createDataFile();
    }
} else {
    // Browser environment
    window.ShieldDataGenerator = { generateCoreConfigurations, createBrowserDataFile };
}