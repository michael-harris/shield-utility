# CV Shield Utility

A comprehensive optimization tool for designing shield configurations in a space engineering game. This utility helps you find the perfect balance between shield capacity, recharge rate, CPU usage, and power consumption.

![Shield Utility Screenshot](images/shield-generator.png)

## Features

### Two Powerful Modes

#### 1. Shield Calculator (Value-to-Component)
The Shield Calculator is your go-to tool when you have specific performance requirements in mind. Tell it what shield stats you need, and it will find the most efficient configuration to achieve them.

**Capabilities:**
- **Target-based optimization**: Specify desired shield capacity and/or recharge rate
- **Multiple optimization strategies**:
  - **CPU-Efficiency**: Minimize CPU usage while meeting your targets
  - **Max Balanced**: Maximize shield capacity with balanced recharge rate
  - **Max Capacity**: Achieve the highest possible shield capacity
  - **Max Recharge**: Maximize capacity with ≤15 second full recharge time
- **Constraint system**: Set limits on CPU, power, generators, reactors, and extenders
- **Block integration**: Include existing shield blocks in calculations
- **Crew bonuses**: Factor in shield technician bonuses
- **Export functionality**: Save and share your optimized builds

#### 2. Shield Explorer (Component-to-Value)
The Shield Explorer is perfect for experimenting and learning. Select components manually and see real-time performance calculations.

**Capabilities:**
- **Real-time calculations**: Instant feedback as you adjust components
- **Visual performance metrics**: Radar chart showing capacity, recharge, CPU efficiency, and power efficiency
- **Component inventory**: Visual list of all selected components
- **Warning system**: Alerts for invalid configurations (negative stats, exceeded limits)
- **Educational tool**: Understand how each component affects overall performance

## Quick Start Guide

### Using the Shield Calculator

1. **Set Your Goals** (Optional)
   - Enter desired shield capacity (HP)
   - Enter desired recharge rate (HP/s)
   - Leave blank to maximize based on strategy

2. **Choose Optimization Strategy**
   - CPU-Efficiency: Best for limited CPU builds
   - Max Balanced: Best for general use
   - Max Capacity: Best for tank builds
   - Max Recharge: Best for sustained combat

3. **Apply Constraints** (Optional)
   - Set CPU/Power limits
   - Restrict generator types
   - Limit extender quantities
   - Control reactor usage

4. **Include Existing Components** (Optional)
   - Add shield blocks you already have
   - Include shield technicians for bonuses

5. **Click "Optimize Configuration"**
   - View results with performance stats
   - See required components list
   - Export or edit in Shield Explorer

### Using the Shield Explorer

1. **Select a Shield Generator**
   - Choose from Compact, Standard, or Advanced
   - This enables other component selections

2. **Add Power Sources**
   - Fusion Reactors: High recharge bonus, high CPU cost
   - Power Generators: Pure power generation, no recharge bonus

3. **Fine-tune with Extenders**
   - Capacitors: Increase capacity, decrease recharge
   - Chargers: Decrease capacity, increase recharge
   - Mix and match within tier limits

4. **Add Blocks and Crew** (Optional)
   - Steel blocks add raw capacity
   - Shield technicians add capacity and recharge

5. **Monitor Performance**
   - Watch the real-time stats update
   - Use the radar chart to visualize balance
   - Check for warnings about invalid configurations

## Technical Details

### Component Database

#### Shield Generators (Choose 1)
| Component | Capacity | Recharge | CPU | Power |
|-----------|----------|----------|-----|-------|
| Compact | 6,000 HP | 300 HP/s | 20,000 | 10,000 W |
| Standard | 12,000 HP | 300 HP/s | 30,000 | 17,500 W |
| Advanced | 24,000 HP | 600 HP/s | 45,000 | 25,000 W |

#### Fusion Reactors (Power + Recharge)
| Component | Recharge Bonus | CPU | Power Generation | Limit |
|-----------|----------------|-----|------------------|-------|
| Small | +250 HP/s | 100,000 | 300,000 W | 4 |
| Large | +1,000 HP/s | 200,000 | 1,000,000 W | 2 |

#### Power Generators (Power Only)
| Component | CPU | Power Generation |
|-----------|-----|------------------|
| Improved Large | 25,000 | 25,000 W |
| Advanced Large | 50,000 | 100,000 W |

#### Shield Extenders
| Tier | Type | Capacity | Recharge | CPU | Power | Limit |
|------|------|----------|----------|-----|-------|-------|
| Advanced | Capacitor | +32,000 HP | -600 HP/s | 18,000 | 16,000 W | 4 |
| Advanced | Charger | -16,000 HP | +1,200 HP/s | 18,000 | 16,000 W | 4 |
| Improved | Capacitor | +16,000 HP | -300 HP/s | 12,000 | 8,000 W | 6 |
| Improved | Charger | -8,000 HP | +600 HP/s | 12,000 | 8,000 W | 6 |
| Basic | Capacitor | +8,000 HP | -150 HP/s | 8,000 | 4,000 W | 8 |
| Basic | Charger | -4,000 HP | +300 HP/s | 8,000 | 4,000 W | 8 |

### Optimization Engine

The utility uses a sophisticated multi-stage optimization system:
1. **Pre-calculated database**: Over 1 million valid configurations
2. **Fast filtering**: Constraint-based elimination
3. **Strategy selection**: Optimized for different playstyles
4. **Real-time validation**: Ensures all configurations are viable

### Power System Rules
- All configurations must be self-sufficient (no external power required)
- Power generators must utilize at least 50% of their output
- Fusion reactors bypass utilization requirements

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/shield-utility.git
   ```

2. Open `index.html` in your web browser

3. No build process or dependencies required!

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile: Responsive design for tablets

## Development

The utility is built with vanilla JavaScript and uses:
- Bulma CSS for styling
- Chart.js for performance visualization
- No build tools or transpilation needed

### File Structure
```
shield-utility/
├── index.html          # Main application
├── css/styles.css      # Custom styling
├── js/
│   ├── app.js         # Application initialization
│   ├── data.js        # Component database
│   ├── calculator.js  # Core calculations
│   ├── optimizer.js   # Optimization engine
│   └── ui.js          # User interface logic
└── images/            # Component icons
```

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - See LICENSE file for details

## Acknowledgments

Created for the space engineering community to solve the complex shield optimization problem with an easy-to-use tool.

---

**Note**: This is an unofficial tool and is not affiliated with the game developers.