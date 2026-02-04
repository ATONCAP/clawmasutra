# The Swarm

A group position where many agents work in parallel, scanning broadly and signaling discoveries.

## Description

The Swarm is distributed intelligence. Many agents spread across the blockchain landscape, each watching their sector. When one finds something, they signal - and the swarm converges or continues based on the finding's significance.

## Invocation

```
/swarm <hunt> [--agents N] [--duration M]
```

Where:
- `<hunt>` - What the swarm is looking for
- `--agents N` - Swarm size (default: 5)
- `--duration M` - Hunt duration in minutes (default: 10)

## Agents

All agents are autonomous scouts with equal status:

| Agent | Sector | State |
|-------|--------|-------|
| Scout-1 | DEX pools | Scanning |
| Scout-2 | Whale wallets | Scanning |
| Scout-3 | New contracts | Scanning |
| Scout-4 | Price feeds | Scanning |
| Scout-5 | Social signals | Scanning |

## Workflow

### Phase 1: Dispersal
1. Hunt objective distributed to all scouts
2. Each scout assigned a sector
3. Scouts spread out and begin scanning
4. Communication channel established

### Phase 2: Scanning
Each scout independently:
1. Monitors their sector continuously
2. Applies hunt criteria to findings
3. Classifies discoveries by significance
4. Signals significant finds to swarm

### Phase 3: Signaling
When a scout finds something:

**Low signal** (FYI):
- Scout notes it in gallery
- Other scouts continue scanning

**Medium signal** (Interesting):
- Scout broadcasts to swarm
- 1-2 nearby scouts may investigate
- Others continue scanning

**High signal** (Converge):
- Scout broadcasts urgent alert
- All scouts pause and evaluate
- Swarm decides: converge or continue

### Phase 4: Convergence (if triggered)
1. All scouts focus on the high-signal finding
2. Each brings their sector expertise
3. Collaborative deep analysis
4. Decision made collectively
5. Swarm either acts or returns to scanning

## Signal Protocol

```json
{
  "type": "SWARM_SIGNAL",
  "scout": "Scout-3",
  "sector": "new_contracts",
  "level": "HIGH",
  "finding": {
    "type": "suspicious_contract",
    "address": "EQ...",
    "reason": "Honeypot pattern detected",
    "urgency": "immediate"
  },
  "action": "CONVERGE"
}
```

## Signal Levels

| Level | Meaning | Swarm Response |
|-------|---------|----------------|
| LOW | Noted | Log only |
| MEDIUM | Interesting | 1-2 scouts check |
| HIGH | Critical | Full convergence |
| EMERGENCY | Threat | Immediate action |

## Example Session

```
User: /swarm "Find arbitrage opportunities" --agents 5 --duration 15

🐝 The Swarm disperses...

Scout-1 → DeDust pools
Scout-2 → STON.fi pools
Scout-3 → Megaton pools
Scout-4 → Cross-DEX prices
Scout-5 → Large pending transactions

--- Scanning Phase ---

Scout-1: [LOW] Normal activity on DeDust
Scout-2: [LOW] STON.fi pools stable
Scout-4: [MEDIUM] "USDT price variance: DeDust 5.23, STON.fi 5.28"
  → Scout-1 checking DeDust USDT depth
  → Scout-2 checking STON.fi USDT depth

Scout-1: "DeDust USDT depth: 500K TON"
Scout-2: "STON.fi USDT depth: 300K TON"
Scout-4: "Arb opportunity: 0.95% spread, sufficient depth"

Scout-3: [LOW] 2 new Jettons, both low liquidity
Scout-5: [MEDIUM] "Whale preparing 10K TON swap"

Scout-4: [HIGH] "SCALE price divergence: 2.3% spread detected!"
  🐝 SWARM CONVERGES 🐝

All scouts analyzing SCALE:
- Scout-1: "DeDust SCALE: 0.045 TON"
- Scout-2: "STON.fi SCALE: 0.046 TON"
- Scout-3: "Contract verified, not honeypot"
- Scout-4: "Spread: 2.2%, depth sufficient for 500 TON"
- Scout-5: "No whale activity on SCALE"

Swarm Decision: EXECUTE ARB
- Buy on DeDust at 0.045
- Sell on STON.fi at 0.046
- Expected profit: ~2% minus fees

--- Execution ---

Scout-4 executes arbitrage...
Result: 1.7% profit realized

🐝 Swarm returns to scanning...

--- Session End ---

📜 Swarm Report:
- Duration: 15 minutes
- Signals: 3 LOW, 2 MEDIUM, 1 HIGH
- Convergences: 1
- Actions taken: 1 arbitrage
- Profit: 1.7% (8.5 TON on 500 TON)

🐝 The Swarm rests.
```

## Philosophy

"The Swarm knows that many eyes see more than one. Spread wide, signal fast, converge when it matters. In distributed watching, nothing escapes notice."

The Swarm teaches that some problems require breadth over depth - that scanning the entire landscape catches opportunities that focused analysis would miss.
