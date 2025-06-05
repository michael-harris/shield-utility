// Pre-calculation Engine for Shield Optimization
// This system pre-calculates core component combinations to dramatically improve optimization speed

class PreCalculationEngine {
    constructor(calculator) {
        this.calculator = calculator;
        this.coreConfigurations = [];
        this.lookupTable = new Map();
        this.isReady = false;
    }
    
    // Calculate all core configurations (generator + reactors + power generators)
    // Extenders will be calculated on-demand for better performance
    async generateCoreConfigurations() {
        const start = performance.now();
        
        const generators = ['compact', 'standard', 'advanced'];
        const maxPowerGens = 4; // Reasonable limit for power generators
        const maxSmallReactors = 4;
        const maxLargeReactors = 2;
        
        const configurations = [];
        let configId = 0;
        
        for (const generator of generators) {
            // Try all fusion reactor combinations
            for (let smallReactors = 0; smallReactors <= maxSmallReactors; smallReactors++) {
                for (let largeReactors = 0; largeReactors <= maxLargeReactors; largeReactors++) {
                    
                    // Configuration with fusion reactors only
                    if (smallReactors > 0 || largeReactors > 0) {
                        const config = {
                            id: configId++,
                            generator: generator,
                            reactors: { small: smallReactors, large: largeReactors },
                            powerGenerators: { basicLarge: 0, improvedLarge: 0, advancedLarge: 0 },
                            extenders: { advanced: { capacitor: 0, charger: 0 }, improved: { capacitor: 0, charger: 0 }, basic: { capacitor: 0, charger: 0 } },
                            blocks: {},
                            crew: {}
                        };
                        
                        const stats = this.calculator.calculateStats(config);
                        configurations.push({
                            id: config.id,
                            config: config,
                            baseStats: stats,
                            type: 'fusion'
                        });
                    }
                    
                    // Configuration with power generators only (no fusion)
                    if (smallReactors === 0 && largeReactors === 0) {
                        for (let basicGens = 0; basicGens <= maxPowerGens; basicGens++) {
                            for (let improvedGens = 0; improvedGens <= maxPowerGens; improvedGens++) {
                                for (let advancedGens = 0; advancedGens <= maxPowerGens; advancedGens++) {
                                    // Skip empty power generator configs
                                    if (basicGens === 0 && improvedGens === 0 && advancedGens === 0) continue;
                                    
                                    const config = {
                                        id: configId++,
                                        generator: generator,
                                        reactors: { small: 0, large: 0 },
                                        powerGenerators: { 
                                            basicLarge: basicGens, 
                                            improvedLarge: improvedGens, 
                                            advancedLarge: advancedGens 
                                        },
                                        extenders: { advanced: { capacitor: 0, charger: 0 }, improved: { capacitor: 0, charger: 0 }, basic: { capacitor: 0, charger: 0 } },
                                        blocks: {},
                                        crew: {}
                                    };
                                    
                                    const stats = this.calculator.calculateStats(config);
                                    
                                    // Only include if power is sustainable (≤ 50% utilization for generators)
                                    if (stats.power <= 0) {
                                        const totalPowerGeneration = (advancedGens * 100000) + (improvedGens * 25000) + (basicGens * 10000);
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
        
        this.coreConfigurations = configurations;
        this.buildLookupTable();
        
        const end = performance.now();
        
        this.isReady = true;
        return configurations;
    }
    
    // Build lookup table for fast filtering
    buildLookupTable() {
        // Group configurations by generator type and power source
        this.lookupTable.clear();
        
        for (const config of this.coreConfigurations) {
            const key = `${config.config.generator}-${config.type}`;
            if (!this.lookupTable.has(key)) {
                this.lookupTable.set(key, []);
            }
            this.lookupTable.get(key).push(config);
        }
        
        // Sort each group by capacity (descending) for efficient lookup
        for (const [key, configs] of this.lookupTable) {
            configs.sort((a, b) => b.baseStats.capacity - a.baseStats.capacity);
        }
    }
    
    // Fast optimization using pre-calculated cores + dynamic extender calculation
    fastOptimize(strategy, constraints = {}, targetCapacity = null, targetRecharge = null, existingBlocks = {}, existingCrew = {}) {
        if (!this.isReady) {
            throw new Error('Pre-calculation engine not ready. Call generateCoreConfigurations() first.');
        }
        
        const start = performance.now();
        
        // Filter core configurations by constraints
        let candidateConfigs = this.getFilteredCoreConfigs(constraints);
        
        // Add extenders to each candidate and score them
        let bestResult = null;
        let bestScore = -1;
        
        for (const coreConfig of candidateConfigs) {
            // Try different extender combinations for this core
            const extenderResults = this.optimizeExtendersForCore(
                coreConfig, 
                strategy, 
                constraints, 
                targetCapacity, 
                targetRecharge, 
                existingBlocks, 
                existingCrew
            );
            
            if (extenderResults && extenderResults.score > bestScore) {
                bestScore = extenderResults.score;
                bestResult = extenderResults.result;
            }
        }
        
        const end = performance.now();
        
        return bestResult;
    }
    
    // Get filtered core configurations based on constraints
    getFilteredCoreConfigs(constraints) {
        let candidates = [];
        
        // Determine which generator types to consider
        const generatorTypes = constraints.generatorType ? [constraints.generatorType] : ['compact', 'standard', 'advanced'];
        
        for (const generator of generatorTypes) {
            // Add fusion configs if reactors are allowed
            const maxSmallReactors = constraints.maxSmallReactors !== undefined ? constraints.maxSmallReactors : 4;
            const maxLargeReactors = constraints.maxLargeReactors !== undefined ? constraints.maxLargeReactors : 2;
            
            if (maxSmallReactors > 0 || maxLargeReactors > 0) {
                const fusionKey = `${generator}-fusion`;
                const fusionConfigs = this.lookupTable.get(fusionKey) || [];
                
                for (const config of fusionConfigs) {
                    // Check reactor constraints
                    if (config.config.reactors.small <= maxSmallReactors && 
                        config.config.reactors.large <= maxLargeReactors) {
                        candidates.push(config);
                    }
                }
            }
            
            // Add generator configs if no-fusion is not enforced
            if (!(maxSmallReactors === 0 && maxLargeReactors === 0)) {
                const genKey = `${generator}-generator`;
                const genConfigs = this.lookupTable.get(genKey) || [];
                candidates.push(...genConfigs);
            }
        }
        
        // Sort by base capacity (descending) and limit to top candidates for performance
        candidates.sort((a, b) => b.baseStats.capacity - a.baseStats.capacity);
        
        // Limit to top 100 candidates to keep optimization fast
        return candidates.slice(0, 100);
    }
    
    // Optimize extenders for a given core configuration
    optimizeExtendersForCore(coreConfig, strategy, constraints, targetCapacity, targetRecharge, existingBlocks, existingCrew) {
        const maxAdvanced = constraints.maxAdvancedExtenders !== undefined ? constraints.maxAdvancedExtenders : 4;
        const maxImproved = constraints.maxImprovedExtenders !== undefined ? constraints.maxImprovedExtenders : 6;
        const maxBasic = constraints.maxBasicExtenders !== undefined ? constraints.maxBasicExtenders : 8;
        
        let bestConfig = null;
        let bestScore = -1;
        
        // Smart extender optimization - try key combinations rather than exhaustive search
        const extenderCombinations = this.generateSmartExtenderCombinations(
            maxAdvanced, maxImproved, maxBasic, 
            coreConfig.baseStats, targetCapacity, targetRecharge
        );
        
        for (const extenderConfig of extenderCombinations) {
            // Create full configuration
            const fullConfig = {
                ...coreConfig.config,
                extenders: extenderConfig,
                blocks: { ...existingBlocks },
                crew: { ...existingCrew }
            };
            
            const stats = this.calculator.calculateStats(fullConfig);
            const validation = this.calculator.validateConfiguration(fullConfig, constraints);
            
            // Check if configuration meets strategy requirements
            if (!this.meetsStrategyRequirements(strategy, stats, targetCapacity, targetRecharge, validation)) {
                continue;
            }
            
            // Score configuration based on strategy
            const score = this.scoreConfiguration(strategy, stats, targetCapacity, targetRecharge);
            
            if (score > bestScore) {
                bestScore = score;
                bestConfig = {
                    success: true,
                    configuration: fullConfig,
                    stats: stats,
                    validation: validation,
                    strategy: strategy
                };
            }
        }
        
        return bestConfig ? { result: bestConfig, score: bestScore } : null;
    }
    
    // Generate smart extender combinations based on targets
    generateSmartExtenderCombinations(maxAdvanced, maxImproved, maxBasic, baseStats, targetCapacity, targetRecharge) {
        const combinations = [];
        
        // Calculate needed capacity and recharge
        const neededCapacity = targetCapacity ? Math.max(0, targetCapacity - baseStats.capacity) : 0;
        const neededRecharge = targetRecharge ? Math.max(0, targetRecharge - baseStats.recharge) : 0;
        
        // Strategy 1: Capacity-focused (all capacitors)
        for (let advCap = 0; advCap <= maxAdvanced; advCap++) {
            for (let impCap = 0; impCap <= maxImproved; impCap++) {
                const remainingBasic = Math.min(maxBasic, Math.max(0, (neededCapacity - advCap * 32000 - impCap * 16000) / 8000));
                for (let basCap = 0; basCap <= Math.min(maxBasic, remainingBasic + 2); basCap++) {
                    combinations.push({
                        advanced: { capacitor: advCap, charger: Math.min(maxAdvanced - advCap, 1) },
                        improved: { capacitor: impCap, charger: Math.min(maxImproved - impCap, 1) },
                        basic: { capacitor: basCap, charger: Math.min(maxBasic - basCap, 1) }
                    });
                }
            }
        }
        
        // Strategy 2: Recharge-focused (all chargers)
        for (let advChg = 0; advChg <= maxAdvanced; advChg++) {
            for (let impChg = 0; impChg <= maxImproved; impChg++) {
                const remainingBasic = Math.min(maxBasic, Math.max(0, (neededRecharge - advChg * 1200 - impChg * 600) / 300));
                for (let basChg = 0; basChg <= Math.min(maxBasic, remainingBasic + 2); basChg++) {
                    combinations.push({
                        advanced: { capacitor: Math.min(maxAdvanced - advChg, 1), charger: advChg },
                        improved: { capacitor: Math.min(maxImproved - impChg, 1), charger: impChg },
                        basic: { capacitor: Math.min(maxBasic - basChg, 1), charger: basChg }
                    });
                }
            }
        }
        
        // Strategy 3: Balanced combinations
        const balancedCombos = [
            // Evenly split advanced
            { advanced: { capacitor: Math.floor(maxAdvanced/2), charger: Math.ceil(maxAdvanced/2) }, improved: { capacitor: maxImproved, charger: 0 }, basic: { capacitor: maxBasic, charger: 0 } },
            { advanced: { capacitor: Math.ceil(maxAdvanced/2), charger: Math.floor(maxAdvanced/2) }, improved: { capacitor: 0, charger: maxImproved }, basic: { capacitor: 0, charger: maxBasic } },
            // Max efficiency setups
            { advanced: { capacitor: maxAdvanced, charger: 0 }, improved: { capacitor: 0, charger: maxImproved }, basic: { capacitor: 0, charger: maxBasic } },
            { advanced: { capacitor: 0, charger: maxAdvanced }, improved: { capacitor: maxImproved, charger: 0 }, basic: { capacitor: maxBasic, charger: 0 } }
        ];
        
        combinations.push(...balancedCombos);
        
        return combinations;
    }
    
    // Check if configuration meets strategy requirements
    meetsStrategyRequirements(strategy, stats, targetCapacity, targetRecharge, validation) {
        // Must pass validation
        if (!validation.valid && validation.warnings.length > 0) {
            return false;
        }
        
        // Must have positive capacity and recharge
        if (stats.capacity <= 0 || stats.recharge <= 0) {
            return false;
        }
        
        // Strategy-specific requirements
        if (strategy === 'max-recharge') {
            const maxRechargeTime = 15; // seconds
            const rechargeTime = stats.capacity / stats.recharge;
            return rechargeTime <= maxRechargeTime;
        }
        
        return true;
    }
    
    // Score configuration based on strategy
    scoreConfiguration(strategy, stats, targetCapacity, targetRecharge) {
        let score = 1000000 - stats.cpu; // Base CPU efficiency
        
        switch (strategy) {
            case 'max-capacity':
                return stats.capacity; // Only capacity matters
                
            case 'max-recharge':
                return stats.capacity; // Highest capacity with 15s recharge
                
            case 'max-balanced':
                // Score by total capacity with balance consideration
                return stats.capacity + stats.recharge;
                
            case 'cpu-efficiency':
            default:
                // Enhanced scoring with target bonuses
                if (targetCapacity && stats.capacity >= targetCapacity) {
                    score += (stats.capacity - targetCapacity) / 100;
                }
                if (targetRecharge && stats.recharge >= targetRecharge) {
                    score += (stats.recharge - targetRecharge) * 10;
                }
                
                // Bonus for power efficiency
                if (stats.power <= 0) {
                    score += Math.abs(stats.power) / 1000;
                }
                
                return score;
        }
    }
    
    // Save pre-calculated data to external file
    async saveToFile() {
        const data = {
            coreConfigurations: this.coreConfigurations,
            generatedAt: new Date().toISOString(),
            version: '1.0'
        };
        
        // In a real implementation, this would save to a file
        // For web context, we'll use localStorage as a fallback
        try {
            localStorage.setItem('shieldOptimizationCache', JSON.stringify(data));
        } catch (e) {
        }
        
        return data;
    }
    
    // Load pre-calculated data from external file
    async loadFromFile() {
        try {
            const data = localStorage.getItem('shieldOptimizationCache');
            if (data) {
                const parsed = JSON.parse(data);
                this.coreConfigurations = parsed.coreConfigurations;
                this.buildLookupTable();
                this.isReady = true;
                return true;
            }
        } catch (e) {
        }
        
        return false;
    }
}