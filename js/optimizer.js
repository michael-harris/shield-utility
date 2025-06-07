// Shield Optimization Engine
class ShieldOptimizer {
    constructor(calculator) {
        this.calculator = calculator;
        this.tolerance = 0.05;
        this.preCalculationEngine = null;
        this.initializePreCalculation();
    }
    
    async initializePreCalculation() {
        try {
            if (typeof PreCalculationEngine !== 'undefined') {
                this.preCalculationEngine = new PreCalculationEngine(this.calculator);
                await this.preCalculationEngine.generateCoreConfigurations();
                this.preCalculationEngine.isReady = true;
            }
        } catch (error) {
            this.preCalculationEngine = null;
        }
    }
    
    async optimize(targetCapacity, targetRecharge, constraints = {}, existingBlocks = {}, existingCrew = {}, strategy = 'cpu-efficiency') {
        // Store strategy in constraints for use in sub-methods
        constraints.strategy = strategy;
        
        let result;
        switch (strategy) {
            case 'max-balanced':
                result = this.optimizeMaxBalanced(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew);
                break;
            case 'max-capacity':
                result = this.optimizeMaxCapacity(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew);
                break;
            case 'max-recharge':
                result = this.optimizeMaxRecharge(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew);
                break;
            case 'cpu-efficiency':
            default:
                result = this.optimizeCPUEfficiency(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew);
                break;
        }
        
        if (result && result.success && result.stats.recharge <= 0) {
            return { success: false, reason: 'invalid_recharge_rate' };
        }
        
        return result;
    }
    
    optimizeCPUEfficiency(targetCapacity, targetRecharge, constraints = {}, existingBlocks = {}, existingCrew = {}) {
        const strategy = this.determineOptimalStrategy(targetCapacity, targetRecharge, existingBlocks, existingCrew);
        
        let bestResult = null;
        try {
            if (strategy === 'High Capacity') {
                bestResult = this.optimizeHighCapacity(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew);
            } else if (strategy === 'High Recharge') {
                bestResult = this.optimizeHighRecharge(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew);
            } else {
                bestResult = this.optimizeBalanced(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew);
            }
            
            if (bestResult && bestResult.success) {
                bestResult.strategy = constraints.considerPowerUsage === false ? strategy + ' (Shield Only)' : strategy;
            }
        } catch (error) {
            // Optimization failed
        }
        
        return bestResult || {
            success: false,
            reason: 'no_solution',
            message: 'No valid configuration found that meets the specified targets and constraints.'
        };
    }
    
    determineOptimalStrategy(targetCapacity, targetRecharge, existingBlocks, existingCrew = {}) {
        const blockCapacity = this.calculator.calculateBlockCapacity(existingBlocks);
        const neededCapacity = Math.max(0, targetCapacity - blockCapacity);
        
        const maxCapacityConfig = {
            generator: 'advanced',
            reactors: { small: 4, large: 2 },
            extenders: {
                advanced: { capacitor: 4, charger: 0 },
                improved: { capacitor: 6, charger: 0 },
                basic: { capacitor: 8, charger: 0 }
            },
            blocks: existingBlocks,
            crew: existingCrew
        };
        
        const maxRechargeConfig = {
            generator: 'advanced',
            reactors: { small: 4, large: 2 },
            extenders: {
                advanced: { capacitor: 0, charger: 4 },
                improved: { capacitor: 0, charger: 6 },
                basic: { capacitor: 0, charger: 8 }
            },
            blocks: existingBlocks,
            crew: existingCrew
        };
        
        const maxCapacityStats = this.calculator.calculateStats(maxCapacityConfig);
        const maxRechargeStats = this.calculator.calculateStats(maxRechargeConfig);
        
        const capacityDemand = targetCapacity / maxCapacityStats.capacity;
        const rechargeDemand = targetRecharge / maxRechargeStats.recharge;
        
        if (capacityDemand > 0.8 && rechargeDemand < 0.5) {
            return 'High Capacity';
        } else if (rechargeDemand > 0.8 && capacityDemand < 0.5) {
            return 'High Recharge';
        } else {
            return 'Balanced';
        }
    }

    optimizeBalanced(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew = {}) {
        if (!this.preCalculationEngine || !this.preCalculationEngine.coreConfigurations) {
            return this.optimizeExhaustive(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew);
        }
        
        const shieldConfig = this.findOptimalShield(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew);
        
        if (!shieldConfig) {
            return this.optimizeExhaustive(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew);
        }
        
        const shieldStats = this.calculator.calculateStats(shieldConfig);
        
        // If not considering power usage, return shield-only configuration
        if (!constraints.considerPowerUsage) {
            return {
                success: true,
                configuration: shieldConfig,
                stats: shieldStats,
                validation: this.calculator.validateConfiguration(shieldConfig, constraints),
                strategy: 'shield_only_approach'
            };
        }
        
        if (shieldStats.power <= 0) {
            return {
                success: true,
                configuration: shieldConfig,
                stats: shieldStats,
                validation: this.calculator.validateConfiguration(shieldConfig, constraints),
                strategy: 'shield_first_approach'
            };
        }
        
        const configWithPower = this.addPowerSource(shieldConfig, shieldStats.power, constraints);
        
        if (!configWithPower) {
            return { success: false, reason: 'no_power_solution' };
        }
        
        // Handle fusion reactor recharge bonus recalculation
        const usesFusion = (configWithPower.reactors.small > shieldConfig.reactors.small || 
                          configWithPower.reactors.large > shieldConfig.reactors.large);
        
        let finalConfig = configWithPower;
        
        if (usesFusion) {
            const smallFusionBonus = (configWithPower.reactors.small - shieldConfig.reactors.small) * this.calculator.components.reactors.small.recharge;
            const largeFusionBonus = (configWithPower.reactors.large - shieldConfig.reactors.large) * this.calculator.components.reactors.large.recharge;
            const totalFusionRechargeBonus = smallFusionBonus + largeFusionBonus;
            
            const adjustedTargetRecharge = Math.max(0, targetRecharge - totalFusionRechargeBonus);
            
            if (adjustedTargetRecharge < targetRecharge) {
                const newShieldConfig = this.findOptimalShield(targetCapacity, adjustedTargetRecharge, constraints, existingBlocks, existingCrew);
                
                if (newShieldConfig) {
                    newShieldConfig.powerGenerators = { ...configWithPower.powerGenerators };
                    newShieldConfig.reactors = { ...configWithPower.reactors };
                    finalConfig = newShieldConfig;
                }
            }
        }
        
        const finalStats = this.calculator.calculateStats(finalConfig);
        const validation = this.calculator.validateConfiguration(finalConfig, constraints);
        
        return {
            success: true,
            configuration: finalConfig,
            stats: finalStats,
            validation: validation,
            strategy: 'shield_first_approach'
        };
    }
    
    findOptimalShield(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew) {
        const maxAdvanced = constraints.maxAdvancedExtenders !== undefined ? constraints.maxAdvancedExtenders : 4;
        const maxImproved = constraints.maxImprovedExtenders !== undefined ? constraints.maxImprovedExtenders : 6;
        const maxBasic = constraints.maxBasicExtenders !== undefined ? constraints.maxBasicExtenders : 8;
        const maxSmallReactors = constraints.maxSmallReactors !== undefined ? constraints.maxSmallReactors : 2;
        const maxLargeReactors = constraints.maxLargeReactors !== undefined ? constraints.maxLargeReactors : 1;
        
        let bestConfig = null;
        let bestScore = -1;
        
        for (const coreConfig of this.preCalculationEngine.coreConfigurations) {
            const baseConfig = coreConfig.config;
            
            if (constraints.generatorType && baseConfig.generator !== constraints.generatorType) {
                continue;
            }
            
            const usesFusion = baseConfig.reactors.small > 0 || baseConfig.reactors.large > 0;
            if (usesFusion && (baseConfig.reactors.small > maxSmallReactors || baseConfig.reactors.large > maxLargeReactors)) {
                continue;
            }
            
            // If not considering power usage, skip fusion reactors unless absolutely necessary
            if (!constraints.considerPowerUsage && usesFusion) {
                // Only use fusion reactors if user is not in cpu-efficiency mode
                // or if fusion reactors are unconstrained and using max strategies
                const strategy = constraints.strategy || 'cpu-efficiency';
                const fusionAllowed = (strategy !== 'cpu-efficiency') && 
                                    (maxSmallReactors > 0 || maxLargeReactors > 0);
                if (!fusionAllowed) {
                    continue;
                }
            }
            
            for (let advCap = 0; advCap <= maxAdvanced; advCap++) {
                for (let advChg = 0; advChg <= maxAdvanced - advCap; advChg++) {
                    for (let impCap = 0; impCap <= maxImproved; impCap++) {
                        for (let impChg = 0; impChg <= maxImproved - impCap; impChg++) {
                            for (let basCap = 0; basCap <= maxBasic; basCap++) {
                                for (let basChg = 0; basChg <= maxBasic - basCap; basChg++) {
                                    
                                    const testConfig = {
                                        generator: baseConfig.generator,
                                        reactors: { ...baseConfig.reactors },
                                        powerGenerators: { advancedLarge: 0, improvedLarge: 0 },
                                        extenders: {
                                            advanced: { capacitor: advCap, charger: advChg },
                                            improved: { capacitor: impCap, charger: impChg },
                                            basic: { capacitor: basCap, charger: basChg }
                                        },
                                        blocks: { ...existingBlocks },
                                        crew: { ...existingCrew }
                                    };
                                    
                                    const stats = this.calculator.calculateStats(testConfig);
                                    
                                    const meetsCapacity = !targetCapacity || stats.capacity >= targetCapacity * 0.95;
                                    const meetsRecharge = !targetRecharge || stats.recharge >= targetRecharge * 0.95;
                                    
                                    if (meetsCapacity && meetsRecharge) {
                                        const score = 1000000 - stats.cpu;
                                        if (score > bestScore) {
                                            bestScore = score;
                                            bestConfig = testConfig;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return bestConfig;
    }
    
    addPowerSource(shieldConfig, powerRequired, constraints) {
        const newConfig = JSON.parse(JSON.stringify(shieldConfig));
        const isConstrainedToGenerators = (constraints.maxSmallReactors === 0 && constraints.maxLargeReactors === 0);
        
        const maxUtilization = 0.65;
        let powerNeeded = powerRequired / maxUtilization;
        
        const maxSmallReactors = constraints.maxSmallReactors !== undefined ? constraints.maxSmallReactors : 2;
        const maxLargeReactors = constraints.maxLargeReactors !== undefined ? constraints.maxLargeReactors : 1;
        
        // Enforce maximum power generator limits (4 each as shown in UI)
        const maxPowerGenerators = 4;
        
        while (powerNeeded > 0) {
            // Check if we can add improved large generator
            if (powerNeeded <= 25000 && newConfig.powerGenerators.improvedLarge < maxPowerGenerators) {
                // Validate constraints before adding
                const testConfig = JSON.parse(JSON.stringify(newConfig));
                testConfig.powerGenerators.improvedLarge += 1;
                const testStats = this.calculator.calculateStats(testConfig);
                const validation = this.calculator.validateConfiguration(testConfig, constraints);
                
                if (validation.valid) {
                    newConfig.powerGenerators.improvedLarge += 1;
                    powerNeeded = 0;
                    break;
                } else {
                    return null; // Cannot add due to constraint violation
                }
            }
            
            // Check if we can add advanced large generator
            if (powerNeeded <= 100000 && newConfig.powerGenerators.advancedLarge < maxPowerGenerators) {
                // Validate constraints before adding
                const testConfig = JSON.parse(JSON.stringify(newConfig));
                testConfig.powerGenerators.advancedLarge += 1;
                const testStats = this.calculator.calculateStats(testConfig);
                const validation = this.calculator.validateConfiguration(testConfig, constraints);
                
                if (validation.valid) {
                    newConfig.powerGenerators.advancedLarge += 1;
                    powerNeeded = 0;
                    break;
                } else {
                    return null; // Cannot add due to constraint violation
                }
            }
            
            // Check if we can add small reactor
            if (!isConstrainedToGenerators && maxSmallReactors > newConfig.reactors.small && powerNeeded <= 300000) {
                // Validate constraints before adding
                const testConfig = JSON.parse(JSON.stringify(newConfig));
                testConfig.reactors.small += 1;
                const testStats = this.calculator.calculateStats(testConfig);
                const validation = this.calculator.validateConfiguration(testConfig, constraints);
                
                if (validation.valid) {
                    newConfig.reactors.small += 1;
                    powerNeeded = 0;
                    break;
                } else {
                    return null; // Cannot add due to constraint violation
                }
            }
            
            // Check if we can add large reactor
            if (!isConstrainedToGenerators && maxLargeReactors > newConfig.reactors.large && powerNeeded <= 1000000) {
                // Validate constraints before adding
                const testConfig = JSON.parse(JSON.stringify(newConfig));
                testConfig.reactors.large += 1;
                const testStats = this.calculator.calculateStats(testConfig);
                const validation = this.calculator.validateConfiguration(testConfig, constraints);
                
                if (validation.valid) {
                    newConfig.reactors.large += 1;
                    powerNeeded = 0;
                    break;
                } else {
                    return null; // Cannot add due to constraint violation
                }
            }
            
            // Try to add multiple components to meet high power needs
            if (!isConstrainedToGenerators && maxLargeReactors > newConfig.reactors.large) {
                // Validate constraints before adding
                const testConfig = JSON.parse(JSON.stringify(newConfig));
                testConfig.reactors.large += 1;
                const testStats = this.calculator.calculateStats(testConfig);
                const validation = this.calculator.validateConfiguration(testConfig, constraints);
                
                if (validation.valid) {
                    newConfig.reactors.large += 1;
                    powerNeeded -= 1000000;
                } else {
                    return null; // Cannot add due to constraint violation
                }
            } else if (!isConstrainedToGenerators && maxSmallReactors > newConfig.reactors.small) {
                // Validate constraints before adding
                const testConfig = JSON.parse(JSON.stringify(newConfig));
                testConfig.reactors.small += 1;
                const testStats = this.calculator.calculateStats(testConfig);
                const validation = this.calculator.validateConfiguration(testConfig, constraints);
                
                if (validation.valid) {
                    newConfig.reactors.small += 1;
                    powerNeeded -= 300000;
                } else {
                    return null; // Cannot add due to constraint violation
                }
            } else if (newConfig.powerGenerators.advancedLarge < maxPowerGenerators) {
                // Validate constraints before adding
                const testConfig = JSON.parse(JSON.stringify(newConfig));
                testConfig.powerGenerators.advancedLarge += 1;
                const testStats = this.calculator.calculateStats(testConfig);
                const validation = this.calculator.validateConfiguration(testConfig, constraints);
                
                if (validation.valid) {
                    newConfig.powerGenerators.advancedLarge += 1;
                    powerNeeded -= 100000;
                } else {
                    return null; // Cannot add due to constraint violation
                }
            } else {
                // Cannot add any more power sources without violating constraints
                return null;
            }
        }
        
        // Verify 35% surplus requirement for generator builds
        const usesGenerators = (newConfig.powerGenerators.advancedLarge > 0 || newConfig.powerGenerators.improvedLarge > 0);
        const usesFusion = (newConfig.reactors.small > 0 || newConfig.reactors.large > 0);
        
        if (usesGenerators && !usesFusion) {
            const totalGeneration = (newConfig.powerGenerators.advancedLarge * 100000) + (newConfig.powerGenerators.improvedLarge * 25000);
            const actualUtilization = powerRequired / totalGeneration;
            
            if (actualUtilization > 0.65) {
                const requiredGeneration = powerRequired / 0.65;
                const additionalPowerNeeded = requiredGeneration - totalGeneration;
                
                if (additionalPowerNeeded <= 25000 && newConfig.powerGenerators.improvedLarge < maxPowerGenerators) {
                    // Validate constraints before adding
                    const testConfig = JSON.parse(JSON.stringify(newConfig));
                    testConfig.powerGenerators.improvedLarge += 1;
                    const validation = this.calculator.validateConfiguration(testConfig, constraints);
                    
                    if (validation.valid) {
                        newConfig.powerGenerators.improvedLarge += 1;
                    } else {
                        return null; // Cannot add due to constraint violation
                    }
                } else if (newConfig.powerGenerators.advancedLarge < maxPowerGenerators) {
                    // Validate constraints before adding
                    const testConfig = JSON.parse(JSON.stringify(newConfig));
                    testConfig.powerGenerators.advancedLarge += 1;
                    const validation = this.calculator.validateConfiguration(testConfig, constraints);
                    
                    if (validation.valid) {
                        newConfig.powerGenerators.advancedLarge += 1;
                    } else {
                        return null; // Cannot add due to constraint violation
                    }
                } else {
                    return null; // Cannot add more generators due to limits
                }
            }
        }
        
        // Final validation check
        const finalValidation = this.calculator.validateConfiguration(newConfig, constraints);
        if (!finalValidation.valid) {
            return null; // Configuration violates constraints
        }
        
        return newConfig;
    }
    
    // Fallback exhaustive search method
    optimizeExhaustive(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew = {}) {
        const maxAdvanced = constraints.maxAdvancedExtenders !== undefined ? constraints.maxAdvancedExtenders : 4;
        const maxImproved = constraints.maxImprovedExtenders !== undefined ? constraints.maxImprovedExtenders : 6;
        const maxBasic = constraints.maxBasicExtenders !== undefined ? constraints.maxBasicExtenders : 8;
        const maxSmallReactors = constraints.maxSmallReactors !== undefined ? constraints.maxSmallReactors : 2;
        const maxLargeReactors = constraints.maxLargeReactors !== undefined ? constraints.maxLargeReactors : 1;
        
        let bestConfig = null;
        let bestScore = -1;
        
        const generatorTypes = constraints.generatorType ? [constraints.generatorType] : ['compact', 'standard', 'advanced'];
        
        for (const generatorType of generatorTypes) {
            const reactorConfigs = (maxSmallReactors === 0 && maxLargeReactors === 0) ? [[0, 0]] : [];
            
            if (maxSmallReactors > 0 || maxLargeReactors > 0) {
                for (let smallReactors = 0; smallReactors <= maxSmallReactors; smallReactors++) {
                    for (let largeReactors = 0; largeReactors <= maxLargeReactors; largeReactors++) {
                        reactorConfigs.push([smallReactors, largeReactors]);
                    }
                }
            }
            
            for (const [smallReactors, largeReactors] of reactorConfigs) {
                const maxPowerGens = 4;
                for (let advancedGens = 0; advancedGens <= maxPowerGens; advancedGens++) {
                    for (let improvedGens = 0; improvedGens <= maxPowerGens; improvedGens++) {
                        if ((smallReactors > 0 || largeReactors > 0) && (advancedGens > 0 || improvedGens > 0)) {
                            continue;
                        }
                        
                        for (let advCap = 0; advCap <= maxAdvanced; advCap++) {
                            for (let advChg = 0; advChg <= maxAdvanced - advCap; advChg++) {
                                for (let impCap = 0; impCap <= maxImproved; impCap++) {
                                    for (let impChg = 0; impChg <= maxImproved - impCap; impChg++) {
                                        for (let basCap = 0; basCap <= maxBasic; basCap++) {
                                            for (let basChg = 0; basChg <= maxBasic - basCap; basChg++) {
                                                
                                                const config = {
                                                    generator: generatorType,
                                                    reactors: { small: smallReactors, large: largeReactors },
                                                    powerGenerators: {
                                                        advancedLarge: advancedGens,
                                                        improvedLarge: improvedGens
                                                    },
                                                    extenders: {
                                                        advanced: { capacitor: advCap, charger: advChg },
                                                        improved: { capacitor: impCap, charger: impChg },
                                                        basic: { capacitor: basCap, charger: basChg }
                                                    },
                                                    blocks: { ...existingBlocks },
                                                    crew: { ...existingCrew }
                                                };
                                                
                                                const stats = this.calculator.calculateStats(config);
                                                
                                                const meetsCapacity = !targetCapacity || this.isWithinTolerance(stats.capacity, targetCapacity);
                                                const meetsRecharge = !targetRecharge || this.isWithinTolerance(stats.recharge, targetRecharge);
                                                
                                                if (meetsCapacity && meetsRecharge) {
                                                    const validation = this.calculator.validateConfiguration(config, constraints);
                                                    
                                                    if (validation.valid) {
                                                        const score = 1000000 - stats.cpu;
                                                        if (score > bestScore) {
                                                            bestScore = score;
                                                            bestConfig = { config, stats, validation };
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
        
        if (bestConfig) {
            return {
                success: true,
                configuration: bestConfig.config,
                stats: bestConfig.stats,
                validation: bestConfig.validation,
                strategy: 'exhaustive_search'
            };
        }
        
        return { success: false, reason: 'no_valid_configuration' };
    }

    // Strategy-specific optimization methods (simplified)
    optimizeHighCapacity(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew = {}) {
        // If not considering power usage, find optimal shield-only configuration
        if (!constraints.considerPowerUsage) {
            const shieldConfig = this.findOptimalShield(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew);
            if (!shieldConfig) {
                return { success: false, reason: 'no_solution' };
            }
            const shieldStats = this.calculator.calculateStats(shieldConfig);
            return {
                success: true,
                configuration: shieldConfig,
                stats: shieldStats,
                validation: this.calculator.validateConfiguration(shieldConfig, constraints),
                strategy: 'High Capacity (Shield Only)'
            };
        }
        return this.optimizeWithPriority(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew, 'capacity');
    }

    optimizeHighRecharge(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew = {}) {
        // If not considering power usage, find optimal shield-only configuration
        if (!constraints.considerPowerUsage) {
            const shieldConfig = this.findOptimalShield(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew);
            if (!shieldConfig) {
                return { success: false, reason: 'no_solution' };
            }
            const shieldStats = this.calculator.calculateStats(shieldConfig);
            return {
                success: true,
                configuration: shieldConfig,
                stats: shieldStats,
                validation: this.calculator.validateConfiguration(shieldConfig, constraints),
                strategy: 'High Recharge (Shield Only)'
            };
        }
        return this.optimizeWithPriority(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew, 'recharge');
    }
    
    optimizeWithPriority(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew, priority) {
        // Use the balanced approach but with priority-based scoring
        const result = this.optimizeBalanced(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew);
        if (result && result.success) {
            result.strategy = priority === 'capacity' ? 'High Capacity' : 'High Recharge';
        }
        return result;
    }
    
    optimizeMaxBalanced(targetCapacity, targetRecharge, constraints = {}, existingBlocks = {}, existingCrew = {}) {
        // Find highest possible capacity with recharge time between 30-40 seconds
        return this.findMaxCapacityConstrained(30, 40, constraints, existingBlocks, existingCrew, 'Max Balanced');
    }
    
    optimizeMaxCapacity(targetCapacity, targetRecharge, constraints = {}, existingBlocks = {}, existingCrew = {}) {
        // Find highest possible capacity with positive recharge
        return this.findMaxCapacityConstrained(0.01, Infinity, constraints, existingBlocks, existingCrew, 'Max Capacity');
    }
    
    optimizeMaxRecharge(targetCapacity, targetRecharge, constraints = {}, existingBlocks = {}, existingCrew = {}) {
        // Find highest possible capacity with recharge time <= 15 seconds
        return this.findMaxCapacityConstrained(0.01, 15, constraints, existingBlocks, existingCrew, 'Max Recharge');
    }
    
    findMaxCapacityConstrained(minRechargeTime, maxRechargeTime, constraints = {}, existingBlocks = {}, existingCrew = {}, strategyName) {
        const maxAdvanced = constraints.maxAdvancedExtenders !== undefined ? constraints.maxAdvancedExtenders : 4;
        const maxImproved = constraints.maxImprovedExtenders !== undefined ? constraints.maxImprovedExtenders : 6;
        const maxBasic = constraints.maxBasicExtenders !== undefined ? constraints.maxBasicExtenders : 8;
        const maxSmallReactors = constraints.maxSmallReactors !== undefined ? constraints.maxSmallReactors : 2;
        const maxLargeReactors = constraints.maxLargeReactors !== undefined ? constraints.maxLargeReactors : 1;
        
        let bestConfig = null;
        let bestCapacity = -1;
        
        const generatorTypes = constraints.generatorType ? [constraints.generatorType] : ['compact', 'standard', 'advanced'];
        
        for (const generatorType of generatorTypes) {
            // Generate all possible reactor configurations
            const reactorConfigs = [];
            
            // If not considering power usage, try without reactors first
            if (!constraints.considerPowerUsage) {
                reactorConfigs.push([0, 0]);
            }
            
            // Add reactor configurations
            for (let smallReactors = 0; smallReactors <= maxSmallReactors; smallReactors++) {
                for (let largeReactors = 0; largeReactors <= maxLargeReactors; largeReactors++) {
                    reactorConfigs.push([smallReactors, largeReactors]);
                }
            }
            
            for (const [smallReactors, largeReactors] of reactorConfigs) {
                // Try all possible power generator configurations if considering power
                const maxPowerGens = constraints.considerPowerUsage ? 4 : 0;
                for (let advancedGens = 0; advancedGens <= maxPowerGens; advancedGens++) {
                    for (let improvedGens = 0; improvedGens <= maxPowerGens; improvedGens++) {
                        if ((smallReactors > 0 || largeReactors > 0) && (advancedGens > 0 || improvedGens > 0)) {
                            continue; // Don't mix reactors and generators
                        }
                        
                        // Try all possible extender configurations
                        for (let advCap = 0; advCap <= maxAdvanced; advCap++) {
                            for (let advChg = 0; advChg <= maxAdvanced - advCap; advChg++) {
                                for (let impCap = 0; impCap <= maxImproved; impCap++) {
                                    for (let impChg = 0; impChg <= maxImproved - impCap; impChg++) {
                                        for (let basCap = 0; basCap <= maxBasic; basCap++) {
                                            for (let basChg = 0; basChg <= maxBasic - basCap; basChg++) {
                                                
                                                const config = {
                                                    generator: generatorType,
                                                    reactors: { small: smallReactors, large: largeReactors },
                                                    powerGenerators: {
                                                        advancedLarge: advancedGens,
                                                        improvedLarge: improvedGens,
                                                        basicLarge: 0
                                                    },
                                                    extenders: {
                                                        advanced: { capacitor: advCap, charger: advChg },
                                                        improved: { capacitor: impCap, charger: impChg },
                                                        basic: { capacitor: basCap, charger: basChg }
                                                    },
                                                    blocks: { ...existingBlocks },
                                                    crew: { ...existingCrew }
                                                };
                                                
                                                const stats = this.calculator.calculateStats(config);
                                                
                                                // Check if recharge is positive and meets recharge time constraint
                                                if (stats.recharge <= 0) continue;
                                                
                                                const rechargeTime = stats.capacity / stats.recharge;
                                                if (rechargeTime < minRechargeTime || rechargeTime > maxRechargeTime) continue;
                                                
                                                // Validate against constraints
                                                const validation = this.calculator.validateConfiguration(config, constraints);
                                                if (!validation.valid && validation.warnings.some(w => w.type === 'cpu' || w.type === 'power')) {
                                                    continue; // Skip if it violates hard constraints
                                                }
                                                
                                                // Check if this has higher capacity than current best
                                                if (stats.capacity > bestCapacity) {
                                                    bestCapacity = stats.capacity;
                                                    bestConfig = {
                                                        config: config,
                                                        stats: stats,
                                                        validation: validation
                                                    };
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
        
        if (bestConfig) {
            const strategyLabel = constraints.considerPowerUsage === false ? strategyName + ' (Shield Only)' : strategyName;
            return {
                success: true,
                configuration: bestConfig.config,
                stats: bestConfig.stats,
                validation: bestConfig.validation,
                strategy: strategyLabel
            };
        }
        
        return { success: false, reason: 'no_valid_configuration' };
    }
    
    isWithinTolerance(actual, target) {
        if (!target) return true;
        const minTarget = target * (1 - this.tolerance);
        return actual >= minTarget;
    }
}