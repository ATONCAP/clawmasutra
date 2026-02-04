/**
 * Clawmasutra Orchestrator Type Definitions
 *
 * Core types for multi-agent collaboration orchestration.
 */

// ============================================================================
// Position & Category Types
// ============================================================================

export type Category = "solo" | "duet" | "group" | "crypto" | "healing";

export interface Position {
  name: string;
  path: string;
  description: string;
  agents: number;
  category: Category;
}

// ============================================================================
// Skill Definition (parsed from SKILL.md)
// ============================================================================

export interface AgentRole {
  name: string;
  role: string;
  personality: string;
  responsibilities: string[];
}

export interface WorkflowPhase {
  name: string;
  description: string;
  steps: string[];
}

export interface CommunicationProtocol {
  type: string;
  description: string;
}

export interface SkillDefinition {
  position: string;
  title: string;
  overview: string;
  agents: AgentRole[];
  workflow: WorkflowPhase[];
  communicationProtocol: CommunicationProtocol[];
  toolsUsed: string[];
  philosophy: string;
  rawContent: string;
}

// ============================================================================
// Session State
// ============================================================================

export type SessionStatus =
  | "initializing"
  | "spawning_agents"
  | "running"
  | "completing"
  | "completed"
  | "error"
  | "timeout"
  | "stopped";

export interface SessionConfig {
  target?: string;
  network?: "mainnet" | "testnet";
  duration?: number;
  allowTransactions?: boolean;
  maxTokensPerAgent?: number;
}

export interface Session {
  id: string;
  position: Position;
  skill: SkillDefinition;
  config: SessionConfig;
  status: SessionStatus;
  agents: Map<string, Agent>;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  result?: SessionResult;
}

export interface SessionResult {
  success: boolean;
  summary: string;
  agentOutputs: Map<string, unknown>;
  consensusReached?: boolean;
  discrepancies?: string[];
}

// ============================================================================
// Agent Types
// ============================================================================

export type AgentStatus =
  | "initializing"
  | "idle"
  | "thinking"
  | "executing_tool"
  | "waiting_for_message"
  | "completed"
  | "error";

export interface Agent {
  id: string;
  sessionId: string;
  role: AgentRole;
  systemPrompt: string;
  status: AgentStatus;
  conversationHistory: ConversationMessage[];
  pendingMessages: AgentMessage[];
  tokensUsed: number;
  turnsCompleted: number;
  createdAt: Date;
  lastActivityAt: Date;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  timestamp: Date;
}

// ============================================================================
// Tool Call Types
// ============================================================================

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  content: string;
  isError: boolean;
}

// ============================================================================
// Inter-Agent Messaging
// ============================================================================

export type MessageType =
  | "READY_TO_SHARE"
  | "RESULTS"
  | "ACKNOWLEDGE"
  | "DISCREPANCY"
  | "CONSENSUS"
  | "ESCALATE"
  | "INSTRUCTION"
  | "QUERY"
  | "RESPONSE"
  | "PYRAMID_ASSIGN"
  | "PYRAMID_REPORT"
  | "STATUS_UPDATE"
  | "COMPLETE";

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  sessionId: string;
  type: MessageType;
  content: unknown;
  timestamp: Date;
  acknowledged: boolean;
}

// ============================================================================
// Gallery Events
// ============================================================================

export type GalleryEventType =
  | "agent_message"
  | "agent_action"
  | "blockchain_tx"
  | "position_update"
  | "system";

export interface GalleryEvent {
  id: string;
  timestamp: Date;
  type: GalleryEventType;
  sessionId: string;
  agentId?: string;
  data: Record<string, unknown>;
}

// ============================================================================
// Configuration
// ============================================================================

export interface OrchestratorConfig {
  anthropicApiKey: string;
  model: string;
  maxTokensPerTurn: number;
  agentTimeoutMs: number;
  sessionMaxAgents: number;
  sessionMaxMessages: number;
  galleryServerUrl: string;
  skillsPath: string;
}

export const DEFAULT_CONFIG: Omit<OrchestratorConfig, "anthropicApiKey"> = {
  model: "claude-sonnet-4-20250514",
  maxTokensPerTurn: 4096,
  agentTimeoutMs: 300000, // 5 minutes
  sessionMaxAgents: 10,
  sessionMaxMessages: 1000,
  galleryServerUrl: process.env.GALLERY_WS_URL || "http://localhost:3001",
  skillsPath: process.env.CLAWMASUTRA_SKILLS_PATH || "../skills",
};

// ============================================================================
// Tool Definitions for Agents
// ============================================================================

export interface AgentToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

// Tools available to agents during execution
export const AGENT_AVAILABLE_TOOLS: string[] = [
  // Inter-agent communication
  "sessions_send",
  "sessions_list",
  "sessions_history",

  // Gallery events
  "gallery_emit",

  // Blockchain read operations
  "ton_wallet_balance",
  "ton_wallet_transactions",
  "ton_contract_get_info",
  "ton_contract_call_getter",
  "ton_contract_get_state",
  "ton_contract_jetton_info",
  "ton_contract_nft_info",

  // Blockchain write operations (gated)
  // "ton_wallet_send", // Only if config.allowTransactions = true
];

export const GATED_TOOLS: string[] = [
  "ton_wallet_send",
];
