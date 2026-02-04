/**
 * Clawmasutra Orchestrator
 *
 * Central coordinator for multi-agent collaboration sessions.
 */

import * as path from "path";
import {
  Session,
  SessionConfig,
  SessionStatus,
  SessionResult,
  Position,
  Agent,
  AgentMessage,
  GalleryEvent,
  OrchestratorConfig,
  DEFAULT_CONFIG,
  AGENT_AVAILABLE_TOOLS,
  GATED_TOOLS,
} from "./types.js";
import { SkillLoader, getSkillLoader } from "./skill-loader.js";
import { MessageBus, getMessageBus, validateMessage } from "./message-bus.js";
import { AgentRuntime, initAgentRuntime, ToolHandler } from "./agent-runtime.js";

// Tool handlers from existing MCP tools
type MCPToolHandler = (
  name: string,
  args: Record<string, unknown> | undefined
) => Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }>;

export class Orchestrator {
  private config: OrchestratorConfig;
  private skillLoader: SkillLoader;
  private messageBus: MessageBus;
  private agentRuntime: AgentRuntime;
  private sessions: Map<string, Session> = new Map();
  private mcpToolHandlers: Map<string, MCPToolHandler> = new Map();
  private galleryEmitter: ((event: Omit<GalleryEvent, "id" | "timestamp">) => void) | null = null;

  constructor(config: Partial<OrchestratorConfig> & { anthropicApiKey: string }) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize skill loader
    const skillsPath = path.resolve(process.cwd(), this.config.skillsPath);
    this.skillLoader = getSkillLoader(skillsPath);

    // Initialize message bus
    this.messageBus = getMessageBus(this.config.sessionMaxMessages);

    // Initialize agent runtime
    this.agentRuntime = initAgentRuntime({
      anthropicApiKey: this.config.anthropicApiKey,
      model: this.config.model,
      maxTokensPerTurn: this.config.maxTokensPerTurn,
      timeoutMs: this.config.agentTimeoutMs,
    });

    // Set up tool handler for agents
    this.agentRuntime.setToolHandler(this.handleAgentToolCall.bind(this));

    // Subscribe to message bus for gallery emission
    this.messageBus.subscribe((message) => {
      this.emitGalleryEvent({
        type: "agent_message",
        sessionId: message.sessionId,
        agentId: message.from,
        data: {
          messageType: message.type,
          to: message.to,
          content: message.content,
        },
      });
    });
  }

  /**
   * Register MCP tool handlers for agent tool calls
   */
  registerToolHandler(toolPrefix: string, handler: MCPToolHandler): void {
    this.mcpToolHandlers.set(toolPrefix, handler);
  }

  /**
   * Set gallery event emitter
   */
  setGalleryEmitter(emitter: (event: Omit<GalleryEvent, "id" | "timestamp">) => void): void {
    this.galleryEmitter = emitter;
  }

  /**
   * Create and start a new collaboration session
   */
  async createSession(
    position: Position,
    config: SessionConfig = {}
  ): Promise<Session> {
    const sessionId = `${position.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Load skill definition
    const skill = this.skillLoader.load(position);

    const session: Session = {
      id: sessionId,
      position,
      skill,
      config,
      status: "initializing",
      agents: new Map(),
      startedAt: new Date(),
    };

    this.sessions.set(sessionId, session);

    // Emit session start event
    this.emitGalleryEvent({
      type: "position_update",
      sessionId,
      data: {
        status: "initializing",
        position: position.name,
        title: skill.title,
        agentCount: position.agents,
      },
    });

    // Spawn agents
    session.status = "spawning_agents";
    await this.spawnAgents(session);

    // Start orchestration
    session.status = "running";
    this.emitGalleryEvent({
      type: "position_update",
      sessionId,
      data: {
        status: "running",
        position: position.name,
        agents: Array.from(session.agents.values()).map((a) => ({
          id: a.id,
          role: a.role.name,
          status: a.status,
        })),
      },
    });

    // Begin agent execution (non-blocking)
    this.runSession(session).catch((error) => {
      session.status = "error";
      session.error = error instanceof Error ? error.message : String(error);
      this.emitGalleryEvent({
        type: "system",
        sessionId,
        data: {
          error: session.error,
          status: "error",
        },
      });
    });

    return session;
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * List all active sessions
   */
  listSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Stop a session
   */
  async stopSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = "stopped";
    session.completedAt = new Date();

    // Destroy all agents
    this.agentRuntime.destroySession(sessionId);

    // Clear messages
    this.messageBus.clearSession(sessionId);

    this.emitGalleryEvent({
      type: "position_update",
      sessionId,
      data: {
        status: "stopped",
        position: session.position.name,
      },
    });
  }

  /**
   * Send a message from external source (user or system) to an agent
   */
  async sendToAgent(sessionId: string, agentId: string, message: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const agent = session.agents.get(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);

    // Add to pending messages
    agent.pendingMessages.push({
      id: `user-${Date.now()}`,
      from: "user",
      to: agentId,
      sessionId,
      type: "INSTRUCTION",
      content: message,
      timestamp: new Date(),
      acknowledged: false,
    });
  }

  /**
   * Get session statistics
   */
  getStats(): {
    activeSessions: number;
    totalAgents: number;
    messageStats: ReturnType<MessageBus["getStats"]>;
  } {
    let totalAgents = 0;
    for (const session of this.sessions.values()) {
      totalAgents += session.agents.size;
    }

    return {
      activeSessions: this.sessions.size,
      totalAgents,
      messageStats: this.messageBus.getStats(),
    };
  }

  // -------------------------------------------------------------------------
  // Session Tools (called by agents)
  // -------------------------------------------------------------------------

  /**
   * Handle sessions_send from an agent
   */
  sessionsSend(
    fromAgentId: string,
    sessionId: string,
    to: string,
    type: string,
    content: unknown
  ): { success: boolean; messageId?: string; error?: string } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, error: `Session not found: ${sessionId}` };
    }

    // Validate message
    const validation = validateMessage({
      from: fromAgentId,
      to,
      sessionId,
      type: type as AgentMessage["type"],
      content,
    });

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Handle broadcast
    if (to === "all") {
      for (const agent of session.agents.values()) {
        if (agent.id !== fromAgentId) {
          this.messageBus.send({
            from: fromAgentId,
            to: agent.id,
            sessionId,
            type: type as AgentMessage["type"],
            content,
          });
        }
      }
      return { success: true, messageId: `broadcast-${Date.now()}` };
    }

    // Direct message
    const message = this.messageBus.send({
      from: fromAgentId,
      to,
      sessionId,
      type: type as AgentMessage["type"],
      content,
    });

    return { success: true, messageId: message.id };
  }

  /**
   * Handle sessions_list from an agent
   */
  sessionsList(sessionId: string): {
    sessionId: string;
    position: string;
    status: SessionStatus;
    agents: Array<{
      id: string;
      role: string;
      status: string;
    }>;
  } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      sessionId: session.id,
      position: session.position.name,
      status: session.status,
      agents: Array.from(session.agents.values()).map((a) => ({
        id: a.id,
        role: a.role.name,
        status: a.status,
      })),
    };
  }

  /**
   * Handle sessions_history from an agent
   */
  sessionsHistory(
    sessionId: string,
    limit?: number
  ): AgentMessage[] {
    return this.messageBus.getSessionHistory(sessionId, limit);
  }

  // -------------------------------------------------------------------------
  // Private methods
  // -------------------------------------------------------------------------

  private async spawnAgents(session: Session): Promise<void> {
    const roles = session.skill.agents;

    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      const agent = this.agentRuntime.create(session, role, i);
      session.agents.set(agent.id, agent);

      this.emitGalleryEvent({
        type: "system",
        sessionId: session.id,
        agentId: agent.id,
        data: {
          event: "agent_spawned",
          role: role.name,
          personality: role.personality,
        },
      });
    }
  }

  private async runSession(session: Session): Promise<void> {
    const category = session.position.category;

    // Route to category-specific orchestration
    switch (category) {
      case "solo":
        await this.runSoloSession(session);
        break;
      case "duet":
        await this.runDuetSession(session);
        break;
      case "group":
        await this.runGroupSession(session);
        break;
      case "crypto":
        await this.runCryptoSession(session);
        break;
      case "healing":
        await this.runHealingSession(session);
        break;
      default:
        await this.runGenericSession(session);
    }
  }

  private async runSoloSession(session: Session): Promise<void> {
    const agent = Array.from(session.agents.values())[0];
    if (!agent) return;

    const initialPrompt = this.buildInitialPrompt(session, agent);

    // Execute agent turns until completion
    let turnCount = 0;
    const maxTurns = 20;

    while (session.status === "running" && turnCount < maxTurns) {
      const input = turnCount === 0
        ? initialPrompt
        : this.buildContinuationPrompt(agent);

      const result = await this.agentRuntime.executeTurn(agent, input);

      this.emitGalleryEvent({
        type: "agent_message",
        sessionId: session.id,
        agentId: agent.id,
        data: {
          turn: turnCount + 1,
          response: result.response.slice(0, 500),
          toolsUsed: result.toolCalls.map((t) => t.name),
          tokensUsed: result.tokensUsed,
        },
      });

      // Check for completion signals
      if (this.isSessionComplete(session, result.response)) {
        break;
      }

      turnCount++;
    }

    this.completeSession(session);
  }

  private async runDuetSession(session: Session): Promise<void> {
    const agents = Array.from(session.agents.values());
    if (agents.length < 2) return;

    const [agentA, agentB] = agents;

    // Initialize both agents
    const initPromptA = this.buildInitialPrompt(session, agentA);
    const initPromptB = this.buildInitialPrompt(session, agentB);

    // Phase 1: Initialization - both agents acknowledge
    await Promise.all([
      this.agentRuntime.executeTurn(agentA, initPromptA),
      this.agentRuntime.executeTurn(agentB, initPromptB),
    ]);

    // Phase 2: Parallel work - both agents execute independently
    let turnCount = 0;
    const maxTurns = 15;

    while (session.status === "running" && turnCount < maxTurns) {
      // Check for pending messages and continue
      const promptA = this.buildTurnPrompt(agentA);
      const promptB = this.buildTurnPrompt(agentB);

      const [resultA, resultB] = await Promise.all([
        this.agentRuntime.executeTurn(agentA, promptA),
        this.agentRuntime.executeTurn(agentB, promptB),
      ]);

      // Emit progress
      for (const [agent, result] of [[agentA, resultA], [agentB, resultB]] as const) {
        this.emitGalleryEvent({
          type: "agent_message",
          sessionId: session.id,
          agentId: agent.id,
          data: {
            turn: turnCount + 1,
            response: result.response.slice(0, 500),
            toolsUsed: result.toolCalls.map((t) => t.name),
          },
        });
      }

      // Check for completion
      if (
        this.isSessionComplete(session, resultA.response) &&
        this.isSessionComplete(session, resultB.response)
      ) {
        break;
      }

      turnCount++;
    }

    this.completeSession(session);
  }

  private async runGroupSession(session: Session): Promise<void> {
    const agents = Array.from(session.agents.values());
    if (agents.length === 0) return;

    // Check if pyramid structure (has Oracle)
    const oracle = agents.find((a) => a.role.name === "Oracle");
    if (oracle) {
      await this.runPyramidSession(session, oracle, agents.filter((a) => a !== oracle));
      return;
    }

    // Generic group: round-robin turns
    // Initialize all agents
    await Promise.all(
      agents.map((agent) =>
        this.agentRuntime.executeTurn(agent, this.buildInitialPrompt(session, agent))
      )
    );

    // Round-robin execution
    let turnCount = 0;
    const maxTurns = 20;

    while (session.status === "running" && turnCount < maxTurns) {
      for (const agent of agents) {
        if (session.status !== "running") break;

        const prompt = this.buildTurnPrompt(agent);
        const result = await this.agentRuntime.executeTurn(agent, prompt);

        this.emitGalleryEvent({
          type: "agent_message",
          sessionId: session.id,
          agentId: agent.id,
          data: {
            turn: turnCount + 1,
            response: result.response.slice(0, 500),
          },
        });

        if (this.isSessionComplete(session, result.response)) {
          break;
        }
      }

      turnCount++;
    }

    this.completeSession(session);
  }

  private async runPyramidSession(
    session: Session,
    oracle: Agent,
    workers: Agent[]
  ): Promise<void> {
    // Oracle decomposes the task
    const oracleInit = await this.agentRuntime.executeTurn(
      oracle,
      this.buildInitialPrompt(session, oracle)
    );

    this.emitGalleryEvent({
      type: "agent_message",
      sessionId: session.id,
      agentId: oracle.id,
      data: {
        phase: "decomposition",
        response: oracleInit.response.slice(0, 500),
      },
    });

    // Initialize workers
    await Promise.all(
      workers.map((worker) =>
        this.agentRuntime.executeTurn(worker, this.buildInitialPrompt(session, worker))
      )
    );

    // Execution loop
    let turnCount = 0;
    const maxTurns = 25;

    while (session.status === "running" && turnCount < maxTurns) {
      // Workers execute their tasks
      const workerResults = await Promise.all(
        workers.map((worker) =>
          this.agentRuntime.executeTurn(worker, this.buildTurnPrompt(worker))
        )
      );

      for (let i = 0; i < workers.length; i++) {
        this.emitGalleryEvent({
          type: "agent_message",
          sessionId: session.id,
          agentId: workers[i].id,
          data: {
            turn: turnCount + 1,
            response: workerResults[i].response.slice(0, 300),
          },
        });
      }

      // Oracle processes and synthesizes
      const oracleResult = await this.agentRuntime.executeTurn(
        oracle,
        this.buildTurnPrompt(oracle)
      );

      this.emitGalleryEvent({
        type: "agent_message",
        sessionId: session.id,
        agentId: oracle.id,
        data: {
          turn: turnCount + 1,
          phase: "synthesis",
          response: oracleResult.response.slice(0, 500),
        },
      });

      if (this.isSessionComplete(session, oracleResult.response)) {
        break;
      }

      turnCount++;
    }

    this.completeSession(session);
  }

  private async runCryptoSession(session: Session): Promise<void> {
    // Crypto positions follow duet/group patterns with blockchain focus
    if (session.position.agents <= 2) {
      await this.runDuetSession(session);
    } else {
      await this.runGroupSession(session);
    }
  }

  private async runHealingSession(session: Session): Promise<void> {
    // Healing positions are typically solo
    await this.runSoloSession(session);
  }

  private async runGenericSession(session: Session): Promise<void> {
    const agentCount = session.agents.size;
    if (agentCount === 1) {
      await this.runSoloSession(session);
    } else if (agentCount === 2) {
      await this.runDuetSession(session);
    } else {
      await this.runGroupSession(session);
    }
  }

  private buildInitialPrompt(session: Session, agent: Agent): string {
    const config = session.config;
    let prompt = `The "${session.skill.title}" collaboration has begun.\n\n`;

    prompt += `You are ${agent.role.name}. `;
    prompt += `Your role: ${agent.role.role}.\n\n`;

    if (config.target) {
      prompt += `**Target**: ${config.target}\n\n`;
    }

    prompt += `Begin your work according to the workflow. `;
    prompt += `Use \`gallery_emit\` to report your progress. `;

    if (session.agents.size > 1) {
      prompt += `Coordinate with other agents using \`sessions_send\`.\n\n`;
      prompt += `Other agents in this session:\n`;
      for (const otherAgent of session.agents.values()) {
        if (otherAgent.id !== agent.id) {
          prompt += `- ${otherAgent.role.name} (${otherAgent.id})\n`;
        }
      }
    }

    prompt += `\nAcknowledge your role and begin Phase 1 of the workflow.`;

    return prompt;
  }

  private buildContinuationPrompt(agent: Agent): string {
    // Check for pending messages
    const messages = this.messageBus.receive(agent.id);

    if (messages.length > 0) {
      let prompt = "You have received messages from other agents:\n\n";
      for (const msg of messages) {
        prompt += `**From ${msg.from}** (${msg.type}):\n`;
        prompt += `${JSON.stringify(msg.content, null, 2)}\n\n`;
      }
      prompt += "Process these messages and continue your work.";
      return prompt;
    }

    return "Continue with the next phase of your work. If you have completed all phases, send a COMPLETE message and summarize your findings.";
  }

  private buildTurnPrompt(agent: Agent): string {
    const messages = this.messageBus.receive(agent.id);

    if (messages.length > 0) {
      let prompt = "Messages received:\n\n";
      for (const msg of messages) {
        prompt += `[${msg.type}] From ${msg.from}: ${JSON.stringify(msg.content)}\n`;
      }
      prompt += "\nRespond appropriately and continue your work.";
      return prompt;
    }

    return "Continue your work. Check if you need to wait for other agents, or proceed to the next step.";
  }

  private isSessionComplete(session: Session, response: string): boolean {
    const lowerResponse = response.toLowerCase();

    // Check for completion signals
    const completionSignals = [
      "workflow complete",
      "session complete",
      "collaboration complete",
      "all phases complete",
      "mission accomplished",
      "final report",
    ];

    for (const signal of completionSignals) {
      if (lowerResponse.includes(signal)) {
        return true;
      }
    }

    // Check if all agents have sent COMPLETE messages
    const history = this.messageBus.getSessionHistory(session.id);
    const completeMessages = history.filter((m) => m.type === "COMPLETE");
    if (completeMessages.length >= session.agents.size) {
      return true;
    }

    return false;
  }

  private completeSession(session: Session): void {
    session.status = "completed";
    session.completedAt = new Date();

    this.emitGalleryEvent({
      type: "position_update",
      sessionId: session.id,
      data: {
        status: "completed",
        position: session.position.name,
        duration: `${Math.floor((session.completedAt.getTime() - session.startedAt.getTime()) / 1000)}s`,
        agentStats: Array.from(session.agents.values()).map((a) => ({
          id: a.id,
          role: a.role.name,
          turns: a.turnsCompleted,
          tokens: a.tokensUsed,
        })),
      },
    });
  }

  private async handleAgentToolCall(
    agentId: string,
    sessionId: string,
    toolName: string,
    toolInput: Record<string, unknown>
  ): Promise<{ result: string; isError: boolean }> {
    // Handle sessions_* tools internally
    if (toolName === "sessions_send") {
      const result = this.sessionsSend(
        agentId,
        sessionId,
        toolInput.to as string,
        toolInput.type as string,
        toolInput.content
      );
      return {
        result: JSON.stringify(result, null, 2),
        isError: !result.success,
      };
    }

    if (toolName === "sessions_list") {
      const result = this.sessionsList(sessionId);
      return {
        result: JSON.stringify(result, null, 2),
        isError: result === null,
      };
    }

    if (toolName === "sessions_history") {
      const result = this.sessionsHistory(sessionId, toolInput.limit as number);
      return {
        result: JSON.stringify({ count: result.length, messages: result }, null, 2),
        isError: false,
      };
    }

    // Handle gallery_emit specially - inject sessionId and agentId
    if (toolName === "gallery_emit") {
      const eventType = toolInput.type as GalleryEvent["type"];
      const data = toolInput.data as Record<string, unknown>;

      this.emitGalleryEvent({
        type: eventType,
        sessionId,
        agentId,
        data,
      });

      return {
        result: JSON.stringify({ success: true, emitted: true }),
        isError: false,
      };
    }

    // Route to MCP tool handlers
    const toolPrefix = toolName.split("_").slice(0, -1).join("_") + "_";
    const handler = this.mcpToolHandlers.get(toolPrefix);

    if (handler) {
      const mcpResult = await handler(toolName, toolInput);
      const text = mcpResult.content[0]?.text || "";
      return {
        result: text,
        isError: mcpResult.isError || false,
      };
    }

    return {
      result: `Unknown tool: ${toolName}`,
      isError: true,
    };
  }

  private emitGalleryEvent(event: Omit<GalleryEvent, "id" | "timestamp">): void {
    if (this.galleryEmitter) {
      this.galleryEmitter(event);
    }
  }
}

// ============================================================================
// Singleton export
// ============================================================================

let orchestratorInstance: Orchestrator | null = null;

export function initOrchestrator(
  config: Partial<OrchestratorConfig> & { anthropicApiKey: string }
): Orchestrator {
  orchestratorInstance = new Orchestrator(config);
  return orchestratorInstance;
}

export function getOrchestrator(): Orchestrator {
  if (!orchestratorInstance) {
    throw new Error("Orchestrator not initialized. Call initOrchestrator first.");
  }
  return orchestratorInstance;
}

export function hasOrchestrator(): boolean {
  return orchestratorInstance !== null;
}

// Re-export types
export * from "./types.js";
export { SkillLoader, getSkillLoader } from "./skill-loader.js";
export { MessageBus, getMessageBus } from "./message-bus.js";
export { AgentRuntime, getAgentRuntime } from "./agent-runtime.js";
