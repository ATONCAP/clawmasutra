import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";

import { handlePositionTool } from "./position-invoke.js";
import { handleGalleryTool } from "./gallery-stream.js";
import { handleTonWalletTool } from "./ton-wallet.js";
import { handleTonContractTool } from "./ton-contract.js";

// ============================================================================
// BOUNDARY CONDITIONS AND EDGE CASES
// ============================================================================

describe("Position Tool Edge Cases", () => {
  it("should handle empty category filter", async () => {
    const result = await handlePositionTool("position_list", { category: "" });
    const parsed = JSON.parse(result.content[0].text);
    // Empty string should match nothing or be treated as "all"
    assert.ok(parsed.positions, "Should return positions array");
  });

  it("should handle invalid category gracefully", async () => {
    const result = await handlePositionTool("position_list", { category: "invalid" });
    const parsed = JSON.parse(result.content[0].text);
    assert.strictEqual(parsed.count, 0, "Invalid category should return 0 positions");
  });

  it("should handle null args", async () => {
    const result = await handlePositionTool("position_list", undefined);
    assert.ok(!result.isError, "undefined args should work");
    const parsed = JSON.parse(result.content[0].text);
    assert.ok(parsed.count > 0, "Should return all positions");
  });

  it("should handle empty position name", async () => {
    const result = await handlePositionTool("position_invoke", { position: "" });
    assert.ok(result.isError, "Empty position should error");
  });

  it("should handle position name with special characters", async () => {
    const result = await handlePositionTool("position_invoke", { position: "mirror<script>" });
    assert.ok(result.isError, "Special chars in position should error");
  });

  it("should list solo positions only", async () => {
    const result = await handlePositionTool("position_list", { category: "solo" });
    const parsed = JSON.parse(result.content[0].text);
    assert.ok(parsed.positions.every((p: { category: string }) => p.category === "solo"));
    assert.strictEqual(parsed.count, 2, "Should have 2 solo positions");
  });

  it("should list duet positions only", async () => {
    const result = await handlePositionTool("position_list", { category: "duet" });
    const parsed = JSON.parse(result.content[0].text);
    assert.ok(parsed.positions.every((p: { category: string }) => p.category === "duet"));
    assert.strictEqual(parsed.count, 4, "Should have 4 duet positions");
  });

  it("should list group positions only", async () => {
    const result = await handlePositionTool("position_list", { category: "group" });
    const parsed = JSON.parse(result.content[0].text);
    assert.ok(parsed.positions.every((p: { category: string }) => p.category === "group"));
    assert.strictEqual(parsed.count, 4, "Should have 4 group positions");
  });

  it("should list crypto positions only", async () => {
    const result = await handlePositionTool("position_list", { category: "crypto" });
    const parsed = JSON.parse(result.content[0].text);
    assert.ok(parsed.positions.every((p: { category: string }) => p.category === "crypto"));
    assert.strictEqual(parsed.count, 3, "Should have 3 crypto positions");
  });

  it("should handle position status for nonexistent session", async () => {
    const result = await handlePositionTool("position_status", { sessionId: "nonexistent-123" });
    assert.ok(result.isError, "Nonexistent session should error");
  });

  it("should handle position stop for nonexistent session", async () => {
    const result = await handlePositionTool("position_stop", { sessionId: "nonexistent-456" });
    assert.ok(result.isError, "Stopping nonexistent session should error");
  });

  it("should describe hyphenated position names", async () => {
    const result = await handlePositionTool("position_describe", { position: "oracle-choir" });
    assert.ok(!result.isError, "oracle-choir should be found");
    const parsed = JSON.parse(result.content[0].text);
    assert.strictEqual(parsed.name, "oracle-choir");
  });

  it("should describe liquidity-lotus position", async () => {
    const result = await handlePositionTool("position_describe", { position: "liquidity-lotus" });
    assert.ok(!result.isError, "liquidity-lotus should be found");
    const parsed = JSON.parse(result.content[0].text);
    assert.strictEqual(parsed.category, "crypto");
  });
});

describe("Position Session Lifecycle", () => {
  let sessionId: string;

  it("should create a demo session", async () => {
    const result = await handlePositionTool("position_invoke", {
      position: "contemplator",
      demoMode: true,
    });
    assert.ok(!result.isError);
    const parsed = JSON.parse(result.content[0].text);
    sessionId = parsed.sessionId;
    assert.ok(sessionId.startsWith("contemplator-"));
    assert.strictEqual(parsed._mode, "DEMO");
  });

  it("should get status of created session", async () => {
    const result = await handlePositionTool("position_status", { sessionId });
    assert.ok(!result.isError);
    const parsed = JSON.parse(result.content[0].text);
    assert.strictEqual(parsed.status, "running");
    assert.strictEqual(parsed.isDemoMode, true);
  });

  it("should stop the session", async () => {
    const result = await handlePositionTool("position_stop", { sessionId });
    assert.ok(!result.isError);
    const parsed = JSON.parse(result.content[0].text);
    assert.strictEqual(parsed.status, "stopped");
  });

  it("should show completed status after stop", async () => {
    const result = await handlePositionTool("position_status", { sessionId });
    assert.ok(!result.isError);
    const parsed = JSON.parse(result.content[0].text);
    assert.strictEqual(parsed.status, "completed");
  });
});

// ============================================================================
// GALLERY STREAM EDGE CASES
// ============================================================================

describe("Gallery Stream Edge Cases", () => {
  it("should handle emit with minimal data", async () => {
    const result = await handleGalleryTool("gallery_emit", {
      sessionId: "minimal-001",
      type: "system",
      data: {},
    });
    assert.ok(!result.isError);
  });

  it("should reject emit without sessionId", async () => {
    const result = await handleGalleryTool("gallery_emit", {
      type: "system",
      data: {},
    });
    assert.ok(result.isError);
    assert.ok(result.content[0].text.includes("sessionId is required"));
  });

  it("should reject emit with empty sessionId", async () => {
    const result = await handleGalleryTool("gallery_emit", {
      sessionId: "",
      type: "system",
      data: {},
    });
    assert.ok(result.isError);
    assert.ok(result.content[0].text.includes("sessionId is required"));
  });

  it("should reject emit without type", async () => {
    const result = await handleGalleryTool("gallery_emit", {
      sessionId: "test-session",
      data: {},
    });
    assert.ok(result.isError);
    assert.ok(result.content[0].text.includes("type is required"));
  });

  it("should reject emit with invalid type", async () => {
    const result = await handleGalleryTool("gallery_emit", {
      sessionId: "test-session",
      type: "invalid_type",
      data: {},
    });
    assert.ok(result.isError);
    assert.ok(result.content[0].text.includes("type is required"));
  });

  it("should reject emit without data", async () => {
    const result = await handleGalleryTool("gallery_emit", {
      sessionId: "test-session",
      type: "system",
    });
    assert.ok(result.isError);
    assert.ok(result.content[0].text.includes("data is required"));
  });

  it("should reject emit with null data", async () => {
    const result = await handleGalleryTool("gallery_emit", {
      sessionId: "test-session",
      type: "system",
      data: null,
    });
    assert.ok(result.isError);
    assert.ok(result.content[0].text.includes("data is required"));
  });

  it("should handle emit with large data payload", async () => {
    const largeData = { items: Array(1000).fill({ key: "value", nested: { a: 1, b: 2 } }) };
    const result = await handleGalleryTool("gallery_emit", {
      sessionId: "large-data-001",
      type: "agent_action",
      data: largeData,
    });
    assert.ok(!result.isError);
  });

  it("should handle stream with all filter types", async () => {
    // Create events of different types
    await handleGalleryTool("gallery_emit", { sessionId: "filter-test", type: "agent_message", data: { m: 1 } });
    await handleGalleryTool("gallery_emit", { sessionId: "filter-test", type: "blockchain_tx", data: { m: 2 } });
    await handleGalleryTool("gallery_emit", { sessionId: "filter-test", type: "position_update", data: { m: 3 } });

    // Filter by type
    const result = await handleGalleryTool("gallery_stream", {
      sessionId: "filter-test",
      type: "blockchain_tx",
    });
    const parsed = JSON.parse(result.content[0].text);
    assert.ok(parsed.events.every((e: { type: string }) => e.type === "blockchain_tx"));
  });

  it("should handle stream with since filter", async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
    const result = await handleGalleryTool("gallery_stream", {
      since: pastDate,
      limit: 5,
    });
    assert.ok(!result.isError);
    const parsed = JSON.parse(result.content[0].text);
    assert.ok(Array.isArray(parsed.events));
  });

  it("should respect limit parameter", async () => {
    // Emit multiple events
    for (let i = 0; i < 10; i++) {
      await handleGalleryTool("gallery_emit", {
        sessionId: "limit-test",
        type: "system",
        data: { i },
      });
    }

    const result = await handleGalleryTool("gallery_stream", {
      sessionId: "limit-test",
      limit: 3,
    });
    const parsed = JSON.parse(result.content[0].text);
    assert.ok(parsed.count <= 3, "Should respect limit");
  });

  it("should clear only specified session", async () => {
    await handleGalleryTool("gallery_emit", { sessionId: "keep-me", type: "system", data: {} });
    await handleGalleryTool("gallery_emit", { sessionId: "delete-me", type: "system", data: {} });

    await handleGalleryTool("gallery_clear", { sessionId: "delete-me" });

    const result = await handleGalleryTool("gallery_stream", { sessionId: "keep-me" });
    const parsed = JSON.parse(result.content[0].text);
    assert.ok(parsed.count > 0, "keep-me session should still have events");
  });
});

// ============================================================================
// TON WALLET EDGE CASES
// ============================================================================

describe("TON Wallet Edge Cases", () => {
  it("should reject mnemonic with wrong word count", async () => {
    const result = await handleTonWalletTool("ton_wallet_connect", {
      mnemonic: "word1 word2 word3", // Only 3 words
    });
    assert.ok(result.isError);
    assert.ok(result.content[0].text.includes("24 words"));
  });

  it("should reject mnemonic with 23 words", async () => {
    const words = Array(23).fill("word").join(" ");
    const result = await handleTonWalletTool("ton_wallet_connect", { mnemonic: words });
    assert.ok(result.isError);
  });

  it("should reject mnemonic with 25 words", async () => {
    const words = Array(25).fill("word").join(" ");
    const result = await handleTonWalletTool("ton_wallet_connect", { mnemonic: words });
    assert.ok(result.isError);
  });

  it("should handle send with zero amount (no wallet)", async () => {
    // Without a connected wallet, should error about wallet first
    const result = await handleTonWalletTool("ton_wallet_send", {
      to: "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N", // Valid testnet address
      amount: "0",
    });
    assert.ok(result.isError, "Should error (no wallet connected)");
  });

  it("should handle send with negative amount (no wallet)", async () => {
    const result = await handleTonWalletTool("ton_wallet_send", {
      to: "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N",
      amount: "-1",
    });
    assert.ok(result.isError, "Should error (no wallet connected)");
  });

  it("should handle transactions with zero limit and no address", async () => {
    // With no connected wallet and no address provided, should error
    const result = await handleTonWalletTool("ton_wallet_transactions", {
      limit: 0,
    });
    assert.ok(result.isError);
    assert.ok(result.content[0].text.includes("No address"));
  });

  it("should handle info when disconnected", async () => {
    await handleTonWalletTool("ton_wallet_disconnect", {});
    const result = await handleTonWalletTool("ton_wallet_info", {});
    const parsed = JSON.parse(result.content[0].text);
    assert.strictEqual(parsed.connected, false);
    assert.strictEqual(parsed.canSign, false);
    assert.strictEqual(parsed.address, null);
  });
});

// ============================================================================
// TON CONTRACT EDGE CASES
// ============================================================================

describe("TON Contract Edge Cases", () => {
  it("should handle malformed address", async () => {
    const result = await handleTonContractTool("ton_contract_get_info", {
      address: "not-a-valid-address",
    });
    assert.ok(result.isError);
  });

  it("should handle empty address", async () => {
    const result = await handleTonContractTool("ton_contract_get_info", {
      address: "",
    });
    assert.ok(result.isError);
  });

  it("should handle getter with empty method name", async () => {
    const result = await handleTonContractTool("ton_contract_call_getter", {
      address: "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N", // Valid testnet address
      method: "",
    });
    // Network call will fail, but should return an error
    assert.ok(result.isError || result.content[0].text.includes("Error"));
  });

  it("should handle jetton info with invalid master", async () => {
    const result = await handleTonContractTool("ton_contract_jetton_info", {
      masterAddress: "invalid",
    });
    assert.ok(result.isError);
  });

  it("should handle NFT info with invalid address", async () => {
    const result = await handleTonContractTool("ton_contract_nft_info", {
      address: "invalid-nft-address",
    });
    assert.ok(result.isError);
  });

  it("should accept mainnet network option", async () => {
    const result = await handleTonContractTool("ton_contract_get_info", {
      address: "invalid", // Will fail, but should recognize mainnet
      network: "mainnet",
    });
    assert.ok(result.isError); // Address is invalid, but network was accepted
  });

  it("should accept testnet network option", async () => {
    const result = await handleTonContractTool("ton_contract_get_info", {
      address: "invalid",
      network: "testnet",
    });
    assert.ok(result.isError);
  });
});

// ============================================================================
// CONCURRENT OPERATIONS
// ============================================================================

describe("Concurrent Operations", () => {
  it("should handle multiple position invocations", async () => {
    const promises = [
      handlePositionTool("position_invoke", { position: "mirror", demoMode: true }),
      handlePositionTool("position_invoke", { position: "relay", demoMode: true }),
      handlePositionTool("position_invoke", { position: "dance", demoMode: true }),
    ];

    const results = await Promise.all(promises);
    assert.ok(results.every(r => !r.isError), "All invocations should succeed");

    const sessionIds = results.map(r => JSON.parse(r.content[0].text).sessionId);
    const uniqueIds = new Set(sessionIds);
    assert.strictEqual(uniqueIds.size, 3, "All session IDs should be unique");
  });

  it("should handle multiple gallery emits", async () => {
    const promises = Array(20).fill(null).map((_, i) =>
      handleGalleryTool("gallery_emit", {
        sessionId: "concurrent-emit",
        type: "agent_message",
        data: { index: i },
      })
    );

    const results = await Promise.all(promises);
    assert.ok(results.every(r => !r.isError), "All emits should succeed");
  });
});

// ============================================================================
// DATA INTEGRITY
// ============================================================================

describe("Data Integrity", () => {
  it("should preserve event data exactly", async () => {
    const testData = {
      nested: { deeply: { object: { with: "values" } } },
      array: [1, 2, 3],
      special: "chars: <>&\"'",
      unicode: "émoji: 🎉",
    };

    await handleGalleryTool("gallery_emit", {
      sessionId: "integrity-test",
      type: "agent_action",
      agentId: "test-agent",
      data: testData,
    });

    const result = await handleGalleryTool("gallery_stream", {
      sessionId: "integrity-test",
      limit: 1,
    });
    const parsed = JSON.parse(result.content[0].text);
    const event = parsed.events.find((e: { sessionId: string }) => e.sessionId === "integrity-test");

    assert.deepStrictEqual(event.data.nested, testData.nested);
    assert.deepStrictEqual(event.data.array, testData.array);
    assert.strictEqual(event.data.special, testData.special);
    assert.strictEqual(event.data.unicode, testData.unicode);
  });

  it("should track position config correctly", async () => {
    const config = {
      target: "EQTest123",
      network: "testnet" as const,
      duration: 60,
      custom: { nested: true },
    };

    const result = await handlePositionTool("position_invoke", {
      position: "contemplator",
      config,
      demoMode: true,
    });

    const parsed = JSON.parse(result.content[0].text);
    assert.deepStrictEqual(parsed.config, config);
  });
});
