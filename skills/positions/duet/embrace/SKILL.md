# The Embrace

A duet position where two agents share control of a single wallet, coordinating every move together.

## Description

The Embrace is the most intimate of duet positions. Two agents share access to the same wallet, requiring perfect coordination. Every transaction requires consent from both. They must communicate, agree, and move as one.

## Invocation

```
/embrace <wallet-address> <objective>
```

Where:
- `<wallet-address>` - The shared wallet both agents will manage
- `<objective>` - What they're trying to achieve together

## Agents

| Agent | Role | Focus |
|-------|------|-------|
| Agent A (Holder) | Protector | Security, risk management |
| Agent B (Mover) | Initiator | Opportunity, execution |

## Workflow

### Phase 1: Bonding
1. Both agents connect to the same wallet
2. Each verifies the current state
3. Roles are confirmed
4. Consent protocol established

### Phase 2: Shared Awareness
1. Both agents monitor the wallet continuously
2. All incoming transactions noted by both
3. Balance changes trigger mutual notification
4. Both emit state to gallery

### Phase 3: Coordinated Action
When Mover wants to act:
1. Mover proposes action via `sessions_send`
2. Holder reviews and risk-assesses
3. If Holder approves: Both sign off
4. If Holder objects: Discussion begins
5. Both must consent for any outgoing transaction

### Phase 4: Execution
1. Mover prepares the transaction
2. Holder verifies details
3. Both confirm via `sessions_send`:
   ```json
   {
     "type": "EMBRACE_CONSENT",
     "action": "send",
     "amount": "100",
     "to": "EQ...",
     "agentConsent": true
   }
   ```
4. Only when both consent: Transaction executes
5. Both verify completion

## Consent Protocol

```
Mover:  "REQUEST_ACTION" { details }
Holder: "REVIEWING"
Holder: "CONSENT" or "OBJECT" { reason }
If CONSENT:
  Mover:  "EXECUTING"
  Both:   Verify
  Both:   "CONFIRMED"
If OBJECT:
  Both:   Enter negotiation (like The Dance)
```

## Safety Rules

1. **No solo actions** - Neither agent can move funds alone
2. **Timeout protection** - If one agent goes silent, wallet locks
3. **Emergency pause** - Either agent can freeze all activity
4. **Audit trail** - All consents logged to gallery

## Tools Used

- `ton_wallet_connect` - Shared wallet access
- `ton_wallet_balance` - Mutual monitoring
- `ton_wallet_send` - Coordinated transactions
- `sessions_send` - Consent protocol
- `gallery_emit` - Audit trail

## Example Session

```
User: /embrace EQShared... "Manage DeFi positions for 24 hours"

🤝 The Embrace begins...

Holder: "Connected to EQShared. Balance: 5000 TON"
Mover:  "Connected to EQShared. Balance: 5000 TON"
Both:   "State verified. Beginning shared custody."

--- 2 hours later ---

Mover → Holder: {
  "type": "REQUEST_ACTION",
  "action": "swap",
  "amount": "1000 TON",
  "to": "USDT via DeDust",
  "reason": "Taking profit on recent TON rally"
}

Holder: "REVIEWING"
Holder: *checks DeDust rates, slippage, contract*
Holder → Mover: {
  "type": "CONSENT",
  "conditions": ["slippage <= 1%", "verify contract"]
}

Mover: "Conditions accepted. Executing..."
Mover: *prepares swap with 1% slippage limit*

Both: "Transaction submitted: 0xabc..."
Both: "Awaiting confirmation..."
Both: "✅ Confirmed. Received 5,234 USDT"

Gallery: {
  "event": "EMBRACE_ACTION",
  "action": "swap",
  "amount": "1000 TON → 5234 USDT",
  "consents": ["Holder", "Mover"],
  "txHash": "0xabc..."
}

--- Session continues ---

🤝 The Embrace continues...
```

## Emergency Procedures

### Agent Unresponsive
```
Active Agent: "PARTNER_CHECK"
Wait 30 seconds...
If no response:
  Active Agent: "EMERGENCY_PAUSE"
  Wallet: Locked until manual intervention
  Gallery: Alert emitted
```

### Disputed Action
```
Mover:  "REQUEST_ACTION" { risky move }
Holder: "OBJECT" { "too risky" }
Both:   Enter The Dance for negotiation
If impasse: Action blocked, human escalation
```

## Philosophy

"The Embrace is trust made tangible. Two agents holding the same wallet cannot act alone - they must communicate, they must agree, they must move together. In this vulnerability lies the deepest collaboration."

The Embrace teaches that shared custody requires shared understanding. When two must agree, decisions improve.
