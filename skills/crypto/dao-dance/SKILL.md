# The DAO Dance

A crypto-specific position where agents coordinate governance participation across DAOs.

## Description

The DAO Dance is democracy in motion. Multiple agents work together to participate in decentralized governance - researching proposals, forming positions, and voting in coordination. They dance through the governance process with deliberation and unity.

## Invocation

```
/dao-dance <dao> [--proposal ID] [--mode "research|vote|full"]
```

Where:
- `<dao>` - The DAO to participate in (e.g., "TON Foundation", "DeDust DAO")
- `--proposal ID` - Specific proposal to focus on (optional)
- `--mode` - Operation mode (default: full)

## Agents

| Agent | Role | Focus |
|-------|------|-------|
| Researcher | Proposal Analysis | Deep-dive into proposals, impact assessment |
| Strategist | Position Formation | Align votes with strategy, coordinate timing |
| Voter | Execution | Cast votes, verify transactions |

## Workflow

### Phase 1: Awareness
1. Researcher monitors active proposals
2. Identifies proposals matching criteria
3. Gathers proposal details and context
4. Flags for Strategist review

### Phase 2: Analysis
Researcher examines each proposal:
1. Read full proposal text
2. Identify stakeholders and impacts
3. Review discussion and sentiment
4. Assess alignment with portfolio strategy
5. Prepare briefing document

### Phase 3: Deliberation
1. Researcher presents briefing to Strategist
2. Strategist considers strategic implications
3. Discussion of pros, cons, risks
4. Position formed: FOR, AGAINST, or ABSTAIN
5. Voting rationale documented

### Phase 4: Coordination
1. Strategist determines optimal voting time
2. Checks for quorum requirements
3. Assesses vote weight and impact
4. Prepares voting transaction
5. Signals Voter when ready

### Phase 5: Execution
1. Voter receives voting instructions
2. Constructs and signs vote transaction
3. Submits vote on-chain
4. Verifies vote recorded correctly
5. Reports completion to gallery

### Phase 6: Post-Vote
1. Monitor proposal outcome
2. Record vote and result
3. Update voting history
4. Analyze vote effectiveness

## Proposal Briefing Format

```json
{
  "type": "DAO_BRIEFING",
  "dao": "DeDust DAO",
  "proposal": {
    "id": "PROP-042",
    "title": "Increase LP rewards for TON/USDT pool",
    "author": "EQ...",
    "status": "Active",
    "votingEnds": "2024-01-20T00:00:00Z"
  },
  "summary": "Proposes doubling LP rewards for TON/USDT pool for 3 months",
  "impact": {
    "treasury": "-500,000 DUST over 3 months",
    "lpApy": "+8% estimated",
    "tvlEffect": "+$2M estimated"
  },
  "sentiment": {
    "forum": "Mostly positive",
    "whalePosition": "Mixed",
    "currentVotes": { "for": 45, "against": 12 }
  },
  "recommendation": "FOR",
  "rationale": "Aligns with TVL growth strategy, treasury can sustain cost"
}
```

## Voting Record Format

```json
{
  "type": "DAO_VOTE_RECORD",
  "dao": "DeDust DAO",
  "proposal": "PROP-042",
  "vote": "FOR",
  "weight": 10000,
  "txHash": "abc123...",
  "timestamp": "2024-01-18T14:30:00Z",
  "outcome": "PASSED",
  "ourContribution": "2.3% of winning votes"
}
```

## Governance Strategies

### Conservative
- Only vote on critical proposals
- Prefer ABSTAIN when uncertain
- Focus on security and stability

### Active
- Vote on most proposals
- Form clear positions
- Engage in pre-vote signaling

### Strategic
- Time votes for maximum impact
- Coordinate with aligned parties
- Target swing proposals

## Example Session

```
User: /dao-dance "DeDust DAO" --mode full

💃 The DAO Dance begins...

Researcher: "Scanning DeDust governance..."

Active Proposals Found: 3

1. PROP-042: Increase LP rewards for TON/USDT
   Status: Active, ends in 2 days
   Current: 45 FOR / 12 AGAINST

2. PROP-043: Add new trading pair SCALE/USDT
   Status: Active, ends in 5 days
   Current: 23 FOR / 8 AGAINST

3. PROP-044: Update fee structure
   Status: Discussion phase
   Current: No voting yet

Researcher: "Prioritizing PROP-042 (ends soonest)..."

--- Analysis Phase ---

Researcher: "Analyzing PROP-042..."

📋 Proposal Briefing:

Title: Increase LP rewards for TON/USDT
Author: Core Team
Request: Double DUST emissions to TON/USDT pool

Impact Analysis:
- Treasury cost: 500,000 DUST over 3 months
- Expected TVL increase: $2M+
- LP APY boost: ~8%

Risk Assessment:
- Treasury can sustain 12 months at this rate
- Precedent for future reward requests
- May dilute other pool incentives

Sentiment:
- Forum: 80% positive
- Whales: Mixed (2 large holders undecided)
- Quorum: 60% reached

Researcher → Strategist: "Briefing complete. Recommendation: FOR"

--- Deliberation Phase ---

Strategist: "Reviewing briefing..."

Strategic Considerations:
- We hold TON/USDT LP position (+)
- Increased TVL benefits all LPs (+)
- Treasury sustainability confirmed (+)
- Aligns with growth phase strategy (+)

Strategist: "Position formed: FOR"
Strategist: "Optimal voting window: 12 hours before close"
Strategist: "Vote weight: 10,000 DUST (2.3% of current votes)"

--- Execution Phase ---

(12 hours before proposal ends)

Strategist → Voter: {
  "action": "VOTE",
  "proposal": "PROP-042",
  "vote": "FOR",
  "weight": 10000
}

Voter: "Preparing vote transaction..."
Voter: "Signing with governance wallet..."
Voter: "Submitting vote..."

✓ Vote submitted: FOR with 10,000 DUST
✓ Transaction confirmed: abc123...
✓ Vote recorded on-chain

--- Post-Vote ---

Gallery: "DAO Dance executed vote on PROP-042"

📊 Vote Summary:
- Proposal: PROP-042
- Our Vote: FOR (10,000 DUST)
- New Totals: 55 FOR / 12 AGAINST
- Our Contribution: 18% of new FOR votes

--- Proposal Outcome (2 days later) ---

🎉 PROP-042 PASSED
Final: 72 FOR / 15 AGAINST (83% approval)
Our vote was part of winning majority.

💃 The DAO Dance concludes.
```

## Multi-DAO Support

The DAO Dance can manage governance across multiple DAOs:

```
/dao-dance --watch "DeDust,STON.fi,TON Foundation"
```

This enables:
- Unified governance dashboard
- Cross-DAO strategy alignment
- Consolidated voting calendar
- Portfolio-wide impact analysis

## Philosophy

"The DAO Dance knows that governance is not a burden but a privilege. Each vote is a step in the dance of decentralized coordination. We move deliberately, in rhythm with our values, shaping the protocols we depend upon."

The DAO Dance teaches that participation in governance is essential stewardship - the protocols we use deserve our attention and our voice.
