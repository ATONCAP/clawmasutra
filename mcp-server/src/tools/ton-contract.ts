import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { TonClient } from "@ton/ton";
import { Address, Cell } from "@ton/core";

const ENDPOINTS = {
  mainnet: "https://toncenter.com/api/v2/jsonRPC",
  testnet: "https://testnet.toncenter.com/api/v2/jsonRPC",
} as const;

type Network = "mainnet" | "testnet";

function getClient(network: Network = "testnet"): TonClient {
  return new TonClient({ endpoint: ENDPOINTS[network] });
}

export const tonContractTools: Tool[] = [
  {
    name: "ton_contract_get_info",
    description: "Get information about a TON smart contract (state, code hash, data)",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Contract address on TON",
        },
        network: {
          type: "string",
          enum: ["mainnet", "testnet"],
          description: "Network to use (default: testnet)",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "ton_contract_call_getter",
    description: "Call a getter method on a TON smart contract",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Contract address on TON",
        },
        method: {
          type: "string",
          description: "Getter method name",
        },
        network: {
          type: "string",
          enum: ["mainnet", "testnet"],
          description: "Network to use (default: testnet)",
        },
      },
      required: ["address", "method"],
    },
  },
  {
    name: "ton_contract_get_state",
    description: "Get the current state of a TON smart contract",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Contract address on TON",
        },
        network: {
          type: "string",
          enum: ["mainnet", "testnet"],
          description: "Network to use (default: testnet)",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "ton_contract_jetton_info",
    description: "Get information about a Jetton (fungible token) on TON",
    inputSchema: {
      type: "object",
      properties: {
        masterAddress: {
          type: "string",
          description: "Jetton master contract address",
        },
        network: {
          type: "string",
          enum: ["mainnet", "testnet"],
          description: "Network to use (default: testnet)",
        },
      },
      required: ["masterAddress"],
    },
  },
  {
    name: "ton_contract_nft_info",
    description: "Get information about an NFT or NFT collection on TON",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "NFT item or collection address",
        },
        network: {
          type: "string",
          enum: ["mainnet", "testnet"],
          description: "Network to use (default: testnet)",
        },
      },
      required: ["address"],
    },
  },
];

export async function handleTonContractTool(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  const network = (args?.network as "mainnet" | "testnet") || "testnet";
  const client = getClient(network);

  try {
    switch (name) {
      case "ton_contract_get_info": {
        const addressStr = args?.address as string;
        const address = Address.parse(addressStr);

        const state = await client.getContractState(address);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              address: addressStr,
              network,
              state: state.state,
              balance: state.balance.toString(),
              lastTransaction: state.lastTransaction ? {
                lt: state.lastTransaction.lt.toString(),
                hash: Buffer.from(state.lastTransaction.hash).toString("hex"),
              } : null,
              codeHash: state.code ? Cell.fromBoc(state.code)[0].hash().toString("hex") : null,
            }, null, 2),
          }],
        };
      }

      case "ton_contract_call_getter": {
        const addressStr = args?.address as string;
        const method = args?.method as string;

        const address = Address.parse(addressStr);
        const result = await client.runMethod(address, method);

        // Parse result stack - read all items
        const resultItems: unknown[] = [];
        while (result.stack.remaining > 0) {
          // Read as generic tuple item
          const itemType = result.stack.peek().type;

          if (itemType === "int") {
            resultItems.push({ type: "int", value: result.stack.readBigNumber().toString() });
          } else if (itemType === "cell") {
            const cell = result.stack.readCell();
            resultItems.push({ type: "cell", hash: cell.hash().toString("hex") });
          } else if (itemType === "slice") {
            const slice = result.stack.readCell(); // Read slice as cell
            resultItems.push({ type: "slice", hash: slice.hash().toString("hex") });
          } else {
            // Skip unknown types
            result.stack.skip();
            resultItems.push({ type: itemType, value: "unknown" });
          }
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              address: addressStr,
              network,
              method,
              result: resultItems,
              gasUsed: result.gas_used?.toString(),
            }, null, 2),
          }],
        };
      }

      case "ton_contract_get_state": {
        const addressStr = args?.address as string;
        const address = Address.parse(addressStr);

        const state = await client.getContractState(address);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              address: addressStr,
              network,
              state: state.state,
              balance: state.balance.toString(),
              code: state.code ? `${state.code.length} bytes` : null,
              data: state.data ? `${state.data.length} bytes` : null,
            }, null, 2),
          }],
        };
      }

      case "ton_contract_jetton_info": {
        const masterAddress = args?.masterAddress as string;
        const address = Address.parse(masterAddress);

        const result = await client.runMethod(address, "get_jetton_data");

        const totalSupply = result.stack.readBigNumber();
        const mintable = result.stack.readBoolean();
        const adminAddress = result.stack.readAddressOpt();
        const content = result.stack.readCell();
        const walletCode = result.stack.readCell();

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              masterAddress,
              network,
              totalSupply: totalSupply.toString(),
              mintable,
              adminAddress: adminAddress?.toString() || null,
              contentHash: content.hash().toString("hex"),
              walletCodeHash: walletCode.hash().toString("hex"),
            }, null, 2),
          }],
        };
      }

      case "ton_contract_nft_info": {
        const addressStr = args?.address as string;
        const address = Address.parse(addressStr);

        // Try collection data first
        try {
          const result = await client.runMethod(address, "get_collection_data");
          const nextItemIndex = result.stack.readBigNumber();
          const content = result.stack.readCell();
          const ownerAddress = result.stack.readAddressOpt();

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                type: "collection",
                address: addressStr,
                network,
                nextItemIndex: nextItemIndex.toString(),
                contentHash: content.hash().toString("hex"),
                ownerAddress: ownerAddress?.toString() || null,
              }, null, 2),
            }],
          };
        } catch {
          // Try NFT item data
          const result = await client.runMethod(address, "get_nft_data");
          const init = result.stack.readBoolean();
          const index = result.stack.readBigNumber();
          const collectionAddress = result.stack.readAddressOpt();
          const ownerAddress = result.stack.readAddressOpt();
          const content = result.stack.readCell();

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                type: "item",
                address: addressStr,
                network,
                initialized: init,
                index: index.toString(),
                collectionAddress: collectionAddress?.toString() || null,
                ownerAddress: ownerAddress?.toString() || null,
                contentHash: content.hash().toString("hex"),
              }, null, 2),
            }],
          };
        }
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown contract tool: ${name}` }],
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
