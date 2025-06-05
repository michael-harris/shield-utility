// Comprehensive Shield Configuration Pre-calculator
// Generates ALL possible shield configurations and stores them for fast optimization

const fs = require('fs');

// Import the component data (copied from js/data.js for consistency)
const components = {
    generators: {
        compact: { 
            name: "Compact Shield Generator",
            capacity: 6000, 
            recharge: 300, 
            power: 10000, 
            cpu: 20000,
            image: "images/compact-shield-generator.png"
        },
        standard: {
            name: "Shield Generator",
            capacity: 12000,
            recharge: 300,
            power: 17500,
            cpu: 30000,
            image: "images/shield-generator.png"
        },
        advanced: {
            name: "Advanced Shield Generator",
            capacity: 24000,
            recharge: 600,
            power: 25000,
            cpu: 45000,
            image: "images/advanced-shield-generator.png"
        }
    },
    powerGenerators: {
        basicLarge: {
            name: "Basic Large Generator",
            capacity: 0,
            recharge: 0,
            powerOutput: 10000,
            power: -10000,
            cpu: 12500,
            image: "images/basic-large-generator.png"
        },
        improvedLarge: {
            name: "Improved Large Generator",
            capacity: 0,
            recharge: 0,
            powerOutput: 25000,
            power: -25000,
            cpu: 25000,
            image: "images/improved-large-generator.png"
        },
        advancedLarge: {
            name: "Advanced Large Generator",
            capacity: 0,
            recharge: 0,
            powerOutput: 100000,
            power: -100000,
            cpu: 50000,
            image: "images/advanced-large-generator.png"
        }
    },
    reactors: {
        small: {
            name: "Small Fusion Reactor",
            capacity: 0,
            recharge: 250,
            powerOutput: 300000,
            power: -300000, // Negative because it provides power
            cpu: 100000,
            size: "3x3x3",
            limit: 4,
            image: "images/small-fusion-reactor.png"
        },
        large: {
            name: "Large Fusion Reactor",
            capacity: 0,
            recharge: 1000,
            powerOutput: 1000000,
            power: -1000000,
            cpu: 200000,
            size: "5x5x5",
            limit: 2,
            image: "images/large-fusion-reactor.png"
        }
    },
    extenders: {
        advanced: {
            capacitor: {
                name: "Advanced Capacitor",
                capacity: 32000,
                recharge: -600,
                power: 16000,
                cpu: 18000,
                image: "images/advanced-shield-extender.png"
            },
            charger: {
                name: "Advanced Charger",
                capacity: -16000,
                recharge: 1200,
                power: 16000,
                cpu: 18000,
                image: "images/advanced-shield-extender.png"
            }
        },
        improved: {
            capacitor: {
                name: "Improved Capacitor",
                capacity: 16000,
                recharge: -300,
                power: 8000,
                cpu: 12000,
                image: "images/improved-shield-extender.png"
            },
            charger: {
                name: "Improved Charger",
                capacity: -8000,
                recharge: 600,
                power: 8000,
                cpu: 12000,
                image: "images/improved-shield-extender.png"
            }
        },
        basic: {
            capacitor: {
                name: "Basic Capacitor",
                capacity: 8000,
                recharge: -150,
                power: 4000,
                cpu: 8000,
                image: "images/basic-shield-extender.png"
            },
            charger: {
                name: "Basic Charger",
                capacity: -4000,
                recharge: 300,
                power: 4000,
                cpu: 8000,
                image: "images/basic-shield-extender.png"
            }
        }
    },
    tierLimits: {
        advanced: 4,
        improved: 6,
        basic: 8
    }
};

class ShieldCalculator {
    constructor() {
        this.components = components;
    }
    
    calculateStats(configuration) {
        let stats = {
            capacity: 0,
            recharge: 0,
            cpu: 0,
            power: 0
        };
        
        // Add generator stats
        if (configuration.generator && configuration.generator !== 'none') {
            const gen = this.components.generators[configuration.generator];
            if (gen) {
                stats.capacity += gen.capacity;
                stats.recharge += gen.recharge;
                stats.cpu += gen.cpu;
                stats.power += gen.power;
            }
        }
        
        // Add power generator stats
        if (configuration.powerGenerators) {
            for (const genType in configuration.powerGenerators) {
                const count = configuration.powerGenerators[genType];
                if (count > 0 && this.components.powerGenerators[genType]) {
                    const gen = this.components.powerGenerators[genType];
                    stats.capacity += gen.capacity * count;
                    stats.recharge += gen.recharge * count;
                    stats.cpu += gen.cpu * count;
                    stats.power += gen.power * count;
                }
            }
        }
        
        // Add reactor stats
        if (configuration.reactors) {
            if (configuration.reactors.small > 0) {
                const reactor = this.components.reactors.small;
                const count = Math.min(configuration.reactors.small, reactor.limit);
                stats.capacity += reactor.capacity * count;
                stats.recharge += reactor.recharge * count;
                stats.cpu += reactor.cpu * count;
                stats.power += reactor.power * count;
            }
            
            if (configuration.reactors.large > 0) {
                const reactor = this.components.reactors.large;
                const count = Math.min(configuration.reactors.large, reactor.limit);
                stats.capacity += reactor.capacity * count;
                stats.recharge += reactor.recharge * count;
                stats.cpu += reactor.cpu * count;
                stats.power += reactor.power * count;
            }
        }
        
        // Add extender stats
        if (configuration.extenders) {
            for (const tier in configuration.extenders) {
                if (this.components.extenders[tier]) {
                    // Capacitors
                    if (configuration.extenders[tier].capacitor > 0) {
                        const extender = this.components.extenders[tier].capacitor;
                        const count = configuration.extenders[tier].capacitor;
                        stats.capacity += extender.capacity * count;
                        stats.recharge += extender.recharge * count;
                        stats.cpu += extender.cpu * count;
                        stats.power += extender.power * count;
                    }
                    
                    // Chargers
                    if (configuration.extenders[tier].charger > 0) {
                        const extender = this.components.extenders[tier].charger;
                        const count = configuration.extenders[tier].charger;
                        stats.capacity += extender.capacity * count;
                        stats.recharge += extender.recharge * count;
                        stats.cpu += extender.cpu * count;
                        stats.power += extender.power * count;
                    }
                }
            }
        }
        
        return stats;
    }
    
    validateConfiguration(configuration, constraints = {}) {
        const stats = this.calculateStats(configuration);
        const warnings = [];
        
        // Check CPU limit
        if (constraints.cpuLimit && stats.cpu > constraints.cpuLimit) {
            warnings.push({
                type: 'cpu',
                message: `CPU usage exceeds limit`
            });
        }
        
        // Check power limit
        if (constraints.powerLimit && stats.power > constraints.powerLimit) {
            warnings.push({
                type: 'power',
                message: `Power usage exceeds limit`
            });
        }
        
        // Check for negative values
        if (stats.capacity < 0) {
            warnings.push({
                type: 'capacity',
                message: 'Shield capacity is negative'
            });
        }
        
        if (stats.recharge <= 0) {
            warnings.push({
                type: 'recharge',
                message: 'Shield recharge is zero or negative'
            });
        }
        
        // Check extender limits
        if (configuration.extenders) {
            for (const tier in configuration.extenders) {
                const tierLimit = this.components.tierLimits[tier];
                const tierTotal = (configuration.extenders[tier].capacitor || 0) + 
                                (configuration.extenders[tier].charger || 0);
                
                if (tierTotal > tierLimit) {
                    warnings.push({
                        type: 'extender',
                        message: `${tier} extenders exceed tier limit`
                    });
                }
            }
        }
        
        return {
            valid: warnings.length === 0,
            warnings: warnings,
            stats: stats
        };
    }
}

class ComprehensiveConfigGenerator {
    constructor() {
        this.calculator = new ShieldCalculator();
        this.allConfigurations = [];
    }
    
    // Generate ALL possible valid configurations
    generateAllConfigurations() {
        console.log('Generating all possible shield configurations...');
        const start = Date.now();
        
        const generators = ['compact', 'standard', 'advanced'];
        const maxPowerGens = 4; // Reasonable upper limit
        const maxSmallReactors = 4;
        const maxLargeReactors = 2;
        const maxAdvanced = 4;
        const maxImproved = 6;
        const maxBasic = 8;
        
        let configId = 0;
        let validConfigs = 0;
        let totalConfigs = 0;
        
        for (const generator of generators) {
            // Try all fusion reactor combinations
            for (let smallReactors = 0; smallReactors <= maxSmallReactors; smallReactors++) {
                for (let largeReactors = 0; largeReactors <= maxLargeReactors; largeReactors++) {
                    
                    // Try power generator combinations (Advanced and Improved only for efficiency)
                    for (let advancedGens = 0; advancedGens <= maxPowerGens; advancedGens++) {
                        for (let improvedGens = 0; improvedGens <= maxPowerGens; improvedGens++) {
                            
                            // Skip if both reactors and generators are present (redundant power)
                            if ((smallReactors > 0 || largeReactors > 0) && (advancedGens > 0 || improvedGens > 0)) {
                                continue;
                            }
                            
                            // Try all extender combinations
                            for (let advCap = 0; advCap <= maxAdvanced; advCap++) {
                                for (let advChg = 0; advChg <= maxAdvanced - advCap; advChg++) {
                                    for (let impCap = 0; impCap <= maxImproved; impCap++) {
                                        for (let impChg = 0; impChg <= maxImproved - impCap; impChg++) {
                                            for (let basCap = 0; basCap <= maxBasic; basCap++) {
                                                for (let basChg = 0; basChg <= maxBasic - basCap; basChg++) {
                                                    
                                                    totalConfigs++;
                                                    
                                                    const config = {
                                                        id: configId++,
                                                        generator: generator,
                                                        reactors: { 
                                                            small: smallReactors, 
                                                            large: largeReactors 
                                                        },
                                                        powerGenerators: {
                                                            basicLarge: 0, // Skip basic for efficiency
                                                            improvedLarge: improvedGens,
                                                            advancedLarge: advancedGens
                                                        },
                                                        extenders: {
                                                            advanced: { 
                                                                capacitor: advCap, 
                                                                charger: advChg 
                                                            },
                                                            improved: { 
                                                                capacitor: impCap, 
                                                                charger: impChg 
                                                            },
                                                            basic: { 
                                                                capacitor: basCap, 
                                                                charger: basChg 
                                                            }
                                                        }
                                                    };
                                                    
                                                    // Calculate stats and validate
                                                    const stats = this.calculator.calculateStats(config);
                                                    const validation = this.calculator.validateConfiguration(config);
                                                    
                                                    // Only store valid configurations with positive capacity and recharge
                                                    if (validation.valid && stats.capacity > 0 && stats.recharge > 0) {
                                                        
                                                        // CRITICAL: Only store self-sufficient configurations (no external power required)
                                                        if (stats.power > 0) {
                                                            continue; // Skip configs that need external power
                                                        }
                                                        
                                                        // Apply power utilization rules
                                                        const usesGenerators = (advancedGens > 0 || improvedGens > 0);
                                                        const usesFusion = (smallReactors > 0 || largeReactors > 0);
                                                        let powerUtilizationValid = true;
                                                        
                                                        if (usesGenerators && !usesFusion) {
                                                            // For generator-only builds, enforce 50% utilization rule
                                                            const totalPowerGeneration = (advancedGens * 100000) + (improvedGens * 25000);
                                                            const shieldPowerRequirement = totalPowerGeneration + stats.power; // stats.power is negative
                                                            const utilizationPercent = shieldPowerRequirement / totalPowerGeneration;
                                                            powerUtilizationValid = utilizationPercent <= 0.5;
                                                        }
                                                        
                                                        if (powerUtilizationValid) {
                                                            // Store only essential data in compact format
                                                            const compactConfig = [
                                                                // Config: [gen, smallR, largeR, advG, impG, advCap, advChg, impCap, impChg, basCap, basChg]
                                                                generator === 'compact' ? 0 : generator === 'standard' ? 1 : 2,
                                                                smallReactors,
                                                                largeReactors,
                                                                advancedGens,
                                                                improvedGens,
                                                                advCap,
                                                                advChg,
                                                                impCap,
                                                                impChg,
                                                                basCap,
                                                                basChg,
                                                                // Stats: [capacity, recharge, cpu, power]
                                                                stats.capacity,
                                                                stats.recharge,
                                                                stats.cpu,
                                                                stats.power,
                                                                // Metrics: [rechargeTime, usesGenerators, usesFusion]
                                                                Math.round(stats.capacity / stats.recharge * 10) / 10,
                                                                usesGenerators ? 1 : 0,
                                                                usesFusion ? 1 : 0
                                                            ];
                                                            
                                                            this.allConfigurations.push(compactConfig);
                                                            validConfigs++;
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
                }
            }
        }
        
        const duration = Date.now() - start;
        console.log(`Generated ${validConfigs} valid configurations out of ${totalConfigs} total combinations in ${duration}ms`);
        
        return this.allConfigurations;
    }
    
    // Save configurations to JSON file
    saveToFile(filename = 'shield-configurations-complete.json') {
        const data = {
            metadata: {
                generatedAt: new Date().toISOString(),
                totalConfigurations: this.allConfigurations.length,
                version: '2.0.0',
                format: 'compact_array',
                schema: {
                    description: 'Each configuration is an array with 18 elements',
                    format: '[gen, smallR, largeR, advG, impG, advCap, advChg, impCap, impChg, basCap, basChg, capacity, recharge, cpu, power, rechargeTime, usesGenerators, usesFusion]',
                    generators: ['compact', 'standard', 'advanced'],
                    indices: {
                        generator: 0,
                        smallReactors: 1,
                        largeReactors: 2,
                        advancedGenerators: 3,
                        improvedGenerators: 4,
                        advancedCapacitors: 5,
                        advancedChargers: 6,
                        improvedCapacitors: 7,
                        improvedChargers: 8,
                        basicCapacitors: 9,
                        basicChargers: 10,
                        capacity: 11,
                        recharge: 12,
                        cpu: 13,
                        power: 14,
                        rechargeTime: 15,
                        usesGenerators: 16,
                        usesFusion: 17
                    }
                }
            },
            configurations: this.allConfigurations
        };
        
        try {
            fs.writeFileSync(filename, JSON.stringify(data));
            console.log(`Saved ${this.allConfigurations.length} configurations to ${filename}`);
            console.log(`File size: ${(fs.statSync(filename).size / 1024 / 1024).toFixed(2)} MB`);
        } catch (error) {
            console.error('Failed to save file:', error.message);
            // Try saving in chunks if too large
            console.log('Attempting to save in chunks...');
            this.saveInChunks(filename);
        }
    }
    
    // Save in multiple smaller files if single file is too large
    saveInChunks(basename = 'shield-configurations-complete') {
        const chunkSize = 100000; // 100k configs per file
        const totalChunks = Math.ceil(this.allConfigurations.length / chunkSize);
        
        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, this.allConfigurations.length);
            const chunk = this.allConfigurations.slice(start, end);
            
            const data = {
                metadata: {
                    generatedAt: new Date().toISOString(),
                    chunkNumber: i + 1,
                    totalChunks: totalChunks,
                    configsInChunk: chunk.length,
                    totalConfigurations: this.allConfigurations.length,
                    version: '2.0.0'
                },
                configurations: chunk
            };
            
            const filename = `${basename}-chunk-${i + 1}-of-${totalChunks}.json`;
            fs.writeFileSync(filename, JSON.stringify(data));
            console.log(`Saved chunk ${i + 1}/${totalChunks} (${chunk.length} configs) to ${filename}`);
        }
    }
}

// Generate the complete configuration database
console.log('Starting comprehensive shield configuration generation...');
const generator = new ComprehensiveConfigGenerator();
generator.generateAllConfigurations();
generator.saveToFile();
console.log('Complete!');