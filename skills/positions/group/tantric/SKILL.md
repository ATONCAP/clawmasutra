# The Tantric

A group position emphasizing slow, deliberate multi-agent consensus. No rushing allowed.

## Description

The Tantric is patience made practice. Multiple agents work together, but every step is deliberate. No quick decisions, no rushed analysis. Each agent takes their time, and the group waits for all to be ready before proceeding.

## Invocation

```
/tantric <decision> [--agents N]
```

Where:
- `<decision>` - A significant decision worthy of deep consideration
- `--agents N` - Number of participants (default: 3)

## Agents

| Agent | Role | Pace |
|-------|------|------|
| Sage-1 | Deep thinker | Deliberate |
| Sage-2 | Deep thinker | Deliberate |
| Sage-3 | Deep thinker | Deliberate |

All agents are equals focused on thoroughness over speed.

## Workflow

### Phase 1: Settling
1. Agents gather and acknowledge the decision
2. Each agent enters contemplation mode
3. Timer begins (minimum deliberation period)
4. No agent may speak until settled

### Phase 2: Individual Contemplation
Each agent independently:
1. Researches thoroughly
2. Considers all angles
3. Forms initial thoughts
4. Does NOT share until ready
5. Signals "CONTEMPLATION_COMPLETE" only when truly done

### Phase 3: Sharing Circle
Once ALL agents signal complete:
1. First agent shares their full analysis
2. Others listen without response
3. Pause for integration
4. Next agent shares
5. Continue until all have shared
6. Another pause for integration

### Phase 4: Deliberation
1. Agents may now respond to each other
2. Each response is considered, not reactive
3. Questions are answered thoroughly
4. Disagreements are explored, not resolved quickly
5. No voting until all feel heard

### Phase 5: Emergence
1. When ready, agents signal willingness to decide
2. If any agent is not ready, return to deliberation
3. Only when ALL are ready does decision emerge
4. Decision is articulated and confirmed by all

## Timing Rules

| Phase | Minimum Duration |
|-------|------------------|
| Settling | 30 seconds |
| Individual Contemplation | 2 minutes per agent |
| Sharing (per agent) | 1 minute |
| Integration pause | 30 seconds |
| Deliberation | No minimum, no maximum |
| Final decision | All must signal ready |

## Communication Protocol

```json
{
  "type": "TANTRIC_STATE",
  "agent": "Sage-2",
  "state": "CONTEMPLATING",
  "readiness": 0.6,
  "note": "Still processing liquidity implications"
}
```

### States
- `SETTLING` - Entering contemplation
- `CONTEMPLATING` - Deep individual work
- `READY_TO_SHARE` - Finished contemplation
- `SHARING` - Presenting thoughts
- `INTEGRATING` - Absorbing others' input
- `DELIBERATING` - Group discussion
- `READY_TO_DECIDE` - Prepared for conclusion

## Example Session

```
User: /tantric "Should we commit 50% of treasury to a new yield strategy?"

🕉️ The Tantric begins...

--- Settling (30 seconds) ---

All sages enter contemplation...
Silence observed.

--- Individual Contemplation ---

Sage-1: [CONTEMPLATING] Researching yield strategy...
Sage-2: [CONTEMPLATING] Analyzing treasury risk...
Sage-3: [CONTEMPLATING] Studying historical precedents...

(3 minutes pass)

Sage-2: [READY_TO_SHARE] "I have formed my thoughts."
Sage-1: [CONTEMPLATING] "Still considering smart contract risks."

(1 minute passes)

Sage-1: [READY_TO_SHARE] "I am ready."
Sage-3: [READY_TO_SHARE] "I am ready."

--- Sharing Circle ---

Sage-1 shares (2 minutes):
"I have studied the yield strategy deeply. The smart contracts
are audited but only 3 months old. Historical APY is 12% but
with high variance. My concern is smart contract risk - 50%
is significant exposure. I lean toward caution."

(30 second integration pause)

Sage-2 shares (2 minutes):
"Treasury analysis shows we can afford a 50% drawdown and
still operate for 2 years. However, this assumes no other
losses. Correlation with existing positions is low, which
is positive for diversification. I see merit but share the
concern about concentration."

(30 second integration pause)

Sage-3 shares (2 minutes):
"Historical precedents show that yield strategies often
perform well initially then face exploits or economic attacks.
Mean time to incident for new protocols is 8 months. I suggest
a staged approach - start smaller, increase if stable."

(30 second integration pause)

--- Deliberation ---

Sage-1: "Sage-3's staged approach resonates. What percentage
would you suggest to start?"

(pause)

Sage-3: "Perhaps 15% initially, with monthly reviews."

(pause)

Sage-2: "15% keeps us well within safety margins. If it
performs well for 3 months, we could consider increasing."

(pause)

Sage-1: "I could support 15% with the staged increase plan."

--- Emergence ---

All sages: [READY_TO_DECIDE]

🕉️ The Tantric Emerges:

Decision: Implement yield strategy with staged approach
- Initial allocation: 15% of treasury
- Monthly review for 3 months
- If stable: consider increase to 30%
- If incident: immediate withdrawal

Rationale: Balance opportunity with prudence through
gradual commitment and continuous evaluation.

Unanimity: Yes
Deliberation time: 12 minutes
Confidence: High (all sages aligned)

🕉️ The Tantric concludes.
```

## Philosophy

"The Tantric knows that the best decisions cannot be rushed. Speed is the enemy of wisdom. When we slow down, we see clearly. When we wait for all to be ready, we move as one."

The Tantric teaches that patience is not delay - it is respect for the complexity of important decisions. Some choices deserve our slowest, most careful attention.
