// Component Database
const components = {
    blocks: {
        steel: { 
            name: "Steel Block", 
            capacity: 1, 
            power: 0, 
            cpu: 0,
            image: "images/steel-block.png"
        },
        hardenedSteel: { 
            name: "Hardened Steel Block", 
            capacity: 2, 
            power: 0, 
            cpu: 0,
            image: "images/hardened-steel-block.png"
        },
        combatSteel: { 
            name: "Combat Steel Block", 
            capacity: 4, 
            power: 0, 
            cpu: 0,
            image: "images/combat-steel-block.png"
        },
        xenoSteel: { 
            name: "XenoSteel Block", 
            capacity: 7, 
            power: 0, 
            cpu: 0,
            image: "images/xenosteel-block.png"
        }
    },
    
    generators: {
        compact: { 
            name: "Compact Shield Generator",
            capacity: 6000, 
            recharge: 300, 
            power: 10000, 
            cpu: 20000,
            size: "1x2x3",
            limit: 1,
            image: "images/compact-shield-generator.png"
        },
        standard: {
            name: "Shield Generator",
            capacity: 12000,
            recharge: 300,
            power: 17500,
            cpu: 30000,
            size: "3x3x3",
            limit: 1,
            image: "images/shield-generator.png"
        },
        advanced: {
            name: "Advanced Shield Generator",
            capacity: 24000,
            recharge: 600,
            power: 25000,
            cpu: 45000,
            size: "3x3x3",
            limit: 1,
            image: "images/advanced-shield-generator.png"
        }
    },
    
    powerGenerators: {
        basicLarge: {
            name: "Basic Large Generator",
            capacity: 0,
            recharge: 0,
            powerOutput: 10000,
            power: -10000, // Negative because it provides power
            cpu: 12500,
            size: "1x1x2",
            limit: null, // No limit
            image: "images/basic-large-generator.png"
        },
        improvedLarge: {
            name: "Improved Large Generator",
            capacity: 0,
            recharge: 0,
            powerOutput: 25000,
            power: -25000,
            cpu: 25000,
            size: "1x1x3",
            limit: null, // No limit
            image: "images/improved-large-generator.png"
        },
        advancedLarge: {
            name: "Advanced Large Generator",
            capacity: 0,
            recharge: 0,
            powerOutput: 100000,
            power: -100000,
            cpu: 50000,
            size: "2x2x6",
            limit: null, // No limit
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
        basic: {
            capacitor: {
                name: "Basic Capacitor",
                capacity: 8000,
                recharge: -150,
                power: 4000,
                cpu: 8000,
                size: "1x1x2",
                tier: "basic",
                image: "images/basic-shield-extender.png",
                efficiency: {
                    capacity: 1.0, // capacity per CPU
                    recharge: 0.0375 // recharge per CPU (absolute value)
                }
            },
            charger: {
                name: "Basic Charger",
                capacity: -4000,
                recharge: 300,
                power: 4000,
                cpu: 8000,
                size: "1x1x2",
                tier: "basic",
                image: "images/basic-shield-extender.png",
                efficiency: {
                    capacity: -0.5, // negative capacity per CPU
                    recharge: 0.0375 // recharge per CPU
                }
            }
        },
        improved: {
            capacitor: {
                name: "Improved Capacitor",
                capacity: 16000,
                recharge: -300,
                power: 8000,
                cpu: 12000,
                size: "2x2x3",
                tier: "improved",
                image: "images/improved-shield-extender.png",
                efficiency: {
                    capacity: 1.33,
                    recharge: 0.05
                }
            },
            charger: {
                name: "Improved Charger",
                capacity: -8000,
                recharge: 600,
                power: 8000,
                cpu: 12000,
                size: "2x2x3",
                tier: "improved",
                image: "images/improved-shield-extender.png",
                efficiency: {
                    capacity: -0.67,
                    recharge: 0.05
                }
            }
        },
        advanced: {
            capacitor: {
                name: "Advanced Capacitor",
                capacity: 32000,
                recharge: -600,
                power: 16000,
                cpu: 18000,
                size: "3x3x4",
                tier: "advanced",
                image: "images/advanced-shield-extender.png",
                efficiency: {
                    capacity: 1.78,
                    recharge: 0.067
                }
            },
            charger: {
                name: "Advanced Charger",
                capacity: -16000,
                recharge: 1200,
                power: 16000,
                cpu: 18000,
                size: "3x3x4",
                tier: "advanced",
                image: "images/advanced-shield-extender.png",
                efficiency: {
                    capacity: -0.89,
                    recharge: 0.067
                }
            }
        }
    },
    
    tierLimits: {
        basic: 8,
        improved: 6,
        advanced: 4
    },
    
    crew: {
        shieldTechnician: {
            name: "Shield Technician",
            capacity: 2000,
            recharge: 75,
            power: 0,
            cpu: 0,
            limit: 16,
            image: "images/shield-technician.png"
        }
    }
};

// Utility functions for component data
const ComponentUtils = {
    // Get all extenders for a specific tier
    getExtendersForTier(tier) {
        return components.extenders[tier] || {};
    },
    
    // Get component by type and id
    getComponent(type, id) {
        return components[type] && components[type][id] ? components[type][id] : null;
    },
    
    // Get all components of a specific type
    getComponentsByType(type) {
        return components[type] || {};
    },
    
    // Calculate efficiency score for sorting
    getEfficiencyScore(component, prioritizeCapacity = true) {
        if (!component.efficiency) return 0;
        
        if (prioritizeCapacity) {
            return Math.abs(component.efficiency.capacity);
        } else {
            return component.efficiency.recharge;
        }
    },
    
    // Format power values for display
    formatPower(power) {
        if (Math.abs(power) >= 1000000) {
            return (power / 1000000).toFixed(1) + ' MW';
        } else if (Math.abs(power) >= 1000) {
            return (power / 1000).toFixed(1) + ' kW';
        } else {
            return power + ' W';
        }
    },
    
    // Format numbers with commas
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    // Get tier limit for extenders
    getTierLimit(tier) {
        return components.tierLimits[tier] || 0;
    }
};

// Create alias for backward compatibility
const ShieldComponents = components;