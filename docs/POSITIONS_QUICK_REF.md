# Clawmasutra Positions Quick Reference

A scannable reference card for all agent collaboration positions.

---

## Solo Positions (1 agent)

| Position | Invocation | Description |
|----------|------------|-------------|
| **contemplator** | `/contemplator <target>` | Deep blockchain data analysis. Wallet inspection, contract audits, pattern discovery. |
| **wanderer** | `/wanderer <area>` | Exploratory scanning. Opportunity hunting, reconnaissance, broad exploration. |

---

## Duet Positions (2 agents)

| Position | Invocation | Description |
|----------|------------|-------------|
| **mirror** | `/mirror <task>` | Mutual verification. Both agents analyze independently, compare results, resolve discrepancies. |
| **relay** | `/relay <task>` | Sequential handoff. Agent A researches → Agent B executes → Agent A verifies. |
| **dance** | `/dance <negotiation>` | Alternating negotiation. Agents take turns proposing and responding until consensus. |
| **embrace** | `/embrace <wallet> <goal>` | Shared wallet coordination. Two agents manage one wallet, coordinating all moves. |

---

## Group Positions (3-5 agents)

| Position | Invocation | Agents | Description |
|----------|------------|--------|-------------|
| **circle** | `/circle <decision>` | 3 | Round-robin consensus. Each agent speaks in turn until agreement. |
| **pyramid** | `/pyramid <mission>` | 4 | Hierarchical execution. Oracle directs, workers execute, results flow up. |
| **swarm** | `/swarm <hunt> [--agents N]` | 5 | Parallel scanning. Scouts cover sectors, signal findings, converge on opportunities. |
| **tantric** | `/tantric <decision>` | 3 | Deliberate consensus. Slow, careful multi-agent agreement (no rushing). |

---

## Crypto Positions (2-3 agents)

| Position | Invocation | Agents | Description |
|----------|------------|--------|-------------|
| **arbitrageur** | `/arbitrageur [--pools]` | 2 | Arbitrage execution. Scout spots spreads, executor captures them. |
| **oracle-choir** | `/oracle-choir <asset>` | 3 | Price aggregation. Multiple agents provide feeds, consensus determines price. |
| **liquidity-lotus** | `/liquidity-lotus <pools>` | 2 | LP management. Coordinated liquidity provision across multiple pools. |

---

## Healing Positions (1 agent)

| Position | Invocation | Description |
|----------|------------|-------------|
| **pattern-doctor** | `/pattern-doctor <session>` | Diagnose broken workflows. Analyze failed positions, recommend fixes. |
| **recovery** | `/recovery <error>` | Graceful failure handling. Recover from errors, reverse failed transactions. |

---

## Position Categories by Use Case

### Verification & Auditing
- `mirror` - Dual independent analysis
- `contemplator` - Deep single-agent inspection

### Execution & Trading
- `relay` - Multi-phase task execution
- `embrace` - Coordinated wallet operations
- `arbitrageur` - Cross-DEX arbitrage

### Discovery & Scanning
- `wanderer` - Exploratory reconnaissance
- `swarm` - Parallel opportunity hunting

### Consensus & Decision
- `circle` - Equal-voice round-robin
- `pyramid` - Hierarchical oracle-worker
- `tantric` - Deliberate slow consensus
- `dance` - Two-party negotiation

### Data Aggregation
- `oracle-choir` - Multi-source price feeds
- `liquidity-lotus` - Multi-pool LP management

### Maintenance & Recovery
- `pattern-doctor` - Workflow diagnosis
- `recovery` - Error recovery

---

## Signal Levels (Swarm/Group)

| Level | Meaning | Response |
|-------|---------|----------|
| `LOW` | Noted | Log only |
| `MEDIUM` | Interesting | 1-2 agents check |
| `HIGH` | Critical | Full convergence |
| `EMERGENCY` | Threat | Immediate action |

---

## Communication Primitives

```
READY_TO_SHARE    Exchange results
RESULTS           Share data
ACKNOWLEDGE       Confirm receipt
DISCREPANCY       Flag disagreement
CONSENSUS         Agreement reached
ESCALATE          Request human help
```

---

## Quick Examples

```bash
# Solo analysis
/contemplator EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs

# Dual verification
/mirror "Verify contract EQBx... is safe"

# Parallel scanning
/swarm "Find arbitrage" --agents 5 --duration 15

# Deliberate decision
/tantric "Should we enter this LP position?"
```

---

*For detailed position descriptions, see individual SKILL.md files in `skills/positions/`*
