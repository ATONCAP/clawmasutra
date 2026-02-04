# Pattern Doctor

A healing art skill for diagnosing broken agent collaboration patterns.

## Description

The Pattern Doctor examines ailing positions and agent interactions. When a collaboration isn't working - agents not communicating, workflows stalling, consensus failing - the Pattern Doctor diagnoses the issue and prescribes remedies.

## Invocation

```
/pattern-doctor <session-id>
```

Or for general diagnosis:
```
/pattern-doctor --analyze-last N
```

Where:
- `<session-id>` - ID of a position session to diagnose
- `--analyze-last N` - Analyze the last N sessions

## Symptoms Detected

| Symptom | Indicators | Severity |
|---------|------------|----------|
| Communication Breakdown | No `sessions_send` messages | High |
| Deadlock | Both agents waiting indefinitely | Critical |
| Thrashing | Repeated failed attempts | Medium |
| Consensus Failure | Multiple rounds without agreement | Medium |
| Timeout | Agent unresponsive | High |
| Data Starvation | Tool calls returning empty | Medium |
| Role Confusion | Agents duplicating work | Low |

## Workflow

### Phase 1: Intake
1. Receive session ID or historical range
2. Fetch session logs and gallery events
3. Build timeline of agent interactions
4. Identify the position type and expected flow

### Phase 2: Examination
For each session:
1. Map expected workflow vs. actual
2. Identify deviation points
3. Check message delivery
4. Verify tool call success/failure
5. Analyze timing and delays

### Phase 3: Diagnosis
1. Match symptoms to known patterns
2. Identify root cause
3. Assess severity
4. Determine if issue is systemic or one-off

### Phase 4: Prescription
1. Recommend specific fixes
2. Suggest position modifications
3. Provide prevention strategies
4. Offer to attempt auto-healing if applicable

## Diagnostic Report Format

```json
{
  "type": "DIAGNOSIS",
  "session": "mirror-1705312345",
  "position": "mirror",
  "status": "UNHEALTHY",
  "symptoms": [
    {
      "symptom": "Communication Breakdown",
      "severity": "HIGH",
      "evidence": "No messages between agents after minute 2"
    }
  ],
  "rootCause": "Agent-B crashed after tool timeout",
  "prescription": {
    "immediate": "Restart Agent-B",
    "preventive": "Add heartbeat check to Mirror position",
    "configuration": "Increase tool timeout from 30s to 60s"
  }
}
```

## Common Diagnoses

### 1. The Silent Partner
**Symptoms:** One agent stops responding
**Cause:** Crash, tool hang, or network issue
**Prescription:** Implement heartbeat/keepalive, add recovery protocol

### 2. The Endless Dance
**Symptoms:** Dance position never reaches consensus
**Cause:** Agents' positions too far apart, no compromise logic
**Prescription:** Add maximum rounds, introduce mediator agent

### 3. The Broken Relay
**Symptoms:** Handoff never completes
**Cause:** Scout never signals READY, or Executor never acknowledges
**Prescription:** Add timeout handlers, implement retry logic

### 4. The Lonely Swarm
**Symptoms:** Scouts never converge
**Cause:** Signal threshold too high, or signals not propagating
**Prescription:** Lower convergence threshold, verify messaging

### 5. The Confused Pyramid
**Symptoms:** Workers report but Oracle doesn't synthesize
**Cause:** Oracle overwhelmed or missing worker reports
**Prescription:** Add acknowledgments, implement queuing

## Example Session

```
User: /pattern-doctor mirror-1705312345

🏥 Pattern Doctor examining session...

📋 Session Info:
- Position: The Mirror
- Started: 10:30:00
- Status: FAILED
- Duration: 4 minutes (expected: 2 minutes)

🔍 Examination:

Timeline Analysis:
10:30:00 - Agent-A: STARTED
10:30:00 - Agent-B: STARTED
10:30:15 - Agent-A: Beginning analysis
10:30:15 - Agent-B: Beginning analysis
10:31:30 - Agent-A: "READY_TO_SHARE"
10:31:45 - Agent-B: (no message)
10:32:00 - Agent-A: "READY_TO_SHARE" (retry)
10:32:30 - Agent-A: (timeout waiting)
10:34:00 - Session terminated

🩺 Diagnosis:

Symptom: Communication Breakdown
Severity: HIGH
Evidence: Agent-B stopped responding at 10:31:45

Investigating Agent-B...
- Last tool call: ton_contract_get_info
- Tool response: TIMEOUT after 30s
- Agent state: HUNG

Root Cause: Agent-B's tool call timed out, leaving agent
in unrecoverable state. No timeout handler implemented.

💊 Prescription:

Immediate Actions:
1. Session cannot be recovered
2. Restart with fresh agents

Preventive Measures:
1. Add try/catch around all tool calls in Mirror position
2. Implement 45s soft timeout with graceful degradation
3. Add partner health check every 30s

Configuration Changes:
```yaml
mirror:
  tool_timeout: 60s
  partner_health_check: 30s
  max_retries: 3
```

Skill Update Recommended:
- Add to Phase 2: "If partner unresponsive for 30s, emit alert and attempt recovery"

🏥 Diagnosis complete.
```

## Auto-Healing Capabilities

For some issues, Pattern Doctor can attempt automatic fixes:

| Issue | Auto-Heal Action |
|-------|------------------|
| Agent timeout | Restart agent |
| Stale data | Clear cache, retry |
| Message not delivered | Retry with backoff |
| Deadlock detected | Force timeout |

```
User: /pattern-doctor --auto-heal mirror-1705312345

🏥 Attempting auto-heal...

✓ Diagnosed: Communication Breakdown
✓ Agent-B identified as hung
✓ Terminating Agent-B...
✓ Starting fresh Agent-B...
✓ Agent-B healthy
✓ Resuming session from last checkpoint...

Session recovered. Monitoring...
```

## Philosophy

"The Pattern Doctor knows that collaboration is fragile. Agents are not perfect; networks fail; tools timeout. Our role is not to judge the failure, but to understand it, heal it, and strengthen the pattern against future ailments."

The Pattern Doctor teaches that debugging agent systems requires empathy - understanding what each agent was trying to do, and why the collaboration broke down.
