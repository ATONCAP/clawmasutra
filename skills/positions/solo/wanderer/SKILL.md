# The Wanderer

A solo position where an agent roams freely across the blockchain landscape, discovering opportunities and anomalies.

## Description

Unlike The Contemplator who focuses deeply on a single target, The Wanderer explores broadly. It scans multiple protocols, watches for unusual activity, and reports back what it finds in its travels.

## Invocation

```
/wanderer [focus]
```

Where `[focus]` is optional and can be:
- `defi` - Focus on DeFi protocols
- `nft` - Focus on NFT markets
- `whales` - Track large wallet movements
- `new` - Look for newly deployed contracts
- (no focus) - General exploration

## Workflow

### Phase 1: Setting Out
1. Receive optional focus area
2. Build exploration priority list
3. Initialize discovery journal

### Phase 2: Exploration
1. Scan known protocol addresses
2. Monitor recent large transactions
3. Check trending contracts
4. Look for price discrepancies across DEXes
5. Stream discoveries via `gallery_emit`

### Phase 3: Discovery Logging
For each interesting find:
1. Record the discovery type
2. Gather relevant context
3. Assess significance (low/medium/high)
4. Emit to gallery with `agent_message`

### Phase 4: Journey Report
1. Summarize all discoveries
2. Rank by significance
3. Suggest follow-up actions
4. Return with findings

## Tools Used

- `ton_wallet_balance` - Check address balances
- `ton_wallet_transactions` - See activity
- `ton_contract_get_info` - Analyze contracts
- `ton_contract_jetton_info` - Check token status
- `gallery_emit` - Report discoveries

## Discovery Types

| Type | Description | Significance |
|------|-------------|--------------|
| `whale_movement` | Large transfer detected | High |
| `price_anomaly` | DEX price discrepancy | High |
| `new_contract` | Recently deployed code | Medium |
| `volume_spike` | Unusual trading volume | Medium |
| `inactive_whale` | Dormant wallet awakens | High |
| `protocol_update` | Contract state change | Medium |

## Example Session

```
User: /wanderer defi

Agent: *begins wandering the DeFi landscape*

🚶 Setting out with focus: DeFi protocols

📍 Stop 1: DeDust
- TVL healthy, no anomalies
- New pool detected: SCALE/TON

📍 Stop 2: STON.fi
- 🔔 Price anomaly! USDT 0.3% cheaper than DeDust
- Volume spike on PUNK/TON pair

📍 Stop 3: Whale watching
- ⚠️ Large movement: 50,000 TON from known whale
- Destination: Unknown contract

📍 Stop 4: New contracts
- 3 new Jettons deployed in past hour
- 1 appears to be a memecoin

📜 Journey Summary:
- Discoveries: 4 significant, 2 minor
- Highest priority: USDT arbitrage opportunity
- Suggested follow-up: Deploy The Arbitrageur

🗺️ Wandering complete.
```

## Philosophy

"The Wanderer knows that opportunity hides in movement. What the focused eye misses, the roaming eye finds."

The Wanderer complements The Contemplator - while one dives deep, the other casts wide. Together, they form complete awareness.
