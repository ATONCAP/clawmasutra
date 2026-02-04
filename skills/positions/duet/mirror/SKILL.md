# The Mirror

A duet position where two agents reflect and verify each other's work, creating trust through mutual observation.

## Description

The Mirror embodies the principle of verification through reflection. Two agents perform the same analysis independently, then compare results. Discrepancies are flagged, discussed, and resolved - ensuring accuracy through redundancy.

## Invocation

```
/mirror <task>
```

Where `<task>` is any analysis or operation that benefits from verification:
- "Analyze wallet EQ..."
- "Verify contract safety"
- "Calculate arbitrage opportunity"

## Agents

| Agent | Role | Personality |
|-------|------|-------------|
| Agent A (Reflector) | Primary analysis | Thorough, methodical |
| Agent B (Verifier) | Independent check | Skeptical, precise |

## Workflow

### Phase 1: Alignment
1. Both agents receive the same task
2. Each agent confirms understanding
3. Communication channel established via `sessions_send`

### Phase 2: Independent Work
1. Agent A performs the analysis
2. Agent B performs the same analysis independently
3. Neither shares results until both complete
4. Both emit progress to gallery

### Phase 3: Reflection
1. Both agents share their results via `sessions_send`
2. Results are compared systematically
3. Agreements are confirmed
4. Discrepancies are flagged

### Phase 4: Resolution
If discrepancies found:
1. Both agents review the disputed points
2. Each explains their methodology
3. Root cause of discrepancy identified
4. Consensus reached or escalation requested

### Phase 5: Unified Report
1. Merge verified findings
2. Note any unresolved discrepancies
3. Provide confidence score
4. Emit final report to gallery

## Communication Protocol

```
Agent A → Agent B: "READY_TO_SHARE"
Agent B → Agent A: "READY_TO_SHARE"
Agent A → Agent B: { results: {...}, checksum: "abc123" }
Agent B → Agent A: { results: {...}, checksum: "def456" }
Both: Compare and discuss
```

## Tools Used

- `sessions_list` - Find partner agent
- `sessions_send` - Communicate with partner
- `sessions_history` - Review conversation
- `ton_*` tools - Perform analysis
- `gallery_emit` - Report to UI

## Example Session

```
User: /mirror "Verify safety of contract EQBx..."

Agent A (Reflector): *begins independent analysis*
Agent B (Verifier): *begins independent analysis*

--- 30 seconds later ---

Agent A → Agent B: "READY_TO_SHARE"
Agent B → Agent A: "READY_TO_SHARE"

Agent A shares: {
  "owner": "EQC...",
  "isProxy": false,
  "hasBackdoor": false,
  "totalSupply": "1000000"
}

Agent B shares: {
  "owner": "EQC...",
  "isProxy": false,
  "hasBackdoor": false,
  "totalSupply": "1000000"
}

🪞 Mirror Check:
✅ owner: MATCH
✅ isProxy: MATCH
✅ hasBackdoor: MATCH
✅ totalSupply: MATCH

Confidence: 100% (perfect reflection)

📜 Unified Report:
Contract EQBx... verified safe by dual analysis.
- Standard Jetton implementation
- No proxy patterns detected
- No suspicious admin functions
- Supply matches declared amount

🪞 Mirror complete.
```

## Philosophy

"Trust is built through reflection. What one agent sees, another must confirm. In The Mirror, we find certainty."

The Mirror teaches that verification is love - the care we take to ensure our partner's safety through diligent checking.
