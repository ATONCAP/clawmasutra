import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  useColorModeValue,
  Spinner,
  Code,
  Collapse,
  IconButton,
  Button,
  Alert,
  AlertIcon,
  AlertDescription,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import React, { useState, useEffect, useRef, useCallback } from "react";

interface GalleryEvent {
  id: string;
  timestamp: string;
  type: "agent_message" | "agent_action" | "blockchain_tx" | "position_update" | "system";
  sessionId: string;
  agentId?: string;
  data: Record<string, unknown>;
}

const eventTypeConfig: Record<string, { color: string; emoji: string; label: string }> = {
  agent_message: { color: "blue", emoji: "💬", label: "Message" },
  agent_action: { color: "purple", emoji: "⚡", label: "Action" },
  blockchain_tx: { color: "green", emoji: "🔗", label: "Transaction" },
  position_update: { color: "orange", emoji: "📍", label: "Position" },
  system: { color: "gray", emoji: "🔧", label: "System" },
};

interface EventCardProps {
  event: GalleryEvent;
}

function EventCard({ event }: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const bgColor = "rgba(30, 15, 25, 0.7)";
  const borderColor = "rgba(236, 72, 153, 0.2)";
  const codeBgColor = "rgba(10, 5, 10, 0.8)";
  const config = eventTypeConfig[event.type] || eventTypeConfig.system;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getEventSummary = (event: GalleryEvent): string => {
    const data = event.data;
    if (data.message) return String(data.message);
    if (data.action) return String(data.action);
    if (data.status) return `Status: ${data.status}`;
    return JSON.stringify(data).slice(0, 100);
  };

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      p={3}
      transition="all 0.2s"
    >
      <HStack justify="space-between" mb={1}>
        <HStack>
          <Text>{config.emoji}</Text>
          <Badge colorScheme={config.color} size="sm">
            {config.label}
          </Badge>
          {event.agentId && (
            <Badge variant="outline" colorScheme="cyan">
              {event.agentId}
            </Badge>
          )}
        </HStack>
        <HStack>
          <Text fontSize="xs" color="gray.500">
            {formatTime(event.timestamp)}
          </Text>
          <IconButton
            aria-label="Toggle details"
            icon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
            size="xs"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
          />
        </HStack>
      </HStack>

      <Text fontSize="sm" color="gray.300" noOfLines={isExpanded ? undefined : 2}>
        {getEventSummary(event)}
      </Text>

      <Collapse in={isExpanded}>
        <Box mt={2}>
          <Code
            display="block"
            whiteSpace="pre-wrap"
            fontSize="xs"
            p={2}
            borderRadius="md"
            bg={codeBgColor}
          >
            {JSON.stringify(event.data, null, 2)}
          </Code>
        </Box>
      </Collapse>
    </Box>
  );
}

interface AgentStreamProps {
  sessionId?: string;
  maxEvents?: number;
  wsUrl?: string;
}

// Demo events - clearly marked as simulated data
const DEMO_EVENTS: GalleryEvent[] = [
  {
    id: "demo-001",
    timestamp: new Date().toISOString(),
    type: "system",
    sessionId: "demo",
    data: { message: "[SIMULATED] No MCP server connected. This is sample data showing what events would look like.", _demo: true },
  },
  {
    id: "demo-002",
    timestamp: new Date(Date.now() - 5000).toISOString(),
    type: "position_update",
    sessionId: "demo",
    data: { status: "simulated", position: "The Mirror", agents: ["simulated-agent-1", "simulated-agent-2"], _demo: true },
  },
  {
    id: "demo-003",
    timestamp: new Date(Date.now() - 10000).toISOString(),
    type: "agent_message",
    sessionId: "demo",
    agentId: "simulated-agent-1",
    data: { message: "[SIMULATED] Beginning analysis...", _demo: true },
  },
];

type ConnectionState = "disconnected" | "connecting" | "connected" | "error" | "demo";

// Use environment variable for production WebSocket URL, fallback to localhost
const DEFAULT_WS_URL = import.meta.env.VITE_GALLERY_WS_URL || "ws://localhost:3001";

export function AgentStream({
  sessionId,
  maxEvents = 100,
  wsUrl = DEFAULT_WS_URL,
}: AgentStreamProps) {
  const [events, setEvents] = useState<GalleryEvent[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionState("connecting");
    setErrorMessage(null);

    try {
      const url = sessionId ? `${wsUrl}?session=${sessionId}` : wsUrl;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setConnectionState("connected");
        setErrorMessage(null);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "connected") {
            console.log("Connected to gallery stream:", msg.subscriptionId);
          } else if (msg.type === "event") {
            setEvents((prev) => {
              const newEvents = [msg.event, ...prev].slice(0, maxEvents);
              return newEvents;
            });
          } else if (msg.type === "filterUpdated") {
            console.log("Filter updated:", msg.sessionFilter);
          }
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      ws.onerror = () => {
        setConnectionState("error");
        setErrorMessage("WebSocket connection error");
      };

      ws.onclose = () => {
        setConnectionState("disconnected");
        wsRef.current = null;

        // Auto-reconnect after 5 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting to reconnect...");
          connect();
        }, 5000);
      };

      wsRef.current = ws;
    } catch (e) {
      setConnectionState("error");
      setErrorMessage(e instanceof Error ? e.message : "Connection failed");
    }
  }, [wsUrl, sessionId, maxEvents]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionState("disconnected");
  }, []);

  const useDemoMode = useCallback(() => {
    disconnect();
    setConnectionState("demo");
    setEvents(DEMO_EVENTS);
  }, [disconnect]);

  // Start in demo mode by default - no deceptive "connecting" spinner
  // User can click "Connect" to try real server if one is running
  useEffect(() => {
    // Immediately show demo mode - don't pretend to connect
    useDemoMode();

    return () => {
      disconnect();
    };
  }, [disconnect, useDemoMode]);

  // Update session filter if connected
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && sessionId !== undefined) {
      wsRef.current.send(JSON.stringify({
        type: "setFilter",
        sessionId,
      }));
    }
  }, [sessionId]);

  // Auto-scroll when new events arrive
  useEffect(() => {
    if (isLive && streamRef.current) {
      streamRef.current.scrollTop = 0;
    }
  }, [events, isLive]);

  const streamBgColor = "rgba(20, 10, 15, 0.6)";
  const isDemo = connectionState === "demo";
  const displayEvents = events.length > 0 ? events : (isDemo ? DEMO_EVENTS : []);

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <HStack>
          <Text fontWeight="bold" color="pink.200">Agent Stream</Text>
          {connectionState === "connected" && (
            <Badge colorScheme="green" variant="subtle">
              <HStack spacing={1}>
                <Box
                  w={2}
                  h={2}
                  borderRadius="full"
                  bg="green.400"
                  animation="pulse 2s infinite"
                />
                <Text>Live</Text>
              </HStack>
            </Badge>
          )}
          {connectionState === "connecting" && (
            <Badge colorScheme="yellow" variant="subtle">
              <HStack spacing={1}>
                <Spinner size="xs" />
                <Text>Connecting...</Text>
              </HStack>
            </Badge>
          )}
          {connectionState === "disconnected" && (
            <Badge colorScheme="gray" variant="subtle">
              Disconnected
            </Badge>
          )}
          {connectionState === "error" && (
            <Badge colorScheme="red" variant="subtle">
              Error
            </Badge>
          )}
          {connectionState === "demo" && (
            <Badge colorScheme="purple" variant="subtle">
              Demo Mode
            </Badge>
          )}
        </HStack>
        <HStack>
          {connectionState !== "connected" && connectionState !== "connecting" && (
            <Button size="xs" onClick={connect}>
              Connect
            </Button>
          )}
          {connectionState === "connected" && (
            <Button size="xs" variant="ghost" onClick={disconnect}>
              Disconnect
            </Button>
          )}
          <Text fontSize="sm" color="gray.500">
            {displayEvents.length} events
          </Text>
        </HStack>
      </HStack>

      {isDemo && (
        <Alert status="warning" mb={4} borderRadius="md" bg="rgba(236, 153, 72, 0.1)" borderColor="orange.500">
          <AlertIcon color="orange.400" />
          <AlertDescription fontSize="sm" color="orange.200">
            Showing simulated data. Real agent execution is not yet implemented.
            Click "Connect" to try connecting to a local WebSocket server.
          </AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert status="warning" mb={4} borderRadius="md">
          <AlertIcon />
          <AlertDescription fontSize="sm">
            {errorMessage}. Will retry automatically.
          </AlertDescription>
        </Alert>
      )}

      {sessionId && (
        <Box mb={4} p={2} bg={streamBgColor} borderRadius="md">
          <Text fontSize="sm" color="gray.400">
            Filtering: <Code colorScheme="pink">{sessionId}</Code>
          </Text>
        </Box>
      )}

      <Box
        ref={streamRef}
        maxH="600px"
        overflowY="auto"
        borderRadius="lg"
        bg={streamBgColor}
        p={4}
        borderWidth="1px"
        borderColor="rgba(236, 72, 153, 0.2)"
      >
        {displayEvents.length === 0 ? (
          <VStack py={8} color="gray.400">
            <Spinner size="lg" color="pink.400" />
            <Text>Waiting for events...</Text>
            <Text fontSize="sm" color="gray.500">Make sure the MCP server is running</Text>
            <Button size="sm" mt={2} onClick={useDemoMode} colorScheme="pink" variant="outline">
              Use Demo Mode
            </Button>
          </VStack>
        ) : (
          <VStack spacing={3} align="stretch">
            {displayEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </VStack>
        )}
      </Box>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </Box>
  );
}

export default AgentStream;
