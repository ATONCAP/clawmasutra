/**
 * Position Tools
 *
 * MCP tools for invoking and managing Clawmasutra collaboration positions.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import {
  getOrchestrator,
  hasOrchestrator,
  Position,
  SessionConfig,
  Category,
} from "../orchestrator/index.js";

type ToolResult = { content: Array<{ type: string; text: string }>; isError?: boolean };

// Position definitions
const POSITIONS: Record<string, Position> = {
  // Solo
  contemplator: { name: "contemplator", path: "positions/solo/contemplator", description: "Single agent deep-diving into blockchain data", agents: 1, category: "solo" },
  wanderer: { name: "wanderer", path: "positions/solo/wanderer", description: "Exploratory agent scanning for opportunities", agents: 1, category: "solo" },
  // Duet
  mirror: { name: "mirror", path: "positions/duet/mirror", description: "Two agents auditing each other's transactions", agents: 2, category: "duet" },
  relay: { name: "relay", path: "positions/duet/relay", description: "Sequential handoff (research → execute → verify)", agents: 2, category: "duet" },
  dance: { name: "dance", path: "positions/duet/dance", description: "Alternating negotiation between agents", agents: 2, category: "duet" },
  embrace: { name: "embrace", path: "positions/duet/embrace", description: "Two agents sharing a wallet, coordinating moves", agents: 2, category: "duet" },
  // Group
  circle: { name: "circle", path: "positions/group/circle", description: "Round-robin consensus on strategy", agents: 3, category: "group" },
  pyramid: { name: "pyramid", path: "positions/group/pyramid", description: "Oracle at top, workers executing below", agents: 4, category: "group" },
  swarm: { name: "swarm", path: "positions/group/swarm", description: "Parallel agents scanning multiple protocols", agents: 5, category: "group" },
  tantric: { name: "tantric", path: "positions/group/tantric", description: "Slow, deliberate multi-agent consensus (no rushing)", agents: 3, category: "group" },
  // Crypto
  arbitrageur: { name: "arbitrageur", path: "crypto/arbitrageur", description: "Agents spotting and executing arb opportunities", agents: 2, category: "crypto" },
  "oracle-choir": { name: "oracle-choir", path: "crypto/oracle-choir", description: "Multiple agents providing price feeds", agents: 3, category: "crypto" },
  "liquidity-lotus": { name: "liquidity-lotus", path: "crypto/liquidity-lotus", description: "Coordinated LP management across pools", agents: 2, category: "crypto" },
  "dao-dance": { name: "dao-dance", path: "crypto/dao-dance", description: "Coordinated DAO governance participation", agents: 3, category: "crypto" },
  // Healing
  "pattern-doctor": { name: "pattern-doctor", path: "healing/pattern-doctor", description: "Diagnose broken agent collaboration patterns", agents: 1, category: "healing" },
  recovery: { name: "recovery", path: "healing/recovery", description: "Graceful failure handling and recovery", agents: 1, category: "healing" },
};

// Environment
const DEFAULT_SKILLS_PATH = path.resolve(process.cwd(), "..", "skills");
const SKILLS_PATH = process.env.CLAWMASUTRA_SKILLS_PATH || DEFAULT_SKILLS_PATH;
const ORCHESTRATOR_AVAILABLE = !!process.env.ANTHROPIC_API_KEY;

// Legacy demo session tracking (for backwards compatibility)
interface LegacySessionState {
  position: string;
  startedAt: Date;
  agents: string[];
  status: "initializing" | "running" | "completed" | "error";
  isDemoMode: boolean;
  config: SessionConfig;
}
const legacySessions = new Map<string, LegacySessionState>();

// Helpers
const ok = (data: object): ToolResult => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
const err = (msg: string): ToolResult => ({ content: [{ type: "text", text: msg }], isError: true });
const getSkillPath = (posPath: string) => path.join(SKILLS_PATH, posPath, "SKILL.md");
const skillExists = (posPath: string) => fs.existsSync(getSkillPath(posPath));

export const positionTools: Tool[] = [
  {
    name: "position_list",
    description: "List all available Clawmasutra positions (agent collaboration patterns)",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["solo", "duet", "group", "crypto", "healing", "all"],
          description: "Filter by category (default: all)",
        },
      },
    },
  },
  {
    name: "position_invoke",
    description: "Start a Clawmasutra position - launches real AI agent collaboration when ANTHROPIC_API_KEY is set, otherwise runs in demo mode.",
    inputSchema: {
      type: "object",
      properties: {
        position: {
          type: "string",
          description: "Position name (e.g., 'contemplator', 'mirror', 'arbitrageur')",
        },
        config: {
          type: "object",
          description: "Position-specific configuration",
          properties: {
            target: {
              type: "string",
              description: "Target address or contract to analyze/interact with",
            },
            network: {
              type: "string",
              enum: ["mainnet", "testnet"],
              description: "TON network to use",
            },
            duration: {
              type: "number",
              description: "How long to run (in seconds, 0 for indefinite)",
            },
            allowTransactions: {
              type: "boolean",
              description: "Allow agents to execute blockchain transactions (default: false)",
            },
            maxTokensPerAgent: {
              type: "number",
              description: "Maximum tokens per agent (default: 50000)",
            },
          },
        },
        demoMode: {
          type: "boolean",
          description: "Force demo mode even if orchestrator is available (for testing)",
        },
      },
      required: ["position"],
    },
  },
  {
    name: "position_status",
    description: "Get the status of an active position session",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Session ID from position_invoke",
        },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "position_stop",
    description: "Stop an active position session",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Session ID to stop",
        },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "position_describe",
    description: "Get detailed information about a specific position including its SKILL.md content",
    inputSchema: {
      type: "object",
      properties: {
        position: {
          type: "string",
          description: "Position name",
        },
      },
      required: ["position"],
    },
  },
];

export async function handlePositionTool(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<ToolResult> {
  switch (name) {
    case "position_list": {
      const category = (args?.category as string) || "all";
      const positions = Object.entries(POSITIONS)
        .filter(([, p]) => category === "all" || p.category === category)
        .map(([name, p]) => ({
          name,
          description: p.description,
          agents: p.agents,
          category: p.category,
          skillExists: skillExists(p.path),
        }));

      return ok({
        count: positions.length,
        positions,
        environment: {
          orchestratorAvailable: ORCHESTRATOR_AVAILABLE,
          orchestratorReason: ORCHESTRATOR_AVAILABLE
            ? "ANTHROPIC_API_KEY is set - real agent execution available"
            : "Set ANTHROPIC_API_KEY to enable real agent execution",
          skillsPath: SKILLS_PATH,
        },
      });
    }

    case "position_invoke": {
      const positionName = args?.position as string;
      const config = (args?.config as SessionConfig) || {};
      const forceDemoMode = (args?.demoMode as boolean) || false;
      const position = POSITIONS[positionName];

      if (!position) {
        return err(`Unknown position: ${positionName}. Use position_list to see available positions.`);
      }

      const skillPath = getSkillPath(position.path);
      if (!skillExists(position.path)) {
        console.warn(`Warning: Skill file not found at ${skillPath}`);
      }

      // Determine if we should use real orchestration
      const useRealOrchestration = ORCHESTRATOR_AVAILABLE && hasOrchestrator() && !forceDemoMode;

      if (useRealOrchestration) {
        // Real orchestration with Claude agents
        const orchestrator = getOrchestrator();

        const session = await orchestrator.createSession(position, config);

        return ok({
          sessionId: session.id,
          position: positionName,
          title: session.skill.title,
          description: position.description,
          status: session.status,
          mode: "REAL",
          agents: Array.from(session.agents.values()).map((a) => ({
            id: a.id,
            role: a.role.name,
            personality: a.role.personality,
            status: a.status,
          })),
          config,
          skillPath: position.path,
          message: `Position '${positionName}' started with ${position.agents} real Claude agent(s). Agents are now collaborating.`,
          _note: "Use position_status to monitor progress, or watch the gallery stream for real-time updates.",
        });
      }

      // Demo mode fallback
      const sessionId = `${positionName}-demo-${Date.now()}`;
      const demoAgents = Array.from({ length: position.agents }, (_, i) => `demo-agent-${i + 1}`);

      legacySessions.set(sessionId, {
        position: positionName,
        startedAt: new Date(),
        agents: demoAgents,
        status: "running",
        isDemoMode: true,
        config,
      });

      return ok({
        sessionId,
        position: positionName,
        description: position.description,
        agents: demoAgents,
        status: "running",
        config,
        skillPath: position.path,
        mode: "DEMO",
        _warning: "Running in DEMO MODE. No real agents are executing.",
        _reason: ORCHESTRATOR_AVAILABLE
          ? "Demo mode was explicitly requested"
          : "ANTHROPIC_API_KEY not set - real agent execution requires API key",
        message: `[DEMO] Position '${positionName}' simulated with ${position.agents} demo agent(s). No real work is being performed.`,
      });
    }

    case "position_status": {
      const sessionId = args?.sessionId as string;

      // Check orchestrator first
      if (hasOrchestrator()) {
        const orchestrator = getOrchestrator();
        const session = orchestrator.getSession(sessionId);

        if (session) {
          const runningFor = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);

          return ok({
            sessionId,
            position: session.position.name,
            title: session.skill.title,
            status: session.status,
            mode: "REAL",
            agents: Array.from(session.agents.values()).map((a) => ({
              id: a.id,
              role: a.role.name,
              status: a.status,
              turnsCompleted: a.turnsCompleted,
              tokensUsed: a.tokensUsed,
            })),
            startedAt: session.startedAt.toISOString(),
            completedAt: session.completedAt?.toISOString(),
            runningFor: `${runningFor}s`,
            error: session.error,
          });
        }
      }

      // Check legacy sessions
      const legacy = legacySessions.get(sessionId);
      if (legacy) {
        const runningFor = Math.floor((Date.now() - legacy.startedAt.getTime()) / 1000);
        const position = POSITIONS[legacy.position];

        return ok({
          sessionId,
          position: legacy.position,
          description: position?.description,
          status: legacy.status,
          mode: "DEMO",
          agents: legacy.agents,
          startedAt: legacy.startedAt.toISOString(),
          runningFor: `${runningFor}s`,
          isDemoMode: true,
          _note: "This session is running in DEMO MODE - no real agents are executing",
        });
      }

      return err(`No session found with ID: ${sessionId}`);
    }

    case "position_stop": {
      const sessionId = args?.sessionId as string;

      // Check orchestrator first
      if (hasOrchestrator()) {
        const orchestrator = getOrchestrator();
        const session = orchestrator.getSession(sessionId);

        if (session) {
          await orchestrator.stopSession(sessionId);

          return ok({
            sessionId,
            position: session.position.name,
            status: "stopped",
            mode: "REAL",
            ranFor: `${Math.floor((Date.now() - session.startedAt.getTime()) / 1000)}s`,
            agentStats: Array.from(session.agents.values()).map((a) => ({
              id: a.id,
              role: a.role.name,
              turns: a.turnsCompleted,
              tokens: a.tokensUsed,
            })),
          });
        }
      }

      // Check legacy sessions
      const legacy = legacySessions.get(sessionId);
      if (legacy) {
        legacy.status = "completed";

        return ok({
          sessionId,
          position: legacy.position,
          status: "stopped",
          mode: "DEMO",
          ranFor: `${Math.floor((Date.now() - legacy.startedAt.getTime()) / 1000)}s`,
          wasDemoMode: true,
        });
      }

      return err(`No session found with ID: ${sessionId}`);
    }

    case "position_describe": {
      const positionName = args?.position as string;
      const position = POSITIONS[positionName];

      if (!position) {
        return err(`Unknown position: ${positionName}. Use position_list to see available positions.`);
      }

      const skillPath = getSkillPath(position.path);
      let skillContent: string | null = null;

      if (skillExists(position.path)) {
        skillContent = fs.readFileSync(skillPath, "utf-8");
      }

      return ok({
        name: positionName,
        category: position.category,
        agents: position.agents,
        description: position.description,
        skillPath,
        skillExists: !!skillContent,
        skill: skillContent || "Skill file not found. See SKILL.md template for documentation.",
        environment: {
          orchestratorAvailable: ORCHESTRATOR_AVAILABLE && hasOrchestrator(),
        },
      });
    }

    default:
      return err(`Unknown position tool: ${name}`);
  }
}

// Export positions for orchestrator use
export { POSITIONS };
