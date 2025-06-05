// Fast Shield Optimizer - Uses pre-calculated configuration database
class FastShieldOptimizer {
    constructor() {
        this.configurations = null;
        this.isReady = false;
        this.generatorNames = ['compact', 'standard', 'advanced'];
        this.loadPromise = null;
    }
    
    // Load pre-calculated configurations
    async loadConfigurations() {
        if (this.loadPromise) {
            return this.loadPromise;
        }
        
        this.loadPromise = (async () => {
            try {
                const start = performance.now();
                
                const response = await fetch('shield-configurations-complete.json');
                if (!response.ok) {
                    throw new Error(`Failed to load configurations: ${response.status}`);
                }
                
                const data = await response.json();
                this.configurations = data.configurations;
                this.metadata = data.metadata;
                
                const duration = performance.now() - start;
                
                this.isReady = true;
                return true;
            } catch (error) {
                this.isReady = false;
                return false;
            }
        })();
        
        return this.loadPromise;
    }
    
    // Convert compact array format back to readable configuration
    expandConfiguration(compactConfig) {
        const [gen, smallR, largeR, advG, impG, advCap, advChg, impCap, impChg, basCap, basChg, 
               capacity, recharge, cpu, power, rechargeTime, usesGenerators, usesFusion] = compactConfig;
        
        return {
            generator: this.generatorNames[gen],
            reactors: {
                small: smallR,
                large: largeR
            },
            powerGenerators: {
                basicLarge: 0,
                improvedLarge: impG,
                advancedLarge: advG
            },
            extenders: {
                advanced: { capacitor: advCap, charger: advChg },
                improved: { capacitor: impCap, charger: impChg },
                basic: { capacitor: basCap, charger: basChg }
            },
            stats: {
                capacity: capacity,
                recharge: recharge,
                cpu: cpu,
                power: power
            },
            metrics: {
                rechargeTime: rechargeTime,
                usesGenerators: usesGenerators === 1,
                usesFusion: usesFusion === 1
            }
        };
    }
    
    // Fast optimization using pre-calculated data
    async optimize(targetCapacity, targetRecharge, constraints = {}, existingBlocks = {}, existingCrew = {}, strategy = 'cpu-efficiency') {
        if (!this.isReady) {
            const loaded = await this.loadConfigurations();
            if (!loaded) {
                return { success: false, reason: 'failed_to_load_data' };
            }
        }
        
        const start = performance.now();
        
        // Calculate bonus stats from existing blocks and crew
        const bonusStats = this.calculateBonusStats(existingBlocks, existingCrew);
        
        // Adjust targets if provided
        let adjustedTargetCapacity = targetCapacity;
        let adjustedTargetRecharge = targetRecharge;
        
        if (targetCapacity && bonusStats.capacity > 0) {
            adjustedTargetCapacity = Math.max(1, targetCapacity - bonusStats.capacity);
        }
        if (targetRecharge && bonusStats.recharge > 0) {
            adjustedTargetRecharge = Math.max(1, targetRecharge - bonusStats.recharge);
        }
        
        // Filter configurations based on constraints and strategy
        let candidates = this.filterByConstraints(this.configurations, constraints, strategy);
        
        // Filter by targets if specified (only for CPU-efficiency strategy)
        if ((adjustedTargetCapacity || adjustedTargetRecharge) && strategy === 'cpu-efficiency') {
            candidates = this.filterByTargets(candidates, adjustedTargetCapacity, adjustedTargetRecharge);
        }
        
        if (candidates.length === 0) {
            return { success: false, reason: 'no_valid_configuration' };
        }
        
        // Select best configuration based on strategy
        const bestCompact = this.selectBestConfiguration(candidates, strategy, adjustedTargetCapacity, adjustedTargetRecharge);
        
        if (!bestCompact) {
            return { success: false, reason: 'no_optimal_configuration' };
        }
        
        
        // Expand to full configuration
        const bestConfig = this.expandConfiguration(bestCompact);
        
        // Add back existing blocks and crew
        if (Object.values(existingBlocks).some(count => count > 0)) {
            bestConfig.blocks = existingBlocks;
        }
        if (Object.values(existingCrew).some(count => count > 0)) {
            bestConfig.crew = existingCrew;
        }
        
        // Adjust final stats to include bonuses
        bestConfig.stats.capacity += bonusStats.capacity;
        bestConfig.stats.recharge += bonusStats.recharge;
        
        // Recalculate recharge time with bonuses
        if (bestConfig.stats.recharge > 0) {
            bestConfig.stats.rechargeTime = bestConfig.stats.capacity / bestConfig.stats.recharge;
        }
        
        const duration = performance.now() - start;
        
        // Return the configuration in the format expected by the UI
        return {
            success: true,
            configuration: bestConfig,
            stats: bestConfig.stats,
            strategy: this.getStrategyName(strategy),
            optimization_time: duration,
            validation: { valid: true, warnings: [] }
        };
    }
    
    // Filter configurations by constraints
    filterByConstraints(configs, constraints, strategy) {
        return configs.filter(config => {
            const [gen, smallR, largeR, advG, impG, advCap, advChg, impCap, impChg, basCap, basChg, 
                   capacity, recharge, cpu, power, rechargeTime, usesGenerators, usesFusion] = config;
            
            // Power is now guaranteed to be <= 0 in pre-calculated data
            
            // Apply strategy-specific reactor limits for CPU-efficiency
            if (strategy === 'cpu-efficiency') {
                if (smallR > 2 || largeR > 1) return false;
            }
            
            // Check CPU limit
            if (constraints.cpuLimit && cpu > constraints.cpuLimit) return false;
            
            // Check power limit (should be negative or zero)
            if (constraints.powerLimit && power > constraints.powerLimit) return false;
            
            // Check generator constraint
            if (constraints.generatorType && constraints.generatorType !== 'any') {
                const generatorIndex = constraints.generatorType === 'compact' ? 0 : 
                                     constraints.generatorType === 'standard' ? 1 : 2;
                if (gen !== generatorIndex) return false;
            }
            
            // Check extender limits
            if (constraints.maxAdvancedExtenders !== undefined) {
                if (advCap + advChg > constraints.maxAdvancedExtenders) return false;
            }
            if (constraints.maxImprovedExtenders !== undefined) {
                if (impCap + impChg > constraints.maxImprovedExtenders) return false;
            }
            if (constraints.maxBasicExtenders !== undefined) {
                if (basCap + basChg > constraints.maxBasicExtenders) return false;
            }
            
            // Check reactor limits
            if (constraints.maxSmallReactors !== undefined) {
                if (smallR > constraints.maxSmallReactors) return false;
            }
            if (constraints.maxLargeReactors !== undefined) {
                if (largeR > constraints.maxLargeReactors) return false;
            }
            
            return true;
        });
    }
    
    // Filter configurations by target values
    filterByTargets(configs, targetCapacity, targetRecharge) {
        const tolerance = 0.05; // 5% tolerance
        
        return configs.filter(config => {
            const [gen, smallR, largeR, advG, impG, advCap, advChg, impCap, impChg, basCap, basChg, 
                   capacity, recharge, cpu, power] = config;
            
            // Check capacity target (must be at least 95% of target)
            if (targetCapacity) {
                const minCapacity = targetCapacity * (1 - tolerance);
                if (capacity < minCapacity) return false;
            }
            
            // Check recharge target (must be at least 95% of target)
            if (targetRecharge) {
                const minRecharge = targetRecharge * (1 - tolerance);
                if (recharge < minRecharge) return false;
            }
            
            return true;
        });
    }
    
    // Select best configuration based on strategy
    selectBestConfiguration(candidates, strategy, targetCapacity, targetRecharge) {
        if (candidates.length === 0) return null;
        
        // Sort by strategy-specific criteria
        let sortedCandidates;
        
        switch (strategy) {
            case 'max-balanced':
                // Find configs where capacity and recharge percentages are balanced
                sortedCandidates = candidates.sort((a, b) => {
                    // Higher capacity is better for max-balanced
                    return b[11] - a[11]; // capacity index
                });
                break;
                
            case 'max-capacity':
                // Highest capacity first
                sortedCandidates = candidates.sort((a, b) => b[11] - a[11]);
                break;
                
            case 'max-recharge':
                // Configs with recharge time <= 15 seconds
                const fastRecharge = candidates.filter(config => config[15] <= 15); // rechargeTime index
                if (fastRecharge.length > 0) {
                    // Sort by: 1) Highest capacity, 2) Lowest CPU, 3) Lowest recharge time
                    sortedCandidates = fastRecharge.sort((a, b) => {
                        // Primary: Highest capacity
                        const capacityDiff = b[11] - a[11]; // capacity index (descending)
                        if (capacityDiff !== 0) return capacityDiff;
                        
                        // Secondary: Lowest CPU usage
                        const cpuDiff = a[13] - b[13]; // cpu index (ascending)
                        if (cpuDiff !== 0) return cpuDiff;
                        
                        // Tertiary: Lowest recharge time
                        return a[15] - b[15]; // rechargeTime index (ascending)
                    });
                } else {
                    // Fallback: No configs with <=15s recharge, so find fastest recharge
                    sortedCandidates = candidates.sort((a, b) => a[15] - b[15]);
                }
                break;
                
            case 'cpu-efficiency':
            default:
                // Lowest CPU first (most efficient)
                sortedCandidates = candidates.sort((a, b) => {
                    // Primary sort: CPU efficiency
                    const cpuDiff = a[13] - b[13]; // cpu index
                    if (cpuDiff !== 0) return cpuDiff;
                    
                    // Secondary sort: power efficiency (negative power is better)
                    return a[14] - b[14]; // power index
                });
                break;
        }
        
        return sortedCandidates[0];
    }
    
    // Calculate bonus stats from blocks and crew
    calculateBonusStats(blocks, crew) {
        let bonusCapacity = 0;
        let bonusRecharge = 0;
        
        // Add block bonuses
        if (blocks.steel) bonusCapacity += blocks.steel * 1;
        if (blocks.hardenedSteel) bonusCapacity += blocks.hardenedSteel * 2;
        if (blocks.combatSteel) bonusCapacity += blocks.combatSteel * 4;
        if (blocks.xenoSteel) bonusCapacity += blocks.xenoSteel * 7;
        
        // Add crew bonuses
        if (crew.shieldTechnicians) {
            bonusCapacity += crew.shieldTechnicians * 2000;
            bonusRecharge += crew.shieldTechnicians * 75;
        }
        
        return { capacity: bonusCapacity, recharge: bonusRecharge };
    }
    
    // Get human-readable strategy name
    getStrategyName(strategy) {
        switch (strategy) {
            case 'max-balanced': return 'Max Balanced';
            case 'max-capacity': return 'Max Capacity';
            case 'max-recharge': return 'Max Recharge';
            case 'cpu-efficiency': 
            default: return 'CPU-Efficiency';
        }
    }
}

// Global instance
window.fastOptimizer = new FastShieldOptimizer();