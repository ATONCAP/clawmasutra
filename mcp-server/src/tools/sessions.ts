/**
 * Sessions Tools
 *
 * MCP tools for inter-agent communication and session management.
 * These tools are primarily used by agents during collaboration,
 * but can also be called directly for debugging/monitoring.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getOrchestrator, hasOrchestrator } from "../orchestrator/index.js";

type ToolResult = { content: Array<{ type: string; text: string }>; isError?: boolean };

const ok = (data: object): ToolResult => ({
  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
});

const err = (msg: string): ToolResult => ({
  content: [{ type: "text", text: msg }],
  isError: true,
});

export const sessionsTools: Tool[] = [
  {
    name: "sessions_send",
    description: "Send a message to another agent in a collaboration session. Used for inter-agent communication during position execution.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID (required when called externally; agents have this injected)",
        },
        from: {
          type: "string",
          description: "Sender agent ID (required when called externally; agents have this injected)",
        },
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
          description: "Message type - determines how the message should be processed",
        },
        content: {
          type: "object",
          description: "Message payload - can contain any structured data relevant to the message type",
        },
      },
      required: ["to", "type", "content"],
    },
  },
  {
    name: "sessions_list",
    description: "List active collaboration sessions and their agents. Shows session status, agents, and their current states.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Filter to a specific session (optional - shows all sessions if not provided)",
        },
      },
    },
  },
  {
    name: "sessions_history",
    description: "Get the message history for a collaboration session. Useful for reviewing inter-agent communication.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID to get history for",
        },
        limit: {
          type: "number",
          description: "Maximum number of messages to return (default: 50)",
        },
        agentId: {
          type: "string",
          description: "Filter to messages involving a specific agent (optional)",
        },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "sessions_agents",
    description: "Get detailed information about agents in a session",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID",
        },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "sessions_stats",
    description: "Get orchestrator statistics including active sessions, agents, and message counts",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

export async function handleSessionsTool(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<ToolResult> {
  // Check if orchestrator is initialized
  if (!hasOrchestrator()) {
    return err(
      "Orchestrator not initialized. Set ANTHROPIC_API_KEY environment variable and restart the server."
    );
  }

  const orchestrator = getOrchestrator();

  switch (name) {
    case "sessions_send": {
      const sessionId = args?.sessionId as string;
      const from = args?.from as string;
      const to = args?.to as string;
      const type = args?.type as string;
      const content = args?.content;

      if (!sessionId) {
        return err("sessionId is required when calling sessions_send externally");
      }
      if (!from) {
        return err("from (sender agent ID) is required when calling sessions_send externally");
      }
      if (!to) {
        return err("to (recipient) is required");
      }
      if (!type) {
        return err("type (message type) is required");
      }
      if (content === undefined) {
        return err("content (message payload) is required");
      }

      const result = orchestrator.sessionsSend(from, sessionId, to, type, content);

      if (result.success) {
        return ok({
          success: true,
          messageId: result.messageId,
          from,
          to,
          type,
        });
      } else {
        return err(result.error || "Failed to send message");
      }
    }

    case "sessions_list": {
      const filterSessionId = args?.sessionId as string | undefined;

      const sessions = orchestrator.listSessions();

      if (filterSessionId) {
        const session = sessions.find((s) => s.id === filterSessionId);
        if (!session) {
          return err(`Session not found: ${filterSessionId}`);
        }

        const info = orchestrator.sessionsList(filterSessionId);
        return ok({
          session: info,
          agentCount: session.agents.size,
          startedAt: session.startedAt.toISOString(),
          completedAt: session.completedAt?.toISOString(),
          config: session.config,
        });
      }

      return ok({
        count: sessions.length,
        sessions: sessions.map((s) => ({
          id: s.id,
          position: s.position.name,
          status: s.status,
          agentCount: s.agents.size,
          startedAt: s.startedAt.toISOString(),
        })),
      });
    }

    case "sessions_history": {
      const sessionId = args?.sessionId as string;
      const limit = (args?.limit as number) || 50;
      const agentId = args?.agentId as string | undefined;

      if (!sessionId) {
        return err("sessionId is required");
      }

      const history = orchestrator.sessionsHistory(sessionId, limit);

      // Filter by agent if specified
      let messages = history;
      if (agentId) {
        messages = history.filter(
          (m) => m.from === agentId || m.to === agentId || m.to === "all"
        );
      }

      return ok({
        sessionId,
        count: messages.length,
        messages: messages.map((m) => ({
          id: m.id,
          from: m.from,
          to: m.to,
          type: m.type,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
          acknowledged: m.acknowledged,
        })),
      });
    }

    case "sessions_agents": {
      const sessionId = args?.sessionId as string;

      if (!sessionId) {
        return err("sessionId is required");
      }

      const session = orchestrator.getSession(sessionId);
      if (!session) {
        return err(`Session not found: ${sessionId}`);
      }

      const agents = Array.from(session.agents.values()).map((agent) => ({
        id: agent.id,
        role: {
          name: agent.role.name,
          role: agent.role.role,
          personality: agent.role.personality,
        },
        status: agent.status,
        turnsCompleted: agent.turnsCompleted,
        tokensUsed: agent.tokensUsed,
        pendingMessages: agent.pendingMessages.length,
        conversationLength: agent.conversationHistory.length,
        createdAt: agent.createdAt.toISOString(),
        lastActivityAt: agent.lastActivityAt.toISOString(),
      }));

      return ok({
        sessionId,
        position: session.position.name,
        agentCount: agents.length,
        agents,
      });
    }

    case "sessions_stats": {
      const stats = orchestrator.getStats();

      return ok({
        orchestrator: {
          activeSessions: stats.activeSessions,
          totalAgents: stats.totalAgents,
        },
        messageBus: stats.messageStats,
        environment: {
          hasApiKey: !!process.env.ANTHROPIC_API_KEY,
          model: process.env.AGENT_MODEL || "claude-sonnet-4-20250514",
        },
      });
    }

    default:
      return err(`Unknown sessions tool: ${name}`);
  }
}
