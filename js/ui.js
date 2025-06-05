// UI Controller for Shield Utility
class UIController {
    constructor(calculator, optimizer) {
        this.calculator = calculator;
        this.optimizer = optimizer;
        this.currentMode = 'value-to-component';
        this.chart = null;
        this.calculatorChart = null; // Chart for calculator results
        
        this.initializeEventListeners();
        this.initializeExtenderDropdowns();
        this.updateComponentBoxStates();
        this.updateLiveStats();
    }
    
    // Initialize all event listeners
    initializeEventListeners() {
        // Mode switching
        document.querySelectorAll('.mode-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const mode = e.target.closest('button').dataset.mode;
                this.switchMode(mode);
            });
        });
        
        // Calculate button
        const calculateBtn = document.getElementById('calculate-btn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculateOptimal());
        }
        
        // Block inputs for value-to-component mode
        document.querySelectorAll('.block-input').forEach(input => {
            input.addEventListener('input', () => this.updateBlockCapacity());
        });
        
        // Live inputs for component-to-value mode
        document.querySelectorAll('.block-input-live, .extender-select, .generator-input, .crew-input').forEach(input => {
            input.addEventListener('change', () => this.updateLiveStats());
        });
        
        // Generator and reactor selects
        const generatorSelect = document.getElementById('shield-generator-select');
        if (generatorSelect) {
            generatorSelect.addEventListener('change', () => {
                this.updateComponentBoxStates();
                this.updateLiveStats();
            });
        }
        
        const smallReactorSelect = document.getElementById('small-reactor-count');
        if (smallReactorSelect) {
            smallReactorSelect.addEventListener('change', () => this.updateLiveStats());
        }
        
        const largeReactorSelect = document.getElementById('large-reactor-count');
        if (largeReactorSelect) {
            largeReactorSelect.addEventListener('change', () => this.updateLiveStats());
        }
        
        // Extender selects with limit checking
        document.querySelectorAll('.extender-select').forEach(select => {
            select.addEventListener('change', (e) => {
                this.updateExtenderLimits();
                this.updateLiveStats();
            });
        });
    }
    
    // Switch between calculation modes
    switchMode(mode) {
        this.currentMode = mode;
        
        // Update button appearance
        document.querySelectorAll('.mode-button').forEach(button => button.classList.remove('is-active'));
        document.querySelector(`[data-mode="${mode}"]`).classList.add('is-active');
        
        // Switch content
        document.querySelectorAll('.mode-content').forEach(content => {
            content.classList.remove('is-active');
        });
        document.getElementById(`${mode}-mode`).classList.add('is-active');
        
        // Update tagline
        this.updateModeTagline(mode);
        
        // Initialize chart for component-to-value mode
        if (mode === 'component-to-value') {
            setTimeout(() => {
                this.initializeChart();
                this.updateLiveStats();
            }, 100);
        }
    }
    
    // Update the tagline based on current mode
    updateModeTagline(mode) {
        const taglineElement = document.getElementById('mode-tagline');
        if (!taglineElement) return;
        
        const taglines = {
            'value-to-component': 'Find the most CPU-efficient configuration for your target shield values',
            'component-to-value': 'Experiment with different components and see real-time shield performance'
        };
        
        taglineElement.textContent = taglines[mode] || taglines['value-to-component'];
    }
    
    // Initialize extender dropdown options
    initializeExtenderDropdowns() {
        const tiers = ['advanced', 'improved', 'basic'];
        const types = ['capacitor', 'charger'];
        
        tiers.forEach(tier => {
            types.forEach(type => {
                const selectId = `${tier}-${type}s`;
                const select = document.getElementById(selectId);
                if (select) {
                    const limit = ComponentUtils.getTierLimit(tier);
                    
                    // Clear existing options
                    select.innerHTML = '';
                    
                    // Add options from 0 to tier limit
                    for (let i = 0; i <= limit; i++) {
                        const option = document.createElement('option');
                        option.value = i;
                        option.textContent = i;
                        select.appendChild(option);
                    }
                }
            });
        });
    }
    
    // Update extender dropdown limits based on current selections
    updateExtenderLimits() {
        const tiers = ['advanced', 'improved', 'basic'];
        
        tiers.forEach(tier => {
            const capacitorSelect = document.getElementById(`${tier}-capacitors`);
            const chargerSelect = document.getElementById(`${tier}-chargers`);
            const limit = ComponentUtils.getTierLimit(tier);
            
            if (capacitorSelect && chargerSelect) {
                const capacitorCount = parseInt(capacitorSelect.value) || 0;
                const chargerCount = parseInt(chargerSelect.value) || 0;
                
                // Update capacitor options
                this.updateSelectOptions(capacitorSelect, limit - chargerCount, capacitorCount);
                
                // Update charger options
                this.updateSelectOptions(chargerSelect, limit - capacitorCount, chargerCount);
                
                // Update limit display
                const limitSpan = document.getElementById(`${tier}-limit`);
                if (limitSpan) {
                    limitSpan.textContent = `${limit}`;
                }
            }
        });
    }
    
    // Update select dropdown options
    updateSelectOptions(select, maxValue, currentValue) {
        const selectedValue = currentValue;
        select.innerHTML = '';
        
        for (let i = 0; i <= maxValue; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            if (i === selectedValue) {
                option.selected = true;
            }
            select.appendChild(option);
        }
    }
    
    // Update block capacity display
    updateBlockCapacity() {
        const blocks = {
            steel: parseInt(document.getElementById('steel-blocks').value) || 0,
            hardenedSteel: parseInt(document.getElementById('hardened-steel-blocks').value) || 0,
            combatSteel: parseInt(document.getElementById('combat-steel-blocks').value) || 0,
            xenoSteel: parseInt(document.getElementById('xeno-steel-blocks').value) || 0
        };
        
        const totalCapacity = this.calculator.calculateBlockCapacity(blocks);
        const displayElement = document.getElementById('total-block-capacity');
        if (displayElement) {
            displayElement.textContent = ComponentUtils.formatNumber(totalCapacity);
        }
    }
    
    // Update live stats for component-to-value mode
    updateLiveStats() {
        const config = this.getCurrentConfiguration();
        const stats = this.calculator.calculateStats(config);
        const validation = this.calculator.validateConfiguration(config);
        
        // Update stat displays
        this.updateStatDisplay('live-capacity', stats.capacity, 'HP');
        this.updateStatDisplay('live-recharge', stats.recharge, 'HP/s');
        this.updateStatDisplay('live-cpu', stats.cpu, '');
        this.updateStatDisplay('live-power', stats.power, 'W', true);
        
        // Update warnings
        this.updateWarnings(validation.warnings);
        
        // Update chart
        this.updateChart(stats);
        
        // Update inventory
        this.updateInventory(config, stats);
    }
    
    // Update individual stat display
    updateStatDisplay(elementId, value, unit, isPower = false) {
        const element = document.getElementById(elementId);
        if (element) {
            let formattedValue;
            if (isPower) {
                if (value < 0) {
                    // Negative power means generation
                    formattedValue = '+' + ComponentUtils.formatPower(Math.abs(value)) + ' Generated';
                } else if (value > 0) {
                    // Positive power means consumption
                    formattedValue = '-' + ComponentUtils.formatPower(value) + ' Required';
                } else {
                    formattedValue = '0 W';
                }
            } else {
                formattedValue = ComponentUtils.formatNumber(value) + (unit ? ' ' + unit : '');
            }
            
            element.textContent = formattedValue;
            
            // Add negative class for values that need attention
            if (isPower) {
                element.classList.toggle('negative', value > 0); // Red if power is required
            } else {
                element.classList.toggle('negative', value < 0); // Red if negative stats
            }
        }
    }
    
    // Update component box states based on shield generator selection
    updateComponentBoxStates() {
        const generatorSelect = document.getElementById('shield-generator-select');
        const hasShield = generatorSelect && generatorSelect.value !== 'none';
        
        // Get component boxes
        const generatorsBox = document.getElementById('generators-box');
        const extendersBox = document.getElementById('extenders-box');
        const blocksBox = document.getElementById('blocks-box');
        const crewBox = document.getElementById('crew-box');
        
        // Toggle disabled state
        if (generatorsBox) {
            generatorsBox.classList.toggle('component-box-disabled', !hasShield);
        }
        if (extendersBox) {
            extendersBox.classList.toggle('component-box-disabled', !hasShield);
        }
        if (blocksBox) {
            blocksBox.classList.toggle('component-box-disabled', !hasShield);
        }
        if (crewBox) {
            crewBox.classList.toggle('component-box-disabled', !hasShield);
        }
        
        // Disable/enable all inputs within these boxes
        const boxes = [generatorsBox, extendersBox, blocksBox, crewBox];
        boxes.forEach(box => {
            if (box) {
                const inputs = box.querySelectorAll('input, select');
                inputs.forEach(input => {
                    input.disabled = !hasShield;
                });
            }
        });
    }
    
    // Update warnings display
    updateWarnings(warnings) {
        const warningsContainer = document.getElementById('warnings');
        if (!warningsContainer) return;
        
        warningsContainer.innerHTML = '';
        
        warnings.forEach(warning => {
            const notification = document.createElement('div');
            notification.className = 'notification is-warning is-light';
            notification.innerHTML = `
                <button class="delete" onclick="this.parentElement.remove()"></button>
                <strong>${warning.type.toUpperCase()}:</strong> ${warning.message}
            `;
            warningsContainer.appendChild(notification);
        });
    }
    
    // Get current configuration from UI
    getCurrentConfiguration() {
        const config = this.calculator.createEmptyConfiguration();
        
        // Generator
        const generatorSelect = document.getElementById('shield-generator-select');
        if (generatorSelect) {
            config.generator = generatorSelect.value;
        }
        
        // Power Generators
        config.powerGenerators = {
            basicLarge: parseInt(document.getElementById('basic-large-generators')?.value) || 0,
            improvedLarge: parseInt(document.getElementById('improved-large-generators')?.value) || 0,
            advancedLarge: parseInt(document.getElementById('advanced-large-generators')?.value) || 0
        };
        
        // Reactors
        const smallReactorSelect = document.getElementById('small-reactor-count');
        if (smallReactorSelect) {
            config.reactors.small = parseInt(smallReactorSelect.value) || 0;
        }
        
        const largeReactorSelect = document.getElementById('large-reactor-count');
        if (largeReactorSelect) {
            config.reactors.large = parseInt(largeReactorSelect.value) || 0;
        }
        
        // Extenders
        const tiers = ['advanced', 'improved', 'basic'];
        tiers.forEach(tier => {
            const capacitorSelect = document.getElementById(`${tier}-capacitors`);
            const chargerSelect = document.getElementById(`${tier}-chargers`);
            
            if (capacitorSelect) {
                config.extenders[tier].capacitor = parseInt(capacitorSelect.value) || 0;
            }
            if (chargerSelect) {
                config.extenders[tier].charger = parseInt(chargerSelect.value) || 0;
            }
        });
        
        // Blocks
        const blockInputs = document.querySelectorAll('.block-input-live');
        blockInputs.forEach(input => {
            const blockType = this.getBlockTypeFromId(input.id);
            if (blockType) {
                config.blocks[blockType] = parseInt(input.value) || 0;
            }
        });
        
        // Crew (Shield Explorer only)
        const shieldTechniciansSelect = document.getElementById('shield-technicians');
        if (shieldTechniciansSelect) {
            config.crew = {
                shieldTechnicians: parseInt(shieldTechniciansSelect.value) || 0
            };
        }
        
        return config;
    }
    
    // Get block type from input ID
    getBlockTypeFromId(id) {
        const mapping = {
            'steel-blocks-live': 'steel',
            'hardened-steel-blocks-live': 'hardenedSteel',
            'combat-steel-blocks-live': 'combatSteel',
            'xeno-steel-blocks-live': 'xenoSteel'
        };
        return mapping[id];
    }
    
    // Calculate optimal configuration
    async calculateOptimal() {
        const calculateBtn = document.getElementById('calculate-btn');
        
        // Show loading state
        calculateBtn.classList.add('is-loading');
        
        try {
            // Get input values
            const targetCapacity = parseInt(document.getElementById('target-capacity').value) || 0;
            const targetRecharge = parseInt(document.getElementById('target-recharge').value) || 0;
            
            if (!targetCapacity && !targetRecharge) {
                this.showError('Please enter at least one target value (capacity or recharge).');
                return;
            }
            
            // Get constraints
            const constraints = {
                cpuLimit: parseInt(document.getElementById('cpu-limit').value) || null,
                powerLimit: parseInt(document.getElementById('power-limit').value) || null,
                maxAdvancedExtenders: parseInt(document.getElementById('max-advanced-extenders').value),
                maxImprovedExtenders: parseInt(document.getElementById('max-improved-extenders').value),
                maxBasicExtenders: parseInt(document.getElementById('max-basic-extenders').value),
                maxSmallReactors: parseInt(document.getElementById('max-small-reactors').value),
                maxLargeReactors: parseInt(document.getElementById('max-large-reactors').value)
            };
            
            // Get existing blocks
            const existingBlocks = {
                steel: parseInt(document.getElementById('steel-blocks').value) || 0,
                hardenedSteel: parseInt(document.getElementById('hardened-steel-blocks').value) || 0,
                combatSteel: parseInt(document.getElementById('combat-steel-blocks').value) || 0,
                xenoSteel: parseInt(document.getElementById('xeno-steel-blocks').value) || 0
            };
            
            // Get existing crew
            const existingCrew = {
                shieldTechnicians: parseInt(document.getElementById('existing-shield-technicians').value) || 0
            };
            
            // Perform optimization
            const result = this.optimizer.optimize(targetCapacity, targetRecharge, constraints, existingBlocks, existingCrew);
            
            // Display results
            this.displayOptimizationResults(result, targetCapacity, targetRecharge);
            
        } catch (error) {
            console.error('Optimization error:', error);
            this.showError('An error occurred during optimization. Please try again.');
        } finally {
            calculateBtn.classList.remove('is-loading');
        }
    }
    
    // Display optimization results
    displayOptimizationResults(result, targetCapacity, targetRecharge) {
        if (!result.success) {
            this.displayOptimizationFailure(result, targetCapacity, targetRecharge);
            return;
        }
        
        const config = result.configuration;
        const stats = result.stats;
        
        // Update calculator stats display with chart
        this.updateCalculatorStats(stats, result.strategy);
        
        // Populate Required Components (pass result for scaled-down message)
        this.populateRequiredComponents(config, result.strategy, result);
        
        // Populate Applied Constraints
        this.populateAppliedConstraints();
        
        // Show all result boxes
        document.getElementById('calculator-stats-box').classList.remove('is-hidden');
        document.getElementById('required-components-box').classList.remove('is-hidden');
        document.getElementById('applied-constraints-box').classList.remove('is-hidden');
        
        // Reset the form after successful calculation
        this.resetCalculatorForm();
    }
    
    // Display optimization failure
    displayOptimizationFailure(result, targetCapacity, targetRecharge) {
        // Show error notification at top of page
        this.showError('The requested values are impossible given the current constraints.');
        
        // Reset only the target values
        document.getElementById('target-capacity').value = '';
        document.getElementById('target-recharge').value = '';
        
        // Hide all result boxes
        document.getElementById('calculator-stats-box').classList.add('is-hidden');
        document.getElementById('required-components-box').classList.add('is-hidden');
        document.getElementById('applied-constraints-box').classList.add('is-hidden');
    }
    
    // Create component card HTML (for calculator results - uses same format as inventory)
    createComponentCard(component, quantity) {
        if (!component || typeof component !== 'object') {
            console.error('Invalid component:', component);
            return '';
        }
        
        return `
            <div class="inventory-item">
                <img src="${component.image}" alt="${component.name}" class="inventory-icon" />
                <div class="inventory-details">
                    <div class="inventory-name">${component.name}</div>
                    <div class="inventory-stats">
                        ${component.capacity ? `${ComponentUtils.formatNumber(component.capacity)} HP` : ''}
                        ${component.recharge && component.recharge !== 0 ? ` • ${component.recharge > 0 ? '+' : ''}${ComponentUtils.formatNumber(component.recharge)} HP/s` : ''}
                    </div>
                </div>
                <div class="inventory-quantity">×${quantity}</div>
            </div>
        `;
    }
    
    // Show error message
    showError(message) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.className = 'notification is-danger';
        notification.innerHTML = `
            <button class="delete" onclick="this.parentElement.remove()"></button>
            ${message}
        `;
        
        // Insert at top of container
        const container = document.querySelector('.container');
        container.insertBefore(notification, container.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Initialize Chart.js chart
    initializeChart() {
        const canvas = document.getElementById('statsChart');
        if (!canvas) return;
        
        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        
        const ctx = canvas.getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Capacity', 'Recharge', 'CPU Efficiency', 'Power Efficiency'],
                datasets: [{
                    label: 'Current Configuration',
                    data: [0, 0, 0, 0],
                    backgroundColor: 'rgba(0, 209, 178, 0.2)',
                    borderColor: 'rgba(0, 209, 178, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(0, 209, 178, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(0, 209, 178, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff',
                            usePointStyle: true,
                            boxWidth: 0,
                            boxHeight: 0
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: '#b5b5b5',
                            backdropColor: 'transparent'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        pointLabels: {
                            color: '#ffffff'
                        }
                    }
                }
            }
        });
    }
    
    // Calculate theoretical maximum capacity while maintaining recharge > 0
    calculateMaxCapacity() {
        // Find maximum capacity with any positive recharge
        // Advanced Shield + all capacitors + minimal chargers to keep recharge > 0
        // LIMITED TO 1 LARGE REACTOR ONLY (to match recharge calculation)
        
        let maxCapacity = components.generators.advanced.capacity; // 24,000
        let recharge = components.generators.advanced.recharge; // 600
        
        // Add only 1 large reactor (same constraint as recharge calculation)
        recharge += 1 * components.reactors.large.recharge; // +1,000
        // Total recharge: 1,600
        
        // Add maximum capacitors
        maxCapacity += 4 * components.extenders.advanced.capacitor.capacity; // +128,000
        maxCapacity += 6 * components.extenders.improved.capacitor.capacity; // +96,000
        maxCapacity += 8 * components.extenders.basic.capacitor.capacity; // +64,000
        
        recharge += 4 * components.extenders.advanced.capacitor.recharge; // -2,400
        recharge += 6 * components.extenders.improved.capacitor.recharge; // -1,800
        recharge += 8 * components.extenders.basic.capacitor.recharge; // -1,200
        
        // Total: 312,000 HP capacity, -1,800 HP/s recharge (negative!)
        // We need to add some chargers to make recharge positive
        
        // Replace some basic capacitors with chargers until recharge > 0
        let basicCapacitors = 8;
        let basicChargers = 0;
        
        while (recharge <= 0 && basicCapacitors > 0) {
            // Remove a capacitor
            maxCapacity -= components.extenders.basic.capacitor.capacity;
            recharge -= components.extenders.basic.capacitor.recharge;
            basicCapacitors--;
            
            // Add a charger
            maxCapacity += components.extenders.basic.charger.capacity;
            recharge += components.extenders.basic.charger.recharge;
            basicChargers++;
        }
        
        console.log('Maximum capacity with positive recharge:', maxCapacity);
        return maxCapacity;
    }
    
    // Calculate theoretical maximum recharge with capacity >= base shield and only 1 large reactor
    calculateMaxRecharge() {
        // Start with Advanced Shield Generator
        const baseCapacity = components.generators.advanced.capacity; // 24,000
        let maxRecharge = components.generators.advanced.recharge; // 600
        let capacity = baseCapacity;
        
        // Add exactly 1 large reactor (no small reactors allowed)
        maxRecharge += 1 * components.reactors.large.recharge; // +1000
        // Total base recharge: 1,600 HP/s
        
        // Add all possible chargers while maintaining capacity >= base
        let chargersAdded = {
            advanced: 0,
            improved: 0,
            basic: 0
        };
        
        // Try to add chargers in order of recharge efficiency
        // Advanced chargers: +1200 recharge, -16000 capacity
        while (chargersAdded.advanced < 4 && 
               capacity + components.extenders.advanced.charger.capacity >= baseCapacity) {
            capacity += components.extenders.advanced.charger.capacity;
            maxRecharge += components.extenders.advanced.charger.recharge;
            chargersAdded.advanced++;
        }
        
        // Improved chargers: +600 recharge, -8000 capacity
        while (chargersAdded.improved < 6 && 
               capacity + components.extenders.improved.charger.capacity >= baseCapacity) {
            capacity += components.extenders.improved.charger.capacity;
            maxRecharge += components.extenders.improved.charger.recharge;
            chargersAdded.improved++;
        }
        
        // Basic chargers: +300 recharge, -4000 capacity
        while (chargersAdded.basic < 8 && 
               capacity + components.extenders.basic.charger.capacity >= baseCapacity) {
            capacity += components.extenders.basic.charger.capacity;
            maxRecharge += components.extenders.basic.charger.recharge;
            chargersAdded.basic++;
        }
        
        console.log('Maximum recharge with 1 large reactor:', maxRecharge);
        return maxRecharge;
    }
    
    // Calculate minimum CPU (just compact shield)
    calculateMinCPU() {
        return components.generators.compact.cpu; // 20,000
    }
    
    // Calculate maximum CPU (Advanced shield + 1 Large reactor + all extenders within limits)
    calculateMaxCPU() {
        let maxCPU = components.generators.advanced.cpu; // 45,000
        maxCPU += 1 * components.reactors.large.cpu; // 200,000
        
        // Add all extenders (but respecting the tier limits)
        // Can only have total of 4 advanced, 6 improved, 8 basic
        maxCPU += 4 * Math.max(components.extenders.advanced.capacitor.cpu, 
                               components.extenders.advanced.charger.cpu); // 4 * 18,000 = 72,000
        maxCPU += 6 * Math.max(components.extenders.improved.capacitor.cpu,
                               components.extenders.improved.charger.cpu); // 6 * 12,000 = 72,000  
        maxCPU += 8 * Math.max(components.extenders.basic.capacitor.cpu,
                               components.extenders.basic.charger.cpu); // 8 * 8,000 = 64,000
        
        // Total: 45,000 + 200,000 + 72,000 + 72,000 + 64,000 = 453,000
        return maxCPU;
    }
    
    // Update chart data
    updateChart(stats) {
        if (!this.chart) {
            // Try to initialize chart if it doesn't exist
            this.initializeChart();
            if (!this.chart) return;
        }
        
        // Ensure stats object has all required properties
        if (!stats || typeof stats.capacity === 'undefined' || typeof stats.recharge === 'undefined' || 
            typeof stats.cpu === 'undefined' || typeof stats.power === 'undefined') {
            console.warn('Invalid stats object:', stats);
            return;
        }
        
        // Calculate theoretical maximums
        const maxCapacity = this.calculateMaxCapacity();
        const minCPU = this.calculateMinCPU();
        const maxCPU = this.calculateMaxCPU();
        
        // Normalize values to 0-100 scale
        const normalizedData = [
            // Capacity: 100% = capacity >= max achievable with 60s recharge
            stats.capacity === 0 ? 0 : 
            stats.capacity >= maxCapacity ? 100 :
            Math.max(0, (stats.capacity / maxCapacity) * 100),
            
            // Recharge: 100% = recharge >= capacity/15 (15 second or faster full recharge)
            stats.recharge <= 0 ? 0 : 
            stats.capacity === 0 ? 0 :
            stats.recharge >= (stats.capacity / 15) ? 100 :
            (stats.recharge / (stats.capacity / 15)) * 100,
            
            // CPU Efficiency: 100% = CPU <= 20,000 and > 0, 0% = max components or no components
            // If no components selected (cpu = 0), show 0% efficiency
            stats.cpu === 0 ? 0 : 
            stats.cpu <= minCPU ? 100 :
            Math.max(0, Math.min(100, 100 - ((stats.cpu - minCPU) / (maxCPU - minCPU)) * 100)),
            
            // Power Efficiency: 100% = power surplus <= 50kW, 0% = power required (positive)
            // If no components selected (power = 0), show 100% efficiency
            stats.power === 0 ? 100 :
            stats.power > 0 ? 0 :  // Positive power (required) = 0% efficiency
            // Negative power means surplus - calculate efficiency based on surplus amount
            (() => {
                const surplus = Math.abs(stats.power);
                if (surplus <= 50000) return 100;
                if (surplus >= 300000) return 0;
                return Math.max(0, 100 - ((surplus - 50000) / 250000) * 100);
            })()
        ];
        
        this.chart.data.datasets[0].data = normalizedData;
        this.chart.update('none');
        
        // Update strategy display
        this.updateStrategyDisplay(normalizedData[0], normalizedData[1]);
    }
    
    // Determine and display strategy based on capacity and recharge percentages
    updateStrategyDisplay(capacityPercent, rechargePercent) {
        let strategy = 'Balanced';
        
        const difference = capacityPercent - rechargePercent;
        
        if (difference > 15) {
            strategy = 'Capacity';
        } else if (difference < -15) {
            strategy = 'Recharge';
        }
        
        // Update or create strategy display
        let strategyBox = document.getElementById('strategy-display');
        if (!strategyBox) {
            // Create strategy box if it doesn't exist
            const chartContainer = document.getElementById('statsChart');
            if (!chartContainer) return;
            
            // Find the chart's container div (the one with mt-5 class)
            const chartDiv = chartContainer.parentElement;
            if (!chartDiv) return;
            
            strategyBox = document.createElement('div');
            strategyBox.id = 'strategy-display';
            strategyBox.className = 'notification is-info is-light mt-3';
            
            // Insert after the chart's container div, not after the canvas
            chartDiv.insertAdjacentElement('afterend', strategyBox);
        }
        
        strategyBox.innerHTML = `<strong>Strategy:</strong> ${strategy}`;
    }
    
    // Update inventory display for Shield Explorer
    updateInventory(config, stats) {
        const inventoryContent = document.getElementById('inventory-content');
        if (!inventoryContent) return;
        
        let html = '';
        let totalComponents = 0;
        
        // Generator
        if (config.generator && config.generator !== 'none') {
            const gen = ComponentUtils.getComponent('generators', config.generator);
            html += this.createInventoryItem(gen, 1);
            totalComponents++;
        }
        
        // Power Generators
        if (config.powerGenerators) {
            for (const genType in config.powerGenerators) {
                const count = config.powerGenerators[genType];
                if (count > 0) {
                    const gen = ComponentUtils.getComponent('powerGenerators', genType);
                    if (gen) {
                        html += this.createInventoryItem(gen, count);
                        totalComponents += count;
                    }
                }
            }
        }
        
        // Reactors
        if (config.reactors.small > 0) {
            const reactor = ComponentUtils.getComponent('reactors', 'small');
            html += this.createInventoryItem(reactor, config.reactors.small);
            totalComponents += config.reactors.small;
        }
        
        if (config.reactors.large > 0) {
            const reactor = ComponentUtils.getComponent('reactors', 'large');
            html += this.createInventoryItem(reactor, config.reactors.large);
            totalComponents += config.reactors.large;
        }
        
        // Extenders
        for (const tier in config.extenders) {
            if (config.extenders[tier].capacitor > 0) {
                const component = ComponentUtils.getComponent('extenders', tier).capacitor;
                html += this.createInventoryItem(component, config.extenders[tier].capacitor);
                totalComponents += config.extenders[tier].capacitor;
            }
            
            if (config.extenders[tier].charger > 0) {
                const component = ComponentUtils.getComponent('extenders', tier).charger;
                html += this.createInventoryItem(component, config.extenders[tier].charger);
                totalComponents += config.extenders[tier].charger;
            }
        }
        
        // Blocks
        for (const blockType in config.blocks) {
            if (config.blocks[blockType] > 0) {
                const block = ComponentUtils.getComponent('blocks', blockType);
                html += this.createInventoryItem(block, config.blocks[blockType]);
                totalComponents += config.blocks[blockType];
            }
        }
        
        // Crew
        if (config.crew && config.crew.shieldTechnicians > 0) {
            const technician = ComponentUtils.getComponent('crew', 'shieldTechnician');
            html += this.createInventoryItem(technician, config.crew.shieldTechnicians);
            totalComponents += config.crew.shieldTechnicians;
        }
        
        if (totalComponents === 0) {
            html = '<div class="notification is-info is-light"><p>Select components to see your build here</p></div>';
        } else {
            html = `
                <div class="notification is-success is-light mb-3">
                    <strong>Total Components:</strong> ${totalComponents}
                </div>
            ` + html;
        }
        
        inventoryContent.innerHTML = html;
    }
    
    // Create inventory item HTML
    createInventoryItem(component, quantity) {
        return `
            <div class="inventory-item">
                <img src="${component.image}" alt="${component.name}" class="inventory-icon" />
                <div class="inventory-details">
                    <div class="inventory-name">${component.name}</div>
                    <div class="inventory-stats">
                        ${component.capacity ? `${ComponentUtils.formatNumber(component.capacity)} HP` : ''}
                        ${component.recharge && component.recharge !== 0 ? ` • ${component.recharge > 0 ? '+' : ''}${ComponentUtils.formatNumber(component.recharge)} HP/s` : ''}
                    </div>
                </div>
                <div class="inventory-quantity">×${quantity}</div>
            </div>
        `;
    }
    
    // Update calculator stats and chart
    updateCalculatorStats(stats, strategy) {
        // Update stat displays
        this.updateStatDisplay('calc-capacity', stats.capacity, 'HP');
        this.updateStatDisplay('calc-recharge', stats.recharge, 'HP/s');
        this.updateStatDisplay('calc-cpu', stats.cpu, '');
        this.updateStatDisplay('calc-power', stats.power, 'W', true);
        
        // Initialize and update calculator chart
        this.initializeCalculatorChart();
        this.updateCalculatorChart(stats);
        
        // Show the stats box
        const statsBox = document.getElementById('calculator-stats-box');
        if (statsBox) {
            statsBox.classList.remove('is-hidden');
        }
    }
    
    // Initialize Calculator Chart.js chart
    initializeCalculatorChart() {
        const canvas = document.getElementById('calculatorStatsChart');
        if (!canvas || this.calculatorChart) return;
        
        const ctx = canvas.getContext('2d');
        
        this.calculatorChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Capacity', 'Recharge', 'CPU Efficiency', 'Power Efficiency'],
                datasets: [{
                    label: 'Optimized Configuration',
                    data: [0, 0, 0, 0],
                    backgroundColor: 'rgba(0, 209, 178, 0.2)',
                    borderColor: 'rgba(0, 209, 178, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(0, 209, 178, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(0, 209, 178, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff',
                            usePointStyle: true,
                            boxWidth: 0,
                            boxHeight: 0
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: '#b5b5b5',
                            backdropColor: 'transparent'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        pointLabels: {
                            color: '#ffffff'
                        }
                    }
                }
            }
        });
    }
    
    // Update calculator chart data
    updateCalculatorChart(stats) {
        if (!this.calculatorChart) return;
        
        // Calculate theoretical maximums (same as explorer)
        const maxCapacity = this.calculateMaxCapacity();
        const maxRecharge = this.calculateMaxRecharge();
        const minCPU = this.calculateMinCPU();
        const maxCPU = this.calculateMaxCPU();
        
        // Normalize values to 0-100 scale
        const normalizedData = [
            // Capacity: 100% = capacity >= max achievable with 60s recharge
            stats.capacity === 0 ? 0 : 
            stats.capacity >= maxCapacity ? 100 :
            Math.max(0, (stats.capacity / maxCapacity) * 100),
            
            // Recharge: 100% = recharge >= capacity/15 (15 second or faster full recharge)
            stats.recharge <= 0 ? 0 : 
            stats.capacity === 0 ? 0 :
            stats.recharge >= (stats.capacity / 15) ? 100 :
            (stats.recharge / (stats.capacity / 15)) * 100,
            
            // CPU Efficiency: 100% = CPU <= 20,000 and > 0, 0% = max components or no components
            // If no components selected (cpu = 0), show 0% efficiency
            stats.cpu === 0 ? 0 : 
            stats.cpu <= minCPU ? 100 :
            Math.max(0, Math.min(100, 100 - ((stats.cpu - minCPU) / (maxCPU - minCPU)) * 100)),
            
            // Power Efficiency: 100% = power surplus <= 50kW, 0% = power required (positive)
            // If no components selected (power = 0), show 100% efficiency
            stats.power === 0 ? 100 :
            stats.power > 0 ? 0 :  // Positive power (required) = 0% efficiency
            // Negative power means surplus - calculate efficiency based on surplus amount
            (() => {
                const surplus = Math.abs(stats.power);
                if (surplus <= 50000) return 100;
                if (surplus >= 300000) return 0;
                return Math.max(0, 100 - ((surplus - 50000) / 250000) * 100);
            })()
        ];
        
        this.calculatorChart.data.datasets[0].data = normalizedData;
        this.calculatorChart.update('none');
        
        // Update strategy display for calculator
        this.updateCalculatorStrategyDisplay(normalizedData[0], normalizedData[1]);
    }
    
    // Update strategy display for calculator mode
    updateCalculatorStrategyDisplay(capacityPercent, rechargePercent) {
        let strategy = 'Balanced';
        
        const difference = capacityPercent - rechargePercent;
        
        if (difference > 15) {
            strategy = 'Capacity';
        } else if (difference < -15) {
            strategy = 'Recharge';
        }
        
        // Update or create strategy display
        let strategyBox = document.getElementById('calculator-strategy-display');
        if (!strategyBox) {
            // Create strategy box if it doesn't exist
            const chartContainer = document.getElementById('calculatorStatsChart');
            if (!chartContainer) return;
            
            // Find the chart's container div (the one with mt-5 class)
            const chartDiv = chartContainer.parentElement;
            if (!chartDiv) return;
            
            strategyBox = document.createElement('div');
            strategyBox.id = 'calculator-strategy-display';
            strategyBox.className = 'notification is-info is-light mt-3';
            
            // Insert after the chart's container div, not after the canvas
            chartDiv.insertAdjacentElement('afterend', strategyBox);
        }
        
        strategyBox.innerHTML = `<strong>Strategy:</strong> ${strategy}`;
    }
    
    // Reset the calculator form
    resetCalculatorForm() {
        // Reset target inputs
        document.getElementById('target-capacity').value = '';
        document.getElementById('target-recharge').value = '';
        
        // Reset block inputs
        document.getElementById('steel-blocks').value = '0';
        document.getElementById('hardened-steel-blocks').value = '0';
        document.getElementById('combat-steel-blocks').value = '0';
        document.getElementById('xeno-steel-blocks').value = '0';
        
        // Reset constraints
        document.getElementById('cpu-limit').value = '';
        document.getElementById('power-limit').value = '';
        document.getElementById('max-advanced-extenders').value = '4';
        document.getElementById('max-improved-extenders').value = '6';
        document.getElementById('max-basic-extenders').value = '8';
        document.getElementById('max-small-reactors').value = '4';
        document.getElementById('max-large-reactors').value = '2';
        
        // Reset crew
        document.getElementById('existing-shield-technicians').value = '0';
        
        // Update block capacity display
        this.updateBlockCapacity();
    }
    
    // Reset the shield explorer
    resetShieldExplorer() {
        // Reset generator
        document.getElementById('shield-generator-select').value = 'none';
        
        // Reset power generators
        document.getElementById('basic-large-generators').value = '0';
        document.getElementById('improved-large-generators').value = '0';
        document.getElementById('advanced-large-generators').value = '0';
        
        // Reset reactors
        document.getElementById('small-reactor-count').value = '0';
        document.getElementById('large-reactor-count').value = '0';
        
        // Reset extenders
        document.getElementById('advanced-capacitors').value = '0';
        document.getElementById('advanced-chargers').value = '0';
        document.getElementById('improved-capacitors').value = '0';
        document.getElementById('improved-chargers').value = '0';
        document.getElementById('basic-capacitors').value = '0';
        document.getElementById('basic-chargers').value = '0';
        
        // Reset blocks
        document.getElementById('steel-blocks-live').value = '0';
        document.getElementById('hardened-steel-blocks-live').value = '0';
        document.getElementById('combat-steel-blocks-live').value = '0';
        document.getElementById('xeno-steel-blocks-live').value = '0';
        
        // Reset crew
        const shieldTechniciansSelect = document.getElementById('shield-technicians');
        if (shieldTechniciansSelect) {
            shieldTechniciansSelect.value = '0';
        }
        
        // Update extender limits and live stats
        this.updateExtenderLimits();
        this.updateComponentBoxStates();
        this.updateLiveStats();
    }
    
    // Populate Required Components box
    populateRequiredComponents(config, strategy, result = null) {
        const requiredComponentsContent = document.getElementById('required-components-content');
        if (!requiredComponentsContent) return;
        
        let html = '';
        
        // Show scaled-down message if applicable
        if (result && result.reason === 'scaled_down') {
            html += `
                <div class="notification is-danger mb-3">
                    <strong>Impossible Targets:</strong> Your requested values are impossible given the current constraints.
                </div>
                <div class="notification is-info is-light mb-4">
                    <strong>Best Alternative:</strong> This is the best alternative that maintains the same ratio of recharge to capacity and meets your constraints.<br>
                    <small>Original Request: ${ComponentUtils.formatNumber(result.originalTargets.capacity)} HP / ${ComponentUtils.formatNumber(result.originalTargets.recharge)} HP/s</small><br>
                    <small>Best Alternative: ${ComponentUtils.formatNumber(result.scaledTargets.capacity)} HP / ${ComponentUtils.formatNumber(result.scaledTargets.recharge)} HP/s</small>
                </div>
            `;
        }
        
        // Generator
        if (config.generator && config.generator !== 'none') {
            const generator = ComponentUtils.getComponent('generators', config.generator);
            html += this.createComponentCard(generator, 1);
        }
        
        // Power Generators
        if (config.powerGenerators) {
            for (const genType in config.powerGenerators) {
                const count = config.powerGenerators[genType];
                if (count > 0) {
                    const gen = ComponentUtils.getComponent('powerGenerators', genType);
                    if (gen) {
                        html += this.createComponentCard(gen, count);
                    }
                }
            }
        }
        
        // Reactors
        if (config.reactors.small > 0) {
            const reactor = ComponentUtils.getComponent('reactors', 'small');
            html += this.createComponentCard(reactor, config.reactors.small);
        }
        
        if (config.reactors.large > 0) {
            const reactor = ComponentUtils.getComponent('reactors', 'large');
            html += this.createComponentCard(reactor, config.reactors.large);
        }
        
        // Extenders
        for (const tier in config.extenders) {
            if (config.extenders[tier].capacitor > 0) {
                const component = ComponentUtils.getComponent('extenders', tier).capacitor;
                html += this.createComponentCard(component, config.extenders[tier].capacitor);
            }
            
            if (config.extenders[tier].charger > 0) {
                const component = ComponentUtils.getComponent('extenders', tier).charger;
                html += this.createComponentCard(component, config.extenders[tier].charger);
            }
        }
        
        // Strategy is now shown under the chart, not here
        
        requiredComponentsContent.innerHTML = html;
    }
    
    // Populate Applied Constraints box
    populateAppliedConstraints() {
        const appliedConstraintsContent = document.getElementById('applied-constraints-content');
        if (!appliedConstraintsContent) return;
        
        // Get current constraint values
        const cpuLimit = document.getElementById('cpu-limit').value;
        const powerLimit = document.getElementById('power-limit').value;
        const maxAdvanced = document.getElementById('max-advanced-extenders').value;
        const maxImproved = document.getElementById('max-improved-extenders').value;
        const maxBasic = document.getElementById('max-basic-extenders').value;
        const maxSmallReactors = document.getElementById('max-small-reactors').value;
        const maxLargeReactors = document.getElementById('max-large-reactors').value;
        
        const html = `
            <div class="columns is-multiline">
                <div class="column is-half">
                    <ul style="color: var(--text-primary);">
                        <li><strong>CPU Limit:</strong> ${cpuLimit || 'No limit'}</li>
                        <li><strong>Power Limit:</strong> ${powerLimit ? ComponentUtils.formatPower(parseInt(powerLimit)) : 'No limit'}</li>
                    </ul>
                </div>
                <div class="column is-half">
                    <ul style="color: var(--text-primary);">
                        <li><strong>Max Advanced Extenders:</strong> ${maxAdvanced}</li>
                        <li><strong>Max Improved Extenders:</strong> ${maxImproved}</li>
                        <li><strong>Max Basic Extenders:</strong> ${maxBasic}</li>
                        <li><strong>Max Small Reactors:</strong> ${maxSmallReactors}</li>
                        <li><strong>Max Large Reactors:</strong> ${maxLargeReactors}</li>
                    </ul>
                </div>
            </div>
        `;
        
        appliedConstraintsContent.innerHTML = html;
    }
    
    // Create constraints display for results (legacy - kept for compatibility)
    createConstraintsDisplay() {
        return '';
    }
}