import { describe, it } from "node:test";
import assert from "node:assert";

import { handleTonWalletTool, tonWalletTools } from "./ton-wallet.js";
import { handleTonContractTool, tonContractTools } from "./ton-contract.js";

describe("TON Wallet Tool Definitions", () => {
  it("should have required wallet tools defined", () => {
    const toolNames = tonWalletTools.map(t => t.name);

    assert.ok(toolNames.includes("ton_wallet_connect"), "Should have connect");
    assert.ok(toolNames.includes("ton_wallet_balance"), "Should have balance");
    assert.ok(toolNames.includes("ton_wallet_send"), "Should have send");
    assert.ok(toolNames.includes("ton_wallet_transactions"), "Should have transactions");
    assert.ok(toolNames.includes("ton_wallet_info"), "Should have info");
    assert.ok(toolNames.includes("ton_wallet_disconnect"), "Should have disconnect");
  });

  it("should have proper input schemas", () => {
    const connectTool = tonWalletTools.find(t => t.name === "ton_wallet_connect");
    assert.ok(connectTool, "connect tool should exist");
    assert.ok(connectTool.inputSchema.properties?.mnemonic, "Should require mnemonic");
    assert.ok(connectTool.inputSchema.required?.includes("mnemonic"), "mnemonic should be required");
  });
});

describe("TON Contract Tool Definitions", () => {
  it("should have required contract tools defined", () => {
    const toolNames = tonContractTools.map(t => t.name);

    assert.ok(toolNames.includes("ton_contract_get_info"), "Should have get_info");
    assert.ok(toolNames.includes("ton_contract_call_getter"), "Should have call_getter");
    assert.ok(toolNames.includes("ton_contract_get_state"), "Should have get_state");
    assert.ok(toolNames.includes("ton_contract_jetton_info"), "Should have jetton_info");
    assert.ok(toolNames.includes("ton_contract_nft_info"), "Should have nft_info");
  });

  it("should have network option on all contract tools", () => {
    for (const tool of tonContractTools) {
      const props = tool.inputSchema.properties as Record<string, { enum?: string[] }> | undefined;
      assert.ok(
        props?.network,
        `${tool.name} should have network option`
      );
      assert.deepStrictEqual(
        props?.network?.enum,
        ["mainnet", "testnet"],
        `${tool.name} network should have correct enum`
      );
    }
  });
});

describe("TON Wallet Handler - No Connection", () => {
  it("should return wallet info when not connected", async () => {
    const result = await handleTonWalletTool("ton_wallet_info", {});
    assert.ok(!result.isError, "info should not error");

    const parsed = JSON.parse(result.content[0].text);
    assert.strictEqual(parsed.connected, false);
    assert.strictEqual(parsed.canSign, false);
  });

  it("should error on balance without address", async () => {
    const result = await handleTonWalletTool("ton_wallet_balance", {});
    assert.ok(result.isError, "Should error without address");
    assert.ok(
      result.content[0].text.includes("No address"),
      "Should mention no address"
    );
  });

  it("should error on send without connection", async () => {
    const result = await handleTonWalletTool("ton_wallet_send", {
      to: "EQDvRVnzT0D6C00E7iCbPXDwwz_nlhM0YPHP0U7xnPs1Rrr1",
      amount: "1",
    });
    assert.ok(result.isError, "Should error without wallet");
    assert.ok(
      result.content[0].text.includes("No wallet connected"),
      "Should mention no wallet"
    );
  });

  it("should error on invalid mnemonic", async () => {
    const result = await handleTonWalletTool("ton_wallet_connect", {
      mnemonic: "invalid mnemonic",
    });
    assert.ok(result.isError, "Should error on invalid mnemonic");
    assert.ok(
      result.content[0].text.includes("must be 24 words"),
      "Should mention 24 words"
    );
  });

  it("should disconnect successfully even when not connected", async () => {
    const result = await handleTonWalletTool("ton_wallet_disconnect", {});
    assert.ok(!result.isError, "disconnect should not error");

    const parsed = JSON.parse(result.content[0].text);
    assert.ok(parsed.success, "Should succeed");
  });

  it("should handle unknown tool", async () => {
    const result = await handleTonWalletTool("ton_wallet_unknown", {});
    assert.ok(result.isError, "Should error on unknown tool");
  });
});

describe("TON Contract Handler - Error Handling", () => {
  it("should handle invalid address", async () => {
    const result = await handleTonContractTool("ton_contract_get_info", {
      address: "invalid-address",
    });
    assert.ok(result.isError, "Should error on invalid address");
  });

  it("should handle unknown tool", async () => {
    const result = await handleTonContractTool("ton_contract_unknown", {});
    assert.ok(result.isError, "Should error on unknown tool");
  });
});
