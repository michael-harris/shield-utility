// UI Controller for Shield Utility
class UIController {
    constructor(calculator, optimizer) {
        this.calculator = calculator;
        this.optimizer = optimizer;
        this.currentMode = 'value-to-component';
        this.chart = null;
        this.calculatorChart = null; // Chart for calculator results
        this.lastOptimizationResult = null; // Store last optimization result for export/edit
        
        this.initializeEventListeners();
        this.initializeExtenderDropdowns();
        this.updateComponentBoxStates();
        this.updateLiveStats();
        this.initializeInputValidation();
        this.updateStrategyHelp(); // Initialize target values state
        this.ensureExportActionsVisible(); // Ensure export action boxes are always visible
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
        
        // Reset calculator button
        const resetCalculatorBtn = document.getElementById('reset-calculator-btn');
        if (resetCalculatorBtn) {
            resetCalculatorBtn.addEventListener('click', () => this.resetCalculatorForm());
        }
        
        // Strategy selection
        const strategySelect = document.getElementById('optimization-strategy');
        if (strategySelect) {
            strategySelect.addEventListener('change', () => this.updateStrategyHelp());
        }
        
        // Export buttons
        const exportCalculatorBtn = document.getElementById('export-calculator-btn');
        if (exportCalculatorBtn) {
            exportCalculatorBtn.addEventListener('click', () => this.exportCalculatorConfiguration());
        }
        
        const exportExplorerBtn = document.getElementById('export-explorer-btn');
        if (exportExplorerBtn) {
            exportExplorerBtn.addEventListener('click', () => this.exportExplorerConfiguration());
        }
        
        const findMostEfficientBtn = document.getElementById('find-most-efficient-btn');
        if (findMostEfficientBtn) {
            findMostEfficientBtn.addEventListener('click', () => this.findMostEfficient());
        }
        
        const editInExplorerBtn = document.getElementById('edit-in-explorer-btn');
        if (editInExplorerBtn) {
            editInExplorerBtn.addEventListener('click', () => this.editInExplorer());
        }
        
        // Help buttons
        const helpCalculatorBtn = document.getElementById('help-calculator-btn');
        if (helpCalculatorBtn) {
            helpCalculatorBtn.addEventListener('click', () => this.showHelp('calculator'));
        }
        
        const helpExplorerBtn = document.getElementById('help-explorer-btn');
        if (helpExplorerBtn) {
            helpExplorerBtn.addEventListener('click', () => this.showHelp('explorer'));
        }
        
        // Help popover close button
        const helpPopoverClose = document.getElementById('help-popover-close');
        if (helpPopoverClose) {
            helpPopoverClose.addEventListener('click', () => this.hideHelp());
        }
        
        // Close help popover when clicking outside
        const helpPopover = document.getElementById('help-popover');
        if (helpPopover) {
            helpPopover.addEventListener('click', (e) => {
                if (e.target === helpPopover) {
                    this.hideHelp();
                }
            });
        }
        
        // Block inputs for value-to-component mode
        document.querySelectorAll('.block-input').forEach(input => {
            input.addEventListener('input', () => {
                // Block input listener (no longer updates block capacity display)
            });
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
                // Only update live stats if we're not in the middle of editing in explorer
                if (!this.isEditingInExplorer) {
                    this.updateLiveStats();
                }
            }, 100);
        }
    }
    
    // Update the tagline based on current mode
    updateModeTagline(mode) {
        const taglineElement = document.getElementById('mode-tagline');
        if (!taglineElement) return;
        
        const taglines = {
            'value-to-component': 'Automatically find the optimal configuration for your requirements',
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
    
    
    // Update strategy help text
    updateStrategyHelp() {
        const strategy = document.getElementById('optimization-strategy').value;
        const helpElement = document.getElementById('strategy-help');
        
        const helpTexts = {
            'cpu-efficiency': 'Meet target values with least CPU expenditure (within constraints)',
            'max-balanced': 'Highest capacity with a balanced recharge rate (within constraints)',
            'max-capacity': 'Absolute most capacity with positive recharge (within constraints)',
            'max-recharge': 'Highest capacity with 15 second recharge or better (within constraints)'
        };
        
        const fusionTips = {
            'max-balanced': '💡 Tip: Consider adding fusion reactor constraints if you want more realistic builds',
            'max-capacity': '💡 Tip: Consider adding fusion reactor constraints if you want more realistic builds', 
            'max-recharge': '💡 Tip: Consider adding fusion reactor constraints if you want more realistic builds'
        };
        
        if (helpElement) {
            const baseText = helpTexts[strategy] || helpTexts['cpu-efficiency'];
            const tip = fusionTips[strategy] ? `\n${fusionTips[strategy]}` : '';
            helpElement.textContent = baseText + tip;
        }
        
        // Enable/disable target values box based on strategy
        this.updateTargetValuesState(strategy);
    }
    
    // Enable/disable target values box based on strategy
    updateTargetValuesState(strategy) {
        const targetValuesBox = document.querySelector('.box').parentElement.querySelector('.box');
        const targetCapacityInput = document.getElementById('target-capacity');
        const targetRechargeInput = document.getElementById('target-recharge');
        
        // Find the target values box (first box in left column)
        const leftColumn = document.querySelector('.column.is-4');
        const targetBox = leftColumn ? leftColumn.querySelector('.box') : null;
        
        if (targetBox && targetCapacityInput && targetRechargeInput) {
            const isCpuEfficiency = strategy === 'cpu-efficiency';
            
            // Toggle disabled state
            targetBox.classList.toggle('component-box-disabled', !isCpuEfficiency);
            targetCapacityInput.disabled = !isCpuEfficiency;
            targetRechargeInput.disabled = !isCpuEfficiency;
            
            // Clear values if disabling
            if (!isCpuEfficiency) {
                targetCapacityInput.value = '';
                targetRechargeInput.value = '';
            }
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
        this.updateStatDisplay('live-cpu', stats.cpu, 'TF');
        this.updateStatDisplay('live-power', stats.power, 'W', true);
        
        // Update recharge time
        this.updateRechargeTime('live-recharge-time', stats.capacity, stats.recharge);
        
        // Update warnings
        this.updateWarnings(validation.warnings);
        
        // Update chart
        this.updateChart(stats);
        
        // Update inventory
        this.updateInventory(config, stats);
        
        // Update explorer action buttons based on configuration
        this.updateExplorerActionButtons();
    }
    
    // Update individual stat display
    updateStatDisplay(elementId, value, unit, isPower = false) {
        const element = document.getElementById(elementId);
        if (element) {
            let formattedValue;
            if (isPower) {
                if (value < 0) {
                    // Negative power means generation (surplus)
                    formattedValue = '+' + ComponentUtils.formatPower(Math.abs(value));
                } else if (value > 0) {
                    // Positive power means consumption (should not happen in optimized configs)
                    formattedValue = '-' + ComponentUtils.formatPower(value);
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
    
    // Update recharge time display
    updateRechargeTime(elementId, capacity, recharge) {
        const element = document.getElementById(elementId);
        if (element && capacity > 0 && recharge > 0) {
            const rechargeTimeSeconds = capacity / recharge;
            const formattedTime = rechargeTimeSeconds.toFixed(1);
            element.textContent = `Recharges in ${formattedTime} seconds`;
        } else if (element) {
            element.textContent = 'Recharges in 0.0 seconds';
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
    
    // Calculate bonus stats from blocks and crew
    calculateBonusStats(blocks, crew) {
        let bonusCapacity = 0;
        let bonusRecharge = 0;
        
        // Add block bonuses
        if (blocks.steel) bonusCapacity += blocks.steel * 1;
        if (blocks.hardenedSteel) bonusCapacity += blocks.hardenedSteel * 2;
        if (blocks.combatSteel) bonusCapacity += blocks.combatSteel * 4;
        if (blocks.xenoSteel) bonusCapacity += blocks.xenoSteel * 7;
        
        // Add crew bonuses (shield technician: +2000 capacity, +75 recharge)
        if (crew.shieldTechnicians) {
            bonusCapacity += crew.shieldTechnicians * 2000;
            bonusRecharge += crew.shieldTechnicians * 75;
        }
        
        return {
            capacity: bonusCapacity,
            recharge: bonusRecharge
        };
    }
    
    // Hide all result boxes
    hideAllResultBoxes() {
        const boxesToHide = [
            'calculator-stats-box',
            'required-components-box',
            'included-bonuses-box',
            'applied-constraints-box'
        ];
        
        boxesToHide.forEach(boxId => {
            const box = document.getElementById(boxId);
            if (box) {
                box.classList.add('is-hidden');
            }
        });
    }
    
    // Ensure export action boxes are always visible
    ensureExportActionsVisible() {
        const calculatorExportActions = document.getElementById('calculator-export-actions');
        const explorerExportActions = document.getElementById('explorer-export-actions');
        
        if (calculatorExportActions) {
            calculatorExportActions.classList.remove('is-hidden');
        }
        if (explorerExportActions) {
            explorerExportActions.classList.remove('is-hidden');
        }
    }
    
    // Calculate optimal configuration
    async calculateOptimal() {
        const calculateBtn = document.getElementById('calculate-btn');
        const optimizingModal = document.getElementById('optimizing-modal');
        
        // Show optimizing modal
        if (optimizingModal) {
            
            // Force show by removing hidden class and ensuring it's visible
            optimizingModal.classList.remove('is-hidden');
            optimizingModal.style.display = 'flex';
            
        }
        
        // Show loading state
        if (calculateBtn) {
            calculateBtn.classList.add('is-loading');
        }
        
        // Hide previous results
        this.hideAllResultBoxes();
        
        // Add a minimum delay to ensure modal is visible
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Track when optimization started
        const optimizationStartTime = Date.now();
        
        try {
            // Validate all inputs first
            if (!this.validateAllInputs()) {
                this.showError('Please fix the input validation errors before optimizing.');
                throw new Error('Validation failed');
            }
            
            // Get input values and check if user entered targets
            const targetCapacityInput = document.getElementById('target-capacity').value.trim();
            const targetRechargeInput = document.getElementById('target-recharge').value.trim();
            const hasTargets = targetCapacityInput !== '' || targetRechargeInput !== '';
            
            let targetCapacity = parseInt(targetCapacityInput) || null;
            let targetRecharge = parseInt(targetRechargeInput) || null;
            
            // Get existing blocks and crew
            const existingBlocks = {
                steel: parseInt(document.getElementById('steel-blocks').value) || 0,
                hardenedSteel: parseInt(document.getElementById('hardened-steel-blocks').value) || 0,
                combatSteel: parseInt(document.getElementById('combat-steel-blocks').value) || 0,
                xenoSteel: parseInt(document.getElementById('xeno-steel-blocks').value) || 0
            };
            
            const existingCrew = {
                shieldTechnicians: parseInt(document.getElementById('existing-shield-technicians').value) || 0
            };
            
            // Calculate bonus stats from blocks and crew
            const bonusStats = this.calculateBonusStats(existingBlocks, existingCrew);
            
            // Get strategy and constraints
            const strategy = document.getElementById('optimization-strategy').value;
            const considerPowerUsage = document.getElementById('consider-power-usage').checked;
            const constraints = {
                cpuLimit: parseInt(document.getElementById('cpu-limit').value) || null,
                powerLimit: parseInt(document.getElementById('power-limit').value) || null,
                generatorType: document.getElementById('generator-constraint').value !== 'any' ? document.getElementById('generator-constraint').value : null,
                maxAdvancedExtenders: parseInt(document.getElementById('max-advanced-extenders').value),
                maxImprovedExtenders: parseInt(document.getElementById('max-improved-extenders').value),
                maxBasicExtenders: parseInt(document.getElementById('max-basic-extenders').value),
                maxSmallReactors: parseInt(document.getElementById('max-small-reactors').value),
                maxLargeReactors: parseInt(document.getElementById('max-large-reactors').value),
                considerPowerUsage: considerPowerUsage
            };
            
            // Perform optimization
            let result;
            if (hasTargets) {
                // User specified targets: subtract bonus stats from targets for optimization
                const adjustedTargetCapacity = targetCapacity ? Math.max(1, targetCapacity - bonusStats.capacity) : null;
                const adjustedTargetRecharge = targetRecharge ? Math.max(1, targetRecharge - bonusStats.recharge) : null;
                // Optimize for adjusted targets without blocks/crew, then add bonuses back
                result = await this.optimizer.optimize(adjustedTargetCapacity, adjustedTargetRecharge, constraints, {}, {}, strategy);
                if (result.success) {
                    result.stats.capacity += bonusStats.capacity;
                    result.stats.recharge += bonusStats.recharge;
                    // Include blocks/crew in the final configuration for display
                    if (Object.values(existingBlocks).some(count => count > 0)) {
                        result.configuration.blocks = existingBlocks;
                    } else {
                        result.configuration.blocks = {};
                    }
                    if (Object.values(existingCrew).some(count => count > 0)) {
                        result.configuration.crew = existingCrew;
                    } else {
                        result.configuration.crew = {};
                    }
                }
            } else {
                // No targets specified: optimize without blocks/crew, then add bonus stats to result
                result = await this.optimizer.optimize(null, null, constraints, {}, {}, strategy);
                if (result.success) {
                    result.stats.capacity += bonusStats.capacity;
                    result.stats.recharge += bonusStats.recharge;
                    // Include blocks/crew in the final configuration for display
                    if (Object.values(existingBlocks).some(count => count > 0)) {
                        result.configuration.blocks = existingBlocks;
                    } else {
                        result.configuration.blocks = {};
                    }
                    if (Object.values(existingCrew).some(count => count > 0)) {
                        result.configuration.crew = existingCrew;
                    } else {
                        result.configuration.crew = {};
                    }
                }
            }
            
            // Display results
            this.displayOptimizationResults(result, targetCapacity, targetRecharge);
            
        } catch (error) {
            this.showError('An error occurred during optimization. Please try again.');
        } finally {
            // Ensure modal was visible for at least 500ms
            const elapsedTime = Date.now() - optimizationStartTime;
            const remainingTime = Math.max(0, 500 - elapsedTime);
            if (remainingTime > 0) {
                await new Promise(resolve => setTimeout(resolve, remainingTime));
            }
            
            // Remove loading state and hide optimizing modal
            if (calculateBtn) {
                calculateBtn.classList.remove('is-loading');
            }
            if (optimizingModal) {
                // Hide with both class and inline style
                optimizingModal.classList.add('is-hidden');
                optimizingModal.style.display = 'none';
                
            }
        }
    }
    
    // Display optimization results
    displayOptimizationResults(result, targetCapacity, targetRecharge) {
        if (!result.success) {
            this.displayOptimizationFailure(result, targetCapacity, targetRecharge);
            return;
        }
        
        // Store the last successful optimization result
        this.lastOptimizationResult = result;
        
        const config = result.configuration;
        const stats = result.stats;
        
        // Update calculator stats display with chart
        this.updateCalculatorStats(stats, result.strategy);
        
        // Populate Required Components (pass result for scaled-down message)
        this.populateRequiredComponents(config, result.strategy, result);
        
        // Populate Included Bonuses with current form values, not optimizer config
        const currentBlocks = {
            steel: parseInt(document.getElementById('steel-blocks').value) || 0,
            hardenedSteel: parseInt(document.getElementById('hardened-steel-blocks').value) || 0,
            combatSteel: parseInt(document.getElementById('combat-steel-blocks').value) || 0,
            xenoSteel: parseInt(document.getElementById('xeno-steel-blocks').value) || 0
        };
        const currentCrew = {
            shieldTechnicians: parseInt(document.getElementById('existing-shield-technicians').value) || 0
        };
        const bonusConfig = {
            blocks: currentBlocks,
            crew: currentCrew
        };
        this.populateIncludedBonuses(bonusConfig);
        
        // Populate Applied Constraints
        this.populateAppliedConstraints();
        
        // Show result boxes (bonuses box is handled by populateIncludedBonuses)
        document.getElementById('calculator-stats-box').classList.remove('is-hidden');
        document.getElementById('required-components-box').classList.remove('is-hidden');
        document.getElementById('applied-constraints-box').classList.remove('is-hidden');
        
        // Enable calculator action buttons now that we have results
        this.enableCalculatorActionButtons();
        
        // Don't auto-reset form - let users experiment
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
        document.getElementById('included-bonuses-box').classList.add('is-hidden');
        document.getElementById('applied-constraints-box').classList.add('is-hidden');
        
        // Disable calculator action buttons since we have no results
        this.disableCalculatorActionButtons();
    }
    
    // Enable calculator action buttons (export and edit in explorer)
    enableCalculatorActionButtons() {
        const exportBtn = document.getElementById('export-calculator-btn');
        const editBtn = document.getElementById('edit-in-explorer-btn');
        
        if (exportBtn) {
            exportBtn.disabled = false;
        }
        if (editBtn) {
            editBtn.disabled = false;
        }
    }
    
    // Disable calculator action buttons
    disableCalculatorActionButtons() {
        const exportBtn = document.getElementById('export-calculator-btn');
        const editBtn = document.getElementById('edit-in-explorer-btn');
        
        if (exportBtn) {
            exportBtn.disabled = true;
        }
        if (editBtn) {
            editBtn.disabled = true;
        }
    }
    
    // Update explorer action buttons based on current configuration
    updateExplorerActionButtons() {
        const config = this.getCurrentConfiguration();
        const hasGenerator = config && config.generator && config.generator !== 'none';
        
        const exportBtn = document.getElementById('export-explorer-btn');
        const efficiencyBtn = document.getElementById('find-most-efficient-btn');
        
        if (exportBtn) {
            exportBtn.disabled = !hasGenerator;
        }
        if (efficiencyBtn) {
            efficiencyBtn.disabled = !hasGenerator;
        }
    }
    
    // Check if config has any components
    configHasAnyComponents(config) {
        if (!config) return false;
        
        // Check if there's a shield generator
        if (config.generator && config.generator !== 'none') {
            return true;
        }
        
        // Check power generators
        if (config.powerGenerators && Object.values(config.powerGenerators).some(count => count > 0)) {
            return true;
        }
        
        // Check reactors
        if (config.reactors && (config.reactors.small > 0 || config.reactors.large > 0)) {
            return true;
        }
        
        // Check extenders
        if (config.extenders) {
            for (const tier in config.extenders) {
                if (config.extenders[tier].capacitor > 0 || config.extenders[tier].charger > 0) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // Create component card HTML (for calculator results - uses same format as inventory)
    createComponentCard(component, quantity) {
        if (!component || typeof component !== 'object') {
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
        this.showNotification(message, 'is-danger', 5000);
    }
    
    // Show success message
    showSuccess(message) {
        this.showNotification(message, 'is-success', 3000);
    }
    
    // Show notification in the fixed container
    showNotification(message, type, duration) {
        const container = document.getElementById('notification-container') || document.body;
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <button class="delete" onclick="this.parentElement.remove()"></button>
            ${message}
        `;
        
        // Add to container
        container.appendChild(notification);
        
        // Auto-remove after specified duration
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);
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
                            stepSize: 25,
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
        
        return maxRecharge;
    }
    
    // Calculate minimum CPU (just compact shield)
    calculateMinCPU() {
        return components.generators.compact.cpu; // 20,000
    }
    
    // Calculate shield components power consumption from configuration
    calculateShieldPowerConsumption(config) {
        if (!config) return 0;
        
        let totalPower = 0;
        
        // Add generator power consumption (NOT power generation - just the shield generator's power cost)
        if (config.generator && config.generator !== 'none' && components.generators[config.generator]) {
            totalPower += components.generators[config.generator].power;
        }
        
        // Add extender power consumption
        if (config.extenders) {
            for (const tier in config.extenders) {
                const extenderData = components.extenders[tier];
                if (extenderData) {
                    // Add capacitor power cost
                    if (config.extenders[tier].capacitor > 0) {
                        totalPower += extenderData.capacitor.power * config.extenders[tier].capacitor;
                    }
                    // Add charger power cost
                    if (config.extenders[tier].charger > 0) {
                        totalPower += extenderData.charger.power * config.extenders[tier].charger;
                    }
                }
            }
        }
        
        // Do NOT include power generators or fusion reactors - they are not shield components
        // We only care about the power COST of shield parts, not power generation
        
        return totalPower;
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
            
            // Power Efficiency: Based on shield components power consumption
            // 100% efficiency = Compact Shield Generator only (10,000W)
            // 0% efficiency = Advanced Shield + all extenders (169,000W)
            (() => {
                try {
                    // Get current configuration to calculate shield power consumption
                    const config = this.getCurrentConfiguration();
                    if (!config || !config.generator || config.generator === 'none') return 0;
                    
                    const shieldPower = this.calculateShieldPowerConsumption(config);
                    
                    // Define min and max power consumption for shield components only
                    const minPower = 10000;  // Compact shield generator only
                    const maxPower = 169000; // Advanced shield generator + all extenders maxed
                    
                    if (shieldPower === 0) return 0; // No shield components
                    if (shieldPower <= minPower) return 100; // Most efficient
                    if (shieldPower >= maxPower) return 0; // Least efficient
                    
                    // Calculate efficiency (inverted scale - lower power consumption = higher efficiency)
                    const efficiency = 100 - ((shieldPower - minPower) / (maxPower - minPower)) * 100;
                    return Math.max(0, Math.min(100, Math.round(efficiency)));
                } catch (e) {
                    console.error('Error calculating power efficiency:', e);
                    return 0;
                }
            })()
        ];
        
        this.chart.data.datasets[0].data = normalizedData;
        this.chart.update('none');
        
        // Update strategy display
        this.updateStrategyDisplay(stats);
    }
    
    // Determine and display result based on recharge time
    updateStrategyDisplay(stats) {
        let result = 'Balanced Capacity/Recharge';
        
        if (stats.capacity > 0 && stats.recharge > 0) {
            const rechargeTime = stats.capacity / stats.recharge;
            
            if (rechargeTime > 40) { // More than 35 + 5
                result = 'High Capacity';
            } else if (rechargeTime < 30) { // Less than 30
                result = 'High Recharge';
            } else {
                result = 'Balanced Capacity/Recharge'; // 30-40 seconds (35 ± 5)
            }
        }
        
        // Update or create result display
        let strategyBox = document.getElementById('strategy-display');
        if (!strategyBox) {
            // Create result box if it doesn't exist
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
        
        strategyBox.innerHTML = `<strong>Result:</strong> ${result}`;
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
        
        // Update explorer bonuses box
        this.updateExplorerBonuses(config);
        
        // Export actions box is now always visible - buttons are enabled/disabled instead
    }
    
    // Update Explorer Bonuses box
    updateExplorerBonuses(config) {
        const explorerBonusesContent = document.getElementById('explorer-included-bonuses-content');
        if (!explorerBonusesContent) return;
        
        let html = '';
        let totalBonusCapacity = 0;
        let totalBonusRecharge = 0;
        
        // Blocks
        if (config.blocks) {
            for (const blockType in config.blocks) {
                const count = config.blocks[blockType];
                if (count > 0) {
                    const block = ComponentUtils.getComponent('blocks', blockType);
                    if (block) {
                        html += this.createInventoryItem(block, count);
                        totalBonusCapacity += block.capacity * count;
                        totalBonusRecharge += (block.recharge || 0) * count;
                    }
                }
            }
        }
        
        // Crew
        if (config.crew && config.crew.shieldTechnicians > 0) {
            const crew = ComponentUtils.getComponent('crew', 'shieldTechnician');
            if (crew) {
                html += this.createInventoryItem(crew, config.crew.shieldTechnicians);
                totalBonusCapacity += crew.capacity * config.crew.shieldTechnicians;
                totalBonusRecharge += crew.recharge * config.crew.shieldTechnicians;
            }
        }
        
        // Show/hide the entire bonuses box based on content
        const bonusesBox = document.getElementById('explorer-included-bonuses-box');
        const bonusSummary = document.getElementById('explorer-bonus-summary');
        const bonusCapacitySpan = document.getElementById('explorer-bonus-capacity');
        const bonusRechargeSpan = document.getElementById('explorer-bonus-recharge');
        
        if (totalBonusCapacity > 0 || totalBonusRecharge > 0) {
            // Show the bonuses box and populate content
            if (bonusesBox) bonusesBox.style.display = 'block';
            explorerBonusesContent.innerHTML = html;
            
            // Update bonus summary box
            if (bonusSummary && bonusCapacitySpan && bonusRechargeSpan) {
                bonusCapacitySpan.textContent = ComponentUtils.formatNumber(totalBonusCapacity);
                bonusRechargeSpan.textContent = ComponentUtils.formatNumber(totalBonusRecharge);
                bonusSummary.style.display = 'block';
            }
        } else {
            // Hide the entire bonuses box when empty
            if (bonusesBox) bonusesBox.style.display = 'none';
            if (bonusSummary) bonusSummary.style.display = 'none';
        }
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
        this.updateStatDisplay('calc-cpu', stats.cpu, 'TF');
        this.updateStatDisplay('calc-power', stats.power, 'W', true);
        
        // Update recharge time
        this.updateRechargeTime('calc-recharge-time', stats.capacity, stats.recharge);
        
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
                            stepSize: 25,
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
        
        // Store the last optimization result's configuration for power efficiency calculation
        const config = this.lastOptimizationResult ? this.lastOptimizationResult.configuration : null;
        
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
            
            // Power Efficiency: Based on shield components power consumption
            // 100% efficiency = Compact Shield Generator only (10,000W)
            // 0% efficiency = Advanced Shield + all extenders (169,000W)
            (() => {
                try {
                    // Use the configuration from the optimization result
                    if (!config || !config.generator || config.generator === 'none') {
                        // If no optimization result yet or no shield, return 0
                        return 0;
                    }
                    
                    const shieldPower = this.calculateShieldPowerConsumption(config);
                    
                    // Define min and max power consumption for shield components only
                    const minPower = 10000;  // Compact shield generator only
                    const maxPower = 169000; // Advanced shield generator + all extenders maxed
                    
                    if (shieldPower === 0) return 0; // No shield components
                    if (shieldPower <= minPower) return 100; // Most efficient
                    if (shieldPower >= maxPower) return 0; // Least efficient
                    
                    // Calculate efficiency (inverted scale - lower power consumption = higher efficiency)
                    const efficiency = 100 - ((shieldPower - minPower) / (maxPower - minPower)) * 100;
                    return Math.max(0, Math.min(100, Math.round(efficiency)));
                } catch (e) {
                    console.error('Error calculating calculator power efficiency:', e);
                    return 0;
                }
            })()
        ];
        
        this.calculatorChart.data.datasets[0].data = normalizedData;
        this.calculatorChart.update('none');
        
        // Update strategy display for calculator
        this.updateCalculatorStrategyDisplay(stats);
    }
    
    // Update result display for calculator mode
    updateCalculatorStrategyDisplay(stats) {
        let result = 'Balanced Capacity/Recharge';
        
        if (stats.capacity > 0 && stats.recharge > 0) {
            const rechargeTime = stats.capacity / stats.recharge;
            
            if (rechargeTime > 40) { // More than 35 + 5
                result = 'High Capacity';
            } else if (rechargeTime < 30) { // Less than 30
                result = 'High Recharge';
            } else {
                result = 'Balanced Capacity/Recharge'; // 30-40 seconds (35 ± 5)
            }
        }
        
        // Update or create result display
        let strategyBox = document.getElementById('calculator-strategy-display');
        if (!strategyBox) {
            // Create result box if it doesn't exist
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
        
        strategyBox.innerHTML = `<strong>Result:</strong> ${result}`;
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
        document.getElementById('consider-power-usage').checked = false;
        document.getElementById('generator-constraint').value = 'any';
        document.getElementById('max-advanced-extenders').value = '4';
        document.getElementById('max-improved-extenders').value = '6';
        document.getElementById('max-basic-extenders').value = '8';
        document.getElementById('max-small-reactors').value = '2';
        document.getElementById('max-large-reactors').value = '1';
        
        // Reset crew
        document.getElementById('existing-shield-technicians').value = '0';
        
        // Reset strategy
        document.getElementById('optimization-strategy').value = 'cpu-efficiency';
        this.updateStrategyHelp();
        
        // Hide all result boxes and clear any previous results
        this.hideAllResultBoxes();
        
        // Clear last optimization result
        this.lastOptimizationResult = null;
        
        // Update target values state (enable/disable based on strategy)
        this.updateTargetValuesState('cpu-efficiency');
        
        // Clear any error/success notifications
        const notificationContainer = document.getElementById('notification-container');
        if (notificationContainer) {
            notificationContainer.innerHTML = '';
        }
        
        // Reset loading state on calculate button if it exists
        const calculateBtn = document.getElementById('calculate-btn');
        if (calculateBtn) {
            calculateBtn.classList.remove('is-loading');
        }
        
        // Disable action buttons since we have no results
        this.disableCalculatorActionButtons();
    }
    
    // Initialize input validation for numerical fields
    initializeInputValidation() {
        // Find all number inputs
        const numberInputs = document.querySelectorAll('input[type="number"]');
        
        numberInputs.forEach(input => {
            // Add input event listener for real-time validation
            input.addEventListener('input', (e) => this.validateNumberInput(e.target));
            input.addEventListener('blur', (e) => this.validateNumberInput(e.target));
            
            // Prevent invalid characters
            input.addEventListener('keypress', (e) => {
                // Allow: backspace, delete, tab, escape, enter, decimal point
                const allowedKeys = [8, 9, 27, 13, 46, 110, 190];
                
                // Allow Ctrl+A, Ctrl+C, Ctrl+V, etc.
                if (e.ctrlKey || e.metaKey) return;
                
                // Allow navigation keys
                if (allowedKeys.includes(e.keyCode)) return;
                
                // Ensure it's a number
                if (e.keyCode < 48 || e.keyCode > 57) {
                    e.preventDefault();
                }
            });
        });
    }
    
    // Validate a number input field
    validateNumberInput(input) {
        const value = input.value.trim();
        
        // Allow empty values for optional fields
        if (value === '') {
            this.clearInputError(input);
            return true;
        }
        
        // Check if it's a valid number
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            this.showInputError(input, 'Must be a valid number');
            return false;
        }
        
        // Check minimum value
        const min = parseFloat(input.getAttribute('min')) || 0;
        if (numValue < min) {
            this.showInputError(input, `Must be at least ${min}`);
            return false;
        }
        
        // Check maximum value if specified
        const max = parseFloat(input.getAttribute('max'));
        if (max !== null && numValue > max) {
            this.showInputError(input, `Must be at most ${max}`);
            return false;
        }
        
        // Ensure integer values where appropriate
        if (input.getAttribute('step') === '1' || !input.hasAttribute('step')) {
            if (!Number.isInteger(numValue)) {
                this.showInputError(input, 'Must be a whole number');
                return false;
            }
        }
        
        this.clearInputError(input);
        return true;
    }
    
    // Show error message for input field
    showInputError(input, message) {
        // Add error class to input
        input.classList.add('is-danger');
        
        // Find or create error message element
        let errorElement = input.parentElement.querySelector('.help.is-danger');
        if (!errorElement) {
            errorElement = document.createElement('p');
            errorElement.className = 'help is-danger';
            input.parentElement.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
    }
    
    // Clear error message for input field
    clearInputError(input) {
        input.classList.remove('is-danger');
        
        const errorElement = input.parentElement.querySelector('.help.is-danger');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    // Validate all numerical inputs before form submission
    validateAllInputs() {
        const numberInputs = document.querySelectorAll('input[type="number"]');
        let allValid = true;
        
        numberInputs.forEach(input => {
            if (!this.validateNumberInput(input)) {
                allValid = false;
            }
        });
        
        return allValid;
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
    
    // Find Most Efficient - switch to calculator and optimize
    findMostEfficient() {
        // Get current explorer configuration and stats
        const config = this.getCurrentConfiguration();
        const stats = this.calculator.calculateStats(config);
        
        // Check if we have a valid shield configuration
        if (!config.generator || config.generator === 'none' || stats.capacity <= 0 || stats.recharge <= 0) {
            this.showError('Please configure a valid shield in the Explorer first.');
            return;
        }
        
        // Switch to calculator mode
        this.switchToCalculatorMode();
        
        // Prepopulate target values with current stats
        document.getElementById('target-capacity').value = Math.round(stats.capacity);
        document.getElementById('target-recharge').value = Math.round(stats.recharge);
        
        // Set strategy to CPU-Efficiency
        document.getElementById('optimization-strategy').value = 'cpu-efficiency';
        this.updateStrategyHelp();
        
        // Copy blocks and crew from explorer to calculator
        this.copyExplorerBlocksAndCrewToCalculator(config);
        
        // Show success message
        this.showSuccess(`Transferred ${ComponentUtils.formatNumber(stats.capacity)} HP / ${ComponentUtils.formatNumber(stats.recharge)} HP/s to Calculator. Running optimization...`);
        
        // Run optimization after a short delay to show the message
        setTimeout(() => {
            this.calculateOptimal();
        }, 500);
    }
    
    // Switch from explorer to calculator mode
    switchToCalculatorMode() {
        // Switch active mode button
        document.querySelectorAll('.mode-button').forEach(btn => btn.classList.remove('is-active'));
        document.querySelector('.mode-button[data-mode="value-to-component"]').classList.add('is-active');
        
        // Switch mode content
        document.querySelectorAll('.mode-content').forEach(content => content.classList.remove('is-active'));
        document.getElementById('value-to-component-mode').classList.add('is-active');
        
        // Update tagline
        document.getElementById('mode-tagline').textContent = 'Automatically find the optimal configuration for your requirements';
    }
    
    // Copy blocks and crew from explorer to calculator
    copyExplorerBlocksAndCrewToCalculator(config) {
        // Copy blocks
        if (config.blocks) {
            document.getElementById('steel-blocks').value = config.blocks.steel || 0;
            document.getElementById('hardened-steel-blocks').value = config.blocks.hardenedSteel || 0;
            document.getElementById('combat-steel-blocks').value = config.blocks.combatSteel || 0;
            document.getElementById('xeno-steel-blocks').value = config.blocks.xenoSteel || 0;
        }
        
        // Copy crew
        if (config.crew && config.crew.shieldTechnicians) {
            document.getElementById('existing-shield-technicians').value = config.crew.shieldTechnicians;
        }
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
        const considerPowerUsage = document.getElementById('consider-power-usage').checked;
        const generatorConstraint = document.getElementById('generator-constraint').value;
        const maxAdvanced = document.getElementById('max-advanced-extenders').value;
        const maxImproved = document.getElementById('max-improved-extenders').value;
        const maxBasic = document.getElementById('max-basic-extenders').value;
        const maxSmallReactors = document.getElementById('max-small-reactors').value;
        const maxLargeReactors = document.getElementById('max-large-reactors').value;
        
        const html = `
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 12px; width: 25%; vertical-align: middle;">
                        <span class="constraint-label">CPU Limit:</span>
                    </td>
                    <td style="padding: 8px 12px; width: 25%; vertical-align: middle;">
                        <span class="constraint-value">${cpuLimit || 'No limit'}</span>
                    </td>
                    <td style="padding: 8px 12px; width: 25%; vertical-align: middle;">
                        <span class="constraint-label">Power Limit:</span>
                    </td>
                    <td style="padding: 8px 12px; width: 25%; vertical-align: middle;">
                        <span class="constraint-value">${powerLimit ? ComponentUtils.formatPower(parseInt(powerLimit)) : 'No limit'}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 12px; vertical-align: middle;">
                        <span class="constraint-label">Shield Generator:</span>
                    </td>
                    <td style="padding: 8px 12px; vertical-align: middle;">
                        <span class="constraint-value">${generatorConstraint === 'any' ? 'Any' : generatorConstraint.charAt(0).toUpperCase() + generatorConstraint.slice(1)}</span>
                    </td>
                    <td style="padding: 8px 12px; vertical-align: middle;">
                        <span class="constraint-label">Max Advanced:</span>
                    </td>
                    <td style="padding: 8px 12px; vertical-align: middle;">
                        <span class="constraint-value">${maxAdvanced}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 12px; vertical-align: middle;">
                        <span class="constraint-label">Max Improved:</span>
                    </td>
                    <td style="padding: 8px 12px; vertical-align: middle;">
                        <span class="constraint-value">${maxImproved}</span>
                    </td>
                    <td style="padding: 8px 12px; vertical-align: middle;">
                        <span class="constraint-label">Max Basic:</span>
                    </td>
                    <td style="padding: 8px 12px; vertical-align: middle;">
                        <span class="constraint-value">${maxBasic}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 12px; vertical-align: middle;">
                        <span class="constraint-label">Max Small Reactors:</span>
                    </td>
                    <td style="padding: 8px 12px; vertical-align: middle;">
                        <span class="constraint-value">${maxSmallReactors}</span>
                    </td>
                    <td style="padding: 8px 12px; vertical-align: middle;">
                        <span class="constraint-label">Max Large Reactors:</span>
                    </td>
                    <td style="padding: 8px 12px; vertical-align: middle;">
                        <span class="constraint-value">${maxLargeReactors}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 12px; vertical-align: middle;">
                        <span class="constraint-label">Consider Power:</span>
                    </td>
                    <td style="padding: 8px 12px; vertical-align: middle;">
                        <span class="constraint-value">${considerPowerUsage ? 'Yes' : 'No'}</span>
                    </td>
                    <td style="padding: 8px 12px; vertical-align: middle;" colspan="2">
                        ${!considerPowerUsage ? '<em style="color: #3273dc;">Shield components only, no power optimization</em>' : ''}
                    </td>
                </tr>
            </table>
        `;
        
        appliedConstraintsContent.innerHTML = html;
    }
    
    // Populate Included Bonuses box
    populateIncludedBonuses(config) {
        const includedBonusesContent = document.getElementById('included-bonuses-content');
        if (!includedBonusesContent) return;
        
        let html = '';
        let totalBonusCapacity = 0;
        let totalBonusRecharge = 0;
        
        // Blocks
        if (config.blocks) {
            for (const blockType in config.blocks) {
                const count = config.blocks[blockType];
                if (count > 0) {
                    const block = ComponentUtils.getComponent('blocks', blockType);
                    if (block) {
                        html += this.createComponentCard(block, count);
                        totalBonusCapacity += block.capacity * count;
                        totalBonusRecharge += (block.recharge || 0) * count;
                    }
                }
            }
        }
        
        // Crew
        if (config.crew && config.crew.shieldTechnicians > 0) {
            const crew = ComponentUtils.getComponent('crew', 'shieldTechnician');
            if (crew) {
                html += this.createComponentCard(crew, config.crew.shieldTechnicians);
                totalBonusCapacity += crew.capacity * config.crew.shieldTechnicians;
                totalBonusRecharge += crew.recharge * config.crew.shieldTechnicians;
            }
        }
        
        // Show/hide the entire bonuses box based on content
        const bonusesBox = document.getElementById('included-bonuses-box');
        const bonusSummary = document.getElementById('calculator-bonus-summary');
        const bonusCapacitySpan = document.getElementById('calculator-bonus-capacity');
        const bonusRechargeSpan = document.getElementById('calculator-bonus-recharge');
        
        if (totalBonusCapacity > 0 || totalBonusRecharge > 0) {
            // Show the bonuses box and populate content
            if (bonusesBox) bonusesBox.classList.remove('is-hidden');
            includedBonusesContent.innerHTML = html;
            
            // Update bonus summary box
            if (bonusSummary && bonusCapacitySpan && bonusRechargeSpan) {
                bonusCapacitySpan.textContent = ComponentUtils.formatNumber(totalBonusCapacity);
                bonusRechargeSpan.textContent = ComponentUtils.formatNumber(totalBonusRecharge);
                bonusSummary.style.display = 'block';
            }
        } else {
            // Hide the entire bonuses box when empty
            if (bonusesBox) bonusesBox.classList.add('is-hidden');
            if (bonusSummary) bonusSummary.style.display = 'none';
        }
    }
    
    // Export calculator configuration to self-contained HTML file
    exportCalculatorConfiguration() {
        // Check if we have results to export
        if (!this.lastOptimizationResult || !this.lastOptimizationResult.success) {
            this.showError('No configuration to export. Please run the calculator first.');
            return;
        }
        
        const config = this.lastOptimizationResult.configuration;
        const stats = this.lastOptimizationResult.stats;
        
        // Build calculator stats HTML from individual elements
        const capacityEl = document.getElementById('calc-capacity');
        const rechargeEl = document.getElementById('calc-recharge');
        const cpuEl = document.getElementById('calc-cpu');
        const powerEl = document.getElementById('calc-power');
        
        const calculatorStats = `
            <div class="stats-grid">
                <div class="stat-item">
                    <label>Capacity:</label>
                    <span>${capacityEl ? capacityEl.textContent : '0 HP'}</span>
                </div>
                <div class="stat-item">
                    <label>Recharge:</label>
                    <span>${rechargeEl ? rechargeEl.textContent : '0 HP/s'}</span>
                </div>
                <div class="stat-item">
                    <label>CPU:</label>
                    <span>${cpuEl ? cpuEl.textContent : '0'}</span>
                </div>
                <div class="stat-item">
                    <label>Power:</label>
                    <span>${powerEl ? powerEl.textContent : '0 W'}</span>
                </div>
            </div>
        `;
        
        // Build simple component table
        const componentsTable = this.buildSimpleComponentTable(config);
        
        // Use current form values for bonuses, not optimizer config
        const currentBlocks = {
            steel: parseInt(document.getElementById('steel-blocks').value) || 0,
            hardenedSteel: parseInt(document.getElementById('hardened-steel-blocks').value) || 0,
            combatSteel: parseInt(document.getElementById('combat-steel-blocks').value) || 0,
            xenoSteel: parseInt(document.getElementById('xeno-steel-blocks').value) || 0
        };
        const currentCrew = {
            shieldTechnicians: parseInt(document.getElementById('existing-shield-technicians').value) || 0
        };
        const bonusConfig = {
            blocks: currentBlocks,
            crew: currentCrew
        };
        
        // Check if there are bonuses to include
        const hasBonuses = this.configHasBonuses(bonusConfig);
        const bonusesTable = hasBonuses ? this.buildIncludedBonusesTable(bonusConfig) : null;
        
        // Generate export data
        const exportData = {
            type: 'Calculator Results',
            generatedAt: new Date().toLocaleString(),
            stats: calculatorStats,
            components: componentsTable,
            bonuses: bonusesTable,
            constraints: null // Remove constraints
        };
        
        this.generateAndDownloadReport(exportData);
    }
    
    // Export explorer configuration to self-contained HTML file
    exportExplorerConfiguration() {
        const config = this.getCurrentConfiguration();
        const stats = this.calculator.calculateStats(config);
        
        // Check if there are any components
        const hasComponents = config.generator !== 'none' || 
                            Object.values(config.powerGenerators).some(count => count > 0) ||
                            config.reactors.small > 0 || config.reactors.large > 0 ||
                            Object.values(config.extenders).some(tier => tier.capacitor > 0 || tier.charger > 0);
        
        if (!hasComponents) {
            this.showError('No configuration to export. Please select components first.');
            return;
        }
        
        // Build simple component table
        const componentsTable = this.buildSimpleComponentTable(config);
        
        // Use current form values for bonuses (already in config from getCurrentConfiguration)
        const hasBonuses = this.configHasBonuses(config);
        const bonusesTable = hasBonuses ? this.buildIncludedBonusesTable(config) : null;
        
        // Generate stats HTML
        const statsHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <label>Capacity:</label>
                    <span>${ComponentUtils.formatNumber(stats.capacity)} HP</span>
                </div>
                <div class="stat-item">
                    <label>Recharge:</label>
                    <span>${ComponentUtils.formatNumber(stats.recharge)} HP/s</span>
                </div>
                <div class="stat-item">
                    <label>CPU:</label>
                    <span>${ComponentUtils.formatNumber(stats.cpu)}</span>
                </div>
                <div class="stat-item">
                    <label>Power:</label>
                    <span>${stats.power < 0 ? '+' + ComponentUtils.formatPower(Math.abs(stats.power)) + ' Generated' : 
                           stats.power > 0 ? '-' + ComponentUtils.formatPower(stats.power) + ' Required' : '0 W'}</span>
                </div>
            </div>
        `;
        
        const exportData = {
            type: 'Shield Explorer Build',
            generatedAt: new Date().toLocaleString(),
            stats: statsHTML,
            components: componentsTable,
            bonuses: bonusesTable,
            constraints: null
        };
        
        this.generateAndDownloadReport(exportData);
    }
    
    // Edit current calculator results in explorer
    editInExplorer() {
        // Get the last optimization result
        if (!this.lastOptimizationResult || !this.lastOptimizationResult.success) {
            this.showError('No calculator results to edit. Please run the calculator first.');
            return;
        }
        
        const config = this.lastOptimizationResult.configuration;
        
        // Set flag to prevent switchMode from updating live stats prematurely
        this.isEditingInExplorer = true;
        
        // Switch to explorer mode first (this will initialize chart but not update stats)
        this.switchMode('component-to-value');
        
        // Wait for mode switch and chart initialization to complete
        setTimeout(() => {
            // Populate the configuration
            this.populateExplorerFromConfiguration(config);
            
            // Clear the flag and update stats
            this.isEditingInExplorer = false;
            this.updateLiveStats();
        }, 150);
        
        // Show success message
        this.showSuccess('Configuration loaded into Shield Explorer. You can now modify components.');
    }
    
    // Populate explorer from a configuration object
    populateExplorerFromConfiguration(config) {
        // Set generator
        const generatorSelect = document.getElementById('shield-generator-select');
        if (generatorSelect && config.generator) {
            generatorSelect.value = config.generator;
        }
        
        // Set power generators
        if (config.powerGenerators) {
            document.getElementById('basic-large-generators').value = config.powerGenerators.basicLarge || 0;
            document.getElementById('improved-large-generators').value = config.powerGenerators.improvedLarge || 0;
            document.getElementById('advanced-large-generators').value = config.powerGenerators.advancedLarge || 0;
        }
        
        // Set reactors
        document.getElementById('small-reactor-count').value = config.reactors.small || 0;
        document.getElementById('large-reactor-count').value = config.reactors.large || 0;
        
        // Set extenders
        if (config.extenders) {
            // Advanced
            const advCapEl = document.getElementById('advanced-capacitors');
            const advChgEl = document.getElementById('advanced-chargers');
            if (advCapEl) advCapEl.value = config.extenders.advanced.capacitor || 0;
            if (advChgEl) advChgEl.value = config.extenders.advanced.charger || 0;
            
            // Improved
            const impCapEl = document.getElementById('improved-capacitors');
            const impChgEl = document.getElementById('improved-chargers');
            if (impCapEl) impCapEl.value = config.extenders.improved.capacitor || 0;
            if (impChgEl) impChgEl.value = config.extenders.improved.charger || 0;
            
            // Basic
            const basCapEl = document.getElementById('basic-capacitors');
            const basChgEl = document.getElementById('basic-chargers');
            if (basCapEl) basCapEl.value = config.extenders.basic.capacitor || 0;
            if (basChgEl) basChgEl.value = config.extenders.basic.charger || 0;
        }
        
        // Set blocks
        if (config.blocks) {
            const steelEl = document.getElementById('steel-blocks-live');
            const hardenedEl = document.getElementById('hardened-steel-blocks-live');
            const combatEl = document.getElementById('combat-steel-blocks-live');
            const xenoEl = document.getElementById('xeno-steel-blocks-live');
            
            if (steelEl) steelEl.value = config.blocks.steel || 0;
            if (hardenedEl) hardenedEl.value = config.blocks.hardenedSteel || 0;
            if (combatEl) combatEl.value = config.blocks.combatSteel || 0;
            if (xenoEl) xenoEl.value = config.blocks.xenoSteel || 0;
        }
        
        // Set crew
        if (config.crew) {
            const technicianEl = document.getElementById('shield-technicians');
            if (technicianEl) technicianEl.value = config.crew.shieldTechnician || 0;
        }
        
        // Update component box states
        this.updateComponentBoxStates();
        
        // Only update live stats if not in edit mode (will be handled by editInExplorer)
        if (!this.isEditingInExplorer) {
            this.updateLiveStats();
        }
    }
    
    // Build simple component table for export
    buildSimpleComponentTable(config) {
        const components = [];
        
        // Generator
        if (config.generator && config.generator !== 'none') {
            const gen = ComponentUtils.getComponent('generators', config.generator);
            if (gen) components.push({ name: gen.name, quantity: 1 });
        }
        
        // Power Generators
        if (config.powerGenerators) {
            for (const [type, count] of Object.entries(config.powerGenerators)) {
                if (count > 0) {
                    const gen = ComponentUtils.getComponent('powerGenerators', type);
                    if (gen) components.push({ name: gen.name, quantity: count });
                }
            }
        }
        
        // Reactors
        if (config.reactors.small > 0) {
            const reactor = ComponentUtils.getComponent('reactors', 'small');
            if (reactor) components.push({ name: reactor.name, quantity: config.reactors.small });
        }
        if (config.reactors.large > 0) {
            const reactor = ComponentUtils.getComponent('reactors', 'large');
            if (reactor) components.push({ name: reactor.name, quantity: config.reactors.large });
        }
        
        // Extenders
        for (const tier in config.extenders) {
            if (config.extenders[tier].capacitor > 0) {
                const component = ComponentUtils.getComponent('extenders', tier).capacitor;
                components.push({ name: component.name, quantity: config.extenders[tier].capacitor });
            }
            if (config.extenders[tier].charger > 0) {
                const component = ComponentUtils.getComponent('extenders', tier).charger;
                components.push({ name: component.name, quantity: config.extenders[tier].charger });
            }
        }
        
        
        // Build simple table HTML
        if (components.length === 0) {
            return '<p>No components required</p>';
        }
        
        let tableHTML = '<table style="width: 100%; border-collapse: collapse;">';
        components.forEach(comp => {
            tableHTML += `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${comp.quantity}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${comp.name}</td>
                </tr>
            `;
        });
        tableHTML += '</table>';
        
        return tableHTML;
    }
    
    // Build included bonuses table with summary
    buildIncludedBonusesTable(config) {
        const bonuses = [];
        let totalBonusCapacity = 0;
        let totalBonusRecharge = 0;
        
        // Blocks
        if (config.blocks) {
            for (const [type, count] of Object.entries(config.blocks)) {
                if (count > 0) {
                    const block = ComponentUtils.getComponent('blocks', type);
                    if (block) {
                        bonuses.push({ name: block.name, quantity: count });
                        totalBonusCapacity += block.capacity * count;
                        totalBonusRecharge += (block.recharge || 0) * count;
                    }
                }
            }
        }
        
        // Crew
        if (config.crew) {
            for (const [type, count] of Object.entries(config.crew)) {
                if (count > 0) {
                    const crewMember = ComponentUtils.getComponent('crew', type);
                    if (crewMember) {
                        bonuses.push({ name: crewMember.name, quantity: count });
                        totalBonusCapacity += crewMember.capacity * count;
                        totalBonusRecharge += crewMember.recharge * count;
                    }
                }
            }
        }
        
        // If no bonuses, return message
        if (bonuses.length === 0) {
            return '<p>No bonus blocks or crew included</p>';
        }
        
        // Build bonuses table HTML
        let tableHTML = '<table style="width: 100%; border-collapse: collapse;">';
        bonuses.forEach(bonus => {
            tableHTML += `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${bonus.quantity}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${bonus.name}</td>
                </tr>
            `;
        });
        tableHTML += '</table>';
        
        // Add summary section
        tableHTML += `
            <div style="margin-top: 16px; padding: 12px; background-color: #f8f9fa; border-radius: 4px; border-left: 4px solid #00d1b2;">
                <h4 style="margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: 600;">Total Bonus Stats</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div>
                        <strong>Capacity:</strong> ${ComponentUtils.formatNumber(totalBonusCapacity)} HP
                    </div>
                    <div>
                        <strong>Recharge:</strong> ${ComponentUtils.formatNumber(totalBonusRecharge)} HP/s
                    </div>
                </div>
            </div>
        `;
        
        return tableHTML;
    }
    
    // Check if configuration has any bonuses (blocks or crew)
    configHasBonuses(config) {
        // Check blocks
        if (config.blocks) {
            for (const [type, count] of Object.entries(config.blocks)) {
                if (count > 0) return true;
            }
        }
        
        // Check crew
        if (config.crew) {
            for (const [type, count] of Object.entries(config.crew)) {
                if (count > 0) return true;
            }
        }
        
        return false;
    }
    
    // Generate and download HTML report
    generateAndDownloadReport(data) {
        const reportHTML = this.createReportTemplate(data);
        
        // Create blob and download
        const blob = new Blob([reportHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `shield-configuration-${Date.now()}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        this.showSuccess('Configuration exported successfully!');
    }
    
    // Create self-contained HTML report template
    createReportTemplate(data) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shield Configuration Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .report-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .report-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .report-header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .report-header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .report-content {
            padding: 30px;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            background: #fafafa;
        }
        .section h2 {
            margin-top: 0;
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-item {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .stat-item label {
            font-weight: 600;
            color: #555;
        }
        .stat-item span {
            font-weight: 500;
            color: #333;
        }
        .components-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .component-card {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            padding: 15px;
            transition: transform 0.2s;
        }
        .component-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .component-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 8px;
        }
        .component-quantity {
            font-size: 1.1em;
            color: #667eea;
            font-weight: 500;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 0.9em;
            border-top: 1px solid #e0e0e0;
        }
        .notification {
            padding: 15px;
            border-radius: 4px;
            margin: 15px 0;
        }
        .notification.is-success {
            background-color: #d1edff;
            border: 1px solid #bee5eb;
            color: #0c5460;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .stats-grid {
                grid-template-columns: 1fr;
            }
            .components-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="report-header">
            <h1>🛡️ Shield Configuration</h1>
            <p>${data.type}</p>
            <p>Generated: ${data.generatedAt}</p>
        </div>
        
        <div class="report-content">
            ${data.stats ? `
            <div class="section">
                <h2>📊 Performance Stats</h2>
                ${data.stats}
            </div>
            ` : ''}
            
            <div class="section">
                <h2>🔧 Required Components</h2>
                ${data.components}
            </div>
            
            ${data.bonuses ? `
            <div class="section">
                <h2>⭐ Included Bonuses</h2>
                ${data.bonuses}
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p>Generated by Shield Utility - <a href="https://github.com/yourusername/shield-utility">https://github.com/yourusername/shield-utility</a></p>
        </div>
    </div>
</body>
</html>`;
    }
    
    // Show help popover for the specified mode
    showHelp(mode) {
        const helpPopover = document.getElementById('help-popover');
        const helpTitle = document.getElementById('help-popover-title');
        const helpBody = document.getElementById('help-popover-body');
        
        if (!helpPopover || !helpTitle || !helpBody) return;
        
        // Set title and content based on mode
        if (mode === 'calculator') {
            helpTitle.textContent = 'Shield Calculator Help';
            helpBody.innerHTML = this.getCalculatorHelpContent();
        } else if (mode === 'explorer') {
            helpTitle.textContent = 'Shield Explorer Help';
            helpBody.innerHTML = this.getExplorerHelpContent();
        }
        
        // Show the popover
        helpPopover.classList.remove('is-hidden');
        
        // Prevent body scrolling when popover is open
        document.body.style.overflow = 'hidden';
    }
    
    // Hide help popover
    hideHelp() {
        const helpPopover = document.getElementById('help-popover');
        if (helpPopover) {
            helpPopover.classList.add('is-hidden');
            
            // Restore body scrolling
            document.body.style.overflow = '';
        }
    }
    
    // Get help content for Calculator mode
    getCalculatorHelpContent() {
        return `
            <h3>How to Use Shield Calculator</h3>
            <p>The Shield Calculator finds the optimal shield configuration for your specific requirements.</p>
            
            <h3>Target Values</h3>
            <ul>
                <li><strong>Desired Capacity:</strong> Enter the shield HP you want (optional)</li>
                <li><strong>Desired Recharge:</strong> Enter the recharge rate you want (optional)</li>
                <li>For CPU-Efficiency strategy, at least one target value is required</li>
            </ul>
            
            <h3>Optimization Strategies</h3>
            <ul>
                <li><strong>CPU-Efficiency:</strong> Meets your targets with least possible CPU usage</li>
                <li><strong>Max Balanced:</strong> Highest capacity with balanced recharge rate</li>
                <li><strong>Max Capacity:</strong> Absolute maximum shield capacity with positive recharge</li>
                <li><strong>Max Recharge:</strong> Maximum capacity with ≤15 second full recharge time</li>
            </ul>
            
            <h3>Constraints</h3>
            <ul>
                <li>Set <strong>CPU and Power limits</strong> based on your ship's current capabilities</li>
                <li>Specify <strong>Shield Generator type</strong> if needed</li>
                <li>Limit <strong>Extender quantities</strong> to match what will fit in your ship</li>
                <li>Adjust <strong>Fusion Reactor limits</strong> to fit your preferences or your ship's available space</li>
                <li><strong>Consider Power Usage:</strong> When checked, includes power generation components in optimization. When unchecked, optimizes shield components only without power calculations, only recommending fusion reactors if absolutely necessary</li>
            </ul>
            
            <h3>Existing Components</h3>
            <ul>
                <li><strong>Shield Blocks:</strong> Add blocks you already have to include their shield capacity bonus in calculations</li>
                <li><strong>Shield Technicians:</strong> Add these crew to include their bonuses in calculations</li>
            </ul>
            
            <div class="help-tip">
                <strong>Pro Tip:</strong> Start with CPU-Efficiency strategy and realistic targets. You can always edit the results in Shield Explorer for fine-tuning.
            </div>
        `;
    }
    
    // Get help content for Explorer mode
    getExplorerHelpContent() {
        return `
            <h3>How to Use Shield Explorer</h3>
            <p>The Shield Explorer lets you experiment with components manually and see real-time performance feedback.</p>
            
            <h3>Getting Started</h3>
            <ul>
                <li><strong>Select a Shield Generator:</strong> This is required and enables all other selections</li>
                <li>Choose from Compact, Standard, or Advanced Shield Generator</li>
                <li>Higher tiers provide more capacity and recharge but cost more CPU and power</li>
            </ul>
            
            <h3>Power Sources</h3>
            <ul>
                <li><strong>Fusion Reactors:</strong> Provide both power generation and recharge bonuses
                    <ul>
                        <li>Small Fusion Reactor: +250 HP/s recharge, 300kW power (max 4)</li>
                        <li>Large Fusion Reactor: +1,000 HP/s recharge, 1MW power (max 2)</li>
                    </ul>
                </li>
                <li><strong>Power Generators:</strong> Pure power generation with no recharge bonus, but require no rare materials
                    <ul>
                        <li>Improved Large Generator: 25kW power, 25k CPU</li>
                        <li>Advanced Large Generator: 100kW power, 50k CPU</li>
                    </ul>
                </li>
            </ul>
            
            <h3>Shield Extenders</h3>
            <ul>
                <li><strong>Capacitors:</strong> Increase shield capacity but decrease recharge rate</li>
                <li><strong>Chargers:</strong> Increase shield recharge rate, but decrease capacity</li>
                <li><strong>Tier Limits:</strong> Advanced (4), Improved (6), Basic (8)</li>
                <li>Mix and match within tier limits to achieve desired balance</li>
            </ul>
            
            <h3>Real-time Feedback</h3>
            <ul>
                <li><strong>Live Statistics:</strong> Watch stats update instantly as you make changes</li>
                <li><strong>Visual Radar Chart:</strong> See balance between capacity, recharge, CPU efficiency, and power efficiency</li>
                <li><strong>Warnings:</strong> Get alerts for invalid configurations or potential issues</li>
                <li><strong>Component Inventory:</strong> See all selected components with their stats</li>
            </ul>
            
            <h3>Blocks</h3>
            <ul>
                <li>Include total block counts (found on CPU Statistics page of ship menu)</li>
                <li>These block types provide free shield capacity bonuses and may reduce the number of extenders needed</li>
            </ul>
            
            <h3>Crew</h3>
            <ul>
                <li><strong>Shield Technicians:</strong> These give large bonuses and should be included if you have them</li>
            </ul>
            
            <div class="help-tip">
                <strong>Pro Tip:</strong> Use the radar chart to understand trade-offs. High capacity configs will have lower recharge efficiency, and vice versa.
            </div>
        `;
    }
    
}