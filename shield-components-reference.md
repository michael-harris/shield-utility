# Shield Components Reference Guide

## Blocks

| Type                 | Capacity |
| -------------------- | -------- |
| Steel Block          | 1        |
| Hardened Steel Block | 2        |
| Combat Steel Block   | 4        |
| XenoSteel Block      | 7        |

## Base Components

### Shield Generator (Limit: 1 Total)

| Component                 | Capacity | Recharge | Power Usage | CPU Cost | Size  |
| ------------------------- | -------- | -------- | ----------- | -------- | ----- |
| Compact Shield Generator  | 6,000    | 300/s    | 10,000      | 20,000   | 1x2x3 |
| Shield Generator          | 12,000   | 300/s    | 17,500      | 30,000   | 3x3x3 |
| Advanced Shield Generator | 24,000   | 600/s    | 25,000      | 45,000   | 3x3x3 |

### Generators

| Component                | Limit    | Recharge | Power Output | CPU Cost | Size  |
| ------------------------ | -------- | -------- | ------------ | -------- | ----- |
| Basic Large Generator    | None     | 0        | 10,000       | 12,500   | 1x1x2 |
| Improved Large Generator | No Limit | 0        | 25,000       | 25,000   | 1x1x3 |
| Advanced Large Generator | No Limit | 0        | 100,000      | 50,000   | 2x2x6 |
| Small Fusion Reactor     | 4        | +250/s   | 300,000      | 100,000  | 3x3x3 |
| Large Fusion Reactor     | 2        | +1000/s  | 1,000,000    | 200,000  | 5x5x5 |

## Shield Extenders

### Basic Extenders (Limit: 8 total)

| Component       | Capacity | Recharge | Power Usage | CPU Cost | Efficiency              | Size  |
| --------------- | -------- | -------- | ----------- | -------- | ----------------------- | ----- |
| Basic Capacitor | +8,000   | -150/s   | 4,000       | 8,000    | 1.0 capacity per CPU    | 1x1x2 |
| Basic Charger   | -4,000   | +300/s   | 4,000       | 8,000    | 0.0375 recharge per CPU | 1x1x2 |

### Improved Extenders (Limit: 6 total)

| Component          | Capacity | Recharge | Power Usage | CPU Cost | Efficiency            | Size  |
| ------------------ | -------- | -------- | ----------- | -------- | --------------------- | ----- |
| Improved Capacitor | +16,000  | -300/s   | 8,000       | 12,000   | 1.33 capacity per CPU | 2x2x3 |
| Improved Charger   | -8,000   | +600/s   | 8,000       | 12,000   | 0.05 recharge per CPU | 2x2x3 |

### Advanced Extenders (Limit: 4 total)

| Component          | Capacity | Recharge | Power Usage | CPU Cost | Efficiency             | Size  |
| ------------------ | -------- | -------- | ----------- | -------- | ---------------------- | ----- |
| Advanced Capacitor | +32,000  | -600/s   | 16,000      | 18,000   | 1.78 capacity per CPU  | 3x3x4 |
| Advanced Charger   | -16,000  | +1,200/s | 16,000      | 18,000   | 0.067 recharge per CPU | 3x3x4 |

## Module Limits Summary

| Tier      | Maximum Modules | Types                          |
| --------- | --------------- | ------------------------------ |
| Basic     | 8               | Capacitors + Chargers combined |
| Improved  | 6               | Capacitors + Chargers combined |
| Advanced  | 4               | Capacitors + Chargers combined |
| **Total** | **18**          | All extenders combined         |

## Key Insights

### CPU Efficiency Rankings

**For Capacity (CPU per 1,000 capacity):**

1. Advanced Capacitor: 562.5 CPU
2. Improved Capacitor: 750 CPU
3. Basic Capacitor: 1,000 CPU

**For Recharge (CPU per 100/s recharge):**

1. Advanced Charger: 1,500 CPU
2. Improved Charger: 2,000 CPU
3. Basic Charger: 2,667 CPU

### Trade-offs

- Capacitors increase shield capacity but reduce recharge rate
- Chargers increase recharge rate but reduce shield capacity
- Higher tier extenders are more CPU-efficient but have stricter limits
- Fusion Reactor provides "free" recharge with no capacity penalty, but costs 50,000 CPU

### Special Notes

- There's a mentioned "+8,000 bonus capacity" from an unexplained source in one configuration
- All configurations assume one Shield Generator as the base
- Multiple fusion reactors can be equipped