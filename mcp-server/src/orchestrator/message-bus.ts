/**
 * Message Bus for Inter-Agent Communication
 *
 * Routes messages between agents in a collaboration session.
 */

import { AgentMessage, MessageType } from "./types.js";

export type MessageHandler = (message: AgentMessage) => void;

export class MessageBus {
  private messages: Map<string, AgentMessage[]> = new Map(); // sessionId -> messages
  private pendingByAgent: Map<string, AgentMessage[]> = new Map(); // agentId -> pending messages
  private subscribers: Set<MessageHandler> = new Set();
  private maxMessagesPerSession: number;

  constructor(maxMessagesPerSession: number = 1000) {
    this.maxMessagesPerSession = maxMessagesPerSession;
  }

  /**
   * Send a message from one agent to another (or broadcast)
   */
  send(message: Omit<AgentMessage, "id" | "timestamp" | "acknowledged">): AgentMessage {
    const fullMessage: AgentMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date(),
      acknowledged: false,
    };

    // Store in session history
    this.addToSessionHistory(fullMessage);

    // Route to recipient(s)
    if (message.to === "all") {
      // Broadcast to all agents in session except sender
      this.broadcastInSession(fullMessage);
    } else if (message.to === "orchestrator") {
      // Message to orchestrator - handled by subscribers
      this.notifySubscribers(fullMessage);
    } else {
      // Direct message to specific agent
      this.addToPending(message.to, fullMessage);
    }

    // Always notify subscribers (for logging, gallery emission, etc.)
    this.notifySubscribers(fullMessage);

    return fullMessage;
  }

  /**
   * Get pending messages for an agent (and mark as received)
   */
  receive(agentId: string): AgentMessage[] {
    const pending = this.pendingByAgent.get(agentId) || [];
    this.pendingByAgent.set(agentId, []);
    return pending;
  }

  /**
   * Peek at pending messages without removing them
   */
  peek(agentId: string): AgentMessage[] {
    return this.pendingByAgent.get(agentId) || [];
  }

  /**
   * Check if agent has pending messages
   */
  hasPending(agentId: string): boolean {
    const pending = this.pendingByAgent.get(agentId);
    return pending !== undefined && pending.length > 0;
  }

  /**
   * Get message history for a session
   */
  getSessionHistory(sessionId: string, limit?: number): AgentMessage[] {
    const history = this.messages.get(sessionId) || [];
    if (limit && limit > 0) {
      return history.slice(-limit);
    }
    return [...history];
  }

  /**
   * Get messages involving a specific agent
   */
  getAgentHistory(sessionId: string, agentId: string, limit?: number): AgentMessage[] {
    const history = this.messages.get(sessionId) || [];
    const agentMessages = history.filter(
      (m) => m.from === agentId || m.to === agentId || m.to === "all"
    );
    if (limit && limit > 0) {
      return agentMessages.slice(-limit);
    }
    return agentMessages;
  }

  /**
   * Subscribe to all messages (for orchestrator monitoring)
   */
  subscribe(handler: MessageHandler): () => void {
    this.subscribers.add(handler);
    return () => this.subscribers.delete(handler);
  }

  /**
   * Acknowledge a message was received
   */
  acknowledge(messageId: string, sessionId: string): boolean {
    const history = this.messages.get(sessionId);
    if (!history) return false;

    const message = history.find((m) => m.id === messageId);
    if (message) {
      message.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Clear all messages for a session
   */
  clearSession(sessionId: string): void {
    this.messages.delete(sessionId);

    // Clear pending messages for agents in this session
    for (const [agentId, pending] of this.pendingByAgent.entries()) {
      const remaining = pending.filter((m) => m.sessionId !== sessionId);
      if (remaining.length === 0) {
        this.pendingByAgent.delete(agentId);
      } else {
        this.pendingByAgent.set(agentId, remaining);
      }
    }
  }

  /**
   * Get statistics about the message bus
   */
  getStats(): {
    totalSessions: number;
    totalMessages: number;
    pendingMessages: number;
    subscribers: number;
  } {
    let totalMessages = 0;
    let pendingMessages = 0;

    for (const history of this.messages.values()) {
      totalMessages += history.length;
    }

    for (const pending of this.pendingByAgent.values()) {
      pendingMessages += pending.length;
    }

    return {
      totalSessions: this.messages.size,
      totalMessages,
      pendingMessages,
      subscribers: this.subscribers.size,
    };
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private addToSessionHistory(message: AgentMessage): void {
    let history = this.messages.get(message.sessionId);
    if (!history) {
      history = [];
      this.messages.set(message.sessionId, history);
    }

    history.push(message);

    // Trim if over limit
    if (history.length > this.maxMessagesPerSession) {
      history.splice(0, history.length - this.maxMessagesPerSession);
    }
  }

  private addToPending(agentId: string, message: AgentMessage): void {
    let pending = this.pendingByAgent.get(agentId);
    if (!pending) {
      pending = [];
      this.pendingByAgent.set(agentId, pending);
    }
    pending.push(message);
  }

  private broadcastInSession(message: AgentMessage): void {
    // Get all agents that have pending message queues for this session
    // In practice, the orchestrator should track which agents are in which session
    // For now, we rely on the "to: all" being handled by the orchestrator
    // which knows which agents exist

    // Mark message for broadcast handling by orchestrator
    // The orchestrator will call addToPending for each agent
  }

  private notifySubscribers(message: AgentMessage): void {
    for (const handler of this.subscribers) {
      handler(message);
    }
  }
}

// ============================================================================
// Message Type Validation
// ============================================================================

const VALID_MESSAGE_TYPES: MessageType[] = [
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
];

export function isValidMessageType(type: string): type is MessageType {
  return VALID_MESSAGE_TYPES.includes(type as MessageType);
}

export function validateMessage(
  message: Partial<AgentMessage>
): { valid: boolean; error?: string } {
  if (!message.from || typeof message.from !== "string") {
    return { valid: false, error: "from is required and must be a string" };
  }
  if (!message.to || typeof message.to !== "string") {
    return { valid: false, error: "to is required and must be a string" };
  }
  if (!message.sessionId || typeof message.sessionId !== "string") {
    return { valid: false, error: "sessionId is required and must be a string" };
  }
  if (!message.type || !isValidMessageType(message.type)) {
    return {
      valid: false,
      error: `type must be one of: ${VALID_MESSAGE_TYPES.join(", ")}`,
    };
  }
  if (message.content === undefined) {
    return { valid: false, error: "content is required" };
  }
  return { valid: true };
}

// Export singleton factory
let busInstance: MessageBus | null = null;

export function getMessageBus(maxMessages?: number): MessageBus {
  if (!busInstance) {
    busInstance = new MessageBus(maxMessages);
  }
  return busInstance;
}
