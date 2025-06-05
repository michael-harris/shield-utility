// Shield Optimization Engine
class ShieldOptimizer {
    constructor(calculator) {
        this.calculator = calculator;
        this.tolerance = 0.05; // 5% tolerance for target matching
        this.preCalculationEngine = null;
        this.initializePreCalculation();
    }
    
    // Initialize pre-calculation engine if available
    async initializePreCalculation() {
        try {
            if (typeof PreCalculationEngine !== 'undefined' && typeof SHIELD_OPTIMIZATION_CACHE !== 'undefined') {
                this.preCalculationEngine = new PreCalculationEngine(this.calculator);
                
                // Load from pre-calculated cache
                this.preCalculationEngine.coreConfigurations = SHIELD_OPTIMIZATION_CACHE.coreConfigurations;
                this.preCalculationEngine.buildLookupTable();
                this.preCalculationEngine.isReady = true;
                
            }
        } catch (error) {
            this.preCalculationEngine = null;
        }
    }
    
    // Main optimization function
    async optimize(targetCapacity, targetRecharge, constraints = {}, existingBlocks = {}, existingCrew = {}, strategy = 'cpu-efficiency') {
        // Try fast optimization first if available
        if (window.fastOptimizer) {
            try {
                const fastResult = await window.fastOptimizer.optimize(
                    targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew, strategy
                );
                
                if (fastResult && fastResult.success) {
                    return fastResult;
                }
            } catch (error) {
            }
        }
        
        // Try old pre-calculation engine if available
        if (this.preCalculationEngine && this.preCalculationEngine.isReady) {
            try {
                const fastResult = this.preCalculationEngine.fastOptimize(
                    strategy, constraints, targetCapacity, targetRecharge, existingBlocks, existingCrew
                );
                
                if (fastResult && fastResult.success) {
                    return fastResult;
                }
            } catch (error) {
            }
        }
        
        // Fall back to standard optimization methods
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
        
        // Only validate for truly invalid cases (recharge exactly 0), allow low but positive recharge
        if (result && result.success && result.stats.recharge <= 0) {
            return { success: false, reason: 'invalid_recharge_rate' };
        }
        
        return result;
    }
    
    
    // CPU-Efficiency strategy (original logic)
    optimizeCPUEfficiency(targetCapacity, targetRecharge, constraints = {}, existingBlocks = {}, existingCrew = {}) {
        // Apply fusion reactor limits for this strategy
        const modifiedConstraints = { ...constraints };
        modifiedConstraints.maxSmallReactors = Math.min(modifiedConstraints.maxSmallReactors || 4, 2);
        modifiedConstraints.maxLargeReactors = Math.min(modifiedConstraints.maxLargeReactors || 2, 1);
        
        // Determine which strategy to use based on targets
        const strategy = this.determineOptimalStrategy(targetCapacity, targetRecharge, existingBlocks, existingCrew);
        
        let bestResult = null;
        
        try {
            if (strategy === 'High Capacity') {
                bestResult = this.optimizeHighCapacity(targetCapacity, targetRecharge, modifiedConstraints, existingBlocks, existingCrew);
            } else if (strategy === 'High Recharge') {
                bestResult = this.optimizeHighRecharge(targetCapacity, targetRecharge, modifiedConstraints, existingBlocks, existingCrew);
            } else {
                bestResult = this.optimizeBalanced(targetCapacity, targetRecharge, modifiedConstraints, existingBlocks, existingCrew);
            }
            
            if (bestResult && bestResult.success) {
                bestResult.strategy = strategy;
            }
        } catch (error) {
            // Optimization strategy failed
        }
        
        return bestResult || {
            success: false,
            reason: 'no_solution',
            message: 'No valid configuration found that meets the specified targets and constraints.'
        };
    }
    
    // Determine which strategy to use based on target characteristics
    determineOptimalStrategy(targetCapacity, targetRecharge, existingBlocks, existingCrew = {}) {
        const blockCapacity = this.calculator.calculateBlockCapacity(existingBlocks);
        
        // Calculate what's needed from components
        const neededCapacity = Math.max(0, targetCapacity - blockCapacity);
        
        // Get theoretical maximums for comparison using CPU-Efficiency reactor limits
        const maxCapacityConfig = {
            generator: 'advanced',
            reactors: { small: 2, large: 1 }, // Use CPU-Efficiency limits
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
            reactors: { small: 2, large: 1 }, // Use CPU-Efficiency limits
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
        
        // Calculate demand ratios (how much of max capacity we're asking for)
        const capacityDemand = targetCapacity / maxCapacityStats.capacity;
        const rechargeDemand = targetRecharge / maxRechargeStats.recharge;
        
        // Strategy decision logic
        if (capacityDemand > 0.8 && rechargeDemand < 0.5) {
            return 'High Capacity'; // Need lots of capacity, moderate recharge
        } else if (rechargeDemand > 0.8 && capacityDemand < 0.5) {
            return 'High Recharge'; // Need lots of recharge, moderate capacity
        } else if (capacityDemand > 0.7 || rechargeDemand > 0.7) {
            return 'Balanced'; // Both are high demand
        } else {
            return 'Balanced'; // Both are moderate - use balanced approach
        }
    }

    // Balanced optimization - tries to meet both targets efficiently
    optimizeBalanced(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew = {}) {
        const maxAdvanced = constraints.maxAdvancedExtenders !== undefined ? constraints.maxAdvancedExtenders : 4;
        const maxImproved = constraints.maxImprovedExtenders !== undefined ? constraints.maxImprovedExtenders : 6;
        const maxBasic = constraints.maxBasicExtenders !== undefined ? constraints.maxBasicExtenders : 8;
        const maxSmallReactors = constraints.maxSmallReactors !== undefined ? constraints.maxSmallReactors : 4;
        const maxLargeReactors = constraints.maxLargeReactors !== undefined ? constraints.maxLargeReactors : 2;
        
        let bestConfig = null;
        let bestScore = -1;
        
        // Try all generator types to find the most efficient (or just the constrained one)
        const generatorTypes = constraints.generatorType ? [constraints.generatorType] : ['compact', 'standard', 'advanced'];
        
        for (const generatorType of generatorTypes) {
            // Try with and without reactors (unless no-fusion is checked)
            const reactorConfigs = (maxSmallReactors === 0 && maxLargeReactors === 0) ? [[0, 0]] : [];
            
            if (maxSmallReactors > 0 || maxLargeReactors > 0) {
                for (let smallReactors = 0; smallReactors <= maxSmallReactors; smallReactors++) {
                    for (let largeReactors = 0; largeReactors <= maxLargeReactors; largeReactors++) {
                        // For strategies with fusion limits (2 small, 1 large), don't mix types
                        if (maxSmallReactors === 2 && maxLargeReactors === 1 && 
                            smallReactors > 0 && largeReactors > 0) {
                            continue; // Skip combinations that use both types
                        }
                        reactorConfigs.push([smallReactors, largeReactors]);
                    }
                }
            }
            
            for (const [smallReactors, largeReactors] of reactorConfigs) {
                // Try power generator combinations (Advanced and Improved only)
                // Limit to reasonable numbers to avoid excessive computation
                const maxPowerGens = 4;
                for (let advancedGens = 0; advancedGens <= maxPowerGens; advancedGens++) {
                    for (let improvedGens = 0; improvedGens <= maxPowerGens; improvedGens++) {
                        // Skip if both reactors and generators are present (redundant)
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
                                        
                                        // Check if this config meets requirements (within 5% tolerance)
                                        const meetsCapacity = !targetCapacity || this.isWithinTolerance(stats.capacity, targetCapacity);
                                        const meetsRecharge = !targetRecharge || this.isWithinTolerance(stats.recharge, targetRecharge);
                                        
                                        
                                        if (meetsCapacity && meetsRecharge) {
                                            // Check constraints and power utilization rules
                                            const validation = this.calculator.validateConfiguration(config, constraints);
                                            
                                            // Apply 50% power constraint for generator-based builds
                                            const usesGenerators = (advancedGens > 0 || improvedGens > 0);
                                            const usesFusion = (smallReactors > 0 || largeReactors > 0);
                                            let powerUtilizationValid = true;
                                            
                                            if (usesGenerators && !usesFusion) {
                                                const totalPowerGeneration = (advancedGens * 100000) + (improvedGens * 25000);
                                                
                                                // If stats.power > 0, generators can't meet the demand - invalid
                                                if (stats.power > 0) {
                                                    powerUtilizationValid = false;
                                                } else {
                                                    // stats.power <= 0 means we have excess power
                                                    // Shield power requirement = totalPowerGeneration - abs(stats.power)
                                                    const shieldPowerRequirement = totalPowerGeneration + stats.power; // stats.power is negative
                                                    const utilizationPercent = shieldPowerRequirement / totalPowerGeneration;
                                                    powerUtilizationValid = utilizationPercent <= 0.5;
                                                }
                                            }
                                            
                                            if ((validation.valid || validation.warnings.length === 0) && powerUtilizationValid) {
                                                // Enhanced scoring: prioritize CPU efficiency with power considerations
                                                let score = 1000000 - stats.cpu; // Base CPU efficiency
                                                
                                                // Bonus for power-positive configurations
                                                if (stats.power <= 0) {
                                                    score += Math.abs(stats.power) / 1000; // Small bonus for excess power
                                                }
                                                
                                                // Additional bonus for efficient power utilization in generator builds
                                                if (usesGenerators && !usesFusion && stats.power <= 0) {
                                                    const totalPowerGeneration = (advancedGens * 100000) + (improvedGens * 25000);
                                                    const shieldPowerRequirement = totalPowerGeneration + stats.power; // stats.power is negative
                                                    const utilizationPercent = shieldPowerRequirement / totalPowerGeneration;
                                                    // Bonus for using less than 50% of power capacity (headroom is good)
                                                    if (utilizationPercent <= 0.5) {
                                                        score += (0.5 - utilizationPercent) * 10000;
                                                    }
                                                }
                                                
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

    // High Capacity optimization - prioritizes reaching capacity target with minimal CPU
    optimizeHighCapacity(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew = {}) {
        return this.optimizeWithPriority(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew, 'capacity');
    }

    // High Recharge optimization - prioritizes reaching recharge target with minimal CPU  
    optimizeHighRecharge(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew = {}) {
        return this.optimizeWithPriority(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew, 'recharge');
    }

    // Generic optimization with priority
    optimizeWithPriority(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew, priority) {
        const maxAdvanced = constraints.maxAdvancedExtenders !== undefined ? constraints.maxAdvancedExtenders : 4;
        const maxImproved = constraints.maxImprovedExtenders !== undefined ? constraints.maxImprovedExtenders : 6;
        const maxBasic = constraints.maxBasicExtenders !== undefined ? constraints.maxBasicExtenders : 8;
        const maxSmallReactors = constraints.maxSmallReactors !== undefined ? constraints.maxSmallReactors : 4;
        const maxLargeReactors = constraints.maxLargeReactors !== undefined ? constraints.maxLargeReactors : 2;
        
        let bestConfig = null;
        let bestScore = -1;
        
        // Try all generator types to find the most efficient (or just the constrained one)
        const generatorTypes = constraints.generatorType ? [constraints.generatorType] : ['compact', 'standard', 'advanced'];
        
        for (const generatorType of generatorTypes) {
            // Try with and without reactors (unless no-fusion is checked)
            const reactorConfigs = (maxSmallReactors === 0 && maxLargeReactors === 0) ? [[0, 0]] : [];
            
            if (maxSmallReactors > 0 || maxLargeReactors > 0) {
                for (let smallReactors = 0; smallReactors <= maxSmallReactors; smallReactors++) {
                    for (let largeReactors = 0; largeReactors <= maxLargeReactors; largeReactors++) {
                        // For strategies with fusion limits (2 small, 1 large), don't mix types
                        if (maxSmallReactors === 2 && maxLargeReactors === 1 && 
                            smallReactors > 0 && largeReactors > 0) {
                            continue; // Skip combinations that use both types
                        }
                        reactorConfigs.push([smallReactors, largeReactors]);
                    }
                }
            }
            
            for (const [smallReactors, largeReactors] of reactorConfigs) {
                // Try power generator combinations (Advanced and Improved only)
                // Limit to reasonable numbers to avoid excessive computation
                const maxPowerGens = 4;
                for (let advancedGens = 0; advancedGens <= maxPowerGens; advancedGens++) {
                    for (let improvedGens = 0; improvedGens <= maxPowerGens; improvedGens++) {
                        // Skip if both reactors and generators are present (redundant)
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
                                        
                                        // Check if this config meets requirements (within 5% tolerance)
                                        const meetsCapacity = !targetCapacity || this.isWithinTolerance(stats.capacity, targetCapacity);
                                        const meetsRecharge = !targetRecharge || this.isWithinTolerance(stats.recharge, targetRecharge);
                                        
                                        if (meetsCapacity && meetsRecharge) {
                                            // Check constraints and power utilization rules
                                            const validation = this.calculator.validateConfiguration(config, constraints);
                                            
                                            // Apply 50% power constraint for generator-based builds
                                            const usesGenerators = (advancedGens > 0 || improvedGens > 0);
                                            const usesFusion = (smallReactors > 0 || largeReactors > 0);
                                            let powerUtilizationValid = true;
                                            
                                            if (usesGenerators && !usesFusion) {
                                                const totalPowerGeneration = (advancedGens * 100000) + (improvedGens * 25000);
                                                
                                                // If stats.power > 0, generators can't meet the demand - invalid
                                                if (stats.power > 0) {
                                                    powerUtilizationValid = false;
                                                } else {
                                                    // stats.power <= 0 means we have excess power
                                                    // Shield power requirement = totalPowerGeneration - abs(stats.power)
                                                    const shieldPowerRequirement = totalPowerGeneration + stats.power; // stats.power is negative
                                                    const utilizationPercent = shieldPowerRequirement / totalPowerGeneration;
                                                    powerUtilizationValid = utilizationPercent <= 0.5;
                                                }
                                            }
                                            
                                            if ((validation.valid || validation.warnings.length === 0) && powerUtilizationValid) {
                                                // Enhanced priority-based scoring: CPU efficiency with power considerations
                                                let score = 1000000 - stats.cpu; // Base CPU efficiency
                                                
                                                if (priority === 'capacity') {
                                                    // Bonus for exceeding capacity target, penalty for falling short
                                                    if (targetCapacity) {
                                                        if (stats.capacity >= targetCapacity) {
                                                            score += (stats.capacity - targetCapacity) / 100; // Bonus for extra capacity
                                                        } else {
                                                            score -= (targetCapacity - stats.capacity) / 50; // Penalty for missing capacity
                                                        }
                                                    }
                                                } else if (priority === 'recharge') {
                                                    // Bonus for exceeding recharge target, penalty for falling short
                                                    if (targetRecharge) {
                                                        if (stats.recharge >= targetRecharge) {
                                                            score += (stats.recharge - targetRecharge) * 10; // Bonus for extra recharge
                                                        } else {
                                                            score -= (targetRecharge - stats.recharge) * 20; // Penalty for missing recharge
                                                        }
                                                    }
                                                }
                                                
                                                // Bonus for power-positive configurations
                                                if (stats.power <= 0) {
                                                    score += Math.abs(stats.power) / 1000; // Small bonus for excess power
                                                }
                                                
                                                // Additional bonus for efficient power utilization in generator builds
                                                if (usesGenerators && !usesFusion && stats.power <= 0) {
                                                    const totalPowerGeneration = (advancedGens * 100000) + (improvedGens * 25000);
                                                    const shieldPowerRequirement = totalPowerGeneration + stats.power; // stats.power is negative
                                                    const utilizationPercent = shieldPowerRequirement / totalPowerGeneration;
                                                    // Bonus for using less than 50% of power capacity (headroom is good)
                                                    if (utilizationPercent <= 0.5) {
                                                        score += (0.5 - utilizationPercent) * 10000;
                                                    }
                                                }
                                                
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
                strategy: priority === 'capacity' ? 'High Capacity' : 'High Recharge'
            };
        }
        
        return { success: false, reason: 'no_valid_configuration' };
    }
    
    
    // Helper functions
    selectOptimalGenerator(targetCapacity, targetRecharge, constraints) {
        if (constraints.generatorType && constraints.generatorType !== 'any') {
            return constraints.generatorType;
        }
        
        // Select based on capacity and recharge requirements
        if (targetCapacity > 20000 || targetRecharge > 500) {
            return 'advanced';
        } else if (targetCapacity > 10000 || targetRecharge > 300) {
            return 'standard';
        } else {
            return 'compact';
        }
    }
    
    selectGeneratorForCapacity(targetCapacity, constraints) {
        if (constraints.generatorType && constraints.generatorType !== 'any') {
            return constraints.generatorType;
        }
        
        if (targetCapacity > 18000) return 'advanced';
        if (targetCapacity > 6000) return 'standard';
        return 'compact';
    }
    
    selectGeneratorForRecharge(targetRecharge, constraints) {
        if (constraints.generatorType && constraints.generatorType !== 'any') {
            return constraints.generatorType;
        }
        
        if (targetRecharge > 500) return 'advanced';
        return 'standard';
    }
    
    selectMostEfficientGenerator(constraints) {
        if (constraints.generatorType && constraints.generatorType !== 'any') {
            return constraints.generatorType;
        }
        
        // Advanced has best capacity per CPU
        return 'advanced';
    }
    
    addOptimalReactors(config, targetRecharge, constraints) {
        const currentStats = this.calculator.calculateStats(config);
        const neededRecharge = targetRecharge - currentStats.recharge;
        
        if (neededRecharge <= 0) return;
        
        // Apply constraints for reactor limits
        const maxLarge = constraints.maxLargeReactors !== undefined ? constraints.maxLargeReactors : 2;
        const maxSmall = constraints.maxSmallReactors !== undefined ? constraints.maxSmallReactors : 4;
        
        // Large reactors are more efficient
        const largeReactorRecharge = this.calculator.components.reactors.large.recharge;
        const smallReactorRecharge = this.calculator.components.reactors.small.recharge;
        
        let largeCount = Math.min(maxLarge, Math.floor(neededRecharge / largeReactorRecharge));
        let remainingRecharge = neededRecharge - (largeCount * largeReactorRecharge);
        let smallCount = Math.min(maxSmall, Math.ceil(remainingRecharge / smallReactorRecharge));
        
        config.reactors.large = largeCount;
        config.reactors.small = smallCount;
    }
    
    addOptimalExtenders(config, targetCapacity, targetRecharge, constraints) {
        // Apply tier limits from constraints
        const maxAdvanced = constraints.maxAdvancedExtenders !== undefined ? constraints.maxAdvancedExtenders : 4;
        const maxImproved = constraints.maxImprovedExtenders !== undefined ? constraints.maxImprovedExtenders : 6;
        const maxBasic = constraints.maxBasicExtenders !== undefined ? constraints.maxBasicExtenders : 8;
        
        const currentStats = this.calculator.calculateStats(config);
        
        // Add capacitors if we need more capacity
        if (currentStats.capacity < targetCapacity) {
            const neededCapacity = targetCapacity - currentStats.capacity;
            
            // Start with most efficient (advanced)
            const advancedCapacity = this.calculator.components.extenders.advanced.capacitor.capacity;
            const advancedCount = Math.min(maxAdvanced, Math.ceil(neededCapacity / advancedCapacity));
            config.extenders.advanced.capacitor = advancedCount;
            
            // If still need more capacity, use improved
            const remainingCapacity = neededCapacity - (advancedCount * advancedCapacity);
            if (remainingCapacity > 0) {
                const improvedCapacity = this.calculator.components.extenders.improved.capacitor.capacity;
                const improvedCount = Math.min(maxImproved, Math.ceil(remainingCapacity / improvedCapacity));
                config.extenders.improved.capacitor = improvedCount;
                
                // If still need more, use basic
                const stillRemainingCapacity = remainingCapacity - (improvedCount * improvedCapacity);
                if (stillRemainingCapacity > 0) {
                    const basicCapacity = this.calculator.components.extenders.basic.capacitor.capacity;
                    const basicCount = Math.min(maxBasic, Math.ceil(stillRemainingCapacity / basicCapacity));
                    config.extenders.basic.capacitor = basicCount;
                }
            }
        }
        
        // Add chargers if we need more recharge
        const updatedStats = this.calculator.calculateStats(config);
        if (updatedStats.recharge < targetRecharge) {
            const neededRecharge = targetRecharge - updatedStats.recharge;
            
            // Use remaining slots in tiers for chargers
            const advancedUsed = config.extenders.advanced.capacitor;
            const improvedUsed = config.extenders.improved.capacitor;
            const basicUsed = config.extenders.basic.capacitor;
            
            const advancedAvailable = maxAdvanced - advancedUsed;
            const improvedAvailable = maxImproved - improvedUsed;
            const basicAvailable = maxBasic - basicUsed;
            
            // Start with advanced chargers
            let remainingRecharge = neededRecharge;
            if (advancedAvailable > 0 && remainingRecharge > 0) {
                const advancedRecharge = this.calculator.components.extenders.advanced.charger.recharge;
                const chargerCount = Math.min(advancedAvailable, Math.ceil(remainingRecharge / advancedRecharge));
                config.extenders.advanced.charger = chargerCount;
                remainingRecharge -= chargerCount * advancedRecharge;
            }
            
            // Continue with improved chargers if needed
            if (improvedAvailable > 0 && remainingRecharge > 0) {
                const improvedRecharge = this.calculator.components.extenders.improved.charger.recharge;
                const chargerCount = Math.min(improvedAvailable, Math.ceil(remainingRecharge / improvedRecharge));
                config.extenders.improved.charger = chargerCount;
                remainingRecharge -= chargerCount * improvedRecharge;
            }
            
            // Continue with basic chargers if needed
            if (basicAvailable > 0 && remainingRecharge > 0) {
                const basicRecharge = this.calculator.components.extenders.basic.charger.recharge;
                const chargerCount = Math.min(basicAvailable, Math.ceil(remainingRecharge / basicRecharge));
                config.extenders.basic.charger = chargerCount;
                remainingRecharge -= chargerCount * basicRecharge;
            }
        }
    }
    
    isWithinTolerance(actual, target) {
        if (!target) return true;
        // Allow going over, but must be at least 95% of target
        const minTarget = target * (1 - this.tolerance);
        return actual >= minTarget;
    }
    
    // Find best alternative when targets are impossible - maintain same ratio but scale down
    findBestAlternative(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew, maxPossible) {
        // Calculate the recharge-to-capacity ratio
        const ratio = targetRecharge / targetCapacity;
        
        // Find the best configuration maintaining this ratio
        // We'll try different capacity values and find the most CPU efficient one
        let bestResult = null;
        let bestScore = -1;
        
        // Try different capacity levels from max down
        for (let testCapacity = maxPossible.capacity; testCapacity >= 10000; testCapacity -= 1000) {
            const testRecharge = Math.floor(testCapacity * ratio);
            
            // Skip if recharge is impossible
            if (testRecharge > maxPossible.recharge) continue;
            
            // Try to optimize for these values
            const result = this.optimizeBalanced(testCapacity, testRecharge, constraints, existingBlocks, existingCrew);
            
            if (result && result.success) {
                // Check if the actual ratio is within 5% of target ratio
                const actualRatio = result.stats.recharge / result.stats.capacity;
                const ratioDiff = Math.abs((actualRatio - ratio) / ratio);
                
                if (ratioDiff <= 0.05) {
                    // Score by CPU efficiency (lower CPU = higher score)
                    const score = 1000000 - result.stats.cpu;
                    if (score > bestScore) {
                        bestScore = score;
                        bestResult = result;
                        bestResult.scaledTargets = {
                            capacity: testCapacity,
                            recharge: testRecharge
                        };
                    }
                }
            }
        }
        
        if (bestResult) {
            bestResult.originalTargets = {
                capacity: targetCapacity,
                recharge: targetRecharge
            };
            bestResult.reason = 'scaled_down';
            bestResult.message = `Targets were impossible. Found the most CPU-efficient configuration maintaining your ${(ratio * 100).toFixed(1)}% recharge-to-capacity ratio.`;
            return bestResult;
        }
        
        // If we couldn't find anything, return failure
        return {
            success: false,
            reason: 'impossible',
            alternatives: this.suggestAlternatives(targetCapacity, targetRecharge, maxPossible),
            maxPossible: maxPossible
        };
    }

    suggestAlternatives(targetCapacity, targetRecharge, maxPossible) {
        const alternatives = [];
        
        if (targetCapacity > maxPossible.capacity) {
            alternatives.push({
                type: 'reduce_capacity',
                message: `Consider reducing target capacity to ${ComponentUtils.formatNumber(maxPossible.capacity)} HP (maximum possible)`,
                newTarget: maxPossible.capacity
            });
        }
        
        if (targetRecharge > maxPossible.recharge) {
            alternatives.push({
                type: 'reduce_recharge',
                message: `Consider reducing target recharge to ${ComponentUtils.formatNumber(maxPossible.recharge)} HP/s (maximum possible)`,
                newTarget: maxPossible.recharge
            });
        }
        
        alternatives.push({
            type: 'add_fusion',
            message: 'Consider allowing fusion reactors for higher recharge rates'
        });
        
        alternatives.push({
            type: 'balanced',
            message: 'Try a balanced approach with lower targets for both capacity and recharge'
        });
        
        return alternatives;
    }
    
    // Add optimal power generators to meet power requirements with maximum CPU efficiency
    addOptimalPowerGenerators(config, powerRequired) {
        const newConfig = JSON.parse(JSON.stringify(config)); // Deep copy
        
        if (!newConfig.powerGenerators) {
            newConfig.powerGenerators = {};
        }
        
        // Initialize generator counts if not present (only Advanced and Improved)
        const generators = ['improvedLarge', 'advancedLarge'];
        generators.forEach(gen => {
            if (!newConfig.powerGenerators[gen]) {
                newConfig.powerGenerators[gen] = 0;
            }
        });
        
        let remainingPower = powerRequired;
        
        // Use most CPU efficient generators first
        // Improved Large: 25000 power / 25000 CPU = 1.0 power per CPU  
        // Advanced Large: 100000 power / 50000 CPU = 2.0 power per CPU
        
        // Start with Advanced Large (best ratio) but ensure we don't overprovision too much
        if (remainingPower >= 50000) {
            const advancedCount = Math.floor(remainingPower / 100000);
            if (advancedCount > 0) {
                newConfig.powerGenerators.advancedLarge += advancedCount;
                remainingPower -= advancedCount * 100000;
            }
        }
        
        // Use Improved Large for remaining power
        if (remainingPower > 0) {
            const improvedCount = Math.ceil(remainingPower / 25000);
            if (improvedCount > 0) {
                newConfig.powerGenerators.improvedLarge += improvedCount;
                remainingPower -= improvedCount * 25000;
            }
        }
        
        return newConfig;
    }
    
    // Max Balanced strategy - find max capacity where chart percentages are within 10% of each other
    optimizeMaxBalanced(targetCapacity, targetRecharge, constraints = {}, existingBlocks = {}, existingCrew = {}) {
        // Use full constraint limits for this strategy
        const modifiedConstraints = { ...constraints };
        
        // First, determine maximum possible values within constraints
        const maxPossible = this.calculateMaxPossibleStats(modifiedConstraints, existingBlocks, existingCrew);
        
        let bestConfig = null;
        let bestScore = -1;
        
        const maxAdvanced = modifiedConstraints.maxAdvancedExtenders !== undefined ? modifiedConstraints.maxAdvancedExtenders : 4;
        const maxImproved = modifiedConstraints.maxImprovedExtenders !== undefined ? modifiedConstraints.maxImprovedExtenders : 6;
        const maxBasic = modifiedConstraints.maxBasicExtenders !== undefined ? modifiedConstraints.maxBasicExtenders : 8;
        const maxSmallReactors = modifiedConstraints.maxSmallReactors !== undefined ? modifiedConstraints.maxSmallReactors : 4;
        const maxLargeReactors = modifiedConstraints.maxLargeReactors !== undefined ? modifiedConstraints.maxLargeReactors : 2;
        
        // Try all generator types (or just the constrained one)
        const generatorTypes = modifiedConstraints.generatorType ? [modifiedConstraints.generatorType] : ['compact', 'standard', 'advanced'];
        
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
                                                
                                                // Check basic requirements
                                                if (stats.capacity <= 0 || stats.recharge <= 0) continue;
                                                
                                                // Apply power utilization rules
                                                const usesGenerators = (advancedGens > 0 || improvedGens > 0);
                                                const usesFusion = (smallReactors > 0 || largeReactors > 0);
                                                let powerUtilizationValid = true;
                                                
                                                if (usesGenerators && !usesFusion) {
                                                    if (stats.power > 0) {
                                                        powerUtilizationValid = false;
                                                    } else {
                                                        const totalPowerGeneration = (advancedGens * 100000) + (improvedGens * 25000);
                                                        const shieldPowerRequirement = totalPowerGeneration + stats.power;
                                                        const utilizationPercent = shieldPowerRequirement / totalPowerGeneration;
                                                        powerUtilizationValid = utilizationPercent <= 0.5;
                                                    }
                                                }
                                                
                                                const validation = this.calculator.validateConfiguration(config, modifiedConstraints);
                                                if (!(validation.valid || validation.warnings.length === 0) || !powerUtilizationValid) {
                                                    continue;
                                                }
                                                
                                                // Calculate balance: difference between capacity% and recharge%
                                                const capacityPercent = stats.capacity / maxPossible.capacity;
                                                const rechargePercent = stats.recharge / maxPossible.recharge;
                                                const balanceDifference = Math.abs(capacityPercent - rechargePercent);
                                                
                                                // Only consider balanced configs (within 10%)
                                                if (balanceDifference <= 0.1) {
                                                    // Score by total capacity (higher is better)
                                                    const score = stats.capacity;
                                                    
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
        
        if (bestConfig) {
            return {
                success: true,
                configuration: bestConfig.config,
                stats: bestConfig.stats,
                validation: bestConfig.validation,
                strategy: 'Max Balanced'
            };
        }
        
        return { success: false, reason: 'no_balanced_configuration' };
    }
    
    // Max Capacity strategy - absolute most capacity (CPU doesn't matter unless constrained)
    optimizeMaxCapacity(targetCapacity, targetRecharge, constraints = {}, existingBlocks = {}, existingCrew = {}) {
        // Use full constraint limits for this strategy
        const modifiedConstraints = { ...constraints };
        
        let bestConfig = null;
        let bestCapacity = -1;
        
        const maxAdvanced = modifiedConstraints.maxAdvancedExtenders !== undefined ? modifiedConstraints.maxAdvancedExtenders : 4;
        const maxImproved = modifiedConstraints.maxImprovedExtenders !== undefined ? modifiedConstraints.maxImprovedExtenders : 6;
        const maxBasic = modifiedConstraints.maxBasicExtenders !== undefined ? modifiedConstraints.maxBasicExtenders : 8;
        const maxSmallReactors = modifiedConstraints.maxSmallReactors !== undefined ? modifiedConstraints.maxSmallReactors : 4;
        const maxLargeReactors = modifiedConstraints.maxLargeReactors !== undefined ? modifiedConstraints.maxLargeReactors : 2;
        
        // Try all generator types (or just the constrained one)
        const generatorTypes = modifiedConstraints.generatorType ? [modifiedConstraints.generatorType] : ['compact', 'standard', 'advanced'];
        
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
                        
                        // Try all extender combinations to find maximum capacity
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
                                                
                                                // Must have positive recharge
                                                if (stats.recharge <= 0) continue;
                                                
                                                // Apply power utilization rules
                                                const usesGenerators = (advancedGens > 0 || improvedGens > 0);
                                                const usesFusion = (smallReactors > 0 || largeReactors > 0);
                                                let powerUtilizationValid = true;
                                                
                                                if (usesGenerators && !usesFusion) {
                                                    if (stats.power > 0) {
                                                        powerUtilizationValid = false;
                                                    } else {
                                                        const totalPowerGeneration = (advancedGens * 100000) + (improvedGens * 25000);
                                                        const shieldPowerRequirement = totalPowerGeneration + stats.power;
                                                        const utilizationPercent = shieldPowerRequirement / totalPowerGeneration;
                                                        powerUtilizationValid = utilizationPercent <= 0.5;
                                                    }
                                                }
                                                
                                                const validation = this.calculator.validateConfiguration(config, modifiedConstraints);
                                                if (!(validation.valid || validation.warnings.length === 0) || !powerUtilizationValid) {
                                                    continue;
                                                }
                        
                                                // Score by capacity only (higher is better)
                                                if (stats.capacity > bestCapacity) {
                                                    bestCapacity = stats.capacity;
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
        
        if (bestConfig) {
            return {
                success: true,
                configuration: bestConfig.config,
                stats: bestConfig.stats,
                validation: bestConfig.validation,
                strategy: 'Max Capacity'
            };
        }
        
        return { success: false, reason: 'no_valid_configuration' };
    }
    
    // Max Recharge strategy - highest capacity with 15 second recharge or better
    optimizeMaxRecharge(targetCapacity, targetRecharge, constraints = {}, existingBlocks = {}, existingCrew = {}) {
        // Use full constraint limits for this strategy
        const modifiedConstraints = { ...constraints };
        
        // Max recharge time of 15 seconds (or user-specified)
        const maxRechargeTime = 15; // seconds
        
        let bestConfig = null;
        let bestCapacity = -1;
        
        const maxAdvanced = modifiedConstraints.maxAdvancedExtenders !== undefined ? modifiedConstraints.maxAdvancedExtenders : 4;
        const maxImproved = modifiedConstraints.maxImprovedExtenders !== undefined ? modifiedConstraints.maxImprovedExtenders : 6;
        const maxBasic = modifiedConstraints.maxBasicExtenders !== undefined ? modifiedConstraints.maxBasicExtenders : 8;
        const maxSmallReactors = modifiedConstraints.maxSmallReactors !== undefined ? modifiedConstraints.maxSmallReactors : 4;
        const maxLargeReactors = modifiedConstraints.maxLargeReactors !== undefined ? modifiedConstraints.maxLargeReactors : 2;
        
        // Try all generator types (or just the constrained one)
        const generatorTypes = modifiedConstraints.generatorType ? [modifiedConstraints.generatorType] : ['compact', 'standard', 'advanced'];
        
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
                        
                        // Try all extender combinations to find configurations with target recharge
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
                                                
                                                // Check if recharge time is 15 seconds or better (Capacity/Recharge <= 15)
                                                const rechargeTime = stats.capacity / stats.recharge;
                                                if (rechargeTime > maxRechargeTime) continue;
                                                
                                                // Must have positive capacity
                                                if (stats.capacity <= 0) continue;
                                                
                                                // Apply power utilization rules
                                                const usesGenerators = (advancedGens > 0 || improvedGens > 0);
                                                const usesFusion = (smallReactors > 0 || largeReactors > 0);
                                                let powerUtilizationValid = true;
                                                
                                                if (usesGenerators && !usesFusion) {
                                                    if (stats.power > 0) {
                                                        powerUtilizationValid = false;
                                                    } else {
                                                        const totalPowerGeneration = (advancedGens * 100000) + (improvedGens * 25000);
                                                        const shieldPowerRequirement = totalPowerGeneration + stats.power;
                                                        const utilizationPercent = shieldPowerRequirement / totalPowerGeneration;
                                                        powerUtilizationValid = utilizationPercent <= 0.5;
                                                    }
                                                }
                                                
                                                const validation = this.calculator.validateConfiguration(config, modifiedConstraints);
                                                if (!(validation.valid || validation.warnings.length === 0) || !powerUtilizationValid) {
                                                    continue;
                                                }
                        
                                                // Score by capacity only (higher is better)
                                                if (stats.capacity > bestCapacity) {
                                                    bestCapacity = stats.capacity;
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
        
        if (bestConfig) {
            return {
                success: true,
                configuration: bestConfig.config,
                stats: bestConfig.stats,
                validation: bestConfig.validation,
                strategy: 'Max Recharge'
            };
        }
        
        return { success: false, reason: 'no_valid_configuration' };
    }
    
    // Calculate maximum possible capacity and recharge within constraints
    calculateMaxPossibleStats(constraints = {}, existingBlocks = {}, existingCrew = {}) {
        let maxCapacity = 0;
        let maxRecharge = 0;
        
        const maxAdvanced = constraints.maxAdvancedExtenders !== undefined ? constraints.maxAdvancedExtenders : 4;
        const maxImproved = constraints.maxImprovedExtenders !== undefined ? constraints.maxImprovedExtenders : 6;
        const maxBasic = constraints.maxBasicExtenders !== undefined ? constraints.maxBasicExtenders : 8;
        const maxSmallReactors = constraints.maxSmallReactors !== undefined ? constraints.maxSmallReactors : 4;
        const maxLargeReactors = constraints.maxLargeReactors !== undefined ? constraints.maxLargeReactors : 2;
        
        // Test with Advanced Shield Generator (highest capacity)
        const maxCapacityConfig = {
            generator: 'advanced',
            reactors: { small: maxSmallReactors, large: maxLargeReactors },
            powerGenerators: {
                advancedLarge: 4, // Max we allow in optimization
                improvedLarge: 0
            },
            extenders: {
                advanced: { capacitor: maxAdvanced, charger: 0 },
                improved: { capacitor: maxImproved, charger: 0 },
                basic: { capacitor: maxBasic, charger: 0 }
            },
            blocks: { ...existingBlocks },
            crew: { ...existingCrew }
        };
        
        const maxCapacityStats = this.calculator.calculateStats(maxCapacityConfig);
        maxCapacity = maxCapacityStats.capacity;
        
        // Test with configuration optimized for recharge
        const maxRechargeConfig = {
            generator: 'advanced',
            reactors: { small: maxSmallReactors, large: maxLargeReactors },
            powerGenerators: {
                advancedLarge: 4,
                improvedLarge: 0
            },
            extenders: {
                advanced: { capacitor: 0, charger: maxAdvanced },
                improved: { capacitor: 0, charger: maxImproved },
                basic: { capacitor: 0, charger: maxBasic }
            },
            blocks: { ...existingBlocks },
            crew: { ...existingCrew }
        };
        
        const maxRechargeStats = this.calculator.calculateStats(maxRechargeConfig);
        maxRecharge = maxRechargeStats.recharge;
        
        return {
            capacity: maxCapacity,
            recharge: maxRecharge
        };
    }
}