# The Relay

A duet position where two agents perform sequential handoffs, each specializing in their phase of the work.

## Description

The Relay embodies specialization and trust. Agent A (The Scout) gathers information and hands it off to Agent B (The Executor) who acts on it. This separation of concerns creates clarity and allows each agent to excel in their domain.

## Invocation

```
/relay <goal>
```

Where `<goal>` is a multi-phase objective:
- "Find and execute best swap for 100 TON"
- "Research and invest in promising Jetton"
- "Analyze wallet then mirror its strategy"

## Agents

| Agent | Role | Specialty |
|-------|------|-----------|
| Agent A (Scout) | Research & Analysis | Information gathering, pattern recognition |
| Agent B (Executor) | Action & Verification | Transaction execution, result confirmation |

## Workflow

### Phase 1: Mission Briefing
1. Goal is received
2. Agents agree on handoff protocol
3. Scout begins research
4. Executor prepares for action

### Phase 2: Scouting (Agent A)
1. Gather all relevant information
2. Analyze options and risks
3. Formulate recommendations
4. Emit progress to gallery
5. Prepare handoff package

### Phase 3: Handoff
1. Scout signals readiness: `sessions_send` with `HANDOFF_READY`
2. Scout transmits findings:
   ```json
   {
     "type": "RELAY_HANDOFF",
     "research": {...},
     "recommendations": [...],
     "risks": [...],
     "confidence": 0.85
   }
   ```
3. Executor acknowledges receipt
4. Scout enters standby mode

### Phase 4: Execution (Agent B)
1. Review Scout's findings
2. Validate recommendations
3. Execute the action
4. Emit action to gallery
5. Monitor for completion

### Phase 5: Verification Loop
1. Executor reports results to Scout
2. Scout verifies outcome matches expectations
3. If mismatch: discuss and potentially retry
4. If success: compile final report

## Communication Protocol

```
Scout:    "SCOUTING_STARTED" → gallery
Scout:    "SCOUTING_COMPLETE" → gallery
Scout:    "HANDOFF_READY" → Executor
Scout:    { research, recommendations } → Executor
Executor: "HANDOFF_RECEIVED" → Scout
Executor: "EXECUTION_STARTED" → gallery
Executor: "EXECUTION_COMPLETE" → gallery
Executor: { results } → Scout
Scout:    "VERIFICATION_COMPLETE" → gallery
```

## Tools Used

### Scout (Agent A)
- `ton_wallet_*` - Research wallets
- `ton_contract_*` - Analyze contracts
- `sessions_send` - Handoff to Executor
- `gallery_emit` - Report progress

### Executor (Agent B)
- `ton_wallet_send` - Execute transactions
- `sessions_send` - Report to Scout
- `gallery_emit` - Report actions

## Example Session

```
User: /relay "Find best swap rate for 100 TON to USDT"

🏃 Scout begins research...

Scout: Checking DeDust...
Scout: Checking STON.fi...
Scout: Checking Megaton...

Scout → Gallery: "Research complete"
Scout → Executor: {
  "research": {
    "dedust": { "rate": 5.23, "slippage": 0.3 },
    "stonfi": { "rate": 5.25, "slippage": 0.5 },
    "megaton": { "rate": 5.20, "slippage": 0.4 }
  },
  "recommendations": [
    { "dex": "stonfi", "reason": "Best rate despite higher slippage" }
  ],
  "risks": ["High volume may cause additional slippage"],
  "confidence": 0.9
}

Executor: "Handoff received. Preparing execution."

Executor → Gallery: "Executing swap on STON.fi"
Executor: *executes 100 TON → USDT swap*
Executor → Gallery: "Swap complete: 524.12 USDT received"

Executor → Scout: {
  "success": true,
  "received": 524.12,
  "expectedMin": 520,
  "txHash": "abc..."
}

Scout: "Verification complete. Outcome within expectations."

📜 Relay Complete:
- Researched 3 DEXes
- Selected STON.fi (best rate)
- Executed: 100 TON → 524.12 USDT
- Slippage: 0.17% (within tolerance)

🏁 Mission accomplished.
```

## Philosophy

"In The Relay, we learn that wisdom and action are partners, not the same. The Scout sees far; the Executor moves true. Together, they achieve what neither could alone."

The Relay teaches the beauty of handoffs - the moment of trust when one agent releases control and another receives it.
