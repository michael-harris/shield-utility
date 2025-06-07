# RE2 CV Shield Utility

A comprehensive optimization tool for designing shield configurations in Reforged Eden 2. This utility helps you find the perfect balance between shield capacity, recharge rate, CPU usage, and power consumption for your Capital Vessel builds.

![Shield Utility Interface](images/re2.png)

## Features Overview

### Two Powerful Modes

The utility offers two complementary approaches to shield design:

- **Shield Calculator**: Specify your requirements and let the optimizer find the best configuration
- **Shield Explorer**: Experiment with components manually and see real-time performance feedback

Both modes support the full range of RE2 shield components including generators, extenders, fusion reactors, power generators, shield blocks, and crew bonuses.

## Shield Calculator Mode

The Shield Calculator is your go-to tool when you have specific performance requirements. Tell it what shield stats you need, and it will find the most efficient configuration to achieve them.

### Capabilities

- **Target-based Optimization**: Specify desired shield capacity and/or recharge rate
- **Multiple Optimization Strategies**:
  - **CPU-Efficiency**: Minimize CPU usage while meeting your targets (with fusion reactor limits)
  - **Max Balanced**: Maximize shield capacity with balanced recharge rate
  - **Max Capacity**: Achieve the highest possible shield capacity with positive recharge
  - **Max Recharge**: Maximize capacity with ≤15 second full recharge time
- **Advanced Constraint System**: Set limits on CPU, power, generator types, extender quantities, and reactor usage
- **Consider Power Usage Option**: Choose whether to include power generation components in optimization
- **Block & Crew Integration**: Include existing shield blocks and crew bonuses in calculations
- **Export & Share**: Generate detailed HTML reports of your optimized builds
- **Edit in Explorer**: Transfer calculator results to Explorer mode for further tweaking

### Instructions

1. **Set Your Performance Goals** (Optional)
   - Enter desired shield capacity in HP (leave blank to maximize)
   - Enter desired recharge rate in HP/s (leave blank to maximize)
   - For CPU-Efficiency strategy, targets are required

2. **Choose Your Optimization Strategy**
   - **CPU-Efficiency**: Best for builds with limited CPU (uses realistic fusion reactor limits)
   - **Max Balanced**: Best for general-purpose builds seeking optimal balance
   - **Max Capacity**: Best for tank builds that prioritize survivability
   - **Max Recharge**: Best for sustained combat with fast shield recovery

3. **Configure Constraints** (Optional)
   - Set CPU and power limits based on your vessel's capabilities
   - Restrict generator types if you have preferences
   - Limit extender quantities for balanced builds
   - Control fusion reactor usage (default limits are realistic for most builds)
   - Use "Consider Power Usage" to choose shield-only or full power optimization

4. **Include Existing Components** (Optional)
   - Add shield blocks you already have installed:
     - Steel Blocks: +1 HP each
     - Hardened Steel Blocks: +2 HP each
     - Combat Steel Blocks: +4 HP each
     - XenoSteel Blocks: +7 HP each
   - Include Shield Technicians: +2,000 HP capacity and +75 HP/s recharge each

5. **Optimize Your Configuration**
   - Click "Optimize" to find the best configuration
   - Review performance stats with visual radar chart
   - Examine the required components list
   - Check applied constraints and included bonuses
   - Export results or edit in Shield Explorer for fine-tuning

## Shield Explorer Mode

The Shield Explorer is perfect for experimentation and learning. Select components manually and see real-time performance calculations with instant visual feedback.

### Capabilities

- **Real-time Performance Calculations**: Instant updates as you adjust components
- **Visual Performance Metrics**: Radar chart showing capacity, recharge, CPU efficiency, and power efficiency
- **Component Inventory Display**: Visual list of all selected components with stats
- **Intelligent Warning System**: Alerts for invalid configurations, exceeded limits, and negative stats
- **Educational Interface**: Understand how each component affects overall shield performance
- **Export Functionality**: Save experimental builds as detailed reports

### Instructions

1. **Select Your Shield Generator**
   - Choose from Compact, Standard, or Advanced Shield Generator
   - This is required and enables all other component selections
   - Higher tiers provide more capacity and recharge but cost more CPU and power

2. **Add Power Sources**
   - **Fusion Reactors**: Provide both power generation and recharge bonuses
     - Small Fusion Reactor: +250 HP/s recharge, 300kW power, 100k CPU (max 4)
     - Large Fusion Reactor: +1,000 HP/s recharge, 1MW power, 200k CPU (max 2)
   - **Power Generators**: Pure power generation with no recharge bonus, but require no rare materials
     - Improved Large Generator: 25kW power, 25k CPU
     - Advanced Large Generator: 100kW power, 50k CPU

3. **Fine-tune with Shield Extenders**
   - **Capacitors**: Increase shield capacity but decrease recharge rate
   - **Chargers**: Increase shield recharge rate, but decrease capacity
   - Each tier has quantity limits: Advanced (4), Improved (6), Basic (8)
   - Mix and match within tier limits to achieve desired balance

4. **Add Shield Blocks and Crew** (Optional)
   - **Shield Blocks**: Direct capacity bonuses that scale with block tier
   - **Shield Technicians**: Provide both capacity (+2,000 HP) and recharge (+75 HP/s) bonuses
   - Up to 16 shield technicians can be assigned

5. **Monitor Real-time Performance**
   - Watch statistics update instantly as you make changes
   - Use the radar chart to visualize balance between capacity, recharge, CPU efficiency, and power efficiency
   - Check for warnings about invalid configurations or exceeded component limits
   - Export successful builds for documentation or sharing

## Technical Architecture

### Optimization Engine

The utility employs a sophisticated multi-layered optimization system designed for speed and accuracy:

#### Primary Optimization Engine
- **Dynamic Configuration Generation**: Real-time generation of shield configurations
- **Constraint-based Filtering**: Rapidly eliminates invalid configurations based on user constraints
- **Strategy-specific Scoring**: Different optimization strategies use tailored scoring algorithms
- **Real-time Validation**: Ensures all generated configurations are viable and meet power requirements

#### Exhaustive Search Fallback
- **Comprehensive Brute-force**: Complete search optimization for complex scenarios
- **Multi-strategy Support**: Handles all four optimization strategies with different priority weightings
- **Power Utilization Rules**: Enforces realistic power generation and consumption requirements
- **Strict Constraint Validation**: Comprehensive checking of CPU, power, and component limits as absolute law

#### Performance Features
- **Asynchronous Processing**: Non-blocking optimization with loading indicators
- **Error Recovery**: Graceful handling of impossible requirements with alternative suggestions

### Component Database

The utility maintains a comprehensive database of all RE2 shield components:

#### Shield Generators
| Component | Capacity | Recharge | CPU | Power | Size |
|-----------|----------|----------|-----|-------|------|
| Compact | 6,000 HP | 300 HP/s | 20,000 | 10,000 W | 1x2x3 |
| Standard | 12,000 HP | 300 HP/s | 30,000 | 17,500 W | 3x3x3 |
| Advanced | 24,000 HP | 600 HP/s | 45,000 | 25,000 W | 3x3x3 |

#### Fusion Reactors
| Component | Recharge Bonus | CPU | Power Generation | Limit |
|-----------|----------------|-----|------------------|-------|
| Small Fusion Reactor | +250 HP/s | 100,000 | 300,000 W | 4 |
| Large Fusion Reactor | +1,000 HP/s | 200,000 | 1,000,000 W | 2 |

#### Power Generators
| Component | CPU | Power Generation |
|-----------|-----|------------------|
| Basic Large Generator | 12,500 | 10,000 W |
| Improved Large Generator | 25,000 | 25,000 W |
| Advanced Large Generator | 50,000 | 100,000 W |

#### Shield Extenders
| Tier | Type | Capacity | Recharge | CPU | Power | Limit |
|------|------|----------|----------|-----|-------|-------|
| Advanced | Capacitor | +32,000 HP | -600 HP/s | 18,000 | 16,000 W | 4 |
| Advanced | Charger | -16,000 HP | +1,200 HP/s | 18,000 | 16,000 W | 4 |
| Improved | Capacitor | +16,000 HP | -300 HP/s | 12,000 | 8,000 W | 6 |
| Improved | Charger | -8,000 HP | +600 HP/s | 12,000 | 8,000 W | 6 |
| Basic | Capacitor | +8,000 HP | -150 HP/s | 8,000 | 4,000 W | 8 |
| Basic | Charger | -4,000 HP | +300 HP/s | 8,000 | 4,000 W | 8 |

#### Shield Blocks & Crew
| Component | Capacity Bonus | Recharge Bonus | Notes |
|-----------|----------------|----------------|-------|
| Steel Block | +1 HP | - | Basic structural enhancement |
| Hardened Steel Block | +2 HP | - | Improved structural enhancement |
| Combat Steel Block | +4 HP | - | Military-grade enhancement |
| XenoSteel Block | +7 HP | - | Alien technology enhancement |
| Shield Technician | +2,000 HP | +75 HP/s | Crew bonus (max 16) |

### Configuration Generation

The optimization engine dynamically generates shield configurations using intelligent algorithms:

#### Generation Features
- **Real-time Configuration Creation**: Generates valid shield configurations on-demand
- **Constraint-aware Generation**: Creates only configurations that meet user constraints
- **Strategy-optimized Selection**: Prioritizes configurations based on selected optimization strategy
- **Power Management**: Intelligently handles power generation and consumption requirements

#### Performance Benefits
- **Fast Optimization**: Most optimizations complete in under 500ms
- **Memory Efficient**: No large pre-calculated databases required
- **Flexible Constraints**: Adapts to any constraint combination
- **Always Current**: Never outdated as it generates configurations dynamically

## Installation

### Quick Start (Recommended)
1. **Download**: Clone or download the repository
   ```bash
   git clone https://github.com/yourusername/shield-utility.git
   ```

2. **Run**: Open `index.html` in your web browser
   - No build process required
   - No dependencies to install
   - Works entirely offline

### Alternative Methods
- **GitHub Pages**: Access the live version at [your-github-pages-url]
- **Local Server**: Use `python -m http.server` or similar for local hosting
- **Docker**: Use any static web server container

## Browser Compatibility

### Fully Supported Browsers
- **Chrome/Chromium**: Version 80+ (Full support, best performance)
- **Firefox**: Version 75+ (Full support)
- **Edge**: Version 80+ (Full support)
- **Safari**: Version 13+ (Full support)

### Mobile & Tablet Support
- **Responsive Design**: Optimized for tablet use (iPad, Android tablets)
- **Touch Interface**: All controls are touch-friendly
- **Portrait/Landscape**: Adaptive layout for both orientations
- **Mobile Performance**: May be slower on smartphones due to computational requirements

### Required Browser Features
- ES6+ JavaScript support
- HTML5 Canvas (for Chart.js)
- CSS Grid and Flexbox
- Local Storage (for preferences)

## Development

### Technology Stack
- **Vanilla JavaScript**: No frameworks or transpilation required
- **Bulma CSS**: Modern CSS framework for responsive design
- **Chart.js**: Interactive radar charts for performance visualization
- **Font Awesome**: Icons for enhanced user experience

### Development Setup
1. Clone the repository
2. Open `index.html` in your browser
3. Make changes and refresh to see results
4. No build process or compilation needed

### File Structure
```
shield-utility/
├── index.html                   # Main application entry point
├── css/
│   └── styles.css              # Custom styling and dark theme
├── js/
│   ├── app.js                  # Application initialization
│   ├── data.js                 # Component database and utilities
│   ├── calculator.js           # Core shield calculations
│   ├── optimizer.js            # Optimization algorithms
│   ├── precalculation-engine.js # Configuration generation engine
│   └── ui.js                   # User interface logic
├── images/                     # Component icons and UI assets
├── favicon.ico                 # Application icon
├── LICENSE                     # MIT license
└── README.md                   # This documentation
```

### Key Components

#### Core Engine (`calculator.js`)
- Configuration validation
- Performance calculations
- Component compatibility checking
- Power requirement analysis

#### Optimization System (`optimizer.js`)
- Multiple optimization strategies
- Constraint-based filtering
- Scoring algorithms
- Dynamic configuration generation

#### User Interface (`ui.js`)
- Mode switching and state management
- Real-time updates and validation
- Chart integration and visualization
- Export functionality

#### Configuration System (`data.js`, `precalculation-engine.js`)
- Component definitions and properties
- Dynamic configuration generation
- Utility functions for data manipulation
- Performance optimization

### Contributing
Contributions are welcome! Please feel free to:
- Submit bug reports and feature requests
- Propose component database updates
- Improve optimization algorithms
- Enhance user interface design
- Add new functionality

## License

MIT License - See LICENSE file for details.

## Acknowledgments

- **Eleon** for creating Empyrion: Galactic Survival and for some of the device icons
- **Ravien & Vermillion** for creating Reforged Eden 2 and device icons
- **The RE2 Community** for feedback and testing that made this tool possible
- **Shield Optimization Theory** developed through community collaboration and testing

---

**Note**: This is an unofficial tool created by the community. It is not affiliated with Eleon Game Studios or the official Reforged Eden 2 development team.