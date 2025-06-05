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
            
            // Initialize optimizer
            this.optimizer = new ShieldOptimizer(this.calculator);
            
            // Initialize UI controller
            this.ui = new UIController(this.calculator, this.optimizer);
            
            // Expose UI for reset button access
            window.shieldUtilityApp = { ui: this.ui };
            
            // Setup global error handling
            this.setupErrorHandling();
            
            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
        } catch (error) {
            this.showInitializationError(error);
        }
    }
    
    // Setup global error handling
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            this.showError('An unexpected error occurred. Please refresh the page and try again.');
        });
        
        window.addEventListener('unhandledrejection', (event) => {
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

// Initialize the application
const app = ShieldUtilityApp.getInstance();