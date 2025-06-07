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
        
        // Check power generator limits
        if (configuration.powerGenerators) {
            const maxPowerGenerators = 4; // Enforce 4 generator limit as shown in UI
            for (const genType in configuration.powerGenerators) {
                const count = configuration.powerGenerators[genType];
                if (count > maxPowerGenerators) {
                    warnings.push({
                        type: 'generator',
                        message: `${genType} generators (${count}) exceed limit (${maxPowerGenerators})`
                    });
                }
            }
        }
        
        // Check reactor limits
        if (configuration.reactors) {
            if (configuration.reactors.small > this.components.reactors.small.limit) {
                warnings.push({
                    type: 'reactor',
                    message: `Small fusion reactors (${configuration.reactors.small}) exceed limit (${this.components.reactors.small.limit})`
                });
            }
            if (configuration.reactors.large > this.components.reactors.large.limit) {
                warnings.push({
                    type: 'reactor',
                    message: `Large fusion reactors (${configuration.reactors.large}) exceed limit (${this.components.reactors.large.limit})`
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
}