# Clawmasutra Orchestration Layer Implementation Plan

## Executive Summary

This plan outlines the implementation of a real agent orchestration layer for Clawmasutra, replacing the current demo/simulation mode with actual multi-agent AI collaboration. The orchestration layer will spawn Claude agents via the Anthropic API, manage their lifecycle, enable inter-agent communication, and coordinate collaboration patterns defined by positions.

---

## 1. Goal Definition

### What We're Building
A production-ready orchestration system that:
1. **Spawns real AI agents** using the Anthropic Claude API
2. **Loads position SKILL.md files** as agent instructions
3. **Manages agent sessions** with full lifecycle control (start, communicate, stop)
4. **Enables inter-agent messaging** for collaboration patterns
5. **Emits real-time events** to the gallery server for UI visualization
6. **Coordinates multi-agent patterns** (mirror, relay, pyramid, swarm, etc.)

### Why We're Building It
- Current system is demo-only - `position_invoke` returns fake `["demo-agent-1", "demo-agent-2"]`
- No actual AI processing happens - agents don't think or act
- Inter-agent communication tools (`sessions_send`, `sessions_list`) don't exist
- Position SKILL.md files aren't being loaded or executed

### Success Criteria
- `position_invoke("mirror", config)` spawns 2 real Claude agents
- Agents load their SKILL.md instructions and execute them
- Agents can send messages to each other via `sessions_send`
- All agent activity appears in real-time on the gallery UI
- Positions complete their collaboration patterns autonomously

---

## 2. Architecture Overview

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MCP SERVER (Enhanced)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐    │
│  │ position_invoke │───▶│  Orchestrator    │───▶│  Agent Runtime      │    │
│  │ (enhanced)      │    │                  │    │                     │    │
│  └─────────────────┘    │  - Session mgmt  │    │  - Claude API calls │    │
│                         │  - Agent spawn   │    │  - Tool execution   │    │
│  ┌─────────────────┐    │  - Coordination  │    │  - Message routing  │    │
│  │ sessions_send   │───▶│  - State machine │    │                     │    │
│  │ (new)           │    │                  │    └─────────────────────┘    │
│  └─────────────────┘    └──────────────────┘              │                │
│                                   │                        │                │
│  ┌─────────────────┐              │                        ▼                │
│  │ sessions_list   │              │              ┌─────────────────────┐    │
│  │ (new)           │              │              │  SKILL.md Loader    │    │
│  └─────────────────┘              │              │                     │    │
│                                   │              │  - Parse markdown   │    │
│  ┌─────────────────┐              │              │  - Extract roles    │    │
│  │ gallery_emit    │◀─────────────┘              │  - Build prompts    │    │
│  │ (existing)      │                             └─────────────────────┘    │
│  └─────────────────┘                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GALLERY SERVER (existing)                            │
│                                                                             │
│  WebSocket broadcast ──────▶ Connected UI clients                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User invokes position** via MCP tool: `position_invoke("mirror", { target: "EQ..." })`
2. **Orchestrator creates session** with unique ID, initializes state machine
3. **SKILL.md loader** reads `skills/duet/mirror/SKILL.md`, extracts agent roles
4. **Agent Runtime spawns agents** via Anthropic API with role-specific system prompts
5. **Agents execute autonomously**, calling tools (sessions_send, gallery_emit, ton_*)
6. **Messages routed** between agents via orchestrator's message bus
7. **Events broadcast** to gallery server for real-time UI updates
8. **Session completes** when collaboration pattern finishes (consensus, timeout, or error)

---

## 3. Constraints & Dependencies

### External Dependencies
| Dependency | Purpose | Risk Level |
|------------|---------|------------|
| Anthropic API | Claude agent execution | Medium - API limits, costs |
| Gallery Server | Event broadcasting | Low - Already deployed |
| TON Blockchain | Wallet/contract ops | Medium - Network latency |
| SKILL.md files | Agent instructions | Low - Local files |

### Technical Constraints
- **Rate Limits**: Anthropic API has request limits; need queuing/throttling
- **Context Windows**: Claude has token limits; long sessions need summarization
- **Concurrent Agents**: Each agent is an API call; parallel limits apply
- **Cost**: Each agent turn costs tokens; need usage tracking
- **Latency**: AI inference takes 1-10s; UI needs "thinking" indicators

### Security Constraints
- **API Key**: ANTHROPIC_API_KEY must be in environment, never exposed to agents
- **Wallet Keys**: Already handled by ton-wallet.ts memory storage
- **Agent Isolation**: Agents shouldn't access each other's prompts directly
- **Tool Scoping**: Some tools (wallet send) need explicit user approval

---

## 4. Detailed Component Design

### 4.1 Orchestrator (`mcp-server/src/orchestrator/index.ts`)

The central coordinator for all agent sessions.

```typescript
interface Orchestrator {
  // Session lifecycle
  createSession(position: Position, config: SessionConfig): Promise<Session>;
  getSession(sessionId: string): Session | undefined;
  listSessions(): Session[];
  stopSession(sessionId: string): Promise<void>;

  // Agent management
  spawnAgent(session: Session, role: AgentRole): Promise<Agent>;
  getAgent(sessionId: string, agentId: string): Agent | undefined;

  // Inter-agent communication
  sendMessage(from: string, to: string, message: AgentMessage): Promise<void>;
  getMessages(agentId: string): AgentMessage[];

  // Event emission
  emit(event: GalleryEvent): void;
}
```

**State Machine per Session**:
```
INITIALIZING → SPAWNING_AGENTS → RUNNING → COMPLETING → COMPLETED
                                    ↓            ↓
                                  ERROR ←───── TIMEOUT
```

### 4.2 Agent Runtime (`mcp-server/src/orchestrator/agent-runtime.ts`)

Executes individual Claude agents with tool access.

```typescript
interface AgentRuntime {
  // Create agent with Anthropic API
  create(config: AgentConfig): Promise<Agent>;

  // Execute agent turn (send message, get response with tool calls)
  executeTurn(agent: Agent, input: string): Promise<AgentResponse>;

  // Handle tool calls from agent
  handleToolCall(agent: Agent, toolCall: ToolCall): Promise<ToolResult>;

  // Terminate agent
  destroy(agent: Agent): void;
}

interface Agent {
  id: string;                    // agent-{sessionId}-{role}-{timestamp}
  sessionId: string;
  role: AgentRole;
  systemPrompt: string;          // Built from SKILL.md
  conversationHistory: Message[];
  status: "idle" | "thinking" | "executing" | "stopped";
  tokensUsed: number;
  createdAt: Date;
}

interface AgentRole {
  name: string;                  // "Reflector", "Verifier", "Scout", etc.
  personality: string;           // From SKILL.md: "Thorough, methodical..."
  responsibilities: string[];    // Specific duties from SKILL.md
}
```

### 4.3 SKILL.md Loader (`mcp-server/src/orchestrator/skill-loader.ts`)

Parses position skill files and extracts agent instructions.

```typescript
interface SkillLoader {
  load(position: Position): Promise<SkillDefinition>;
}

interface SkillDefinition {
  position: string;
  overview: string;
  agents: AgentRole[];
  workflow: WorkflowStep[];
  communicationProtocol: ProtocolRule[];
  successCriteria: string[];
  errorHandling: ErrorHandler[];
}

interface WorkflowStep {
  phase: string;                 // "DISCOVERY", "ANALYSIS", "SYNTHESIS"
  agentActions: Map<string, string>; // role → action description
  expectedOutputs: string[];
}
```

### 4.4 Message Bus (`mcp-server/src/orchestrator/message-bus.ts`)

Routes messages between agents in a session.

```typescript
interface MessageBus {
  // Send message from one agent to another
  send(message: AgentMessage): void;

  // Get pending messages for an agent
  receive(agentId: string): AgentMessage[];

  // Subscribe to messages (for orchestrator monitoring)
  subscribe(handler: (message: AgentMessage) => void): () => void;

  // Broadcast to all agents in session
  broadcast(sessionId: string, message: AgentMessage): void;
}

interface AgentMessage {
  id: string;
  from: string;                  // agentId or "orchestrator" or "user"
  to: string;                    // agentId or "all"
  sessionId: string;
  type: MessageType;
  content: unknown;
  timestamp: Date;
}

type MessageType =
  | "READY_TO_SHARE"
  | "RESULTS"
  | "ACKNOWLEDGE"
  | "DISCREPANCY"
  | "CONSENSUS"
  | "ESCALATE"
  | "INSTRUCTION"
  | "QUERY"
  | "RESPONSE";
```

### 4.5 New MCP Tools

#### `sessions_send` - Inter-agent messaging
```typescript
{
  name: "sessions_send",
  description: "Send a message to another agent in the current collaboration session",
  inputSchema: {
    to: string,           // Target agent ID or "all" for broadcast
    type: MessageType,    // Message type enum
    content: unknown,     // Message payload
  }
}
```

#### `sessions_list` - List active sessions/agents
```typescript
{
  name: "sessions_list",
  description: "List active collaboration sessions and their agents",
  inputSchema: {
    sessionId?: string,   // Optional: filter to specific session
  }
}

// Returns:
{
  sessions: [{
    id: string,
    position: string,
    status: SessionStatus,
    agents: [{
      id: string,
      role: string,
      status: AgentStatus,
    }],
    startedAt: Date,
    messageCount: number,
  }]
}
```

#### `sessions_history` - Get message history
```typescript
{
  name: "sessions_history",
  description: "Get message history for a session",
  inputSchema: {
    sessionId: string,
    limit?: number,       // Default 50
    agentId?: string,     // Filter to specific agent
  }
}
```

---

## 5. Implementation Phases

### Phase 1: Core Infrastructure (Foundation)
**Files to create:**
- `mcp-server/src/orchestrator/index.ts` - Main orchestrator class
- `mcp-server/src/orchestrator/types.ts` - All TypeScript interfaces
- `mcp-server/src/orchestrator/agent-runtime.ts` - Anthropic API integration
- `mcp-server/src/orchestrator/skill-loader.ts` - SKILL.md parser
- `mcp-server/src/orchestrator/message-bus.ts` - Inter-agent messaging

**Files to modify:**
- `mcp-server/src/index.ts` - Register new tools, initialize orchestrator
- `mcp-server/package.json` - Add @anthropic-ai/sdk dependency

### Phase 2: Agent Spawning & Execution
**Implement:**
- `AgentRuntime.create()` - Spawn agent via Anthropic API
- `AgentRuntime.executeTurn()` - Agent turn execution loop
- `AgentRuntime.handleToolCall()` - Process tool calls from agents
- System prompt generation from SKILL.md
- Conversation history management

### Phase 3: Inter-Agent Communication
**Implement:**
- `MessageBus` - Full message routing system
- `sessions_send` tool - Agent-to-agent messaging
- `sessions_list` tool - Session/agent discovery
- `sessions_history` tool - Message history retrieval
- Message type validation and routing

### Phase 4: Position Orchestration
**Implement:**
- State machine for session lifecycle
- Position-specific coordination logic:
  - **Solo**: Single agent, direct execution
  - **Duet**: Two-agent handoff/mirror patterns
  - **Group**: Multi-agent consensus/hierarchy
  - **Crypto**: Blockchain-specific workflows
  - **Healing**: Error recovery patterns
- Timeout handling and graceful shutdown

### Phase 5: Integration & Polish
**Implement:**
- Enhanced `position_invoke` with real agent spawning
- Gallery event emission throughout agent lifecycle
- Usage tracking and cost reporting
- Error handling and recovery
- Integration tests

---

## 6. SKILL.md Structure Analysis

Examining existing SKILL.md files to understand parsing requirements:

### Example: Mirror Position (`skills/duet/mirror/SKILL.md`)

```markdown
# Mirror Position

## Overview
Two agents independently analyze the same target and compare results.

## Agents
### Reflector
- **Personality**: Thorough, methodical, detail-oriented
- **Responsibilities**:
  - Perform primary analysis of target
  - Document findings with evidence
  - Calculate verification checksum

### Verifier
- **Personality**: Skeptical, precise, independent
- **Responsibilities**:
  - Perform independent analysis
  - Compare results with Reflector
  - Flag discrepancies

## Workflow
1. **DISCOVERY**: Both agents receive target, acknowledge readiness
2. **ANALYSIS**: Independent parallel analysis
3. **EXCHANGE**: Share results with checksums
4. **COMPARISON**: Identify matches and discrepancies
5. **SYNTHESIS**: Produce unified report or escalate

## Communication Protocol
- READY_TO_SHARE: Signal completion of analysis phase
- RESULTS: Share analysis with checksum
- DISCREPANCY: Flag disagreement on specific point
- CONSENSUS: Agreement reached
```

### Parser Output Structure
```typescript
{
  position: "mirror",
  overview: "Two agents independently analyze...",
  agents: [
    {
      name: "Reflector",
      personality: "Thorough, methodical, detail-oriented",
      responsibilities: [
        "Perform primary analysis of target",
        "Document findings with evidence",
        "Calculate verification checksum"
      ]
    },
    {
      name: "Verifier",
      personality: "Skeptical, precise, independent",
      responsibilities: [
        "Perform independent analysis",
        "Compare results with Reflector",
        "Flag discrepancies"
      ]
    }
  ],
  workflow: [
    { phase: "DISCOVERY", description: "Both agents receive target..." },
    { phase: "ANALYSIS", description: "Independent parallel analysis" },
    { phase: "EXCHANGE", description: "Share results with checksums" },
    { phase: "COMPARISON", description: "Identify matches and discrepancies" },
    { phase: "SYNTHESIS", description: "Produce unified report or escalate" }
  ],
  communicationProtocol: [
    { type: "READY_TO_SHARE", description: "Signal completion of analysis phase" },
    { type: "RESULTS", description: "Share analysis with checksum" },
    { type: "DISCREPANCY", description: "Flag disagreement on specific point" },
    { type: "CONSENSUS", description: "Agreement reached" }
  ]
}
```

---

## 7. Anthropic API Integration

### API Configuration
```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Agent configuration
const AGENT_CONFIG = {
  model: "claude-sonnet-4-20250514", // Use Sonnet for agents (cost-effective)
  max_tokens: 4096,
  temperature: 0.7,
};
```

### Tool Schema for Agents
Agents will have access to a subset of MCP tools:
```typescript
const AGENT_TOOLS = [
  // Communication
  "sessions_send",
  "sessions_list",

  // Observation
  "gallery_emit",

  // Blockchain (read-only by default)
  "ton_wallet_balance",
  "ton_wallet_transactions",
  "ton_contract_get_info",
  "ton_contract_call_getter",

  // Blockchain (requires explicit approval)
  // "ton_wallet_send", // Gated behind approval
];
```

### System Prompt Template
```typescript
function buildSystemPrompt(role: AgentRole, position: SkillDefinition, session: Session): string {
  return `You are ${role.name}, an AI agent participating in a Clawmasutra "${position.position}" collaboration.

## Your Role
${role.personality}

## Your Responsibilities
${role.responsibilities.map(r => `- ${r}`).join('\n')}

## Current Session
- Session ID: ${session.id}
- Position: ${position.position}
- Your Agent ID: ${session.agents.find(a => a.role === role.name)?.id}
- Other Agents: ${session.agents.filter(a => a.role !== role.name).map(a => `${a.role} (${a.id})`).join(', ')}

## Workflow
${position.workflow.map((w, i) => `${i + 1}. **${w.phase}**: ${w.description}`).join('\n')}

## Communication
Use the sessions_send tool to communicate with other agents.
Message types: ${position.communicationProtocol.map(p => p.type).join(', ')}

Use the gallery_emit tool to broadcast your activities for visualization.

## Important
- Stay in character as ${role.name}
- Follow the workflow phases in order
- Communicate with other agents using the prescribed protocol
- Emit gallery events for important actions
- If you encounter an error or need human help, send an ESCALATE message`;
}
```

---

## 8. Error Handling & Edge Cases

### Agent Failures
| Scenario | Handling |
|----------|----------|
| API timeout | Retry with exponential backoff (3 attempts) |
| Rate limit | Queue and throttle requests |
| Agent stuck | Timeout after 5 minutes of no response |
| Invalid tool call | Return error, let agent retry |
| Agent contradiction | Log and continue (agents can disagree) |

### Session Failures
| Scenario | Handling |
|----------|----------|
| Agent crash | Mark agent as failed, notify others |
| Consensus timeout | Force synthesis with available results |
| All agents fail | Mark session as ERROR, emit event |
| User cancellation | Graceful shutdown, save partial results |

### Communication Failures
| Scenario | Handling |
|----------|----------|
| Invalid message type | Reject with error |
| Unknown recipient | Return error to sender |
| Message loop detected | Break cycle, warn agents |
| Excessive messages | Rate limit per agent |

---

## 9. Testing Strategy

### Unit Tests
- `skill-loader.test.ts` - SKILL.md parsing
- `message-bus.test.ts` - Message routing
- `orchestrator.test.ts` - Session state machine

### Integration Tests
- Spawn solo agent, verify tool access
- Spawn duet agents, verify messaging
- Full mirror position execution
- Gallery event emission verification

### E2E Tests
- `position_invoke("contemplator")` - Solo execution
- `position_invoke("mirror")` - Duet with result comparison
- `position_invoke("circle")` - Group consensus
- Error recovery scenarios

---

## 10. Unknowns & Risks

### Technical Risks
| Risk | Mitigation |
|------|------------|
| High API costs | Use Sonnet (cheaper), implement token budgets |
| Agent unpredictability | Clear instructions, strict tool schemas |
| Complex coordination | Start with solo/duet, iterate to group |
| Long-running sessions | Implement checkpointing, timeout handling |

### Open Questions
1. **Token budget**: How many tokens per agent per session? (Propose: 50K)
2. **Parallel execution**: How many agents can run concurrently? (Propose: 10)
3. **Persistence**: Should sessions survive server restart? (Propose: No, in-memory only for v1)
4. **Approval flow**: How to gate dangerous tools like `ton_wallet_send`? (Propose: Require explicit user flag in config)

### Future Enhancements (Out of Scope)
- Agent memory/persistence across sessions
- Multi-model support (GPT-4, local models)
- Visual agent debugging interface
- Automated position suggestion based on task
- Agent marketplace/custom positions

---

## 11. File Structure

```
mcp-server/src/
├── orchestrator/
│   ├── index.ts              # Main Orchestrator class
│   ├── types.ts              # All TypeScript interfaces
│   ├── agent-runtime.ts      # Anthropic API integration
│   ├── skill-loader.ts       # SKILL.md parser
│   ├── message-bus.ts        # Inter-agent messaging
│   └── state-machine.ts      # Session state management
├── tools/
│   ├── position-invoke.ts    # Enhanced with real orchestration
│   ├── sessions.ts           # New: sessions_send, sessions_list, sessions_history
│   ├── gallery-stream.ts     # Existing (unchanged)
│   ├── ton-wallet.ts         # Existing (unchanged)
│   └── ton-contract.ts       # Existing (unchanged)
└── index.ts                  # Register new tools
```

---

## 12. Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...          # Anthropic API key for agent execution

# Optional (with defaults)
AGENT_MODEL=claude-sonnet-4-20250514  # Model for agents
AGENT_MAX_TOKENS=4096                  # Max tokens per agent turn
AGENT_TIMEOUT_MS=300000                # Agent timeout (5 min)
SESSION_MAX_AGENTS=10                  # Max concurrent agents
SESSION_MAX_MESSAGES=1000              # Max messages per session
GALLERY_WS_URL=http://localhost:3001   # Gallery server for events
```

---

## 13. Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Create `mcp-server/src/orchestrator/types.ts` with all interfaces
- [ ] Create `mcp-server/src/orchestrator/skill-loader.ts`
- [ ] Create `mcp-server/src/orchestrator/message-bus.ts`
- [ ] Create `mcp-server/src/orchestrator/state-machine.ts`
- [ ] Create `mcp-server/src/orchestrator/index.ts` (Orchestrator class)
- [ ] Add `@anthropic-ai/sdk` to package.json

### Phase 2: Agent Spawning
- [ ] Create `mcp-server/src/orchestrator/agent-runtime.ts`
- [ ] Implement `AgentRuntime.create()`
- [ ] Implement `AgentRuntime.executeTurn()` with tool handling
- [ ] Build system prompt from SKILL.md
- [ ] Implement conversation history management

### Phase 3: Communication Tools
- [ ] Create `mcp-server/src/tools/sessions.ts`
- [ ] Implement `sessions_send` tool
- [ ] Implement `sessions_list` tool
- [ ] Implement `sessions_history` tool
- [ ] Register tools in `index.ts`

### Phase 4: Position Orchestration
- [ ] Enhance `position_invoke` to use real orchestrator
- [ ] Implement solo position coordination
- [ ] Implement duet position coordination
- [ ] Implement group position coordination
- [ ] Add timeout and error handling

### Phase 5: Polish
- [ ] Add gallery event emission throughout
- [ ] Implement usage tracking
- [ ] Add integration tests
- [ ] Update documentation

---

## 14. Questions for Review

Before proceeding, please confirm or clarify:

1. **API Key**: Do you have an `ANTHROPIC_API_KEY` available for agent execution?

2. **Cost Tolerance**: Agent execution uses tokens. A typical mirror session might use ~20K tokens (~$0.06 with Sonnet). Is this acceptable?

3. **Model Choice**: Should agents use:
   - `claude-sonnet-4-20250514` (recommended - fast, cheap, capable)
   - `claude-opus-4-20250514` (expensive but more capable)
   - Make it configurable per position?

4. **Tool Gating**: For dangerous tools like `ton_wallet_send`:
   - Require explicit `{ allowTransactions: true }` in config?
   - Always require user confirmation via MCP?
   - Or fully autonomous?

5. **SKILL.md Files**: The existing skills directory has SKILL.md files. Should I:
   - Use them as-is?
   - Enhance/standardize their format?
   - Create missing ones for positions without skills?

---

## Ready for Implementation

Once these questions are answered, I'm ready to begin Phase 1 implementation. The plan is designed to be implemented incrementally - each phase produces working functionality that can be tested before proceeding.
