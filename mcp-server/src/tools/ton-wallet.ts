import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { TonClient, WalletContractV4, internal } from "@ton/ton";
import { mnemonicToPrivateKey, KeyPair } from "@ton/crypto";
import { Address, toNano, fromNano, beginCell } from "@ton/core";

type Network = "mainnet" | "testnet";
type ToolResult = { content: Array<{ type: string; text: string }>; isError?: boolean };

const ENDPOINTS: Record<Network, string> = {
  mainnet: "https://toncenter.com/api/v2/jsonRPC",
  testnet: "https://testnet.toncenter.com/api/v2/jsonRPC",
};

interface WalletState {
  client: TonClient | null;
  wallet: WalletContractV4 | null;
  keyPair: KeyPair | null;
  address: string | null;
  network: Network;
}

const state: WalletState = {
  client: null,
  wallet: null,
  keyPair: null,
  address: null,
  network: "testnet",
};

const ok = (data: object): ToolResult => ({
  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
});

const err = (message: string): ToolResult => ({
  content: [{ type: "text", text: message }],
  isError: true,
});

const getClient = (network: Network = "testnet") =>
  state.client || new TonClient({ endpoint: ENDPOINTS[network] });

export const tonWalletTools: Tool[] = [
  {
    name: "ton_wallet_connect",
    description: "Connect to a TON wallet using mnemonic phrase. Returns the wallet address. WARNING: The mnemonic is stored in memory for signing transactions.",
    inputSchema: {
      type: "object",
      properties: {
        mnemonic: {
          type: "string",
          description: "24-word mnemonic phrase (space-separated)",
        },
        network: {
          type: "string",
          enum: ["mainnet", "testnet"],
          description: "Network to connect to (default: testnet)",
        },
      },
      required: ["mnemonic"],
    },
  },
  {
    name: "ton_wallet_balance",
    description: "Get the balance of a TON wallet address",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "TON wallet address (uses connected wallet if not provided)",
        },
      },
    },
  },
  {
    name: "ton_wallet_send",
    description: "Send TON from the connected wallet to an address. ACTUALLY SENDS REAL TRANSACTIONS.",
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "Recipient TON address",
        },
        amount: {
          type: "string",
          description: "Amount in TON (e.g., '0.5')",
        },
        message: {
          type: "string",
          description: "Optional comment/memo for the transaction",
        },
        dryRun: {
          type: "boolean",
          description: "If true, prepare but don't send the transaction (default: false)",
        },
      },
      required: ["to", "amount"],
    },
  },
  {
    name: "ton_wallet_transactions",
    description: "Get recent transactions for a TON wallet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "TON wallet address (uses connected wallet if not provided)",
        },
        limit: {
          type: "number",
          description: "Number of transactions to fetch (default: 10)",
        },
      },
    },
  },
  {
    name: "ton_wallet_info",
    description: "Get current wallet connection status and info",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "ton_wallet_disconnect",
    description: "Disconnect the current wallet and clear stored keys from memory",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

export async function handleTonWalletTool(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<ToolResult> {
  switch (name) {
    case "ton_wallet_connect": {
      const mnemonic = args?.mnemonic as string;
      const network = (args?.network as Network) || "testnet";

      const mnemonicArray = mnemonic.split(" ");
      if (mnemonicArray.length !== 24) {
        return err("Invalid mnemonic: must be 24 words");
      }

      const keyPair = await mnemonicToPrivateKey(mnemonicArray);
      const wallet = WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: 0 });
      const client = new TonClient({ endpoint: ENDPOINTS[network] });

      state.client = client;
      state.wallet = wallet;
      state.keyPair = keyPair;
      state.address = wallet.address.toString();
      state.network = network;

      const contractState = await client.getContractState(wallet.address);

      return ok({
        success: true,
        address: state.address,
        network: state.network,
        isDeployed: contractState.state === "active",
        _warning: "Private key is stored in memory. Use ton_wallet_disconnect when done.",
      });
    }

    case "ton_wallet_balance": {
      const addressStr = (args?.address as string) || state.address;
      if (!addressStr) return err("No address provided and no wallet connected");

      const balance = await getClient().getBalance(Address.parse(addressStr));

      return ok({
        address: addressStr,
        balance: fromNano(balance),
        balanceNano: balance.toString(),
      });
    }

    case "ton_wallet_send": {
      if (!state.wallet || !state.client || !state.keyPair) {
        return err("No wallet connected with signing capability. Use ton_wallet_connect first.");
      }

      const to = args?.to as string;
      const amount = args?.amount as string;
      const message = args?.message as string | undefined;
      const dryRun = (args?.dryRun as boolean) || false;

      let recipientAddress: Address;
      try {
        recipientAddress = Address.parse(to);
      } catch {
        return err(`Invalid recipient address: ${to}`);
      }

      let amountNano: bigint;
      try {
        amountNano = toNano(amount);
        if (amountNano <= 0n) throw new Error("Amount must be positive");
      } catch {
        return err(`Invalid amount: ${amount}`);
      }

      const contract = state.client.open(state.wallet);
      const seqno = await contract.getSeqno();
      const balance = await state.client.getBalance(state.wallet.address);
      const estimatedFee = toNano("0.01");

      if (balance < amountNano + estimatedFee) {
        return {
          ...err("Insufficient balance"),
          content: [{ type: "text", text: JSON.stringify({
            error: "Insufficient balance",
            balance: fromNano(balance),
            requested: amount,
            estimatedFee: fromNano(estimatedFee),
          }, null, 2) }],
        };
      }

      const body = message
        ? beginCell().storeUint(0, 32).storeStringTail(message).endCell()
        : undefined;

      const txInfo = {
        from: state.address,
        to: recipientAddress.toString(),
        amount,
        amountNano: amountNano.toString(),
        message: message || null,
        seqno,
      };

      if (dryRun) {
        return ok({
          dryRun: true,
          status: "prepared",
          ...txInfo,
          balance: fromNano(balance),
          balanceAfter: fromNano(balance - amountNano - estimatedFee),
          estimatedFee: fromNano(estimatedFee),
          _note: "Transaction NOT sent. Remove dryRun:true to send.",
        });
      }

      await contract.sendTransfer({
        seqno,
        secretKey: state.keyPair.secretKey,
        messages: [internal({ to: recipientAddress, value: amountNano, body, bounce: false })],
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
      let newSeqno = seqno;
      try { newSeqno = await contract.getSeqno(); } catch { /* keep seqno */ }

      const confirmed = newSeqno > seqno;
      return ok({
        success: true,
        status: confirmed ? "confirmed" : "pending",
        ...txInfo,
        newSeqno,
        _note: confirmed
          ? "Transaction confirmed (seqno increased)"
          : "Transaction submitted but not yet confirmed. Check balance in a few seconds.",
      });
    }

    case "ton_wallet_transactions": {
      const addressStr = (args?.address as string) || state.address;
      const limit = (args?.limit as number) || 10;

      if (!addressStr) return err("No address provided and no wallet connected");

      const transactions = await getClient().getTransactions(Address.parse(addressStr), { limit });

      return ok({
        address: addressStr,
        count: transactions.length,
        transactions: transactions.map((tx) => ({
          hash: tx.hash().toString("hex"),
          lt: tx.lt.toString(),
          now: tx.now,
          inMessage: tx.inMessage && tx.inMessage.info.type === "internal" ? {
            value: fromNano(tx.inMessage.info.value.coins),
            src: tx.inMessage.info.src?.toString() || null,
          } : null,
          outMessagesCount: tx.outMessagesCount,
        })),
      });
    }

    case "ton_wallet_info":
      return ok({
        connected: !!state.wallet,
        canSign: !!state.keyPair,
        address: state.address,
        network: state.network,
      });

    case "ton_wallet_disconnect":
      state.client = null;
      state.wallet = null;
      state.keyPair = null;
      state.address = null;
      state.network = "testnet";
      return ok({ success: true, message: "Wallet disconnected. Keys cleared from memory." });

    default:
      return err(`Unknown wallet tool: ${name}`);
  }
}
