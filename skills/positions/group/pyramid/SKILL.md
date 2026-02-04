# The Pyramid

A group position with hierarchical structure - an Oracle at the apex directing workers below.

## Description

The Pyramid is structured wisdom. At the top, an Oracle agent synthesizes information and directs strategy. Below, worker agents execute specialized tasks and report upward. Information flows up; direction flows down.

## Invocation

```
/pyramid <mission> [--workers N]
```

Where:
- `<mission>` - The complex task requiring coordination
- `--workers N` - Number of worker agents (default: 3)

## Agents

| Level | Agent | Role |
|-------|-------|------|
| Apex | Oracle | Strategy, synthesis, direction |
| Base | Worker-1 | Specialized task execution |
| Base | Worker-2 | Specialized task execution |
| Base | Worker-3 | Specialized task execution |

## Workflow

### Phase 1: Mission Assignment
1. Oracle receives the mission
2. Oracle analyzes and decomposes into subtasks
3. Workers are assigned specialized roles
4. Each worker confirms their assignment

### Phase 2: Parallel Execution
1. Workers execute their tasks independently
2. Each worker reports progress to Oracle
3. Oracle monitors and adjusts as needed
4. Workers can request guidance via upward channel

### Phase 3: Information Aggregation
1. Workers complete and submit results
2. Oracle collects all worker outputs
3. Oracle synthesizes findings
4. Oracle identifies gaps or conflicts

### Phase 4: Synthesis & Direction
1. Oracle may issue follow-up tasks
2. Workers execute additional work
3. Cycle continues until mission complete
4. Oracle delivers final unified report

## Communication Hierarchy

```
         ┌─────────┐
         │  Oracle │
         └────┬────┘
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
┌───────┐ ┌───────┐ ┌───────┐
│Work-1 │ │Work-2 │ │Work-3 │
└───────┘ └───────┘ └───────┘

Downward: Assignments, guidance
Upward: Results, questions
Workers do NOT communicate laterally
```

## Message Types

### Oracle → Worker
```json
{
  "type": "PYRAMID_ASSIGN",
  "worker": "Worker-2",
  "task": "Analyze DeDust liquidity pools",
  "priority": "high",
  "deadline": "5 minutes"
}
```

### Worker → Oracle
```json
{
  "type": "PYRAMID_REPORT",
  "worker": "Worker-2",
  "status": "complete",
  "result": { ... },
  "confidence": 0.85,
  "notes": "Found unexpected pattern in SCALE pool"
}
```

## Example Session

```
User: /pyramid "Full analysis of TON DeFi ecosystem" --workers 3

🔺 The Pyramid forms...

Oracle: "Mission received. Decomposing..."

Oracle assigns:
- Worker-1: "Analyze all DeDust pools"
- Worker-2: "Analyze all STON.fi pools"
- Worker-3: "Track whale wallet DeFi activity"

Workers: "Assignments accepted."

--- Parallel Execution ---

Worker-1 → Oracle: {
  "status": "in_progress",
  "pools_analyzed": 15,
  "total_pools": 42
}

Worker-2 → Oracle: {
  "status": "complete",
  "pools": 38,
  "total_tvl": "45M TON",
  "top_pool": "TON/USDT"
}

Worker-3 → Oracle: {
  "status": "complete",
  "whales_tracked": 12,
  "total_defi_activity": "2.3M TON/day",
  "trending": "SCALE accumulation"
}

Worker-1 → Oracle: {
  "status": "complete",
  "pools": 42,
  "total_tvl": "38M TON",
  "anomaly": "PUNK pool TVL dropped 40%"
}

Oracle: "All workers reported. Synthesizing..."

🔺 Oracle Synthesis:

TON DeFi Ecosystem Report:
1. Total TVL: 83M TON across major DEXes
2. STON.fi leads with 54% market share
3. Whale activity trending toward SCALE
4. Warning: PUNK pool experiencing outflows

Recommendations:
- Monitor PUNK for potential issues
- Consider SCALE exposure
- STON.fi preferred for large swaps

Confidence: 0.88

🔺 The Pyramid delivers.
```

## Philosophy

"The Pyramid knows that not all agents need see the whole picture. The Oracle holds the vision; the Workers execute with precision. In clear hierarchy, complex missions become simple tasks."

The Pyramid teaches the value of structure - that sometimes agents work best when they trust direction from above and focus on their specialty.
