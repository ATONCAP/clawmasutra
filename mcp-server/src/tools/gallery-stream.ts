import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { WebSocketServer, WebSocket } from "ws";

// Event types for the gallery stream
interface GalleryEvent {
  id: string;
  timestamp: Date;
  type: "agent_message" | "agent_action" | "blockchain_tx" | "position_update" | "system";
  sessionId: string;
  agentId?: string;
  data: Record<string, unknown>;
}

// In-memory event store
const eventStore: GalleryEvent[] = [];
const MAX_EVENTS = 1000;

// WebSocket server for real-time push
let wss: WebSocketServer | null = null;
const WS_PORT = parseInt(process.env.GALLERY_WS_PORT || "3001");

// Connected clients with their session filters
interface ClientConnection {
  ws: WebSocket;
  sessionFilter?: string;
  subscriptionId: string;
}
const clients: Map<string, ClientConnection> = new Map();

/**
 * Initialize the WebSocket server for real-time event streaming
 */
function initWebSocketServer(): { started: boolean; port: number; error?: string } {
  if (wss) {
    return { started: true, port: WS_PORT };
  }

  try {
    wss = new WebSocketServer({ port: WS_PORT });

    wss.on("connection", (ws, req) => {
      const subscriptionId = `ws-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Parse session filter from query string
      const url = new URL(req.url || "/", `http://localhost:${WS_PORT}`);
      const sessionFilter = url.searchParams.get("session") || undefined;

      clients.set(subscriptionId, { ws, sessionFilter, subscriptionId });

      // Send welcome message
      ws.send(JSON.stringify({
        type: "connected",
        subscriptionId,
        sessionFilter: sessionFilter || "all",
        message: "Connected to Clawmasutra Gallery Stream",
      }));

      // Handle client messages (for changing filters, etc.)
      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === "setFilter" && msg.sessionId !== undefined) {
            const client = clients.get(subscriptionId);
            if (client) {
              client.sessionFilter = msg.sessionId || undefined;
              ws.send(JSON.stringify({
                type: "filterUpdated",
                sessionFilter: msg.sessionId || "all",
              }));
            }
          }
        } catch {
          // Ignore invalid messages
        }
      });

      ws.on("close", () => {
        clients.delete(subscriptionId);
      });

      ws.on("error", () => {
        clients.delete(subscriptionId);
      });
    });

    wss.on("error", (error) => {
      console.error("WebSocket server error:", error);
    });

    console.error(`Gallery WebSocket server started on ws://localhost:${WS_PORT}`);
    return { started: true, port: WS_PORT };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Failed to start WebSocket server:", errorMsg);
    return { started: false, port: WS_PORT, error: errorMsg };
  }
}

/**
 * Broadcast an event to all connected WebSocket clients
 */
function broadcastEvent(event: GalleryEvent): number {
  let sentCount = 0;

  clients.forEach((client) => {
    // Apply session filter
    if (client.sessionFilter && event.sessionId !== client.sessionFilter) {
      return;
    }

    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify({
          type: "event",
          event: {
            id: event.id,
            timestamp: event.timestamp.toISOString(),
            type: event.type,
            sessionId: event.sessionId,
            agentId: event.agentId,
            data: event.data,
          },
        }));
        sentCount++;
      } catch {
        // Client disconnected, will be cleaned up
      }
    }
  });

  return sentCount;
}

function addEvent(event: Omit<GalleryEvent, "id" | "timestamp">): GalleryEvent {
  const fullEvent: GalleryEvent = {
    ...event,
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date(),
  };

  eventStore.push(fullEvent);

  // Trim if over limit
  if (eventStore.length > MAX_EVENTS) {
    eventStore.splice(0, eventStore.length - MAX_EVENTS);
  }

  // Broadcast to WebSocket clients
  const sentCount = broadcastEvent(fullEvent);

  return fullEvent;
}

export const galleryTools: Tool[] = [
  {
    name: "gallery_emit",
    description: "Emit an event to the visual gallery stream (for agents to report their activity). Events are broadcast to connected WebSocket clients in real-time.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The position session ID this event belongs to",
        },
        agentId: {
          type: "string",
          description: "The agent emitting this event",
        },
        type: {
          type: "string",
          enum: ["agent_message", "agent_action", "blockchain_tx", "position_update", "system"],
          description: "Type of event",
        },
        data: {
          type: "object",
          description: "Event-specific data payload",
        },
      },
      required: ["sessionId", "type", "data"],
    },
  },
  {
    name: "gallery_stream",
    description: "Get recent events from the gallery stream (polling). For real-time updates, connect to the WebSocket server.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Filter by session ID (optional)",
        },
        agentId: {
          type: "string",
          description: "Filter by agent ID (optional)",
        },
        type: {
          type: "string",
          enum: ["agent_message", "agent_action", "blockchain_tx", "position_update", "system"],
          description: "Filter by event type (optional)",
        },
        limit: {
          type: "number",
          description: "Number of events to return (default: 50)",
        },
        since: {
          type: "string",
          description: "ISO timestamp to get events after (optional)",
        },
      },
    },
  },
  {
    name: "gallery_server_start",
    description: "Start the WebSocket server for real-time event streaming to the UI",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "gallery_server_status",
    description: "Get the status of the gallery WebSocket server",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "gallery_clear",
    description: "Clear events from the gallery stream",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Clear only events for this session (clears all if not specified)",
        },
      },
    },
  },
];

export async function handleGalleryTool(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  try {
    switch (name) {
      case "gallery_emit": {
        const sessionId = args?.sessionId as string;
        const agentId = args?.agentId as string | undefined;
        const type = args?.type as GalleryEvent["type"];
        const data = args?.data as Record<string, unknown>;

        const event = addEvent({
          sessionId,
          agentId,
          type,
          data,
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              eventId: event.id,
              timestamp: event.timestamp.toISOString(),
              broadcastedTo: clients.size,
              wsServerRunning: wss !== null,
            }, null, 2),
          }],
        };
      }

      case "gallery_stream": {
        const sessionId = args?.sessionId as string | undefined;
        const agentId = args?.agentId as string | undefined;
        const eventType = args?.type as GalleryEvent["type"] | undefined;
        const limit = (args?.limit as number) || 50;
        const since = args?.since as string | undefined;

        let events = [...eventStore];

        // Apply filters
        if (sessionId) {
          events = events.filter((e) => e.sessionId === sessionId);
        }
        if (agentId) {
          events = events.filter((e) => e.agentId === agentId);
        }
        if (eventType) {
          events = events.filter((e) => e.type === eventType);
        }
        if (since) {
          const sinceDate = new Date(since);
          events = events.filter((e) => e.timestamp > sinceDate);
        }

        // Sort by timestamp descending and limit
        events = events
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, limit);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: events.length,
              events: events.map((e) => ({
                id: e.id,
                timestamp: e.timestamp.toISOString(),
                type: e.type,
                sessionId: e.sessionId,
                agentId: e.agentId,
                data: e.data,
              })),
              _realtime: wss
                ? `For real-time updates, connect to ws://localhost:${WS_PORT}`
                : "WebSocket server not running. Use gallery_server_start to enable real-time updates.",
            }, null, 2),
          }],
        };
      }

      case "gallery_server_start": {
        const result = initWebSocketServer();

        if (result.started) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                wsUrl: `ws://localhost:${result.port}`,
                message: "WebSocket server is running. Connect from UI for real-time events.",
                connectedClients: clients.size,
                usage: {
                  connect: `ws://localhost:${result.port}`,
                  connectWithFilter: `ws://localhost:${result.port}?session=YOUR_SESSION_ID`,
                  changeFilter: '{ "type": "setFilter", "sessionId": "SESSION_ID" }',
                },
              }, null, 2),
            }],
          };
        } else {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: result.error,
                port: result.port,
                _note: "Port may already be in use. Set GALLERY_WS_PORT env var to use a different port.",
              }, null, 2),
            }],
            isError: true,
          };
        }
      }

      case "gallery_server_status": {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              running: wss !== null,
              port: WS_PORT,
              wsUrl: wss ? `ws://localhost:${WS_PORT}` : null,
              connectedClients: clients.size,
              clientDetails: Array.from(clients.values()).map(c => ({
                subscriptionId: c.subscriptionId,
                sessionFilter: c.sessionFilter || "all",
                connected: c.ws.readyState === WebSocket.OPEN,
              })),
              eventStoreSize: eventStore.length,
            }, null, 2),
          }],
        };
      }

      case "gallery_clear": {
        const sessionId = args?.sessionId as string | undefined;

        if (sessionId) {
          const before = eventStore.length;
          const toRemove = eventStore.filter((e) => e.sessionId === sessionId);
          toRemove.forEach((e) => {
            const idx = eventStore.indexOf(e);
            if (idx >= 0) eventStore.splice(idx, 1);
          });

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                cleared: before - eventStore.length,
                remaining: eventStore.length,
                sessionId,
              }, null, 2),
            }],
          };
        } else {
          const cleared = eventStore.length;
          eventStore.length = 0;

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                cleared,
                remaining: 0,
              }, null, 2),
            }],
          };
        }
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown gallery tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
}

// Export for external use
export { initWebSocketServer, broadcastEvent, GalleryEvent };
