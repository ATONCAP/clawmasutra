import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

import { tonWalletTools, handleTonWalletTool } from "./tools/ton-wallet.js";
import { tonContractTools, handleTonContractTool } from "./tools/ton-contract.js";
import { positionTools, handlePositionTool } from "./tools/position-invoke.js";
import { galleryTools, handleGalleryTool, initWebSocketServer, broadcastEvent, GalleryEvent } from "./tools/gallery-stream.js";
import { sessionsTools, handleSessionsTool } from "./tools/sessions.js";
import { initOrchestrator, hasOrchestrator } from "./orchestrator/index.js";

type ToolHandler = (name: string, args: Record<string, unknown> | undefined) => Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}>;

// Tool registry with prefix-based routing
const toolRegistry: Array<{ prefix: string; tools: Tool[]; handler: ToolHandler }> = [
  { prefix: "ton_wallet_", tools: tonWalletTools, handler: handleTonWalletTool },
  { prefix: "ton_contract_", tools: tonContractTools, handler: handleTonContractTool },
  { prefix: "position_", tools: positionTools, handler: handlePositionTool },
  { prefix: "gallery_", tools: galleryTools, handler: handleGalleryTool },
  { prefix: "sessions_", tools: sessionsTools, handler: handleSessionsTool },
];

const allTools = toolRegistry.flatMap(r => r.tools);

const server = new Server(
  { name: "clawmasutra", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: allTools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  for (const { prefix, handler } of toolRegistry) {
    if (name.startsWith(prefix)) {
      return handler(name, args);
    }
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

/**
 * Initialize the orchestrator if ANTHROPIC_API_KEY is available
 */
function initializeOrchestrator(): void {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY not set - orchestrator disabled (demo mode only)");
    return;
  }

  const orchestrator = initOrchestrator({
    anthropicApiKey: apiKey,
    model: process.env.AGENT_MODEL || "claude-sonnet-4-20250514",
    maxTokensPerTurn: parseInt(process.env.AGENT_MAX_TOKENS || "4096"),
    agentTimeoutMs: parseInt(process.env.AGENT_TIMEOUT_MS || "300000"),
    sessionMaxAgents: parseInt(process.env.SESSION_MAX_AGENTS || "10"),
    sessionMaxMessages: parseInt(process.env.SESSION_MAX_MESSAGES || "1000"),
    galleryServerUrl: process.env.GALLERY_WS_URL || "http://localhost:3001",
    skillsPath: process.env.CLAWMASUTRA_SKILLS_PATH || "../skills",
  });

  // Connect gallery emitter to broadcast events
  orchestrator.setGalleryEmitter((event) => {
    // Create full event with ID and timestamp
    const fullEvent: GalleryEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date(),
    };

    // Broadcast to WebSocket clients
    broadcastEvent(fullEvent);
  });

  // Register MCP tool handlers for agent tool calls
  orchestrator.registerToolHandler("ton_wallet_", handleTonWalletTool);
  orchestrator.registerToolHandler("ton_contract_", handleTonContractTool);

  console.error("Orchestrator initialized - real agent execution enabled");
  console.error(`  Model: ${process.env.AGENT_MODEL || "claude-sonnet-4-20250514"}`);
  console.error(`  Max tokens/turn: ${process.env.AGENT_MAX_TOKENS || "4096"}`);
  console.error(`  Agent timeout: ${process.env.AGENT_TIMEOUT_MS || "300000"}ms`);
}

async function main() {
  // Auto-start gallery WebSocket server for real-time streaming
  initWebSocketServer();

  // Initialize orchestrator if API key is available
  initializeOrchestrator();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Clawmasutra MCP server running on stdio");
  console.error(`  Tools registered: ${allTools.length}`);
  console.error(`  Orchestrator: ${hasOrchestrator() ? "enabled" : "disabled (set ANTHROPIC_API_KEY)"}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
