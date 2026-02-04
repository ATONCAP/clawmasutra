import { describe, it } from "node:test";
import assert from "node:assert";

import { handlePositionTool, positionTools } from "./position-invoke.js";
import { handleGalleryTool, galleryTools } from "./gallery-stream.js";

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

describe("Position Tool Definitions", () => {
  it("should have required position tools defined", () => {
    const toolNames = positionTools.map(t => t.name);

    assert.ok(toolNames.includes("position_list"), "Should have list");
    assert.ok(toolNames.includes("position_invoke"), "Should have invoke");
    assert.ok(toolNames.includes("position_status"), "Should have status");
    assert.ok(toolNames.includes("position_stop"), "Should have stop");
    assert.ok(toolNames.includes("position_describe"), "Should have describe");
  });

  it("should have proper input schemas for invoke", () => {
    const invokeTool = positionTools.find(t => t.name === "position_invoke");
    assert.ok(invokeTool, "invoke tool should exist");
    assert.ok(invokeTool.inputSchema.properties?.position, "Should have position property");
    assert.ok(invokeTool.inputSchema.required?.includes("position"), "position should be required");
  });

  it("should have proper input schemas for status", () => {
    const statusTool = positionTools.find(t => t.name === "position_status");
    assert.ok(statusTool, "status tool should exist");
    assert.ok(statusTool.inputSchema.properties?.sessionId, "Should have sessionId property");
    assert.ok(statusTool.inputSchema.required?.includes("sessionId"), "sessionId should be required");
  });
});

describe("Gallery Tool Definitions", () => {
  it("should have required gallery tools defined", () => {
    const toolNames = galleryTools.map(t => t.name);

    assert.ok(toolNames.includes("gallery_emit"), "Should have emit");
    assert.ok(toolNames.includes("gallery_stream"), "Should have stream");
    assert.ok(toolNames.includes("gallery_server_start"), "Should have server_start");
    assert.ok(toolNames.includes("gallery_server_status"), "Should have server_status");
    assert.ok(toolNames.includes("gallery_clear"), "Should have clear");
  });

  it("should have proper input schemas for emit", () => {
    const emitTool = galleryTools.find(t => t.name === "gallery_emit");
    assert.ok(emitTool, "emit tool should exist");
    assert.ok(emitTool.inputSchema.properties?.sessionId, "Should have sessionId property");
    assert.ok(emitTool.inputSchema.properties?.type, "Should have type property");
    assert.ok(emitTool.inputSchema.properties?.data, "Should have data property");
    assert.ok(emitTool.inputSchema.required?.includes("sessionId"), "sessionId should be required");
    assert.ok(emitTool.inputSchema.required?.includes("type"), "type should be required");
    assert.ok(emitTool.inputSchema.required?.includes("data"), "data should be required");
  });

  it("should have type enum for emit", () => {
    const emitTool = galleryTools.find(t => t.name === "gallery_emit");
    const typeSchema = emitTool?.inputSchema.properties?.type as { enum?: string[] } | undefined;
    assert.ok(typeSchema?.enum, "type should have enum");
    assert.ok(typeSchema.enum.includes("agent_message"), "enum should include agent_message");
    assert.ok(typeSchema.enum.includes("blockchain_tx"), "enum should include blockchain_tx");
    assert.ok(typeSchema.enum.includes("system"), "enum should include system");
  });
});
