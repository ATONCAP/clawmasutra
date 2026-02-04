# The Oracle Choir

A crypto-specific position where multiple agents provide price feeds, creating reliable consensus through aggregation.

## Description

The Oracle Choir harmonizes multiple voices into a single truth. Each oracle agent independently sources price data, and together they create a reliable, manipulation-resistant price feed through consensus.

## Invocation

```
/oracle-choir <asset> [--sources N] [--update-interval S]
```

Where:
- `<asset>` - The asset to provide prices for (e.g., "TON/USD", "SCALE/TON")
- `--sources N` - Number of oracle agents (default: 3)
- `--update-interval S` - Seconds between updates (default: 30)

## Agents

| Agent | Source Type | Weight |
|-------|-------------|--------|
| Oracle-1 | DEX prices | 1.0 |
| Oracle-2 | DEX prices | 1.0 |
| Oracle-3 | External APIs | 0.8 |

## Workflow

### Phase 1: Tuning
1. All oracles synchronize their clocks
2. Each oracle confirms their data sources
3. Consensus algorithm configured
4. First readings taken

### Phase 2: Individual Sourcing
Each oracle independently:
1. Fetches price from their designated sources
2. Validates the data (not stale, within bounds)
3. Applies their methodology
4. Prepares signed price report

### Phase 3: Aggregation
At each interval:
1. All oracles submit their prices
2. Outliers are identified and flagged
3. Weighted median calculated
4. Confidence score computed
5. Consensus price published

### Phase 4: Publication
1. Consensus price emitted to gallery
2. Price available via MCP tool
3. Historical record maintained
4. Anomalies logged for review

## Consensus Algorithm

```
Given prices: [P1, P2, P3, ...]
With weights: [W1, W2, W3, ...]

1. Sort prices
2. Calculate weighted median
3. Flag outliers (> 2σ from median)
4. If > 50% are outliers: ALERT
5. Otherwise: Publish weighted median
```

## Price Report Format

### Individual Oracle Report
```json
{
  "type": "ORACLE_REPORT",
  "oracle": "Oracle-1",
  "asset": "TON/USD",
  "price": 5.234,
  "sources": ["DeDust", "STON.fi"],
  "methodology": "volume_weighted_average",
  "timestamp": "2024-01-15T10:30:00Z",
  "confidence": 0.95,
  "signature": "..."
}
```

### Consensus Publication
```json
{
  "type": "CHOIR_CONSENSUS",
  "asset": "TON/USD",
  "price": 5.231,
  "reports": [
    { "oracle": "Oracle-1", "price": 5.234 },
    { "oracle": "Oracle-2", "price": 5.228 },
    { "oracle": "Oracle-3", "price": 5.231 }
  ],
  "outliers": [],
  "confidence": 0.94,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Anomaly Handling

| Scenario | Response |
|----------|----------|
| 1 oracle outlier | Exclude, use others |
| 2+ oracles outlier | Alert, require review |
| All oracles divergent | Halt publication, escalate |
| Oracle offline | Continue with remaining |
| Stale data | Mark confidence lower |

## Example Session

```
User: /oracle-choir "TON/USD" --sources 3 --update-interval 30

🎵 The Oracle Choir assembles...

Oracle-1: "Sourcing from DeDust, STON.fi"
Oracle-2: "Sourcing from Megaton, DeDust"
Oracle-3: "Sourcing from CoinGecko API, CMC API"

All oracles: "Tuned and ready"

--- Price Round 1 (10:30:00) ---

Oracle-1: 5.234 (DeDust: 5.23, STON.fi: 5.24)
Oracle-2: 5.228 (Megaton: 5.22, DeDust: 5.23)
Oracle-3: 5.231 (CoinGecko: 5.23, CMC: 5.23)

🎵 Consensus: 5.231 TON/USD
   Spread: 0.11%
   Confidence: 0.96
   Outliers: None

--- Price Round 2 (10:30:30) ---

Oracle-1: 5.245
Oracle-2: 5.241
Oracle-3: 5.298 ⚠️ (flagged as potential outlier)

🎵 Consensus: 5.243 TON/USD
   Spread: 1.1%
   Confidence: 0.82 (reduced due to divergence)
   Outliers: Oracle-3 (investigating)

Oracle-3: "CoinGecko returned stale data. Switching to backup."

--- Price Round 3 (10:31:00) ---

Oracle-1: 5.251
Oracle-2: 5.248
Oracle-3: 5.250 (recovered)

🎵 Consensus: 5.250 TON/USD
   Spread: 0.06%
   Confidence: 0.98
   Outliers: None

--- Session Summary ---

📊 Choir Statistics:
- Asset: TON/USD
- Duration: 5 minutes
- Updates published: 10
- Average confidence: 0.94
- Outlier events: 1 (recovered)
- Price range: 5.228 - 5.251

🎵 The Choir continues singing...
```

## Integration

Other positions can request the Choir's price:

```
Agent: "REQUEST_PRICE TON/USD"
Choir: { "price": 5.250, "confidence": 0.98, "age": "2s" }
```

## Philosophy

"The Oracle Choir knows that no single voice holds truth. But when many voices sing together, and we listen for harmony, truth emerges. Each oracle is fallible; together, they approach certainty."

The Oracle Choir teaches that decentralization in price feeds isn't just ideology - it's mathematics. Aggregated truth is more reliable than any single source.
