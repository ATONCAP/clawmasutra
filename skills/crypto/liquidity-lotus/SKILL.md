# The Liquidity Lotus

A crypto-specific position for coordinated liquidity provision management across multiple pools.

## Description

The Liquidity Lotus blooms across many pools. Two agents work together to optimize liquidity positions - one monitoring performance and opportunities, one executing rebalances. They tend the garden of liquidity with care.

## Invocation

```
/liquidity-lotus <strategy> [--pools "..."] [--rebalance-threshold 5]
```

Where:
- `<strategy>` - LP strategy ("balanced", "yield-max", "stable-focus")
- `--pools` - Specific pools to manage (default: auto-select)
- `--rebalance-threshold` - % deviation before rebalance (default: 5%)

## Agents

| Agent | Role | Focus |
|-------|------|-------|
| Gardener | Monitor & Strategy | Pool health, yields, rebalance signals |
| Cultivator | Execution | Add/remove liquidity, harvest rewards |

## Workflow

### Phase 1: Survey
1. Gardener maps all current LP positions
2. Cultivator verifies wallet permissions
3. Current yields and APYs calculated
4. Initial portfolio snapshot taken

### Phase 2: Monitoring
Gardener continuously watches:
1. Pool TVLs and your share
2. Impermanent loss calculations
3. Reward accumulation rates
4. Price movements affecting positions
5. New pool opportunities

### Phase 3: Analysis
When threshold triggered or opportunity found:
1. Gardener calculates optimal rebalance
2. Considers gas costs vs. benefit
3. Simulates the moves
4. If beneficial → Signal Cultivator

### Phase 4: Cultivation
1. Cultivator receives rebalance plan
2. Harvests pending rewards first
3. Removes liquidity from underperforming pools
4. Adds liquidity to target pools
5. Reports completion to Gardener

### Phase 5: Bloom Report
1. Compare before/after positions
2. Calculate realized gains/losses
3. Project new yields
4. Update portfolio snapshot

## Strategy Profiles

### Balanced
- Diversify across 3-5 pools
- Mix of stable and volatile pairs
- Target: Steady yield with moderate IL risk

### Yield-Max
- Focus on highest APY pools
- Accept higher IL risk
- Frequent rebalancing
- Target: Maximum short-term returns

### Stable-Focus
- Primarily stablecoin pairs
- Minimal IL exposure
- Less frequent rebalancing
- Target: Consistent, low-risk yield

## Signal Protocol

### Gardener → Cultivator
```json
{
  "type": "LOTUS_REBALANCE",
  "reason": "SCALE/TON APY dropped 40%",
  "actions": [
    {
      "action": "HARVEST",
      "pool": "DeDust:SCALE/TON",
      "rewards": "12.5 SCALE"
    },
    {
      "action": "REMOVE",
      "pool": "DeDust:SCALE/TON",
      "amount": "100%"
    },
    {
      "action": "ADD",
      "pool": "STON.fi:TON/USDT",
      "amount": "500 TON equivalent"
    }
  ],
  "expectedImprovement": "+3.2% APY"
}
```

### Cultivator → Gardener
```json
{
  "type": "LOTUS_EXECUTED",
  "actions_completed": 3,
  "harvested": "12.5 SCALE",
  "removed": "1000 TON value",
  "added": "980 TON value",
  "fees_paid": "2.1 TON",
  "new_positions": [
    { "pool": "STON.fi:TON/USDT", "value": "980 TON", "apy": "18.5%" }
  ]
}
```

## Metrics Tracked

| Metric | Description |
|--------|-------------|
| Total Value | Sum of all LP positions |
| Net APY | Weighted average yield |
| IL Exposure | Current impermanent loss |
| Rewards Pending | Unharvested rewards |
| Pool Diversity | Number of active pools |
| Rebalance Count | Actions this session |

## Example Session

```
User: /liquidity-lotus "balanced" --rebalance-threshold 5

🪷 The Liquidity Lotus unfolds...

Gardener: "Surveying positions..."

Current Portfolio:
┌─────────────────┬───────────┬────────┬──────────┐
│ Pool            │ Value     │ APY    │ IL       │
├─────────────────┼───────────┼────────┼──────────┤
│ DeDust:TON/USDT │ 1000 TON  │ 15.2%  │ -0.8%    │
│ DeDust:SCALE/TON│ 500 TON   │ 45.0%  │ -3.2%    │
│ STON.fi:PUNK/TON│ 300 TON   │ 62.0%  │ -8.1%    │
└─────────────────┴───────────┴────────┴──────────┘

Net APY: 28.4%
Total IL: -2.9%
Effective APY: 25.5%

--- Monitoring Phase ---

Gardener: [14:00] All pools stable
Gardener: [14:30] PUNK/TON APY dropped to 35%
Gardener: [14:30] IL on PUNK/TON increased to -12%

⚠️ PUNK/TON position needs attention

Gardener: "Analyzing rebalance options..."
- Option A: Exit PUNK/TON → TON/USDT (+3% APY, -10% IL)
- Option B: Exit PUNK/TON → SCALE/TON (+8% APY, but more IL risk)
- Option C: Hold and harvest (current IL may recover)

Gardener: "Recommending Option A - aligns with balanced strategy"

Gardener → Cultivator: {
  "type": "LOTUS_REBALANCE",
  "actions": [
    { "action": "HARVEST", "pool": "STON.fi:PUNK/TON" },
    { "action": "REMOVE", "pool": "STON.fi:PUNK/TON", "amount": "100%" },
    { "action": "ADD", "pool": "DeDust:TON/USDT", "amount": "all" }
  ]
}

Cultivator: "Executing rebalance..."
Cultivator: ✓ Harvested 45 PUNK tokens
Cultivator: ✓ Removed 276 TON value (IL realized: -24 TON)
Cultivator: ✓ Added 274 TON to TON/USDT pool

--- Post-Rebalance ---

New Portfolio:
┌─────────────────┬───────────┬────────┬──────────┐
│ Pool            │ Value     │ APY    │ IL       │
├─────────────────┼───────────┼────────┼──────────┤
│ DeDust:TON/USDT │ 1274 TON  │ 15.2%  │ -0.6%    │
│ DeDust:SCALE/TON│ 500 TON   │ 45.0%  │ -3.2%    │
└─────────────────┴───────────┴────────┴──────────┘

Net APY: 25.8%
Total IL: -1.5%
Effective APY: 24.3%

📊 Rebalance Summary:
- Exited high-IL position
- Reduced risk exposure
- Slight APY decrease (-1.2%) but much healthier IL (-1.4%)
- Harvested 45 PUNK (bonus)

🪷 The Lotus continues blooming...
```

## Philosophy

"The Liquidity Lotus knows that yield farming is gardening, not hunting. We tend our positions with patience, prune when needed, and harvest at the right time. Growth comes from attention, not aggression."

The Liquidity Lotus teaches that LP management is an ongoing relationship with your positions - not set-and-forget, but continuous care and optimization.
