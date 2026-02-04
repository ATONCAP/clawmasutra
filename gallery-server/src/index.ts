import { createServer, IncomingMessage, ServerResponse } from "http";
import { WebSocketServer, WebSocket } from "ws";

const PORT = parseInt(process.env.PORT || "3001");

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

// Connected clients with their session filters
interface ClientConnection {
  ws: WebSocket;
  sessionFilter?: string;
  subscriptionId: string;
}
const clients: Map<string, ClientConnection> = new Map();

/**
 * Broadcast an event to all connected WebSocket clients
 */
function broadcastEvent(event: GalleryEvent): number {
  let sentCount = 0;

  clients.forEach((client) => {
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
      } catch (error) {
        console.warn(`Failed to send to client ${client.subscriptionId}:`, error instanceof Error ? error.message : String(error));
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

  if (eventStore.length > MAX_EVENTS) {
    eventStore.splice(0, eventStore.length - MAX_EVENTS);
  }

  broadcastEvent(fullEvent);
  return fullEvent;
}

// Create HTTP server for health checks and WebSocket upgrade
const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  // Health check endpoint
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({
      status: "ok",
      service: "clawmasutra-gallery",
      clients: clients.size,
      events: eventStore.length,
      uptime: process.uptime(),
    }));
    return;
  }

  // API endpoint to emit events (POST /emit)
  if (req.url === "/emit" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const event = addEvent({
          sessionId: data.sessionId || "api",
          agentId: data.agentId,
          type: data.type || "system",
          data: data.data || data,
        });
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify({ success: true, eventId: event.id }));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  // API endpoint to get recent events (GET /events)
  if (req.url?.startsWith("/events")) {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const sessionId = url.searchParams.get("session");

    let events = [...eventStore];
    if (sessionId) {
      events = events.filter(e => e.sessionId === sessionId);
    }
    events = events.slice(-limit).reverse();

    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({
      count: events.length,
      events: events.map(e => ({
        id: e.id,
        timestamp: e.timestamp.toISOString(),
        type: e.type,
        sessionId: e.sessionId,
        agentId: e.agentId,
        data: e.data,
      })),
    }));
    return;
  }

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  const subscriptionId = `ws-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  const sessionFilter = url.searchParams.get("session") || undefined;

  clients.set(subscriptionId, { ws, sessionFilter, subscriptionId });
  console.log(`Client connected: ${subscriptionId} (filter: ${sessionFilter || "all"})`);

  ws.send(JSON.stringify({
    type: "connected",
    subscriptionId,
    sessionFilter: sessionFilter || "all",
    message: "Connected to Clawmasutra Gallery Stream",
  }));

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());

      // Handle filter updates
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

      // Handle event emission from WebSocket
      if (msg.type === "emit" && msg.event) {
        const event = addEvent({
          sessionId: msg.event.sessionId || subscriptionId,
          agentId: msg.event.agentId,
          type: msg.event.type || "system",
          data: msg.event.data || {},
        });
        ws.send(JSON.stringify({
          type: "emitted",
          eventId: event.id,
        }));
      }
    } catch (error) {
      console.warn(`Invalid WebSocket message from ${subscriptionId}:`, error instanceof Error ? error.message : String(error));
    }
  });

  ws.on("close", () => {
    console.log(`Client disconnected: ${subscriptionId}`);
    clients.delete(subscriptionId);
  });

  ws.on("error", (error) => {
    console.warn(`WebSocket client error (${subscriptionId}):`, error.message);
    clients.delete(subscriptionId);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Clawmasutra Gallery Server running on port ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log(`  Events: http://localhost:${PORT}/events`);
  console.log(`  WebSocket: ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Shutting down...");
  wss.close();
  server.close();
  process.exit(0);
});
