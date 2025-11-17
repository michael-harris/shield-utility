// Ship Type Configuration System
// Defines ship-specific components, limits, and constraints

const shipTypes = {
    CV: {
        name: "Capital Vessel",
        abbreviation: "CV",

        // Component availability
        hasCompactGenerator: true,
        hasXenoSteelBlocks: true,
        hasShieldTechnicians: true,
        hasFusionReactors: true,  // CV has Small/Large Fusion Reactors
        hasFusionGenerators: false, // CV doesn't have Fusion Generators

        // Hard limits (maximum possible)
        limits: {
            reactors: {
                small: 4,
                large: 2
            },
            extenders: {
                advanced: 4,
                improved: 6,
                basic: 8
            },
            powerGenerators: {
                basicLarge: -1,      // -1 = unlimited
                improvedLarge: -1,
                advancedLarge: -1
            }
        },

        // Default optimization constraints (realistic defaults)
        defaultConstraints: {
            maxSmallReactors: 2,
            maxLargeReactors: 1,
            maxAdvancedExtenders: 4,
            maxImprovedExtenders: 6,
            maxBasicExtenders: 8
        },

        // Component stats (all existing CV stats)
        components: {
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
                    power: -10000,
                    cpu: 12500,
                    size: "1x1x2",
                    limit: null,
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
                    limit: null,
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
                    limit: null,
                    image: "images/advanced-large-generator.png"
                }
            },

            reactors: {
                small: {
                    name: "Small Fusion Reactor",
                    capacity: 0,
                    recharge: 250,
                    powerOutput: 300000,
                    power: -300000,
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
                            capacity: 1.0,
                            recharge: 0.0375
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
                            capacity: -0.5,
                            recharge: 0.0375
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
            }
        }
    },

    SV: {
        name: "Small Vessel",
        abbreviation: "SV",

        // Component availability
        hasCompactGenerator: false,  // SV only has Standard and Advanced
        hasXenoSteelBlocks: false,
        hasShieldTechnicians: false,
        hasFusionReactors: false,    // SV has no reactors at all
        hasFusionGenerators: true,   // SV has Fusion Generators instead

        // Hard limits (maximum possible)
        limits: {
            reactors: {
                small: 0,  // No reactors in SV
                large: 0
            },
            extenders: {
                advanced: 4,
                improved: 4,
                basic: 4
            },
            powerGenerators: {
                basicSmall: -1,        // -1 = unlimited
                improvedSmall: -1,
                advancedSmall: -1,
                fusion: -1             // Unlimited but default constraint is 1
            }
        },

        // Default optimization constraints
        defaultConstraints: {
            maxSmallReactors: 0,
            maxLargeReactors: 0,
            maxAdvancedExtenders: 4,
            maxImprovedExtenders: 4,
            maxBasicExtenders: 4,
            maxFusionGenerators: 1  // Default to 1 (rarely need more)
        },

        // Component stats (SV-specific values)
        components: {
            generators: {
                standard: {
                    name: "Shield Generator",
                    capacity: 4000,
                    recharge: 200,
                    power: 1000,
                    cpu: 1000,
                    size: "3x3x3",
                    limit: 1,
                    image: "images/shield-generator.png"
                },
                advanced: {
                    name: "Advanced Shield Generator",
                    capacity: 8000,
                    recharge: 400,
                    power: 2000,
                    cpu: 2000,
                    size: "3x3x3",
                    limit: 1,
                    image: "images/advanced-shield-generator.png"
                }
            },

            powerGenerators: {
                basicSmall: {
                    name: "Basic Small Generator",
                    capacity: 0,
                    recharge: 0,
                    powerOutput: 875,
                    power: -875,
                    cpu: 500,
                    size: "1x1x1",
                    limit: null,
                    image: "images/basic-small-generator.png"
                },
                improvedSmall: {
                    name: "Improved Small Generator",
                    capacity: 0,
                    recharge: 0,
                    powerOutput: 2000,
                    power: -2000,
                    cpu: 1000,
                    size: "1x1x2",
                    limit: null,
                    image: "images/improved-small-generator.png"
                },
                advancedSmall: {
                    name: "Advanced Small Generator",
                    capacity: 0,
                    recharge: 0,
                    powerOutput: 4500,
                    power: -4500,
                    cpu: 2000,
                    size: "1x1x2",
                    limit: null,
                    image: "images/advanced-small-generator.png"
                },
                fusion: {
                    name: "Fusion Generator",
                    capacity: 0,
                    recharge: 200,
                    powerOutput: 20000,
                    power: -20000,
                    cpu: 4000,
                    size: "2x2x3",
                    limit: null,  // No hard limit, but default constraint is 1
                    image: "images/fusion-generator.png"
                }
            },

            reactors: {
                // No reactors for SV
            },

            extenders: {
                basic: {
                    capacitor: {
                        name: "Small Shield Capacitor",
                        capacity: 1500,
                        recharge: -120,
                        power: 125,
                        cpu: 400,
                        size: "1x1x1",
                        tier: "basic",
                        image: "images/basic-shield-extender.png",
                        efficiency: {
                            capacity: 3.75,   // 1500/400
                            recharge: 0.3     // 120/400
                        }
                    },
                    charger: {
                        name: "Small Shield Charger",
                        capacity: -750,
                        recharge: 240,
                        power: 125,
                        cpu: 400,
                        size: "1x1x1",
                        tier: "basic",
                        image: "images/basic-shield-extender.png",
                        efficiency: {
                            capacity: -1.875,
                            recharge: 0.6
                        }
                    }
                },
                improved: {
                    capacitor: {
                        name: "Small Shield Capacitor",
                        capacity: 3000,
                        recharge: -240,
                        power: 250,
                        cpu: 600,
                        size: "1x1x2",
                        tier: "improved",
                        image: "images/improved-shield-extender.png",
                        efficiency: {
                            capacity: 5.0,
                            recharge: 0.4
                        }
                    },
                    charger: {
                        name: "Small Shield Charger",
                        capacity: -1500,
                        recharge: 480,
                        power: 250,
                        cpu: 600,
                        size: "1x1x2",
                        tier: "improved",
                        image: "images/improved-shield-extender.png",
                        efficiency: {
                            capacity: -2.5,
                            recharge: 0.8
                        }
                    }
                },
                advanced: {
                    capacitor: {
                        name: "Small Shield Capacitor",
                        capacity: 6000,
                        recharge: -480,
                        power: 500,
                        cpu: 900,
                        size: "1x1x2",
                        tier: "advanced",
                        image: "images/advanced-shield-extender.png",
                        efficiency: {
                            capacity: 6.67,
                            recharge: 0.533
                        }
                    },
                    charger: {
                        name: "Small Shield Charger",
                        capacity: -3000,
                        recharge: 960,
                        power: 500,
                        cpu: 900,
                        size: "1x1x2",
                        tier: "advanced",
                        image: "images/advanced-shield-extender.png",
                        efficiency: {
                            capacity: -3.33,
                            recharge: 1.067
                        }
                    }
                }
            },

            tierLimits: {
                basic: 4,
                improved: 4,
                advanced: 4
            }
        }
    }
};

// Utility class for ship-type-aware operations
const ShipTypeUtils = {
    // Get ship type configuration
    getShipType(shipType = 'CV') {
        return shipTypes[shipType] || shipTypes.CV;
    },

    // Get ship-specific components
    getComponents(shipType = 'CV') {
        const ship = this.getShipType(shipType);
        return ship.components;
    },

    // Get ship-specific limits
    getLimits(shipType = 'CV') {
        const ship = this.getShipType(shipType);
        return ship.limits;
    },

    // Get ship-specific default constraints
    getDefaultConstraints(shipType = 'CV') {
        const ship = this.getShipType(shipType);
        return ship.defaultConstraints;
    },

    // Get extender tier limit for specific ship type
    getTierLimit(tier, shipType = 'CV') {
        const components = this.getComponents(shipType);
        return components.tierLimits[tier] || 0;
    },

    // Get reactor limit for specific ship type
    getReactorLimit(reactorSize, shipType = 'CV') {
        const limits = this.getLimits(shipType);
        return limits.reactors[reactorSize] || 0;
    },

    // Check if ship type has specific component
    hasComponent(shipType, componentType) {
        const ship = this.getShipType(shipType);
        switch(componentType) {
            case 'compactGenerator':
                return ship.hasCompactGenerator;
            case 'xenoSteelBlocks':
                return ship.hasXenoSteelBlocks;
            case 'shieldTechnicians':
                return ship.hasShieldTechnicians;
            case 'fusionReactors':
                return ship.hasFusionReactors;
            case 'fusionGenerators':
                return ship.hasFusionGenerators;
            default:
                return false;
        }
    },

    // Get available generator types for ship
    getAvailableGenerators(shipType = 'CV') {
        const components = this.getComponents(shipType);
        return Object.keys(components.generators);
    },

    // Get available power generator types for ship
    getAvailablePowerGenerators(shipType = 'CV') {
        const components = this.getComponents(shipType);
        return Object.keys(components.powerGenerators || {});
    }
};
