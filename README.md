# Clawmasutra

An agent-to-agent MCP-first application that reimagines the Kama Sutra's themes through AI agent collaboration, with TON blockchain integration.

## The Metaphor

| Kama Sutra | Clawmasutra |
|------------|-------------|
| Positions | Agent collaboration patterns (sequential, parallel, hierarchical, swarm) |
| Partners | Agent types/roles (researcher, trader, builder, oracle) |
| Techniques | MCP tools, session messaging, tool handoffs |
| Philosophy | Agent design principles (autonomy, trust, boundaries) |
| Healing | Debugging, optimization, recovery patterns |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLAWMASUTRA                          │
├─────────────────────────────────────────────────────────┤
│   ┌─────────┐  sessions_send  ┌─────────┐              │
│   │ Agent A │◄───────────────►│ Agent B │              │
│   │ (Lover) │                 │(Partner)│              │
│   └────┬────┘                 └────┬────┘              │
│        │ MCP Tools                 │ MCP Tools          │
│        ▼                           ▼                    │
│   ┌─────────────────────────────────────┐              │
│   │         TON Blockchain               │              │
│   │   (contracts, wallets, jettons)      │              │
│   └─────────────────────────────────────┘              │
│   ┌─────────────────────────────────────┐              │
│   │      Visual Observation UI           │              │
│   │   (humans watch agents perform)      │              │
│   └─────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

## Positions (Agent Patterns)

### Solo Positions
- **The Contemplator** - Single agent deep-diving into blockchain data
- **The Wanderer** - Exploratory agent scanning for opportunities

### Duet Positions
- **The Mirror** - Two agents auditing each other's transactions
- **The Relay** - Sequential handoff (research → execute → verify)
- **The Dance** - Alternating negotiation between agents
- **The Embrace** - Two agents sharing a wallet, coordinating moves

### Group Positions
- **The Circle** - Round-robin consensus on strategy
- **The Pyramid** - Oracle at top, workers executing below
- **The Swarm** - Parallel agents scanning multiple protocols
- **The Tantric** - Slow, deliberate multi-agent consensus

### Crypto-Specific Positions
- **The Arbitrageur** - Agents spotting and executing arb opportunities
- **The Oracle Choir** - Multiple agents providing price feeds
- **The DAO Dance** - Agents voting and proposing in coordination
- **The Liquidity Lotus** - Coordinated LP management across pools

## Project Structure

```
clawmasutra/
├── skills/                    # OpenClaw skills (SKILL.md format)
│   ├── positions/
│   │   ├── solo/              # Single agent patterns
│   │   ├── duet/              # Two agent patterns
│   │   └── group/             # Multi-agent patterns
│   ├── healing/               # Debugging & recovery
│   └── crypto/                # Crypto-specific positions
├── mcp-server/                # Custom MCP server
│   └── src/tools/             # TON & position tools
├── dapp/                      # Visual observation UI
└── contracts/                 # TON smart contracts
```

## Getting Started

### Prerequisites
- Node.js ≥22
- pnpm
- OpenClaw installed and running

### Installation

```bash
# Install MCP server dependencies
cd mcp-server && pnpm install

# Install DApp dependencies
cd dapp && yarn install

# Copy skills to OpenClaw workspace
cp -r skills/* ~/.openclaw/workspace/skills/
```

### Running

```bash
# Start MCP server
cd mcp-server && pnpm dev

# Start DApp (in another terminal)
cd dapp && yarn dev
```

## Technical Stack

- **Framework**: OpenClaw (agent orchestration)
- **Blockchain**: TON Network
- **Frontend**: React + Chakra UI + Vite
- **MCP Server**: TypeScript + @modelcontextprotocol/sdk

## Documentation

| Document | Description |
|----------|-------------|
| [AGENT.md](./AGENT.md) | Agent integration guide - include in SOUL.md or system prompts |
| [docs/POSITIONS_QUICK_REF.md](./docs/POSITIONS_QUICK_REF.md) | One-page position reference card |
| [docs/MCP_TOOLS_REF.md](./docs/MCP_TOOLS_REF.md) | Complete MCP tool documentation |

### Claude Code Skill

A `/clawmasutra` skill is available for Claude Code users:

```bash
# Installed at ~/.claude/skills/clawmasutra/SKILL.md
/clawmasutra list           # List positions
/clawmasutra start mirror   # Start a position
/clawmasutra status         # Check status
```

## License

MIT
