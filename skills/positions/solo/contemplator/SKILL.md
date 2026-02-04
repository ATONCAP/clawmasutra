# The Contemplator

A solo position where a single agent performs deep, meditative analysis of blockchain data.

## Description

The Contemplator embodies focused attention - a single agent that dives deep into the mysteries of the blockchain, uncovering patterns, relationships, and insights that surface-level analysis would miss.

## Invocation

```
/contemplator <target>
```

Where `<target>` can be:
- A TON wallet address
- A contract address
- A Jetton master address
- A general topic like "top DEX pools" or "recent whale movements"

## Workflow

### Phase 1: Centering
1. Receive the target for contemplation
2. Identify the type of target (wallet, contract, jetton, NFT, topic)
3. Prepare the analytical framework

### Phase 2: Observation
1. Gather all relevant on-chain data using MCP tools:
   - `ton_wallet_balance` - Current holdings
   - `ton_wallet_transactions` - Transaction history
   - `ton_contract_get_info` - Contract state
   - `ton_contract_call_getter` - Contract data
   - `ton_contract_jetton_info` - Token details
2. Stream observations to gallery: `gallery_emit` with type `agent_action`

### Phase 3: Analysis
1. Identify patterns in the data
2. Map relationships between addresses
3. Calculate key metrics:
   - Transaction frequency
   - Average transaction size
   - Top interaction partners
   - Protocol usage patterns
4. Report insights via `gallery_emit` with type `agent_message`

### Phase 4: Synthesis
1. Compile findings into a coherent narrative
2. Highlight risks and opportunities
3. Provide actionable insights
4. Emit final report to gallery

## Tools Used

- `ton_wallet_balance` - Check balances
- `ton_wallet_transactions` - Fetch transaction history
- `ton_contract_get_info` - Contract analysis
- `ton_contract_call_getter` - Call contract methods
- `ton_contract_jetton_info` - Jetton analysis
- `ton_contract_nft_info` - NFT analysis
- `gallery_emit` - Report to visual UI

## Example Session

```
User: /contemplator EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs

Agent: *enters contemplation*

📍 Target identified: Wallet address on TON mainnet

🔍 Beginning observation phase...
- Balance: 1,234.56 TON
- Transaction count: 847
- First activity: 2023-03-15

📊 Analyzing patterns...
- Most frequent interaction: DeDust DEX (234 txs)
- Average tx size: 45.2 TON
- Peak activity hours: 14:00-18:00 UTC

💡 Key insights:
1. Active DeFi user, primarily using DeDust
2. Accumulation pattern detected over past 30 days
3. Interacts with 3 known whale wallets
4. Risk: High exposure to single DEX

📜 Contemplation complete.
```

## Philosophy

"In stillness, we see clearly. The Contemplator does not rush - it observes, it understands, it illuminates."

The Contemplator represents the foundation of all Clawmasutra positions. Before agents can dance together, they must first learn to see deeply on their own.
