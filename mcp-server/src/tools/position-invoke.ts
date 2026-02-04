import { Tool } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";

type ToolResult = { content: Array<{ type: string; text: string }>; isError?: boolean };
type Category = "solo" | "duet" | "group" | "crypto";

interface Position { path: string; description: string; agents: number; category: Category; }

const POSITIONS: Record<string, Position> = {
  // Solo
  contemplator: { path: "positions/solo/contemplator", description: "Single agent deep-diving into blockchain data", agents: 1, category: "solo" },
  wanderer: { path: "positions/solo/wanderer", description: "Exploratory agent scanning for opportunities", agents: 1, category: "solo" },
  // Duet
  mirror: { path: "positions/duet/mirror", description: "Two agents auditing each other's transactions", agents: 2, category: "duet" },
  relay: { path: "positions/duet/relay", description: "Sequential handoff (research → execute → verify)", agents: 2, category: "duet" },
  dance: { path: "positions/duet/dance", description: "Alternating negotiation between agents", agents: 2, category: "duet" },
  embrace: { path: "positions/duet/embrace", description: "Two agents sharing a wallet, coordinating moves", agents: 2, category: "duet" },
  // Group
  circle: { path: "positions/group/circle", description: "Round-robin consensus on strategy", agents: 3, category: "group" },
  pyramid: { path: "positions/group/pyramid", description: "Oracle at top, workers executing below", agents: 4, category: "group" },
  swarm: { path: "positions/group/swarm", description: "Parallel agents scanning multiple protocols", agents: 5, category: "group" },
  tantric: { path: "positions/group/tantric", description: "Slow, deliberate multi-agent consensus (no rushing)", agents: 3, category: "group" },
  // Crypto
  arbitrageur: { path: "crypto/arbitrageur", description: "Agents spotting and executing arb opportunities", agents: 2, category: "crypto" },
  "oracle-choir": { path: "crypto/oracle-choir", description: "Multiple agents providing price feeds", agents: 3, category: "crypto" },
  "liquidity-lotus": { path: "crypto/liquidity-lotus", description: "Coordinated LP management across pools", agents: 2, category: "crypto" },
};

// Default skills path: look in parent directory (clawmasutra/skills from mcp-server)
// Override with CLAWMASUTRA_SKILLS_PATH env var for custom locations
const DEFAULT_SKILLS_PATH = path.resolve(process.cwd(), "..", "skills");
const SKILLS_PATH = process.env.CLAWMASUTRA_SKILLS_PATH || DEFAULT_SKILLS_PATH;
const OPENCLAW_AVAILABLE = !!process.env.OPENCLAW_PATH && fs.existsSync(process.env.OPENCLAW_PATH);

interface SessionState {
  position: string;
  startedAt: Date;
  agents: string[];
  status: "initializing" | "running" | "completed" | "error";
  processIds: number[];  // PIDs for any spawned processes (future use)
  isDemoMode: boolean;
  config: Record<string, unknown>;
}

const activeSessions = new Map<string, SessionState>();

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
          enum: ["solo", "duet", "group", "crypto", "all"],
          description: "Filter by category (default: all)",
        },
      },
    },
  },
  {
    name: "position_invoke",
    description: "Start a Clawmasutra position - launches the agent collaboration pattern. NOTE: Requires OpenClaw to be installed and configured. Set OPENCLAW_PATH env var. Without it, runs in demo mode with simulated responses.",
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
          },
        },
        demoMode: {
          type: "boolean",
          description: "Force demo mode even if OpenClaw is available (for testing UI)",
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
    description: "Get detailed information about a specific position",
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

const openClawReason = () => {
  if (!process.env.OPENCLAW_PATH) return "OPENCLAW_PATH environment variable not set";
  if (!fs.existsSync(process.env.OPENCLAW_PATH)) return `OPENCLAW_PATH (${process.env.OPENCLAW_PATH}) does not exist`;
  return undefined;
};

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
          openClawAvailable: OPENCLAW_AVAILABLE,
          openClawReason: openClawReason(),
          skillsPath: SKILLS_PATH,
        },
      });
    }

    case "position_invoke": {
      const positionName = args?.position as string;
      const config = (args?.config as Record<string, unknown>) || {};
      const forceDemoMode = (args?.demoMode as boolean) || false;
      const position = POSITIONS[positionName];

      if (!position) return err(`Unknown position: ${positionName}. Use position_list to see available positions.`);

      const sessionId = `${positionName}-${Date.now()}`;
      const runInDemoMode = forceDemoMode || !OPENCLAW_AVAILABLE;
      const skillPath = getSkillPath(position.path);

      if (!skillExists(position.path)) {
        console.warn(`Warning: Skill file not found at ${skillPath}`);
      }

      const session: SessionState = {
        position: positionName,
        startedAt: new Date(),
        agents: [],
        status: "initializing",
        processIds: [],
        isDemoMode: runInDemoMode,
        config,
      };
      activeSessions.set(sessionId, session);

      if (runInDemoMode) {
        session.status = "running";
        session.agents = Array.from({ length: position.agents }, (_, i) => `demo-agent-${i + 1}`);

        return ok({
          sessionId,
          position: positionName,
          description: position.description,
          agents: session.agents,
          status: session.status,
          config,
          skillPath: position.path,
          _mode: "DEMO",
          _warning: "Running in DEMO MODE. No real agents are executing.",
          _reason: openClawReason() || "Demo mode requested",
          _toEnable: "Set OPENCLAW_PATH environment variable to your OpenClaw installation path",
          message: `[DEMO] Position '${positionName}' simulated with ${position.agents} demo agent(s). No real work is being performed.`,
        });
      }

      // Real mode - not yet implemented
      return {
        ...err("Real OpenClaw integration is not yet implemented"),
        content: [{ type: "text", text: JSON.stringify({
          sessionId,
          position: positionName,
          status: "NOT_IMPLEMENTED",
          error: "Real OpenClaw integration is not yet implemented",
          _todo: ["Start OpenClaw sessions", "Load SKILL.md", "Configure sessions_send", "Set up gallery_emit"],
          openClawPath: process.env.OPENCLAW_PATH,
          skillPath,
          skillExists: skillExists(position.path),
        }, null, 2) }],
      };
    }

    case "position_status": {
      const sessionId = args?.sessionId as string;
      const session = activeSessions.get(sessionId);
      if (!session) return err(`No session found with ID: ${sessionId}`);

      const position = POSITIONS[session.position];
      const runningFor = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);

      return ok({
        sessionId,
        position: session.position,
        description: position.description,
        status: session.status,
        agents: session.agents,
        startedAt: session.startedAt.toISOString(),
        runningFor: `${runningFor}s`,
        isDemoMode: session.isDemoMode,
        ...(session.isDemoMode && { _note: "This session is running in DEMO MODE - no real agents are executing" }),
      });
    }

    case "position_stop": {
      const sessionId = args?.sessionId as string;
      const session = activeSessions.get(sessionId);
      if (!session) return err(`No session found with ID: ${sessionId}`);

      // Kill any real processes by PID (future: when OpenClaw integration is added)
      for (const pid of session.processIds) {
        try { process.kill(pid); } catch { /* already exited */ }
      }
      session.status = "completed";

      return ok({
        sessionId,
        position: session.position,
        status: "stopped",
        ranFor: `${Math.floor((Date.now() - session.startedAt.getTime()) / 1000)}s`,
        wasDemoMode: session.isDemoMode,
      });
    }

    case "position_describe": {
      const positionName = args?.position as string;
      const position = POSITIONS[positionName];
      if (!position) return err(`Unknown position: ${positionName}. Use position_list to see available positions.`);

      const skillPath = getSkillPath(position.path);
      let details: string | null = null;
      if (skillExists(position.path)) {
        try { details = fs.readFileSync(skillPath, "utf-8"); } catch { /* use fallback */ }
      }

      return ok({
        name: positionName,
        category: position.category,
        agents: position.agents,
        description: position.description,
        skillPath,
        skillExists: skillExists(position.path),
        details: details || "See SKILL.md for detailed description.",
      });
    }

    default:
      return err(`Unknown position tool: ${name}`);
  }
}
