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
import { galleryTools, handleGalleryTool, initWebSocketServer } from "./tools/gallery-stream.js";

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

async function main() {
  // Auto-start gallery WebSocket server for real-time streaming
  initWebSocketServer();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Clawmasutra MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
