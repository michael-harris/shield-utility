// Shield Optimization Engine
class ShieldOptimizer {
    constructor(calculator) {
        this.calculator = calculator;
        this.tolerance = 0.05; // 5% tolerance for target matching
    }
    
    // Main optimization function
    optimize(targetCapacity, targetRecharge, constraints = {}, existingBlocks = {}, existingCrew = {}) {
        // Check if targets are achievable
        const achievability = this.calculator.isTargetAchievable(targetCapacity, targetRecharge, {
            ...constraints,
            blocks: existingBlocks,
            crew: existingCrew
        });
        
        if (!achievability.capacityAchievable || !achievability.rechargeAchievable) {
            // Return immediate failure for impossible targets
            return {
                success: false,
                reason: 'impossible',
                maxPossible: achievability.maxPossible
            };
        }
        
        // Determine which strategy to use based on targets
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
                bestResult.strategy = strategy;
            }
        } catch (error) {
            console.warn('Optimization strategy failed:', error);
        }
        
        return bestResult || {
            success: false,
            reason: 'no_solution',
            alternatives: this.suggestAlternatives(targetCapacity, targetRecharge, achievability.maxPossible)
        };
    }
    
    // Determine which strategy to use based on target characteristics
    determineOptimalStrategy(targetCapacity, targetRecharge, existingBlocks, existingCrew = {}) {
        const blockCapacity = this.calculator.calculateBlockCapacity(existingBlocks);
        
        // Calculate what's needed from components
        const neededCapacity = Math.max(0, targetCapacity - blockCapacity);
        
        // Get theoretical maximums for comparison
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
        
        // Try all generator types to find the most efficient
        const generatorTypes = ['compact', 'standard', 'advanced'];
        
        for (const generatorType of generatorTypes) {
            // Try with and without reactors (unless no-fusion is checked)
            const reactorConfigs = (maxSmallReactors === 0 && maxLargeReactors === 0) ? [[0, 0]] : [];
            
            if (maxSmallReactors > 0 || maxLargeReactors > 0) {
                for (let smallReactors = 0; smallReactors <= maxSmallReactors; smallReactors++) {
                    for (let largeReactors = 0; largeReactors <= maxLargeReactors; largeReactors++) {
                        reactorConfigs.push([smallReactors, largeReactors]);
                    }
                }
            }
            
            for (const [smallReactors, largeReactors] of reactorConfigs) {
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
                                            // Check constraints
                                            const validation = this.calculator.validateConfiguration(config, constraints);
                                            if (validation.valid || validation.warnings.length === 0) {
                                                // Score primarily on CPU efficiency (lower CPU = higher score)
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
        
        // Try all generator types to find the most efficient
        const generatorTypes = ['compact', 'standard', 'advanced'];
        
        for (const generatorType of generatorTypes) {
            // Try with and without reactors (unless no-fusion is checked)
            const reactorConfigs = (maxSmallReactors === 0 && maxLargeReactors === 0) ? [[0, 0]] : [];
            
            if (maxSmallReactors > 0 || maxLargeReactors > 0) {
                for (let smallReactors = 0; smallReactors <= maxSmallReactors; smallReactors++) {
                    for (let largeReactors = 0; largeReactors <= maxLargeReactors; largeReactors++) {
                        reactorConfigs.push([smallReactors, largeReactors]);
                    }
                }
            }
            
            for (const [smallReactors, largeReactors] of reactorConfigs) {
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
                                            // Check constraints
                                            const validation = this.calculator.validateConfiguration(config, constraints);
                                            if (validation.valid || validation.warnings.length === 0) {
                                                // Priority-based scoring
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
    
    // Capacity-first optimization
    optimizeCapacityFirst(targetCapacity, targetRecharge, constraints, existingBlocks) {
        const config = this.calculator.createEmptyConfiguration();
        config.blocks = { ...existingBlocks };
        
        const blockCapacity = this.calculator.calculateBlockCapacity(existingBlocks);
        const remainingCapacity = Math.max(0, targetCapacity - blockCapacity);
        
        // Start with best generator for capacity
        config.generator = this.selectGeneratorForCapacity(remainingCapacity, constraints);
        
        // Add capacitors first (most efficient for capacity)
        const capacitorEfficiency = this.calculator.getComponentEfficiency('capacitor', true);
        
        for (const tierData of capacitorEfficiency) {
            const tier = tierData.tier;
            const maxCount = this.calculator.components.tierLimits[tier];
            
            const currentStats = this.calculator.calculateStats(config);
            const neededCapacity = targetCapacity - currentStats.capacity;
            
            if (neededCapacity <= 0) break;
            
            const optimalCount = Math.min(
                maxCount,
                Math.ceil(neededCapacity / tierData.capacity)
            );
            
            config.extenders[tier].capacitor = optimalCount;
        }
        
        // Then adjust with chargers if recharge is too low
        this.adjustRechargeWithChargers(config, targetRecharge, constraints);
        
        const stats = this.calculator.calculateStats(config);
        
        if (this.isWithinTolerance(stats.capacity, targetCapacity) && 
            this.isWithinTolerance(stats.recharge, targetRecharge)) {
            return {
                success: true,
                configuration: config,
                stats: stats,
                strategy: 'capacity_first'
            };
        }
        
        return { success: false, reason: 'targets_not_met', stats: stats };
    }
    
    // Recharge-first optimization
    optimizeRechargeFirst(targetCapacity, targetRecharge, constraints, existingBlocks) {
        const maxSmallReactors = constraints.maxSmallReactors !== undefined ? constraints.maxSmallReactors : 4;
        const maxLargeReactors = constraints.maxLargeReactors !== undefined ? constraints.maxLargeReactors : 2;
        
        const config = this.calculator.createEmptyConfiguration();
        config.blocks = { ...existingBlocks };
        
        // Start with best generator for recharge
        config.generator = this.selectGeneratorForRecharge(targetRecharge, constraints);
        
        // Add reactors if needed and allowed
        if (maxSmallReactors > 0 || maxLargeReactors > 0) {
            this.addOptimalReactors(config, targetRecharge, constraints);
        }
        
        // Add chargers first
        const chargerEfficiency = this.calculator.getComponentEfficiency('charger', false);
        
        for (const tierData of chargerEfficiency) {
            const tier = tierData.tier;
            const maxCount = this.calculator.components.tierLimits[tier];
            
            const currentStats = this.calculator.calculateStats(config);
            const neededRecharge = targetRecharge - currentStats.recharge;
            
            if (neededRecharge <= 0) break;
            
            const optimalCount = Math.min(
                maxCount,
                Math.ceil(neededRecharge / tierData.recharge)
            );
            
            config.extenders[tier].charger = optimalCount;
        }
        
        // Then adjust with capacitors if capacity is too low
        this.adjustCapacityWithCapacitors(config, targetCapacity, constraints);
        
        const stats = this.calculator.calculateStats(config);
        
        if (this.isWithinTolerance(stats.capacity, targetCapacity) && 
            this.isWithinTolerance(stats.recharge, targetRecharge)) {
            return {
                success: true,
                configuration: config,
                stats: stats,
                strategy: 'recharge_first'
            };
        }
        
        return { success: false, reason: 'targets_not_met', stats: stats };
    }
    
    // CPU efficiency optimization
    optimizeEfficiency(targetCapacity, targetRecharge, constraints, existingBlocks) {
        const config = this.calculator.createEmptyConfiguration();
        config.blocks = { ...existingBlocks };
        
        // Select most CPU-efficient generator
        config.generator = this.selectMostEfficientGenerator(constraints);
        
        // Use most efficient components first
        const allExtenders = [];
        
        // Collect all extenders with efficiency scores
        for (const tier in this.calculator.components.extenders) {
            const capacitor = this.calculator.components.extenders[tier].capacitor;
            const charger = this.calculator.components.extenders[tier].charger;
            
            allExtenders.push({
                type: 'capacitor',
                tier: tier,
                component: capacitor,
                efficiencyScore: capacitor.efficiency.capacity / (capacitor.cpu / 1000)
            });
            
            allExtenders.push({
                type: 'charger',
                tier: tier,
                component: charger,
                efficiencyScore: charger.efficiency.recharge / (charger.cpu / 1000)
            });
        }
        
        // Sort by efficiency
        allExtenders.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
        
        // Add components in efficiency order
        for (const extender of allExtenders) {
            const currentStats = this.calculator.calculateStats(config);
            
            if (this.isWithinTolerance(currentStats.capacity, targetCapacity) && 
                this.isWithinTolerance(currentStats.recharge, targetRecharge)) {
                break;
            }
            
            const tierLimit = this.calculator.components.tierLimits[extender.tier];
            const currentTierCount = config.extenders[extender.tier].capacitor + 
                                   config.extenders[extender.tier].charger;
            
            if (currentTierCount < tierLimit) {
                config.extenders[extender.tier][extender.type]++;
            }
        }
        
        const stats = this.calculator.calculateStats(config);
        
        if (this.isWithinTolerance(stats.capacity, targetCapacity) && 
            this.isWithinTolerance(stats.recharge, targetRecharge)) {
            return {
                success: true,
                configuration: config,
                stats: stats,
                strategy: 'efficiency'
            };
        }
        
        return { success: false, reason: 'targets_not_met', stats: stats };
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
    
    adjustRechargeWithChargers(config, targetRecharge, constraints) {
        // Implementation for fine-tuning recharge with chargers
        // This would replace some capacitors with chargers if needed
    }
    
    adjustCapacityWithCapacitors(config, targetCapacity, constraints) {
        // Implementation for fine-tuning capacity with capacitors
        // This would replace some chargers with capacitors if needed
    }
    
    isWithinTolerance(actual, target) {
        if (!target) return true;
        // Allow going over, but must be at least 95% of target
        const minTarget = target * (1 - this.tolerance);
        return actual >= minTarget;
    }
    
    scoreConfiguration(config, targetCapacity, targetRecharge, constraints) {
        const stats = this.calculator.calculateStats(config);
        const validation = this.calculator.validateConfiguration(config, constraints);
        
        if (!validation.valid && validation.warnings.length > 0) return -1;
        
        // Primary scoring: CPU efficiency (lower CPU = higher score)
        // Use negative CPU so lower CPU gives higher score
        let score = 1000000 - stats.cpu;
        
        // Small bonus for meeting targets exactly (but CPU is still primary)
        if (targetCapacity && stats.capacity >= targetCapacity) {
            score += 1000; // Small bonus for meeting capacity
        }
        
        if (targetRecharge && stats.recharge >= targetRecharge) {
            score += 1000; // Small bonus for meeting recharge
        }
        
        // Small penalty for excessive over-achievement (waste)
        if (targetCapacity && stats.capacity > targetCapacity * 1.2) {
            score -= (stats.capacity - targetCapacity * 1.2) / 1000;
        }
        
        if (targetRecharge && stats.recharge > targetRecharge * 1.2) {
            score -= (stats.recharge - targetRecharge * 1.2) / 10;
        }
        
        return score;
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
}