# Shield Utility Implementation Plan

## Project Overview
A single-page JavaScript application with two calculation modes:
1. **Value → Component Calculator**: Calculate optimal components for desired shield stats
2. **Component → Value Calculator**: Real-time stats based on selected components

## Data Structure

### Component Database
```javascript
const components = {
  blocks: {
    steel: { name: "Steel Block", capacity: 1, power: 0, cpu: 0 },
    hardenedSteel: { name: "Hardened Steel Block", capacity: 2, power: 0, cpu: 0 },
    combatSteel: { name: "Combat Steel Block", capacity: 4, power: 0, cpu: 0 },
    xenoSteel: { name: "XenoSteel Block", capacity: 7, power: 0, cpu: 0 }
  },
  
  generators: {
    compact: { 
      name: "Compact Shield Generator",
      capacity: 6000, 
      recharge: 300, 
      power: 10000, 
      cpu: 20000,
      size: "1x2x3",
      limit: 1
    },
    standard: {
      name: "Shield Generator",
      capacity: 12000,
      recharge: 300,
      power: 17500,
      cpu: 30000,
      size: "3x3x3",
      limit: 1
    },
    advanced: {
      name: "Advanced Shield Generator",
      capacity: 24000,
      recharge: 600,
      power: 25000,
      cpu: 45000,
      size: "3x3x3",
      limit: 1
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
      limit: 4
    },
    large: {
      name: "Large Fusion Reactor",
      capacity: 0,
      recharge: 1000,
      powerOutput: 1000000,
      power: -1000000,
      cpu: 200000,
      size: "5x5x5",
      limit: 2
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
        tier: "basic"
      },
      charger: {
        name: "Basic Charger",
        capacity: -4000,
        recharge: 300,
        power: 4000,
        cpu: 8000,
        size: "1x1x2",
        tier: "basic"
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
        tier: "improved"
      },
      charger: {
        name: "Improved Charger",
        capacity: -8000,
        recharge: 600,
        power: 8000,
        cpu: 12000,
        size: "2x2x3",
        tier: "improved"
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
        tier: "advanced"
      },
      charger: {
        name: "Advanced Charger",
        capacity: -16000,
        recharge: 1200,
        power: 16000,
        cpu: 18000,
        size: "3x3x4",
        tier: "advanced"
      }
    }
  },
  
  tierLimits: {
    basic: 8,
    improved: 6,
    advanced: 4
  }
};
```

## UI Layout & Components

### Main Container Structure
```html
<div id="shield-calculator">
  <header>
    <h1>Shield Configuration Calculator</h1>
    <div class="mode-switcher">
      <button class="mode-btn active" data-mode="value-to-component">
        Value → Components
      </button>
      <button class="mode-btn" data-mode="component-to-value">
        Components → Value
      </button>
    </div>
  </header>
  
  <main>
    <div id="value-to-component-mode" class="mode-content active">
      <!-- Value to Component Calculator -->
    </div>
    <div id="component-to-value-mode" class="mode-content">
      <!-- Component to Value Calculator -->
    </div>
  </main>
</div>
```

### Value → Component Calculator UI
```html
<div class="input-section">
  <h2>Target Values</h2>
  <div class="input-group">
    <label>Desired Capacity (HP)</label>
    <input type="number" id="target-capacity" min="0" step="1000">
    <span class="helper-text">Will target within 5% of this value</span>
  </div>
  <div class="input-group">
    <label>Desired Recharge (HP/s)</label>
    <input type="number" id="target-recharge" min="0" step="100">
    <span class="helper-text">Will target within 5% of this value</span>
  </div>
</div>

<div class="blocks-section">
  <h2>Existing Blocks</h2>
  <div class="block-inputs">
    <div class="input-group">
      <label>Steel Blocks</label>
      <input type="number" id="steel-blocks" min="0" value="0">
    </div>
    <div class="input-group">
      <label>Hardened Steel Blocks</label>
      <input type="number" id="hardened-steel-blocks" min="0" value="0">
    </div>
    <div class="input-group">
      <label>Combat Steel Blocks</label>
      <input type="number" id="combat-steel-blocks" min="0" value="0">
    </div>
    <div class="input-group">
      <label>XenoSteel Blocks</label>
      <input type="number" id="xeno-steel-blocks" min="0" value="0">
    </div>
  </div>
  <div class="block-capacity-display">
    Total Block Capacity: <span id="total-block-capacity">0</span> HP
  </div>
</div>

<div class="constraints-section">
  <h2>Constraints</h2>
  <div class="constraint-inputs">
    <div class="input-group">
      <label>CPU Limit</label>
      <input type="number" id="cpu-limit" min="0" placeholder="No limit">
    </div>
    <div class="input-group">
      <label>Power Limit (W)</label>
      <input type="number" id="power-limit" min="0" placeholder="No limit">
    </div>
    <div class="checkbox-group">
      <label>
        <input type="checkbox" id="no-fusion-reactors">
        No Fusion Reactors
      </label>
    </div>
    <div class="input-group">
      <label>Max Advanced Extenders</label>
      <select id="max-advanced-extenders">
        <option value="4">4 (Default)</option>
        <option value="3">3</option>
        <option value="2">2</option>
        <option value="1">1</option>
        <option value="0">0</option>
      </select>
    </div>
    <div class="input-group">
      <label>Shield Generator Type</label>
      <select id="generator-type">
        <option value="any">Any (Optimize)</option>
        <option value="compact">Compact Only</option>
        <option value="standard">Standard Only</option>
        <option value="advanced">Advanced Only</option>
      </select>
    </div>
  </div>
</div>

<button id="calculate-btn" class="primary-btn">Calculate Optimal Configuration</button>

<div id="results-section" class="results hidden">
  <!-- Results will be dynamically populated -->
</div>
```

### Component → Value Calculator UI
```html
<div class="component-selector">
  <h2>Shield Generator</h2>
  <select id="shield-generator-select">
    <option value="none">None</option>
    <option value="compact">Compact Shield Generator</option>
    <option value="standard">Shield Generator</option>
    <option value="advanced">Advanced Shield Generator</option>
  </select>
  
  <h2>Fusion Reactors</h2>
  <div class="reactor-inputs">
    <div class="input-group">
      <label>Small Fusion Reactors</label>
      <select id="small-reactor-count">
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
    </div>
    <div class="input-group">
      <label>Large Fusion Reactors</label>
      <select id="large-reactor-count">
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
      </select>
    </div>
  </div>
  
  <h2>Shield Extenders</h2>
  <div class="extender-section">
    <h3>Advanced (Limit: <span id="advanced-limit">4</span>)</h3>
    <div class="extender-inputs">
      <div class="input-group">
        <label>Advanced Capacitors</label>
        <select id="advanced-capacitors" data-tier="advanced" data-type="capacitor">
          <!-- Options dynamically generated -->
        </select>
      </div>
      <div class="input-group">
        <label>Advanced Chargers</label>
        <select id="advanced-chargers" data-tier="advanced" data-type="charger">
          <!-- Options dynamically generated -->
        </select>
      </div>
    </div>
  </div>
  
  <!-- Similar sections for Improved and Basic extenders -->
  
  <h2>Blocks</h2>
  <div class="block-inputs">
    <!-- Same as in Value→Component mode -->
  </div>
</div>

<div class="live-stats">
  <h2>Current Configuration Stats</h2>
  <div class="stat-grid">
    <div class="stat-item">
      <label>Total Capacity</label>
      <span id="live-capacity" class="stat-value">0 HP</span>
    </div>
    <div class="stat-item">
      <label>Recharge Rate</label>
      <span id="live-recharge" class="stat-value">0 HP/s</span>
    </div>
    <div class="stat-item">
      <label>CPU Usage</label>
      <span id="live-cpu" class="stat-value">0</span>
    </div>
    <div class="stat-item">
      <label>Net Power</label>
      <span id="live-power" class="stat-value">0 W</span>
    </div>
  </div>
  <div class="warnings">
    <!-- Warnings for negative values displayed here -->
  </div>
</div>
```

## Core JavaScript Modules

### 1. Calculator Engine
```javascript
class ShieldCalculator {
  constructor() {
    this.components = components; // From data structure above
  }
  
  calculateStats(configuration) {
    let stats = {
      capacity: 0,
      recharge: 0,
      cpu: 0,
      power: 0
    };
    
    // Add generator stats
    if (configuration.generator) {
      const gen = this.components.generators[configuration.generator];
      stats.capacity += gen.capacity;
      stats.recharge += gen.recharge;
      stats.cpu += gen.cpu;
      stats.power += gen.power;
    }
    
    // Add reactor stats
    // Add extender stats
    // Add block stats
    
    return stats;
  }
  
  findOptimalConfiguration(targetCapacity, targetRecharge, constraints) {
    // Implementation of optimization algorithm
    // Use dynamic programming or greedy approach
    // Consider all constraints
    // Return optimal configuration or closest possible
  }
}
```

### 2. UI Controller
```javascript
class UIController {
  constructor(calculator) {
    this.calculator = calculator;
    this.currentMode = 'value-to-component';
    this.initializeEventListeners();
  }
  
  initializeEventListeners() {
    // Mode switching
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
    });
    
    // Calculate button
    document.getElementById('calculate-btn').addEventListener('click', 
      () => this.calculateOptimal());
    
    // Live updates for component mode
    this.initializeComponentSelectors();
  }
  
  updateExtenderLimits() {
    // Dynamically update dropdown options based on selections
  }
  
  displayResults(configuration, stats) {
    // Format and display results
  }
  
  displayError(message, suggestion) {
    // Show error with suggested alternative
  }
}
```

### 3. Optimization Algorithm
```javascript
class OptimizationEngine {
  constructor(components) {
    this.components = components;
  }
  
  optimize(targetCapacity, targetRecharge, constraints) {
    const tolerance = 0.05; // 5% tolerance
    const minCapacity = targetCapacity * (1 - tolerance);
    const maxCapacity = targetCapacity * (1 + tolerance);
    const minRecharge = targetRecharge * (1 - tolerance);
    const maxRecharge = targetRecharge * (1 + tolerance);
    
    // Accepts configurations with >= minCapacity AND >= minRecharge
    
    // Try different generator types if not constrained
    // Use greedy approach: prioritize most CPU-efficient components
    // Implement backtracking if needed
    // Check all constraints at each step
    
    return bestConfiguration;
  }
}
```

## Styling Guidelines

### CSS Structure
```css
/* Use CSS Grid for layouts */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

/* Color coding for warnings */
.stat-value.negative {
  color: #d32f2f;
  font-weight: bold;
}

/* Mode switching animation */
.mode-content {
  display: none;
}

.mode-content.active {
  display: block;
  animation: fadeIn 0.3s ease-in;
}

/* Responsive design */
@media (max-width: 768px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
}
```

## Key Features to Implement

### 1. Dynamic Dropdown Updates
- When user selects extenders, update remaining options
- Ensure tier limits are respected
- Visual feedback when limits are reached

### 2. Real-time Validation
- Check for negative values immediately
- Highlight issues in red
- Provide helpful tooltips

### 3. Optimization Algorithm
- Start with most CPU-efficient components
- Use constraint satisfaction approach
- Implement fallback for impossible configurations

### 4. Results Display
- Clear component list with quantities
- Total stats summary
- Visual indicators for efficiency
- Export/save configuration option

### 5. Power Formatting
- Auto-convert to appropriate units (W, kW, MW)
- Show net power (consumption vs generation)
- Warning if power balance is negative

## Testing Considerations

1. **Edge Cases**
   - Zero or negative targets
   - Impossible configurations
   - Maximum component limits
   - Very large numbers

2. **Performance**
   - Optimization should complete quickly
   - Live updates should be smooth
   - No UI blocking

3. **Browser Compatibility**
   - Modern browsers (Chrome, Firefox, Safari, Edge)
   - Mobile responsive
   - No external dependencies

## Future Enhancements

1. **Save/Load Configurations**
   - Local storage for favorites
   - Export as JSON or URL

2. **Comparison Mode**
   - Compare multiple configurations
   - Efficiency graphs

3. **Advanced Constraints**
   - Size/volume constraints
   - Custom component restrictions

4. **Tooltips & Help**
   - Component descriptions
   - Strategy suggestions
   - Efficiency tips