# The Dance

A duet position where two agents engage in alternating negotiation, each move responding to the other.

## Description

The Dance is the art of negotiation made visible. Two agents with different perspectives engage in a structured dialogue, taking turns to propose, counter, and refine until they reach harmony or agree to disagree.

## Invocation

```
/dance <topic> [--perspective-a "..."] [--perspective-b "..."]
```

Where `<topic>` is a decision requiring negotiation:
- "Should we invest in Jetton X?"
- "What's the optimal portfolio allocation?"
- "Which DEX should be our primary?"

## Agents

| Agent | Role | Starting Position |
|-------|------|-------------------|
| Agent A (Lead) | Opens, proposes | Optimistic / Risk-tolerant |
| Agent B (Follow) | Responds, counters | Cautious / Risk-averse |

## Workflow

### Phase 1: Opening Positions
1. Each agent establishes their initial stance
2. Positions are shared via `sessions_send`
3. Both emit their positions to gallery

### Phase 2: The Dance
Alternating rounds:

**Round N (Lead's turn):**
1. Lead makes a proposal or refinement
2. Lead explains reasoning
3. Follow receives and considers

**Round N+1 (Follow's turn):**
1. Follow responds (accept/counter/reject)
2. Follow explains reasoning
3. Lead receives and considers

Continue until:
- Consensus reached
- Max rounds exceeded
- Impasse declared

### Phase 3: Resolution
1. Summarize points of agreement
2. Summarize points of disagreement
3. If consensus: formulate joint recommendation
4. If impasse: present both perspectives for human decision

## Dance Moves

| Move | Symbol | Meaning |
|------|--------|---------|
| PROPOSE | 💃 | New idea or position |
| ACCEPT | 🤝 | Full agreement |
| COUNTER | 🔄 | Alternative proposal |
| REFINE | ✨ | Slight modification |
| CHALLENGE | ⚔️ | Request justification |
| CONCEDE | 🏳️ | Give ground |
| IMPASSE | 🚫 | Cannot agree |

## Communication Protocol

```json
{
  "type": "DANCE_MOVE",
  "round": 3,
  "agent": "A",
  "move": "COUNTER",
  "position": "We should allocate 60% to stables, not 40%",
  "reasoning": "Market volatility requires more safety",
  "confidence": 0.75
}
```

## Example Session

```
User: /dance "Should we invest 1000 TON in SCALE token?"

🎭 The Dance begins...

Round 1 - Lead (💃 PROPOSE):
"We should invest 1000 TON in SCALE. The token has shown
consistent growth, strong community, and unique utility."
Confidence: 0.8

Round 2 - Follow (🔄 COUNTER):
"I propose only 300 TON. While growth is promising, the
token is only 2 months old. Limited track record."
Confidence: 0.7

Round 3 - Lead (✨ REFINE):
"Let's meet at 500 TON with a stop-loss at -20%.
This balances opportunity with risk management."
Confidence: 0.75

Round 4 - Follow (⚔️ CHALLENGE):
"What's the liquidity depth? Can we exit 500 TON
without significant slippage?"

Round 5 - Lead (💃 PROPOSE):
"Liquidity check shows 50,000 TON depth. 500 TON
represents only 1% - easy exit. Maintaining proposal."
Confidence: 0.85

Round 6 - Follow (🤝 ACCEPT):
"Liquidity is sufficient. I accept 500 TON with
stop-loss at -20%."
Confidence: 0.8

🎭 Consensus Reached!

📜 Joint Recommendation:
- Investment: 500 TON in SCALE
- Stop-loss: -20%
- Rationale: Good growth potential, acceptable risk with
  stop-loss, sufficient liquidity for exit
- Confidence: 0.825 (average)

💃 The Dance concludes.
```

## Philosophy

"In The Dance, opposition becomes collaboration. Each step of resistance reveals a step toward truth. The Lead and Follow are not adversaries - they are partners finding balance."

The Dance teaches that disagreement, when structured, leads to better decisions than unanimous agreement ever could.
