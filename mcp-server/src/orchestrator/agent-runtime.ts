/**
 * Agent Runtime - Anthropic API Integration
 *
 * Spawns and executes Claude agents with tool access.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  Agent,
  AgentRole,
  AgentStatus,
  ConversationMessage,
  ToolCall,
  ToolResult,
  SkillDefinition,
  Session,
  SessionConfig,
  OrchestratorConfig,
  AGENT_AVAILABLE_TOOLS,
  GATED_TOOLS,
} from "./types.js";

// Tool handler function type - will be injected by orchestrator
export type ToolHandler = (
  agentId: string,
  sessionId: string,
  toolName: string,
  toolInput: Record<string, unknown>
) => Promise<{ result: string; isError: boolean }>;

interface AgentRuntimeConfig {
  anthropicApiKey: string;
  model: string;
  maxTokensPerTurn: number;
  timeoutMs: number;
}

export class AgentRuntime {
  private client: Anthropic;
  private config: AgentRuntimeConfig;
  private toolHandler: ToolHandler | null = null;
  private activeAgents: Map<string, Agent> = new Map();

  constructor(config: AgentRuntimeConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.anthropicApiKey,
    });
  }

  /**
   * Set the tool handler for processing agent tool calls
   */
  setToolHandler(handler: ToolHandler): void {
    this.toolHandler = handler;
  }

  /**
   * Create a new agent for a session
   */
  create(
    session: Session,
    role: AgentRole,
    agentIndex: number
  ): Agent {
    const agentId = `agent-${session.id}-${role.name.toLowerCase().replace(/\s+/g, "-")}-${agentIndex}`;

    const systemPrompt = this.buildSystemPrompt(role, session);

    const agent: Agent = {
      id: agentId,
      sessionId: session.id,
      role,
      systemPrompt,
      status: "initializing",
      conversationHistory: [],
      pendingMessages: [],
      tokensUsed: 0,
      turnsCompleted: 0,
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };

    this.activeAgents.set(agentId, agent);
    agent.status = "idle";

    return agent;
  }

  /**
   * Execute an agent turn - send input, get response with potential tool calls
   */
  async executeTurn(
    agent: Agent,
    input: string
  ): Promise<{
    response: string;
    toolCalls: ToolCall[];
    toolResults: ToolResult[];
    tokensUsed: number;
  }> {
    if (!this.toolHandler) {
      throw new Error("Tool handler not set. Call setToolHandler first.");
    }

    agent.status = "thinking";
    agent.lastActivityAt = new Date();

    // Add user message to history
    agent.conversationHistory.push({
      role: "user",
      content: input,
      timestamp: new Date(),
    });

    // Build messages array for API
    const messages = this.buildMessages(agent);

    // Build tool definitions
    const tools = this.buildToolDefinitions(agent.sessionId);

    let response: string = "";
    let toolCalls: ToolCall[] = [];
    let toolResults: ToolResult[] = [];
    let totalTokens = 0;

    // Execute turn with potential tool use loop
    let continueLoop = true;

    while (continueLoop) {
      const apiResponse = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokensPerTurn,
        system: agent.systemPrompt,
        messages,
        tools,
      });

      totalTokens += (apiResponse.usage?.input_tokens || 0) + (apiResponse.usage?.output_tokens || 0);

      // Process response content blocks
      const textBlocks: string[] = [];
      const newToolCalls: ToolCall[] = [];

      for (const block of apiResponse.content) {
        if (block.type === "text") {
          textBlocks.push(block.text);
        } else if (block.type === "tool_use") {
          newToolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          });
        }
      }

      response = textBlocks.join("\n");

      // If there are tool calls, execute them and continue the loop
      if (newToolCalls.length > 0) {
        agent.status = "executing_tool";
        toolCalls.push(...newToolCalls);

        // Add assistant message with tool calls
        messages.push({
          role: "assistant",
          content: apiResponse.content,
        });

        // Execute each tool call
        const toolResultBlocks: Array<{
          type: "tool_result";
          tool_use_id: string;
          content: string;
          is_error?: boolean;
        }> = [];

        for (const call of newToolCalls) {
          const result = await this.toolHandler(
            agent.id,
            agent.sessionId,
            call.name,
            call.input
          );

          toolResults.push({
            toolCallId: call.id,
            content: result.result,
            isError: result.isError,
          });

          toolResultBlocks.push({
            type: "tool_result",
            tool_use_id: call.id,
            content: result.result,
            is_error: result.isError,
          });
        }

        // Add tool results to messages
        messages.push({
          role: "user",
          content: toolResultBlocks,
        });

        agent.status = "thinking";
      } else {
        // No tool calls, we're done
        continueLoop = false;
      }

      // Check stop reason
      if (apiResponse.stop_reason === "end_turn" || apiResponse.stop_reason === "stop_sequence") {
        continueLoop = false;
      }
    }

    // Add final response to history
    agent.conversationHistory.push({
      role: "assistant",
      content: response,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      toolResults: toolResults.length > 0 ? toolResults : undefined,
      timestamp: new Date(),
    });

    agent.tokensUsed += totalTokens;
    agent.turnsCompleted += 1;
    agent.status = "idle";
    agent.lastActivityAt = new Date();

    return {
      response,
      toolCalls,
      toolResults,
      tokensUsed: totalTokens,
    };
  }

  /**
   * Get an agent by ID
   */
  getAgent(agentId: string): Agent | undefined {
    return this.activeAgents.get(agentId);
  }

  /**
   * List all agents for a session
   */
  getSessionAgents(sessionId: string): Agent[] {
    const agents: Agent[] = [];
    for (const agent of this.activeAgents.values()) {
      if (agent.sessionId === sessionId) {
        agents.push(agent);
      }
    }
    return agents;
  }

  /**
   * Destroy an agent
   */
  destroy(agentId: string): void {
    const agent = this.activeAgents.get(agentId);
    if (agent) {
      agent.status = "completed";
      this.activeAgents.delete(agentId);
    }
  }

  /**
   * Destroy all agents for a session
   */
  destroySession(sessionId: string): void {
    for (const [agentId, agent] of this.activeAgents.entries()) {
      if (agent.sessionId === sessionId) {
        agent.status = "completed";
        this.activeAgents.delete(agentId);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private buildSystemPrompt(role: AgentRole, session: Session): string {
    const skill = session.skill;
    const config = session.config;

    const otherAgents = skill.agents
      .filter((a) => a.name !== role.name)
      .map((a) => `${a.name} (${a.role})`)
      .join(", ");

    const workflowSteps = skill.workflow
      .map((phase, i) => {
        const steps = phase.steps.length > 0
          ? phase.steps.map((s, j) => `   ${j + 1}. ${s}`).join("\n")
          : `   - ${phase.description}`;
        return `${i + 1}. **${phase.name}**:\n${steps}`;
      })
      .join("\n");

    const protocols = skill.communicationProtocol
      .map((p) => `- ${p.type}: ${p.description}`)
      .join("\n");

    const responsibilities = role.responsibilities.length > 0
      ? role.responsibilities.map((r) => `- ${r}`).join("\n")
      : "- Execute your role in the collaboration";

    const targetInfo = config.target
      ? `\n## Target\n${config.target}`
      : "";

    const networkInfo = config.network
      ? `\n## Network\nUsing TON ${config.network}`
      : "";

    return `You are **${role.name}**, an AI agent participating in a Clawmasutra "${skill.title}" collaboration.

## Your Role
${role.role}

## Your Personality
${role.personality}

## Your Responsibilities
${responsibilities}

## Current Session
- Session ID: ${session.id}
- Position: ${skill.position} (${skill.title})
- Category: ${session.position.category}
${targetInfo}${networkInfo}

## Other Agents in This Session
${otherAgents || "You are working solo in this position."}

## Workflow
${workflowSteps}

## Communication Protocol
Use \`sessions_send\` to communicate with other agents.
Valid message types:
${protocols}

## Available Tools

### Communication
- \`sessions_send\` - Send message to another agent or broadcast to all
- \`sessions_list\` - List agents in the session
- \`sessions_history\` - Get message history

### Observation
- \`gallery_emit\` - Report activity to the visual UI (use for important actions and progress updates)

### Blockchain (Read)
- \`ton_wallet_balance\` - Check wallet balance
- \`ton_wallet_transactions\` - Get transaction history
- \`ton_contract_get_info\` - Get contract information
- \`ton_contract_call_getter\` - Call contract getter methods
- \`ton_contract_jetton_info\` - Get Jetton token info
- \`ton_contract_nft_info\` - Get NFT info

${config.allowTransactions ? `### Blockchain (Write) - ENABLED
- \`ton_wallet_send\` - Send TON (USE WITH CAUTION)` : ""}

## Guidelines

1. **Stay in character** as ${role.name} - embody your personality
2. **Follow the workflow** phases in order
3. **Communicate** with other agents using \`sessions_send\` and the message types above
4. **Report progress** using \`gallery_emit\` so the UI shows your activity
5. **Be autonomous** - make decisions and take actions within your role
6. **Coordinate** with other agents - wait for their responses when needed
7. **Complete your responsibilities** before signaling completion

## Philosophy
"${skill.philosophy}"

Begin your work. If this is your first turn, acknowledge your role and prepare for your responsibilities.`;
  }

  private buildMessages(agent: Agent): Anthropic.MessageParam[] {
    const messages: Anthropic.MessageParam[] = [];

    for (const msg of agent.conversationHistory) {
      if (msg.role === "user") {
        messages.push({
          role: "user",
          content: msg.content,
        });
      } else if (msg.role === "assistant") {
        // Reconstruct assistant message with tool calls if present
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          const content: Anthropic.ContentBlockParam[] = [];

          if (msg.content) {
            content.push({ type: "text", text: msg.content });
          }

          for (const call of msg.toolCalls) {
            content.push({
              type: "tool_use",
              id: call.id,
              name: call.name,
              input: call.input,
            });
          }

          messages.push({ role: "assistant", content });

          // Add tool results
          if (msg.toolResults && msg.toolResults.length > 0) {
            const results: Array<{
              type: "tool_result";
              tool_use_id: string;
              content: string;
              is_error?: boolean;
            }> = msg.toolResults.map((r) => ({
              type: "tool_result" as const,
              tool_use_id: r.toolCallId,
              content: r.content,
              is_error: r.isError,
            }));

            messages.push({ role: "user", content: results });
          }
        } else {
          messages.push({
            role: "assistant",
            content: msg.content,
          });
        }
      }
    }

    return messages;
  }

  private buildToolDefinitions(sessionId: string): Anthropic.Tool[] {
    // Get session to check config
    const session = this.getSessionForAgent(sessionId);
    const allowTransactions = session?.config.allowTransactions || false;

    const tools: Anthropic.Tool[] = [];

    // Sessions tools
    tools.push({
      name: "sessions_send",
      description: "Send a message to another agent in this collaboration session. Use this to coordinate with other agents.",
      input_schema: {
        type: "object" as const,
        properties: {
          to: {
            type: "string",
            description: "Target agent ID, or 'all' to broadcast to all agents in the session",
          },
          type: {
            type: "string",
            enum: [
              "READY_TO_SHARE",
              "RESULTS",
              "ACKNOWLEDGE",
              "DISCREPANCY",
              "CONSENSUS",
              "ESCALATE",
              "INSTRUCTION",
              "QUERY",
              "RESPONSE",
              "PYRAMID_ASSIGN",
              "PYRAMID_REPORT",
              "STATUS_UPDATE",
              "COMPLETE",
            ],
            description: "Message type",
          },
          content: {
            type: "object",
            description: "Message payload - can contain any structured data",
          },
        },
        required: ["to", "type", "content"],
      },
    });

    tools.push({
      name: "sessions_list",
      description: "List all agents in the current collaboration session",
      input_schema: {
        type: "object" as const,
        properties: {},
      },
    });

    tools.push({
      name: "sessions_history",
      description: "Get the message history for this session",
      input_schema: {
        type: "object" as const,
        properties: {
          limit: {
            type: "number",
            description: "Maximum number of messages to return (default: 50)",
          },
        },
      },
    });

    // Gallery tool
    tools.push({
      name: "gallery_emit",
      description: "Emit an event to the visual gallery UI. Use this to report your progress and actions.",
      input_schema: {
        type: "object" as const,
        properties: {
          type: {
            type: "string",
            enum: ["agent_message", "agent_action", "blockchain_tx", "position_update", "system"],
            description: "Type of event",
          },
          data: {
            type: "object",
            description: "Event data payload",
          },
        },
        required: ["type", "data"],
      },
    });

    // TON read tools
    tools.push({
      name: "ton_wallet_balance",
      description: "Get the TON balance of a wallet address",
      input_schema: {
        type: "object" as const,
        properties: {
          address: {
            type: "string",
            description: "TON wallet address",
          },
        },
        required: ["address"],
      },
    });

    tools.push({
      name: "ton_wallet_transactions",
      description: "Get recent transactions for a wallet address",
      input_schema: {
        type: "object" as const,
        properties: {
          address: {
            type: "string",
            description: "TON wallet address",
          },
          limit: {
            type: "number",
            description: "Maximum number of transactions to return (default: 20)",
          },
        },
        required: ["address"],
      },
    });

    tools.push({
      name: "ton_contract_get_info",
      description: "Get information about a TON smart contract",
      input_schema: {
        type: "object" as const,
        properties: {
          address: {
            type: "string",
            description: "Contract address",
          },
        },
        required: ["address"],
      },
    });

    tools.push({
      name: "ton_contract_call_getter",
      description: "Call a getter method on a TON smart contract",
      input_schema: {
        type: "object" as const,
        properties: {
          address: {
            type: "string",
            description: "Contract address",
          },
          method: {
            type: "string",
            description: "Getter method name",
          },
          args: {
            type: "array",
            description: "Arguments to pass to the getter",
          },
        },
        required: ["address", "method"],
      },
    });

    tools.push({
      name: "ton_contract_jetton_info",
      description: "Get information about a Jetton token",
      input_schema: {
        type: "object" as const,
        properties: {
          masterAddress: {
            type: "string",
            description: "Jetton master contract address",
          },
        },
        required: ["masterAddress"],
      },
    });

    tools.push({
      name: "ton_contract_nft_info",
      description: "Get information about an NFT or NFT collection",
      input_schema: {
        type: "object" as const,
        properties: {
          address: {
            type: "string",
            description: "NFT item or collection address",
          },
        },
        required: ["address"],
      },
    });

    // Gated tools (only if allowed)
    if (allowTransactions) {
      tools.push({
        name: "ton_wallet_send",
        description: "Send TON to an address. WARNING: This executes a real blockchain transaction!",
        input_schema: {
          type: "object" as const,
          properties: {
            to: {
              type: "string",
              description: "Recipient address",
            },
            amount: {
              type: "string",
              description: "Amount in TON (e.g., '1.5')",
            },
            comment: {
              type: "string",
              description: "Optional transaction comment",
            },
          },
          required: ["to", "amount"],
        },
      });
    }

    return tools;
  }

  private getSessionForAgent(sessionId: string): Session | undefined {
    // This is a bit of a circular dependency workaround
    // The orchestrator should inject session info or we need a different approach
    // For now, return undefined and handle in buildToolDefinitions
    return undefined;
  }
}

// Export factory
let runtimeInstance: AgentRuntime | null = null;

export function getAgentRuntime(config?: AgentRuntimeConfig): AgentRuntime {
  if (!runtimeInstance && config) {
    runtimeInstance = new AgentRuntime(config);
  }
  if (!runtimeInstance) {
    throw new Error("AgentRuntime not initialized. Provide config on first call.");
  }
  return runtimeInstance;
}

export function initAgentRuntime(config: AgentRuntimeConfig): AgentRuntime {
  runtimeInstance = new AgentRuntime(config);
  return runtimeInstance;
}
