// Shield Utility Engine
class ShieldUtility {
    constructor() {
        this.components = components;
    }
    
    // Calculate total stats for a given configuration
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
                    stats.power += gen.power * count; // Negative value (power generation)
                }
            }
        }
        
        // Add reactor stats
        if (configuration.reactors) {
            // Small reactors
            if (configuration.reactors.small > 0) {
                const reactor = this.components.reactors.small;
                const count = Math.min(configuration.reactors.small, reactor.limit);
                stats.capacity += reactor.capacity * count;
                stats.recharge += reactor.recharge * count;
                stats.cpu += reactor.cpu * count;
                stats.power += reactor.power * count; // Negative value (power generation)
            }
            
            // Large reactors
            if (configuration.reactors.large > 0) {
                const reactor = this.components.reactors.large;
                const count = Math.min(configuration.reactors.large, reactor.limit);
                stats.capacity += reactor.capacity * count;
                stats.recharge += reactor.recharge * count;
                stats.cpu += reactor.cpu * count;
                stats.power += reactor.power * count; // Negative value (power generation)
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
        
        // Add block stats
        if (configuration.blocks) {
            for (const blockType in configuration.blocks) {
                if (this.components.blocks[blockType] && configuration.blocks[blockType] > 0) {
                    const block = this.components.blocks[blockType];
                    const count = configuration.blocks[blockType];
                    stats.capacity += block.capacity * count;
                    stats.recharge += block.recharge || 0;
                    stats.cpu += block.cpu * count;
                    stats.power += block.power * count;
                }
            }
        }
        
        // Add crew stats (Shield Explorer only - not used in optimizer)
        if (configuration.crew && configuration.crew.shieldTechnicians > 0) {
            const technician = this.components.crew.shieldTechnician;
            const count = Math.min(configuration.crew.shieldTechnicians, technician.limit);
            stats.capacity += technician.capacity * count;
            stats.recharge += technician.recharge * count;
            stats.cpu += technician.cpu * count;
            stats.power += technician.power * count;
        }
        
        return stats;
    }
    
    // Calculate block capacity from block counts
    calculateBlockCapacity(blocks) {
        let totalCapacity = 0;
        
        for (const blockType in blocks) {
            if (this.components.blocks[blockType] && blocks[blockType] > 0) {
                const block = this.components.blocks[blockType];
                totalCapacity += block.capacity * blocks[blockType];
            }
        }
        
        return totalCapacity;
    }
    
    // Validate configuration constraints
    validateConfiguration(configuration, constraints = {}) {
        const stats = this.calculateStats(configuration);
        const warnings = [];
        
        // Check CPU limit
        if (constraints.cpuLimit && stats.cpu > constraints.cpuLimit) {
            warnings.push({
                type: 'cpu',
                message: `CPU usage (${ComponentUtils.formatNumber(stats.cpu)}) exceeds limit (${ComponentUtils.formatNumber(constraints.cpuLimit)})`
            });
        }
        
        // Check power limit
        if (constraints.powerLimit && stats.power > constraints.powerLimit) {
            warnings.push({
                type: 'power',
                message: `Power usage (${ComponentUtils.formatPower(stats.power)}) exceeds limit (${ComponentUtils.formatPower(constraints.powerLimit)})`
            });
        }
        
        // Check for negative values
        if (stats.capacity < 0) {
            warnings.push({
                type: 'capacity',
                message: 'Shield capacity is negative! Too many chargers reduce total capacity.'
            });
        }
        
        if (stats.recharge < 0) {
            warnings.push({
                type: 'recharge',
                message: 'Shield recharge is negative! Too many capacitors reduce recharge rate.'
            });
        }
        
        // Only warn about power if there aren't sufficient power generators
        if (stats.power > 0) {
            let totalPowerGeneration = 0;
            if (configuration.powerGenerators) {
                for (const genType in configuration.powerGenerators) {
                    const count = configuration.powerGenerators[genType];
                    if (count > 0 && this.components.powerGenerators[genType]) {
                        totalPowerGeneration += Math.abs(this.components.powerGenerators[genType].power) * count;
                    }
                }
            }
            
            // Only add warning if power generators don't cover the requirement
            if (totalPowerGeneration < stats.power) {
                const remainingPower = stats.power - totalPowerGeneration;
                warnings.push({
                    type: 'power',
                    message: `Configuration requires ${ComponentUtils.formatPower(remainingPower)} of additional external power.`
                });
            }
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
                        message: `${tier} extenders (${tierTotal}) exceed tier limit (${tierLimit})`
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
    
    // Check if target values are achievable
    isTargetAchievable(targetCapacity, targetRecharge, constraints = {}) {
        // Use constraints to determine actual maximum limits
        const maxAdvanced = constraints.maxAdvancedExtenders !== undefined ? constraints.maxAdvancedExtenders : 4;
        const maxImproved = constraints.maxImprovedExtenders !== undefined ? constraints.maxImprovedExtenders : 6;
        const maxBasic = constraints.maxBasicExtenders !== undefined ? constraints.maxBasicExtenders : 8;
        const maxSmallReactors = constraints.noFusionReactors ? 0 : (constraints.maxSmallReactors !== undefined ? constraints.maxSmallReactors : 4);
        const maxLargeReactors = constraints.noFusionReactors ? 0 : (constraints.maxLargeReactors !== undefined ? constraints.maxLargeReactors : 2);
        
        // Find maximum achievable capacity while maintaining positive recharge
        const maxCapacityConfig = this.findMaxCapacityWithPositiveRecharge(
            maxAdvanced, maxImproved, maxBasic, maxSmallReactors, maxLargeReactors, constraints
        );
        
        // Find maximum achievable recharge while maintaining positive capacity  
        const maxRechargeConfig = this.findMaxRechargeWithPositiveCapacity(
            maxAdvanced, maxImproved, maxBasic, maxSmallReactors, maxLargeReactors, constraints
        );
        
        const maxCapacityStats = this.calculateStats(maxCapacityConfig);
        const maxRechargeStats = this.calculateStats(maxRechargeConfig);
        
        
        // Check if targets are achievable
        return {
            capacityAchievable: !targetCapacity || maxCapacityStats.capacity >= targetCapacity,
            rechargeAchievable: !targetRecharge || maxRechargeStats.recharge >= targetRecharge,
            maxPossible: {
                capacity: maxCapacityStats.capacity,
                recharge: maxRechargeStats.recharge,
                cpu: Math.max(maxCapacityStats.cpu, maxRechargeStats.cpu),
                power: Math.max(maxCapacityStats.power, maxRechargeStats.power)
            }
        };
    }
    
    // Get component efficiency ranking
    getComponentEfficiency(type, prioritizeCapacity = true) {
        const components = [];
        
        if (type === 'capacitor') {
            for (const tier in this.components.extenders) {
                const component = this.components.extenders[tier].capacitor;
                components.push({
                    ...component,
                    tier: tier,
                    efficiencyScore: ComponentUtils.getEfficiencyScore(component, true)
                });
            }
        } else if (type === 'charger') {
            for (const tier in this.components.extenders) {
                const component = this.components.extenders[tier].charger;
                components.push({
                    ...component,
                    tier: tier,
                    efficiencyScore: ComponentUtils.getEfficiencyScore(component, false)
                });
            }
        }
        
        // Sort by efficiency (higher is better)
        return components.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
    }
    
    // Create empty configuration
    createEmptyConfiguration() {
        return {
            generator: 'none',
            powerGenerators: {
                basicLarge: 0,
                improvedLarge: 0,
                advancedLarge: 0
            },
            reactors: {
                small: 0,
                large: 0
            },
            extenders: {
                advanced: { capacitor: 0, charger: 0 },
                improved: { capacitor: 0, charger: 0 },
                basic: { capacitor: 0, charger: 0 }
            },
            blocks: {
                steel: 0,
                hardenedSteel: 0,
                combatSteel: 0,
                xenoSteel: 0
            }
        };
    }
    
    // Clone configuration
    cloneConfiguration(config) {
        return JSON.parse(JSON.stringify(config));
    }
    
    // Find maximum capacity while maintaining positive recharge
    findMaxCapacityWithPositiveRecharge(maxAdvanced, maxImproved, maxBasic, maxSmallReactors, maxLargeReactors, constraints) {
        const baseConfig = {
            generator: 'advanced',
            reactors: {
                small: maxSmallReactors,
                large: maxLargeReactors
            },
            extenders: {
                advanced: { capacitor: 0, charger: 0 },
                improved: { capacitor: 0, charger: 0 },
                basic: { capacitor: 0, charger: 0 }
            },
            blocks: constraints.blocks || {},
            crew: constraints.crew || {}
        };
        
        // Start with base stats and add capacitors greedily while keeping recharge > 0
        let bestConfig = this.cloneConfiguration(baseConfig);
        
        // Try adding capacitors in order of efficiency (advanced -> improved -> basic)
        const tierOrder = [
            { tier: 'advanced', max: maxAdvanced, capacity: 32000, recharge: -600 },
            { tier: 'improved', max: maxImproved, capacity: 16000, recharge: -300 },
            { tier: 'basic', max: maxBasic, capacity: 8000, recharge: -150 }
        ];
        
        for (const tierInfo of tierOrder) {
            for (let count = 1; count <= tierInfo.max; count++) {
                const testConfig = this.cloneConfiguration(bestConfig);
                testConfig.extenders[tierInfo.tier].capacitor = count;
                
                const testStats = this.calculateStats(testConfig);
                if (testStats.recharge > 0) {
                    bestConfig = testConfig;
                } else {
                    break; // Stop adding this tier if recharge goes negative
                }
            }
        }
        
        return bestConfig;
    }
    
    // Find maximum recharge while maintaining positive capacity
    findMaxRechargeWithPositiveCapacity(maxAdvanced, maxImproved, maxBasic, maxSmallReactors, maxLargeReactors, constraints) {
        const baseConfig = {
            generator: 'advanced',
            reactors: {
                small: maxSmallReactors,
                large: maxLargeReactors
            },
            extenders: {
                advanced: { capacitor: 0, charger: 0 },
                improved: { capacitor: 0, charger: 0 },
                basic: { capacitor: 0, charger: 0 }
            },
            blocks: constraints.blocks || {},
            crew: constraints.crew || {}
        };
        
        // Start with base stats and add chargers greedily while keeping capacity > 0
        let bestConfig = this.cloneConfiguration(baseConfig);
        
        // Try adding chargers in order of efficiency (advanced -> improved -> basic)
        const tierOrder = [
            { tier: 'advanced', max: maxAdvanced, capacity: -16000, recharge: 1200 },
            { tier: 'improved', max: maxImproved, capacity: -8000, recharge: 600 },
            { tier: 'basic', max: maxBasic, capacity: -4000, recharge: 300 }
        ];
        
        for (const tierInfo of tierOrder) {
            for (let count = 1; count <= tierInfo.max; count++) {
                const testConfig = this.cloneConfiguration(bestConfig);
                testConfig.extenders[tierInfo.tier].charger = count;
                
                const testStats = this.calculateStats(testConfig);
                if (testStats.capacity > 0) {
                    bestConfig = testConfig;
                } else {
                    break; // Stop adding this tier if capacity goes negative
                }
            }
        }
        
        return bestConfig;
    }
}