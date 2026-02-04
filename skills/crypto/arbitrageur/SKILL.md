# The Arbitrageur

A crypto-specific position where agents hunt for and execute cross-DEX arbitrage opportunities.

## Description

The Arbitrageur is profit in motion. Two agents work in concert - one watching for price discrepancies, one ready to execute. When opportunity appears, they move fast but carefully, capturing value from market inefficiencies.

## Invocation

```
/arbitrageur [--pairs "TON/USDT,SCALE/TON"] [--min-spread 0.5] [--max-size 1000]
```

Options:
- `--pairs` - Trading pairs to monitor (default: all major pairs)
- `--min-spread` - Minimum spread % to act on (default: 0.5%)
- `--max-size` - Maximum trade size in TON (default: 1000)

## Agents

| Agent | Role | Focus |
|-------|------|-------|
| Watcher | Price Monitor | Continuous DEX scanning |
| Striker | Executor | Fast, precise trade execution |

## Workflow

### Phase 1: Calibration
1. Watcher connects to all DEX price feeds
2. Striker prepares transaction templates
3. Both verify wallet balances
4. Minimum spread threshold confirmed

### Phase 2: Watching
Watcher continuously:
1. Fetches prices from DeDust, STON.fi, Megaton
2. Calculates spreads for each pair
3. Accounts for gas and slippage
4. When profitable spread found → Signal Striker

### Phase 3: Validation
When Watcher signals:
1. Striker re-verifies prices (they can change fast)
2. Calculates exact trade sizes
3. Simulates the trade
4. If still profitable → Execute
5. If not → Return to watching

### Phase 4: Execution
1. Striker executes buy on cheaper DEX
2. Striker executes sell on expensive DEX
3. Both transactions must succeed
4. Report result to Watcher and gallery

### Phase 5: Accounting
1. Calculate actual profit/loss
2. Update statistics
3. Adjust thresholds if needed
4. Return to watching

## Signal Protocol

### Watcher → Striker
```json
{
  "type": "ARB_OPPORTUNITY",
  "pair": "SCALE/TON",
  "buy": {
    "dex": "DeDust",
    "price": 0.0450,
    "depth": 10000
  },
  "sell": {
    "dex": "STON.fi",
    "price": 0.0462,
    "depth": 8000
  },
  "spread": 2.67,
  "netSpread": 2.17,
  "maxSize": 800,
  "expires": "2024-01-15T10:30:45Z"
}
```

### Striker → Watcher
```json
{
  "type": "ARB_RESULT",
  "success": true,
  "pair": "SCALE/TON",
  "bought": { "amount": 500, "price": 0.0451 },
  "sold": { "amount": 500, "price": 0.0460 },
  "grossProfit": 0.45,
  "fees": 0.12,
  "netProfit": 0.33,
  "profitPercent": 1.98
}
```

## Risk Management

| Check | Threshold | Action if Exceeded |
|-------|-----------|-------------------|
| Spread too small | < min-spread | Skip |
| Trade too large | > max-size | Reduce size |
| Slippage too high | > 1% | Skip |
| Liquidity too low | < trade size | Reduce size |
| Price stale | > 5 seconds | Re-fetch |

## Tools Used

- `ton_wallet_balance` - Check available funds
- `ton_wallet_send` - Execute swaps
- `ton_contract_call_getter` - Read DEX prices
- `sessions_send` - Agent communication
- `gallery_emit` - Report activity

## Example Session

```
User: /arbitrageur --pairs "SCALE/TON" --min-spread 1.0 --max-size 500

💹 The Arbitrageur awakens...

Watcher: "Monitoring SCALE/TON across 3 DEXes"
Striker: "Ready. Max trade: 500 TON"

--- Watching Phase ---

Watcher: [10:30:01] DeDust: 0.0450 | STON.fi: 0.0452 | Megaton: 0.0449
         Spread: 0.67% (below threshold)

Watcher: [10:30:15] DeDust: 0.0448 | STON.fi: 0.0455 | Megaton: 0.0450
         Spread: 1.56% ✓

Watcher → Striker: {
  "type": "ARB_OPPORTUNITY",
  "spread": 1.56,
  "netSpread": 1.06,
  "buy": { "dex": "DeDust", "price": 0.0448 },
  "sell": { "dex": "STON.fi", "price": 0.0455 }
}

Striker: "Validating..."
Striker: "Prices confirmed. Executing 400 TON trade..."

Striker: BUY 8928 SCALE @ 0.0448 on DeDust ✓
Striker: SELL 8928 SCALE @ 0.0454 on STON.fi ✓

Striker → Watcher: {
  "success": true,
  "netProfit": "0.42 TON",
  "profitPercent": 1.05
}

Gallery: "Arbitrage executed: +0.42 TON (1.05%)"

--- Back to Watching ---

Watcher: [10:30:45] Spread normalized to 0.4%
Watcher: "Continuing surveillance..."

--- Session Statistics ---

📊 Arbitrageur Stats:
- Runtime: 15 minutes
- Opportunities spotted: 3
- Opportunities executed: 1
- Skipped (below threshold): 2
- Total profit: 0.42 TON
- Success rate: 100%

💹 The Arbitrageur rests.
```

## Philosophy

"The Arbitrageur knows that markets are imperfect, and in imperfection lies opportunity. Not through luck, but through vigilance. Not through greed, but through precision."

The Arbitrageur teaches that profit in crypto comes to those who watch carefully and act decisively - never rushing, never hesitating when the moment is right.
