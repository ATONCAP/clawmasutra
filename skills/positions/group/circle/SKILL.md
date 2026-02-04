# The Circle

A group position where multiple agents form a round-robin consensus, each contributing their perspective before a collective decision.

## Description

The Circle gathers agents as equals. No hierarchy, no leader - just voices taking turns. Each agent speaks once per round, and only when all have spoken does the circle consider moving forward. Consensus emerges through patience.

## Invocation

```
/circle <decision> [--agents N]
```

Where:
- `<decision>` - The question requiring collective wisdom
- `--agents N` - Number of agents in the circle (default: 3)

## Agents

All agents are equal participants with rotating speaking order:

| Position | Current Speaker | State |
|----------|-----------------|-------|
| 1 | Active | Speaking |
| 2 | Waiting | Listening |
| 3 | Waiting | Listening |
| ... | ... | ... |

## Workflow

### Phase 1: Gathering
1. Agents join the circle
2. Speaking order established (random or by join time)
3. Question is presented to all
4. Moment of silence before beginning

### Phase 2: Round Robin
For each round:
1. Current speaker shares their perspective
2. Others listen without interruption
3. Speaker signals completion
4. Token passes to next agent
5. Continue until all have spoken
6. Emit round summary to gallery

### Phase 3: Synthesis
After each round:
1. Tally agreements and disagreements
2. Identify common themes
3. Note unique insights
4. Determine if consensus possible

### Phase 4: Resolution
If consensus:
- Circle formulates unified position
- All agents confirm acceptance

If no consensus:
- Begin another round with refined focus
- Or declare the split and present options

## Communication Protocol

```json
{
  "type": "CIRCLE_SPEAK",
  "round": 2,
  "speaker": "Agent-C",
  "position": 3,
  "statement": "I believe we should...",
  "vote": "approve",
  "confidence": 0.8,
  "passingToken": true
}
```

## Circle Rules

1. **One voice at a time** - Only the token holder speaks
2. **Equal time** - Each agent gets similar speaking time
3. **No interruption** - Others listen fully before responding
4. **Full rounds** - Must complete the circle before decisions
5. **Transparent votes** - All positions visible to all

## Example Session

```
User: /circle "Should we add SCALE to our treasury?" --agents 3

⭕ The Circle gathers...

Agent-A, Agent-B, Agent-C take their positions.
Question presented: "Should we add SCALE to our treasury?"

--- Round 1 ---

Agent-A (speaks):
"I support adding SCALE. Strong fundamentals:
- 50% growth in 30 days
- Active development team
- Unique use case in gaming
Vote: APPROVE (confidence: 0.75)"

Agent-B (speaks):
"I'm cautious. Concerns:
- Low liquidity depth
- No audit published
- Team is anonymous
Vote: ABSTAIN (confidence: 0.6)"

Agent-C (speaks):
"I support with conditions:
- Only if we can verify audit
- Maximum 5% of treasury
Vote: CONDITIONAL (confidence: 0.7)"

⭕ Round 1 Complete
- APPROVE: 1
- ABSTAIN: 1
- CONDITIONAL: 1
- Consensus: NOT REACHED

--- Round 2 (focused on conditions) ---

Agent-A: "I accept the 5% limit and audit requirement."
Agent-B: "If audit passes, I change to APPROVE."
Agent-C: "Confirmed: 5% max, audit required."

⭕ Round 2 Complete
- CONDITIONAL APPROVE: 3
- Consensus: REACHED

📜 Circle Decision:
Add SCALE to treasury with conditions:
1. Audit must be verified first
2. Maximum allocation: 5% of treasury
3. Review position in 30 days

Confidence: 0.72 (average)
Unanimity: Yes (conditional)

⭕ The Circle closes.
```

## Philosophy

"In The Circle, every voice matters equally. There is no head, no tail - only the continuous flow of perspectives. Wisdom emerges not from authority, but from the patience to hear all sides."

The Circle teaches that consensus is not compromise - it's the emergence of collective truth that no single agent could have found alone.
