# Clawmasutra MCP Tools Reference

Complete tool documentation for the Clawmasutra MCP server.

---

## Position Tools

Tools for managing agent collaboration positions.

### position_list

List all available Clawmasutra positions.

```json
{
  "name": "position_list",
  "params": {
    "category": "solo | duet | group | crypto | all"
  }
}
```

**Response:**
```json
{
  "count": 15,
  "positions": [
    { "name": "contemplator", "description": "...", "agents": 1, "category": "solo", "skillExists": true }
  ],
  "environment": {
    "openClawAvailable": false,
    "skillsPath": "/path/to/skills"
  }
}
```

---

### position_invoke

Start a position session.

```json
{
  "name": "position_invoke",
  "params": {
    "position": "string (required)",
    "config": {
      "target": "TON address or topic",
      "network": "mainnet | testnet",
      "duration": "seconds (0 = indefinite)"
    },
    "demoMode": "boolean (force demo mode)"
  }
}
```

**Response:**
```json
{
  "sessionId": "contemplator-1704067200000",
  "position": "contemplator",
  "description": "Single agent deep-diving into blockchain data",
  "agents": ["demo-agent-1"],
  "status": "running",
  "config": { "target": "EQ..." },
  "_mode": "DEMO"
}
```

---

### position_status

Check status of a running session.

```json
{
  "name": "position_status",
  "params": {
    "sessionId": "string (required)"
  }
}
```

**Response:**
```json
{
  "sessionId": "mirror-1704067200000",
  "position": "mirror",
  "status": "running",
  "agents": ["demo-agent-1", "demo-agent-2"],
  "startedAt": "2024-01-01T00:00:00.000Z",
  "runningFor": "45s"
}
```

---

### position_stop

Stop an active session.

```json
{
  "name": "position_stop",
  "params": {
    "sessionId": "string (required)"
  }
}
```

**Response:**
```json
{
  "sessionId": "mirror-1704067200000",
  "position": "mirror",
  "status": "stopped",
  "ranFor": "120s"
}
```

---

### position_describe

Get detailed information about a position.

```json
{
  "name": "position_describe",
  "params": {
    "position": "string (required)"
  }
}
```

**Response:**
```json
{
  "name": "mirror",
  "category": "duet",
  "agents": 2,
  "description": "Two agents auditing each other's transactions",
  "skillPath": "/path/to/skills/positions/duet/mirror/SKILL.md",
  "skillExists": true,
  "details": "# The Mirror\n\n..."
}
```

---

## Wallet Tools

Tools for TON wallet operations.

### ton_wallet_connect

Connect to a TON wallet using mnemonic.

```json
{
  "name": "ton_wallet_connect",
  "params": {
    "mnemonic": "24-word phrase (required)",
    "network": "mainnet | testnet"
  }
}
```

**Response:**
```json
{
  "success": true,
  "address": "EQ...",
  "network": "testnet",
  "isDeployed": true,
  "_warning": "Private key is stored in memory. Use ton_wallet_disconnect when done."
}
```

**Security:** Mnemonic stored in memory only. Always disconnect when done.

---

### ton_wallet_balance

Get wallet balance.

```json
{
  "name": "ton_wallet_balance",
  "params": {
    "address": "TON address (optional, uses connected wallet)"
  }
}
```

**Response:**
```json
{
  "address": "EQ...",
  "balance": "123.456",
  "balanceNano": "123456000000"
}
```

---

### ton_wallet_send

Send TON from connected wallet.

```json
{
  "name": "ton_wallet_send",
  "params": {
    "to": "recipient address (required)",
    "amount": "amount in TON (required)",
    "message": "optional comment",
    "dryRun": "boolean (prepare but don't send)"
  }
}
```

**Response (dryRun=true):**
```json
{
  "dryRun": true,
  "status": "prepared",
  "from": "EQ...",
  "to": "EQ...",
  "amount": "1.5",
  "balance": "100.0",
  "balanceAfter": "98.49",
  "_note": "Transaction NOT sent. Remove dryRun:true to send."
}
```

**Response (sent):**
```json
{
  "success": true,
  "status": "confirmed",
  "from": "EQ...",
  "to": "EQ...",
  "amount": "1.5",
  "newSeqno": 43
}
```

---

### ton_wallet_transactions

Get recent transactions.

```json
{
  "name": "ton_wallet_transactions",
  "params": {
    "address": "TON address (optional)",
    "limit": "number (default: 10)"
  }
}
```

**Response:**
```json
{
  "address": "EQ...",
  "count": 10,
  "transactions": [
    {
      "hash": "abc123...",
      "lt": "12345678",
      "now": 1704067200,
      "inMessage": { "value": "5.0", "src": "EQ..." },
      "outMessagesCount": 1
    }
  ]
}
```

---

### ton_wallet_info

Get connection status.

```json
{
  "name": "ton_wallet_info",
  "params": {}
}
```

**Response:**
```json
{
  "connected": true,
  "canSign": true,
  "address": "EQ...",
  "network": "testnet"
}
```

---

### ton_wallet_disconnect

Disconnect and clear keys.

```json
{
  "name": "ton_wallet_disconnect",
  "params": {}
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet disconnected. Keys cleared from memory."
}
```

---

## Contract Tools

Tools for TON smart contract interaction.

### ton_contract_get_info

Get contract information.

```json
{
  "name": "ton_contract_get_info",
  "params": {
    "address": "contract address (required)",
    "network": "mainnet | testnet"
  }
}
```

**Response:**
```json
{
  "address": "EQ...",
  "network": "testnet",
  "state": "active",
  "balance": "1000000000",
  "lastTransaction": { "lt": "12345", "hash": "abc..." },
  "codeHash": "def..."
}
```

---

### ton_contract_call_getter

Call a getter method.

```json
{
  "name": "ton_contract_call_getter",
  "params": {
    "address": "contract address (required)",
    "method": "getter name (required)",
    "network": "mainnet | testnet"
  }
}
```

**Response:**
```json
{
  "address": "EQ...",
  "network": "testnet",
  "method": "get_balance",
  "result": [
    { "type": "int", "value": "1000000000" }
  ],
  "gasUsed": "1234"
}
```

---

### ton_contract_get_state

Get contract state details.

```json
{
  "name": "ton_contract_get_state",
  "params": {
    "address": "contract address (required)",
    "network": "mainnet | testnet"
  }
}
```

**Response:**
```json
{
  "address": "EQ...",
  "network": "testnet",
  "state": "active",
  "balance": "1000000000",
  "code": "512 bytes",
  "data": "128 bytes"
}
```

---

### ton_contract_jetton_info

Get Jetton (fungible token) information.

```json
{
  "name": "ton_contract_jetton_info",
  "params": {
    "masterAddress": "jetton master address (required)",
    "network": "mainnet | testnet"
  }
}
```

**Response:**
```json
{
  "masterAddress": "EQ...",
  "network": "testnet",
  "totalSupply": "1000000000000000000",
  "mintable": true,
  "adminAddress": "EQ...",
  "contentHash": "abc...",
  "walletCodeHash": "def..."
}
```

---

### ton_contract_nft_info

Get NFT or collection information.

```json
{
  "name": "ton_contract_nft_info",
  "params": {
    "address": "NFT/collection address (required)",
    "network": "mainnet | testnet"
  }
}
```

**Response (collection):**
```json
{
  "type": "collection",
  "address": "EQ...",
  "network": "testnet",
  "nextItemIndex": "100",
  "contentHash": "abc...",
  "ownerAddress": "EQ..."
}
```

**Response (item):**
```json
{
  "type": "item",
  "address": "EQ...",
  "network": "testnet",
  "initialized": true,
  "index": "42",
  "collectionAddress": "EQ...",
  "ownerAddress": "EQ...",
  "contentHash": "abc..."
}
```

---

## Gallery Tools

Tools for visual observation UI streaming.

### gallery_emit

Emit an event to the gallery stream.

```json
{
  "name": "gallery_emit",
  "params": {
    "sessionId": "position session ID (required)",
    "agentId": "emitting agent (optional)",
    "type": "agent_message | agent_action | blockchain_tx | position_update | system (required)",
    "data": "event payload object (required)"
  }
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "evt-1704067200000-abc123",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "broadcastedTo": 3,
  "wsServerRunning": true
}
```

**Event Types:**
- `agent_message` - Agent communication logs
- `agent_action` - Tool calls, decisions
- `blockchain_tx` - Transaction events
- `position_update` - Position state changes
- `system` - System-level events

---

### gallery_stream

Get recent events (polling).

```json
{
  "name": "gallery_stream",
  "params": {
    "sessionId": "filter by session (optional)",
    "agentId": "filter by agent (optional)",
    "type": "filter by event type (optional)",
    "limit": "number (default: 50)",
    "since": "ISO timestamp (optional)"
  }
}
```

**Response:**
```json
{
  "count": 10,
  "events": [
    {
      "id": "evt-...",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "type": "agent_message",
      "sessionId": "mirror-123",
      "agentId": "reflector",
      "data": { "message": "Analysis complete" }
    }
  ],
  "_realtime": "For real-time updates, connect to ws://localhost:3001"
}
```

---

### gallery_server_start

Start WebSocket server for real-time streaming.

```json
{
  "name": "gallery_server_start",
  "params": {}
}
```

**Response:**
```json
{
  "success": true,
  "wsUrl": "ws://localhost:3001",
  "message": "WebSocket server is running.",
  "connectedClients": 0,
  "usage": {
    "connect": "ws://localhost:3001",
    "connectWithFilter": "ws://localhost:3001?session=YOUR_SESSION_ID",
    "changeFilter": "{ \"type\": \"setFilter\", \"sessionId\": \"SESSION_ID\" }"
  }
}
```

---

### gallery_server_status

Get WebSocket server status.

```json
{
  "name": "gallery_server_status",
  "params": {}
}
```

**Response:**
```json
{
  "running": true,
  "port": 3001,
  "wsUrl": "ws://localhost:3001",
  "connectedClients": 2,
  "clientDetails": [
    { "subscriptionId": "ws-123", "sessionFilter": "all", "connected": true }
  ],
  "eventStoreSize": 47
}
```

---

### gallery_clear

Clear events from the gallery.

```json
{
  "name": "gallery_clear",
  "params": {
    "sessionId": "clear only this session (optional)"
  }
}
```

**Response:**
```json
{
  "success": true,
  "cleared": 47,
  "remaining": 0
}
```

---

## WebSocket Protocol

Connect to `ws://localhost:3001` for real-time events.

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3001');
// Or with session filter:
const ws = new WebSocket('ws://localhost:3001?session=mirror-123');
```

### Incoming Messages

**Connected:**
```json
{
  "type": "connected",
  "subscriptionId": "ws-123",
  "sessionFilter": "all",
  "message": "Connected to Clawmasutra Gallery Stream"
}
```

**Event:**
```json
{
  "type": "event",
  "event": {
    "id": "evt-...",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "type": "agent_message",
    "sessionId": "mirror-123",
    "agentId": "reflector",
    "data": { "message": "..." }
  }
}
```

### Outgoing Messages

**Change filter:**
```json
{
  "type": "setFilter",
  "sessionId": "mirror-123"
}
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLAWMASUTRA_SKILLS_PATH` | Path to skills directory | `../skills` |
| `OPENCLAW_PATH` | Path to OpenClaw installation | (none) |
| `GALLERY_WS_PORT` | WebSocket server port | `3001` |

---

## Error Handling

All tools return errors in this format:

```json
{
  "content": [{ "type": "text", "text": "Error message" }],
  "isError": true
}
```

Common errors:
- `Unknown position: xyz` - Invalid position name
- `No wallet connected` - Must connect wallet first
- `Invalid address` - TON address parsing failed
- `sessionId is required` - Missing required parameter

---

*For position-specific workflows, see individual SKILL.md files.*
