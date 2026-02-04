# Recovery

A healing art skill for graceful failure handling and position recovery.

## Description

Recovery is the art of resilience. When positions fail mid-execution, when transactions are stuck, when agents lose their way - Recovery steps in to salvage what can be saved and safely unwind what cannot.

## Invocation

```
/recovery <session-id> [--mode MODE]
```

Modes:
- `assess` - Evaluate recoverable state (default)
- `resume` - Attempt to continue from last good state
- `rollback` - Safely unwind to pre-session state
- `salvage` - Extract any partial results

## Recovery Scenarios

| Scenario | Risk Level | Recovery Options |
|----------|------------|------------------|
| Agent crash | Low | Resume or restart |
| Network failure | Low | Retry with backoff |
| Tool timeout | Medium | Retry or skip step |
| Partial transaction | High | Complete or revert |
| State corruption | High | Rollback required |
| Consensus failure | Low | Restart negotiation |

## Workflow

### Phase 1: Assessment
1. Load session state and history
2. Identify failure point
3. Catalog completed actions
4. Identify pending/incomplete actions
5. Assess external state (blockchain, etc.)

### Phase 2: State Reconciliation
1. Compare intended state vs. actual state
2. Identify discrepancies
3. Determine what's recoverable
4. Calculate recovery options

### Phase 3: Recovery Planning
For each option:
1. List required actions
2. Estimate success probability
3. Identify risks
4. Calculate cost (gas, time, etc.)

### Phase 4: Execution
Based on selected mode:
- **Resume:** Continue from last checkpoint
- **Rollback:** Reverse completed actions
- **Salvage:** Extract partial results

### Phase 5: Verification
1. Confirm final state
2. Verify no orphaned resources
3. Archive session with outcome
4. Emit recovery report

## Assessment Report Format

```json
{
  "type": "RECOVERY_ASSESSMENT",
  "session": "relay-1705312345",
  "failure_point": "Phase 3: Execution",
  "completed_actions": [
    { "action": "research", "status": "complete", "reversible": false },
    { "action": "handoff", "status": "complete", "reversible": false }
  ],
  "pending_actions": [
    { "action": "execute_swap", "status": "started", "state": "tx_pending" },
    { "action": "verify", "status": "not_started" }
  ],
  "external_state": {
    "transaction": "0xabc...",
    "status": "pending",
    "confirmations": 0
  },
  "options": [
    {
      "mode": "resume",
      "description": "Wait for pending tx, then continue",
      "probability": 0.85,
      "risk": "low"
    },
    {
      "mode": "salvage",
      "description": "Cancel tx if possible, keep research",
      "probability": 0.70,
      "risk": "medium"
    }
  ]
}
```

## Recovery Protocols

### Protocol A: Agent Crash Recovery
```
1. Identify crashed agent
2. Preserve agent's last known state
3. Start fresh agent with state injection
4. Resume from last checkpoint
5. Verify partner agents still healthy
```

### Protocol B: Transaction Recovery
```
1. Check transaction status on chain
2. If pending > 5 min: Attempt speed-up
3. If failed: Analyze reason
4. If stuck: Consider replacement tx
5. If confirmed: Continue flow
```

### Protocol C: Consensus Recovery
```
1. Load all agent positions
2. Identify point of breakdown
3. Reset to last agreed state
4. Offer simplified decision options
5. Resume with tighter constraints
```

### Protocol D: Full Rollback
```
1. List all reversible actions
2. Execute reversals in reverse order
3. Confirm each reversal
4. Return to pre-session state
5. Archive session as rolled back
```

## Example Session

```
User: /recovery relay-1705312345

🛟 Recovery assessing session...

📋 Session Info:
- Position: The Relay
- Failed at: Phase 3 (Execution)
- Time in failed state: 12 minutes

🔍 Assessment:

Completed Actions:
✓ Scout research (non-reversible)
✓ Handoff to Executor (non-reversible)
⚠️ Swap transaction (PENDING)

Pending Actions:
○ Verification
○ Final report

External State Check:
- Transaction 0xabc...
- Status: PENDING (11 minutes)
- Gas price: 0.05 TON (low)
- Network: Normal congestion

🎯 Recovery Options:

Option 1: RESUME (Recommended)
- Wait for transaction or speed up
- Continue verification once confirmed
- Probability: 85%
- Risk: Low
- Cost: ~0.1 TON (speed-up fee)

Option 2: SALVAGE
- Attempt transaction cancellation
- Keep research results
- Probability: 60%
- Risk: Medium (cancel may fail)
- Cost: ~0.05 TON

Option 3: ROLLBACK
- Not available (research non-reversible)

User: /recovery relay-1705312345 --mode resume

🛟 Executing RESUME recovery...

Step 1: Speed up pending transaction
- Submitting replacement tx with higher gas...
- New tx: 0xdef...
- Status: SUBMITTED

Step 2: Waiting for confirmation...
- Confirmation 1/2...
- Confirmation 2/2... ✓

Step 3: Transaction confirmed
- Received: 523.4 USDT
- As expected: Yes

Step 4: Resuming Relay position
- Injecting state into verification phase...
- Executor reporting success to Scout...

Step 5: Scout verification
- Scout comparing results...
- Outcome matches expectations ✓

Step 6: Final report generated

🛟 Recovery Successful!

Session relay-1705312345 recovered.
- Recovery mode: RESUME
- Transaction completed: 0xdef...
- Position outcome: SUCCESS
- Recovery cost: 0.08 TON

📊 Recovery Statistics:
- Time in failed state: 12 minutes
- Recovery time: 3 minutes
- Total session time: 19 minutes (expected: 4 minutes)

Recommendation: Consider adding transaction timeout
handler to Relay position to auto-trigger speed-up.

🛟 Recovery complete.
```

## Salvage Mode Details

When full recovery isn't possible, salvage extracts value:

```
User: /recovery pyramid-1705399999 --mode salvage

🛟 Salvaging session...

Recoverable Elements:
✓ Worker-1 research: DeDust analysis
✓ Worker-2 research: STON.fi analysis
✗ Worker-3 research: Lost (agent crashed)
✗ Oracle synthesis: Never completed

Salvage Actions:
1. Extracting Worker-1 results... ✓
2. Extracting Worker-2 results... ✓
3. Packaging partial research...

📦 Salvage Package:
{
  "original_mission": "Full DeFi analysis",
  "completion": "67%",
  "salvaged_data": {
    "dedust_analysis": {...},
    "stonfi_analysis": {...}
  },
  "missing": ["megaton_analysis", "synthesis"],
  "recommendation": "Re-run Pyramid with 2 workers for remaining data"
}

🛟 Salvage complete. Partial results preserved.
```

## Philosophy

"Recovery knows that failure is not the end. Every broken position holds valuable state, completed work, pending intentions. Our role is to honor that work - to save what can be saved, restore what can be restored, and learn what can be learned."

Recovery teaches that graceful failure handling is as important as success handling. The measure of a system isn't whether it fails, but how it recovers.
