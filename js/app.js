// Main Application Initialization
class ShieldUtilityApp {
    constructor() {
        this.calculator = null;
        this.optimizer = null;
        this.ui = null;
        
        this.init();
    }
    
    // Initialize the application
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApplication());
        } else {
            this.setupApplication();
        }
    }
    
    // Setup the application components
    setupApplication() {
        try {
            // Initialize calculator engine
            this.calculator = new ShieldUtility();
            console.log('Shield Utility initialized');
            
            // Initialize optimizer
            this.optimizer = new ShieldOptimizer(this.calculator);
            console.log('Shield Optimizer initialized');
            
            // Initialize UI controller
            this.ui = new UIController(this.calculator, this.optimizer);
            console.log('UI Controller initialized');
            
            // Expose UI for reset button access
            window.shieldUtilityApp = { ui: this.ui };
            
            // Setup global error handling
            this.setupErrorHandling();
            
            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            console.log('Shield Utility App fully initialized');
            
        } catch (error) {
            console.error('Failed to initialize Shield Utility App:', error);
            this.showInitializationError(error);
        }
    }
    
    // Setup global error handling
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showError('An unexpected error occurred. Please refresh the page and try again.');
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showError('An unexpected error occurred. Please refresh the page and try again.');
        });
    }
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + Enter to calculate
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault();
                if (this.ui.currentMode === 'value-to-component') {
                    this.ui.calculateOptimal();
                }
            }
            
            // Ctrl/Cmd + 1/2 to switch modes
            if ((event.ctrlKey || event.metaKey) && ['1', '2'].includes(event.key)) {
                event.preventDefault();
                const mode = event.key === '1' ? 'value-to-component' : 'component-to-value';
                this.ui.switchMode(mode);
            }
            
            // Escape to clear results
            if (event.key === 'Escape') {
                const resultsSection = document.getElementById('results-section');
                if (resultsSection && !resultsSection.classList.contains('is-hidden')) {
                    resultsSection.classList.add('is-hidden');
                }
            }
        });
    }
    
    // Show initialization error
    showInitializationError(error) {
        const errorHTML = `
            <div class="hero is-danger is-fullheight">
                <div class="hero-body">
                    <div class="container has-text-centered">
                        <h1 class="title">
                            <i class="fas fa-exclamation-triangle"></i>
                            Initialization Error
                        </h1>
                        <h2 class="subtitle">
                            Failed to start Shield Utility
                        </h2>
                        <div class="notification is-danger">
                            <p><strong>Error:</strong> ${error.message}</p>
                            <p>Please refresh the page and try again. If the problem persists, check the browser console for more details.</p>
                        </div>
                        <button class="button is-light" onclick="location.reload()">
                            <span class="icon">
                                <i class="fas fa-redo"></i>
                            </span>
                            <span>Refresh Page</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.innerHTML = errorHTML;
    }
    
    // Show general error
    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification is-danger is-fixed';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
        `;
        
        notification.innerHTML = `
            <button class="delete" onclick="this.parentElement.remove()"></button>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 8000);
    }
    
    // Utility method to get app instance
    static getInstance() {
        if (!window.shieldUtilityApp) {
            window.shieldUtilityApp = new ShieldUtilityApp();
        }
        return window.shieldUtilityApp;
    }
}

// Application Configuration
const AppConfig = {
    version: '1.0.0',
    debug: false, // Set to true for development
    features: {
        chartVisualization: true,
        keyboardShortcuts: true,
        localStorage: true,
        exportConfiguration: false // Future feature
    }
};

// Utility functions for the app
const AppUtils = {
    // Save configuration to localStorage
    saveConfiguration(name, config) {
        if (!AppConfig.features.localStorage) return false;
        
        try {
            const saved = JSON.parse(localStorage.getItem('shieldUtilityConfigs') || '{}');
            saved[name] = {
                config: config,
                timestamp: Date.now()
            };
            localStorage.setItem('shieldUtilityConfigs', JSON.stringify(saved));
            return true;
        } catch (error) {
            console.error('Failed to save configuration:', error);
            return false;
        }
    },
    
    // Load configuration from localStorage
    loadConfiguration(name) {
        if (!AppConfig.features.localStorage) return null;
        
        try {
            const saved = JSON.parse(localStorage.getItem('shieldUtilityConfigs') || '{}');
            return saved[name] ? saved[name].config : null;
        } catch (error) {
            console.error('Failed to load configuration:', error);
            return null;
        }
    },
    
    // Get all saved configurations
    getSavedConfigurations() {
        if (!AppConfig.features.localStorage) return {};
        
        try {
            return JSON.parse(localStorage.getItem('shieldUtilityConfigs') || '{}');
        } catch (error) {
            console.error('Failed to get saved configurations:', error);
            return {};
        }
    },
    
    // Clear all saved configurations
    clearSavedConfigurations() {
        if (!AppConfig.features.localStorage) return false;
        
        try {
            localStorage.removeItem('shieldUtilityConfigs');
            return true;
        } catch (error) {
            console.error('Failed to clear saved configurations:', error);
            return false;
        }
    },
    
    // Log debug information
    debug(...args) {
        if (AppConfig.debug) {
            console.log('[Shield Utility Debug]', ...args);
        }
    },
    
    // Copy text to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                return successful;
            } catch (err) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    },
    
    // Format configuration for sharing
    formatConfigurationForSharing(config, stats) {
        let text = 'Shield Configuration:\n\n';
        
        // Stats
        text += `Total Capacity: ${ComponentUtils.formatNumber(stats.capacity)} HP\n`;
        text += `Recharge Rate: ${ComponentUtils.formatNumber(stats.recharge)} HP/s\n`;
        text += `CPU Usage: ${ComponentUtils.formatNumber(stats.cpu)}\n`;
        text += `Net Power: ${ComponentUtils.formatPower(stats.power)}\n\n`;
        
        // Components
        text += 'Components:\n';
        
        if (config.generator && config.generator !== 'none') {
            const gen = ComponentUtils.getComponent('generators', config.generator);
            text += `- ${gen.name} x1\n`;
        }
        
        if (config.reactors.small > 0) {
            text += `- Small Fusion Reactor x${config.reactors.small}\n`;
        }
        
        if (config.reactors.large > 0) {
            text += `- Large Fusion Reactor x${config.reactors.large}\n`;
        }
        
        for (const tier in config.extenders) {
            if (config.extenders[tier].capacitor > 0) {
                const comp = ComponentUtils.getComponent('extenders', tier).capacitor;
                text += `- ${comp.name} x${config.extenders[tier].capacitor}\n`;
            }
            
            if (config.extenders[tier].charger > 0) {
                const comp = ComponentUtils.getComponent('extenders', tier).charger;
                text += `- ${comp.name} x${config.extenders[tier].charger}\n`;
            }
        }
        
        text += '\nGenerated by Shield Utility (https://your-domain.com)';
        
        return text;
    }
};

// Initialize the application
const app = ShieldUtilityApp.getInstance();

// Expose to global scope for debugging (only in debug mode)
if (AppConfig.debug) {
    window.ShieldUtilityApp = ShieldUtilityApp;
    window.AppUtils = AppUtils;
    window.AppConfig = AppConfig;
}