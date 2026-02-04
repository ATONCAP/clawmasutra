import { describe, it, mock } from "node:test";
import assert from "node:assert";

import { handlePositionTool } from "./position-invoke.js";
import { handleGalleryTool } from "./gallery-stream.js";

describe("Position Tools", () => {
  it("should list all positions", async () => {
    const result = await handlePositionTool("position_list", {});
    assert.ok(!result.isError, "position_list should not error");

    const parsed = JSON.parse(result.content[0].text);
    assert.ok(parsed.count > 0, "Should have positions");
    assert.ok(parsed.positions.length > 0, "Should return position array");

    // Check for expected positions
    const names = parsed.positions.map((p: { name: string }) => p.name);
    assert.ok(names.includes("contemplator"), "Should include contemplator");
    assert.ok(names.includes("mirror"), "Should include mirror");
    assert.ok(names.includes("arbitrageur"), "Should include arbitrageur");
  });

  it("should describe a position", async () => {
    const result = await handlePositionTool("position_describe", {
      position: "contemplator",
    });
    assert.ok(!result.isError, "position_describe should not error");

    const parsed = JSON.parse(result.content[0].text);
    assert.strictEqual(parsed.name, "contemplator");
    assert.strictEqual(parsed.category, "solo");
    assert.strictEqual(parsed.agents, 1);
  });

  it("should error on unknown position", async () => {
    const result = await handlePositionTool("position_describe", {
      position: "nonexistent",
    });
    assert.ok(result.isError, "Should error for unknown position");
  });

  it("should invoke position in demo mode", async () => {
    const result = await handlePositionTool("position_invoke", {
      position: "mirror",
      demoMode: true,
    });
    assert.ok(!result.isError, "position_invoke should not error in demo mode");

    const parsed = JSON.parse(result.content[0].text);
    assert.strictEqual(parsed._mode, "DEMO");
    assert.ok(parsed.sessionId, "Should have sessionId");
    assert.strictEqual(parsed.position, "mirror");
  });
});

describe("Gallery Tools", () => {
  it("should emit an event", async () => {
    const result = await handleGalleryTool("gallery_emit", {
      sessionId: "test-session-001",
      type: "agent_message",
      agentId: "test-agent",
      data: { message: "Hello from test" },
    });
    assert.ok(!result.isError, "gallery_emit should not error");

    const parsed = JSON.parse(result.content[0].text);
    assert.ok(parsed.success, "Should succeed");
    assert.ok(parsed.eventId, "Should have eventId");
  });

  it("should stream events", async () => {
    // First emit an event
    await handleGalleryTool("gallery_emit", {
      sessionId: "test-session-002",
      type: "system",
      data: { status: "test" },
    });

    // Then retrieve it
    const result = await handleGalleryTool("gallery_stream", {
      sessionId: "test-session-002",
      limit: 10,
    });
    assert.ok(!result.isError, "gallery_stream should not error");

    const parsed = JSON.parse(result.content[0].text);
    assert.ok(parsed.events, "Should have events array");
  });

  it("should get server status", async () => {
    const result = await handleGalleryTool("gallery_server_status", {});
    assert.ok(!result.isError, "gallery_server_status should not error");

    const parsed = JSON.parse(result.content[0].text);
    assert.strictEqual(typeof parsed.running, "boolean");
    assert.strictEqual(typeof parsed.eventStoreSize, "number");
  });

  it("should clear events", async () => {
    const result = await handleGalleryTool("gallery_clear", {
      sessionId: "test-session-001",
    });
    assert.ok(!result.isError, "gallery_clear should not error");

    const parsed = JSON.parse(result.content[0].text);
    assert.ok(parsed.success, "Should succeed");
  });
});

describe("Tool Error Handling", () => {
  it("should handle unknown position tool", async () => {
    const result = await handlePositionTool("position_unknown", {});
    assert.ok(result.isError, "Should error for unknown tool");
  });

  it("should handle unknown gallery tool", async () => {
    const result = await handleGalleryTool("gallery_unknown", {});
    assert.ok(result.isError, "Should error for unknown tool");
  });
});
