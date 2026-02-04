/**
 * SKILL.md Parser
 *
 * Parses position skill files and extracts structured agent instructions.
 */

import * as fs from "fs";
import * as path from "path";
import {
  SkillDefinition,
  AgentRole,
  WorkflowPhase,
  CommunicationProtocol,
  Position,
} from "./types.js";

export class SkillLoader {
  private skillsPath: string;
  private cache: Map<string, SkillDefinition> = new Map();

  constructor(skillsPath: string) {
    this.skillsPath = skillsPath;
  }

  /**
   * Load and parse a skill file for a position
   */
  load(position: Position): SkillDefinition {
    const cacheKey = position.name;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const skillPath = path.join(this.skillsPath, position.path, "SKILL.md");

    if (!fs.existsSync(skillPath)) {
      throw new Error(`Skill file not found: ${skillPath}`);
    }

    const content = fs.readFileSync(skillPath, "utf-8");
    const skill = this.parse(position.name, content);

    this.cache.set(cacheKey, skill);
    return skill;
  }

  /**
   * Parse SKILL.md content into structured definition
   */
  private parse(positionName: string, content: string): SkillDefinition {
    const sections = this.splitSections(content);

    const title = this.extractTitle(content);
    const overview = this.extractOverview(sections);
    const agents = this.extractAgents(sections, positionName);
    const workflow = this.extractWorkflow(sections);
    const communicationProtocol = this.extractCommunicationProtocol(sections);
    const toolsUsed = this.extractToolsUsed(sections);
    const philosophy = this.extractPhilosophy(sections);

    return {
      position: positionName,
      title,
      overview,
      agents,
      workflow,
      communicationProtocol,
      toolsUsed,
      philosophy,
      rawContent: content,
    };
  }

  /**
   * Split markdown into sections by ## headers
   */
  private splitSections(content: string): Map<string, string> {
    const sections = new Map<string, string>();
    const regex = /^## (.+)$/gm;
    const lines = content.split("\n");

    let currentSection = "intro";
    let currentContent: string[] = [];

    for (const line of lines) {
      const match = line.match(/^## (.+)$/);
      if (match) {
        if (currentContent.length > 0) {
          sections.set(currentSection.toLowerCase(), currentContent.join("\n").trim());
        }
        currentSection = match[1];
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    if (currentContent.length > 0) {
      sections.set(currentSection.toLowerCase(), currentContent.join("\n").trim());
    }

    return sections;
  }

  /**
   * Extract the main title (# Header)
   */
  private extractTitle(content: string): string {
    const match = content.match(/^# (.+)$/m);
    return match ? match[1].trim() : "Unknown Position";
  }

  /**
   * Extract overview/description
   */
  private extractOverview(sections: Map<string, string>): string {
    // Try various section names
    const descSection =
      sections.get("description") ||
      sections.get("overview") ||
      sections.get("intro") ||
      "";

    // Get first paragraph (before any ### subsection)
    const lines = descSection.split("\n");
    const paragraphLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith("###") || line.startsWith("```")) break;
      paragraphLines.push(line);
    }

    return paragraphLines.join("\n").trim();
  }

  /**
   * Extract agent roles from Agents section
   */
  private extractAgents(sections: Map<string, string>, positionName: string): AgentRole[] {
    const agentsSection = sections.get("agents") || "";

    // Try to parse table format: | Agent | Role | Personality |
    const tableMatch = agentsSection.match(/\|[^|]+\|[^|]+\|[^|]+\|/g);

    if (tableMatch && tableMatch.length > 1) {
      return this.parseAgentTable(tableMatch);
    }

    // Try to parse subsection format: ### Agent Name
    const subsectionAgents = this.parseAgentSubsections(agentsSection);
    if (subsectionAgents.length > 0) {
      return subsectionAgents;
    }

    // Fallback: generate generic agents based on position
    return this.generateGenericAgents(positionName);
  }

  /**
   * Parse agent table format
   */
  private parseAgentTable(rows: string[]): AgentRole[] {
    const agents: AgentRole[] = [];

    // Skip header row and separator
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      const cells = row
        .split("|")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      if (cells.length >= 3) {
        // Format: Agent Name | Role | Personality
        const namePart = cells[0];
        const role = cells[1];
        const personality = cells[2];

        // Extract agent name (might be "Agent A (Reflector)" format)
        const nameMatch = namePart.match(/(?:\(([^)]+)\)|^([^(]+))/);
        const name = nameMatch
          ? (nameMatch[1] || nameMatch[2]).trim()
          : namePart;

        agents.push({
          name,
          role,
          personality,
          responsibilities: [],
        });
      }
    }

    return agents;
  }

  /**
   * Parse agent subsections format (### Agent Name)
   */
  private parseAgentSubsections(content: string): AgentRole[] {
    const agents: AgentRole[] = [];
    const regex = /### ([^\n]+)\n([\s\S]*?)(?=###|$)/g;

    let match;
    while ((match = regex.exec(content)) !== null) {
      const name = match[1].trim();
      const body = match[2].trim();

      // Extract personality from **Personality**: line
      const personalityMatch = body.match(/\*\*Personality\*\*:\s*(.+)/);
      const personality = personalityMatch ? personalityMatch[1].trim() : "";

      // Extract responsibilities from bullet points under **Responsibilities**:
      const responsibilities: string[] = [];
      const respSection = body.match(
        /\*\*Responsibilities\*\*:[\s\S]*?(?=\*\*|$)/
      );
      if (respSection) {
        const bullets = respSection[0].match(/^\s*-\s*(.+)$/gm);
        if (bullets) {
          for (const bullet of bullets) {
            const text = bullet.replace(/^\s*-\s*/, "").trim();
            if (text) responsibilities.push(text);
          }
        }
      }

      agents.push({
        name,
        role: name,
        personality,
        responsibilities,
      });
    }

    return agents;
  }

  /**
   * Generate generic agents for positions without detailed agent specs
   */
  private generateGenericAgents(positionName: string): AgentRole[] {
    const agentConfigs: Record<string, AgentRole[]> = {
      contemplator: [
        {
          name: "Contemplator",
          role: "Primary Analyst",
          personality: "Thorough, methodical, patient",
          responsibilities: [
            "Perform deep analysis of the target",
            "Document findings with evidence",
            "Report insights via gallery",
          ],
        },
      ],
      wanderer: [
        {
          name: "Wanderer",
          role: "Explorer",
          personality: "Curious, opportunistic, alert",
          responsibilities: [
            "Scan for opportunities",
            "Identify patterns and trends",
            "Report discoveries",
          ],
        },
      ],
      mirror: [
        {
          name: "Reflector",
          role: "Primary Analyst",
          personality: "Thorough, methodical, detail-oriented",
          responsibilities: [
            "Perform primary analysis of target",
            "Document findings with evidence",
            "Calculate verification checksum",
          ],
        },
        {
          name: "Verifier",
          role: "Independent Checker",
          personality: "Skeptical, precise, independent",
          responsibilities: [
            "Perform independent analysis",
            "Compare results with Reflector",
            "Flag discrepancies",
          ],
        },
      ],
      relay: [
        {
          name: "Researcher",
          role: "Information Gatherer",
          personality: "Curious, thorough, organized",
          responsibilities: [
            "Gather context and information",
            "Prepare research summary",
            "Hand off to Executor",
          ],
        },
        {
          name: "Executor",
          role: "Action Specialist",
          personality: "Decisive, precise, action-oriented",
          responsibilities: [
            "Receive research from Researcher",
            "Execute required actions",
            "Verify and report results",
          ],
        },
      ],
      dance: [
        {
          name: "Leader",
          role: "Initiative Taker",
          personality: "Assertive, creative, adaptable",
          responsibilities: [
            "Propose actions and strategies",
            "Respond to partner's moves",
            "Drive toward resolution",
          ],
        },
        {
          name: "Partner",
          role: "Counterpart",
          personality: "Responsive, analytical, supportive",
          responsibilities: [
            "Evaluate leader's proposals",
            "Suggest alternatives",
            "Maintain balance",
          ],
        },
      ],
      embrace: [
        {
          name: "Guardian",
          role: "Asset Protector",
          personality: "Cautious, protective, strategic",
          responsibilities: [
            "Monitor shared wallet state",
            "Validate partner's actions",
            "Ensure coordinated execution",
          ],
        },
        {
          name: "Operator",
          role: "Transaction Handler",
          personality: "Efficient, precise, reliable",
          responsibilities: [
            "Execute transactions",
            "Report actions to Guardian",
            "Maintain sync with partner",
          ],
        },
      ],
      circle: [
        {
          name: "Voice-1",
          role: "First Speaker",
          personality: "Initiating, thoughtful",
          responsibilities: ["Present initial analysis", "Build on others' ideas"],
        },
        {
          name: "Voice-2",
          role: "Second Speaker",
          personality: "Questioning, analytical",
          responsibilities: ["Challenge assumptions", "Add perspective"],
        },
        {
          name: "Voice-3",
          role: "Third Speaker",
          personality: "Synthesizing, decisive",
          responsibilities: ["Find common ground", "Drive to consensus"],
        },
      ],
      pyramid: [
        {
          name: "Oracle",
          role: "Strategic Director",
          personality: "Visionary, commanding, synthesizing",
          responsibilities: [
            "Decompose mission into tasks",
            "Assign work to workers",
            "Synthesize results",
            "Make final decisions",
          ],
        },
        {
          name: "Worker-1",
          role: "Specialist Executor",
          personality: "Focused, efficient, reliable",
          responsibilities: [
            "Execute assigned tasks",
            "Report results to Oracle",
            "Request guidance when needed",
          ],
        },
        {
          name: "Worker-2",
          role: "Specialist Executor",
          personality: "Focused, efficient, reliable",
          responsibilities: [
            "Execute assigned tasks",
            "Report results to Oracle",
            "Request guidance when needed",
          ],
        },
        {
          name: "Worker-3",
          role: "Specialist Executor",
          personality: "Focused, efficient, reliable",
          responsibilities: [
            "Execute assigned tasks",
            "Report results to Oracle",
            "Request guidance when needed",
          ],
        },
      ],
      swarm: [
        {
          name: "Scout-1",
          role: "Sector Monitor",
          personality: "Alert, thorough, quick",
          responsibilities: ["Monitor assigned sector", "Report findings"],
        },
        {
          name: "Scout-2",
          role: "Sector Monitor",
          personality: "Alert, thorough, quick",
          responsibilities: ["Monitor assigned sector", "Report findings"],
        },
        {
          name: "Scout-3",
          role: "Sector Monitor",
          personality: "Alert, thorough, quick",
          responsibilities: ["Monitor assigned sector", "Report findings"],
        },
        {
          name: "Scout-4",
          role: "Sector Monitor",
          personality: "Alert, thorough, quick",
          responsibilities: ["Monitor assigned sector", "Report findings"],
        },
        {
          name: "Scout-5",
          role: "Sector Monitor",
          personality: "Alert, thorough, quick",
          responsibilities: ["Monitor assigned sector", "Report findings"],
        },
      ],
      tantric: [
        {
          name: "Breath-1",
          role: "Patient Observer",
          personality: "Calm, deliberate, wise",
          responsibilities: ["Observe deeply", "Share insights slowly"],
        },
        {
          name: "Breath-2",
          role: "Patient Observer",
          personality: "Calm, deliberate, wise",
          responsibilities: ["Listen fully", "Add measured perspective"],
        },
        {
          name: "Breath-3",
          role: "Patient Observer",
          personality: "Calm, deliberate, wise",
          responsibilities: ["Integrate views", "Guide to consensus"],
        },
      ],
      arbitrageur: [
        {
          name: "Spotter",
          role: "Opportunity Finder",
          personality: "Sharp, quick, analytical",
          responsibilities: [
            "Monitor price feeds",
            "Identify arbitrage opportunities",
            "Calculate profitability",
          ],
        },
        {
          name: "Executor",
          role: "Trade Handler",
          personality: "Precise, fast, reliable",
          responsibilities: [
            "Execute arbitrage trades",
            "Manage timing",
            "Verify completion",
          ],
        },
      ],
      "oracle-choir": [
        {
          name: "Voice-A",
          role: "Price Reporter",
          personality: "Accurate, consistent",
          responsibilities: ["Report price observations", "Validate others' reports"],
        },
        {
          name: "Voice-B",
          role: "Price Reporter",
          personality: "Accurate, consistent",
          responsibilities: ["Report price observations", "Validate others' reports"],
        },
        {
          name: "Voice-C",
          role: "Price Reporter",
          personality: "Accurate, consistent",
          responsibilities: ["Report price observations", "Validate others' reports"],
        },
      ],
      "liquidity-lotus": [
        {
          name: "Strategist",
          role: "LP Planner",
          personality: "Strategic, analytical",
          responsibilities: [
            "Analyze pool conditions",
            "Plan LP positions",
            "Coordinate with Executor",
          ],
        },
        {
          name: "Executor",
          role: "LP Operator",
          personality: "Precise, careful",
          responsibilities: [
            "Execute LP operations",
            "Monitor positions",
            "Report status",
          ],
        },
      ],
      "dao-dance": [
        {
          name: "Researcher",
          role: "Proposal Analyst",
          personality: "Thorough, neutral",
          responsibilities: [
            "Analyze proposals",
            "Research implications",
            "Present findings",
          ],
        },
        {
          name: "Strategist",
          role: "Position Former",
          personality: "Strategic, decisive",
          responsibilities: [
            "Form voting position",
            "Coordinate with team",
            "Finalize strategy",
          ],
        },
        {
          name: "Voter",
          role: "Vote Executor",
          personality: "Reliable, precise",
          responsibilities: [
            "Execute votes",
            "Verify transactions",
            "Report results",
          ],
        },
      ],
      "pattern-doctor": [
        {
          name: "Doctor",
          role: "Pattern Diagnostician",
          personality: "Analytical, patient, thorough",
          responsibilities: [
            "Diagnose collaboration issues",
            "Identify failure patterns",
            "Prescribe remediation",
          ],
        },
      ],
      recovery: [
        {
          name: "Healer",
          role: "Recovery Specialist",
          personality: "Calm, systematic, resilient",
          responsibilities: [
            "Handle failures gracefully",
            "Recover state",
            "Resume operations",
          ],
        },
      ],
    };

    return agentConfigs[positionName] || [
      {
        name: "Agent",
        role: "General Executor",
        personality: "Capable, adaptable",
        responsibilities: ["Execute position workflow", "Report results"],
      },
    ];
  }

  /**
   * Extract workflow phases
   */
  private extractWorkflow(sections: Map<string, string>): WorkflowPhase[] {
    const workflowSection = sections.get("workflow") || "";
    const phases: WorkflowPhase[] = [];

    // Match ### Phase headers
    const phaseRegex = /### (?:Phase \d+:\s*)?([^\n]+)\n([\s\S]*?)(?=###|$)/g;

    let match;
    while ((match = phaseRegex.exec(workflowSection)) !== null) {
      const name = match[1].trim();
      const body = match[2].trim();

      // Extract numbered steps
      const steps: string[] = [];
      const stepMatches = body.match(/^\d+\.\s+(.+)$/gm);
      if (stepMatches) {
        for (const step of stepMatches) {
          const text = step.replace(/^\d+\.\s+/, "").trim();
          if (text) steps.push(text);
        }
      }

      phases.push({
        name,
        description: body.split("\n")[0] || name,
        steps,
      });
    }

    // Fallback: if no phases found, create generic
    if (phases.length === 0) {
      phases.push(
        { name: "Initialize", description: "Set up and prepare", steps: [] },
        { name: "Execute", description: "Perform main work", steps: [] },
        { name: "Complete", description: "Finalize and report", steps: [] }
      );
    }

    return phases;
  }

  /**
   * Extract communication protocol
   */
  private extractCommunicationProtocol(
    sections: Map<string, string>
  ): CommunicationProtocol[] {
    const section =
      sections.get("communication protocol") ||
      sections.get("communication") ||
      sections.get("message types") ||
      "";

    const protocols: CommunicationProtocol[] = [];

    // Match message type definitions
    const typeRegex =
      /(?:^|\n)[-*]\s*`?([A-Z_]+)`?(?:\s*[-:])?\s*(.+?)(?=\n[-*]|\n\n|$)/g;

    let match;
    while ((match = typeRegex.exec(section)) !== null) {
      protocols.push({
        type: match[1].trim(),
        description: match[2].trim(),
      });
    }

    // Also try code block format
    const codeBlockMatch = section.match(/```[\s\S]*?```/);
    if (codeBlockMatch && protocols.length === 0) {
      // Parse from code block examples
      const lines = codeBlockMatch[0].split("\n");
      for (const line of lines) {
        const typeMatch = line.match(/"?([A-Z_]+)"?\s*:/);
        if (typeMatch) {
          protocols.push({
            type: typeMatch[1],
            description: `Message type: ${typeMatch[1]}`,
          });
        }
      }
    }

    // Default protocols if none found
    if (protocols.length === 0) {
      protocols.push(
        { type: "READY_TO_SHARE", description: "Signal readiness" },
        { type: "RESULTS", description: "Share results" },
        { type: "ACKNOWLEDGE", description: "Confirm receipt" },
        { type: "COMPLETE", description: "Signal completion" }
      );
    }

    return protocols;
  }

  /**
   * Extract tools used
   */
  private extractToolsUsed(sections: Map<string, string>): string[] {
    const section = sections.get("tools used") || sections.get("tools") || "";

    const tools: string[] = [];
    const toolRegex = /`([a-z_]+)`/g;

    let match;
    while ((match = toolRegex.exec(section)) !== null) {
      const tool = match[1];
      if (!tools.includes(tool)) {
        tools.push(tool);
      }
    }

    // Also match bullet points: - tool_name
    const bulletRegex = /^\s*[-*]\s*`?([a-z_]+)`?/gm;
    while ((match = bulletRegex.exec(section)) !== null) {
      const tool = match[1];
      if (!tools.includes(tool) && tool.includes("_")) {
        tools.push(tool);
      }
    }

    return tools;
  }

  /**
   * Extract philosophy section
   */
  private extractPhilosophy(sections: Map<string, string>): string {
    const section = sections.get("philosophy") || "";

    // Extract quoted text
    const quoteMatch = section.match(/"([^"]+)"/);
    if (quoteMatch) {
      return quoteMatch[1];
    }

    // Return first non-empty line
    const firstLine = section.split("\n").find((l) => l.trim().length > 0);
    return firstLine?.trim() || "";
  }

  /**
   * Clear the cache (useful for development)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton factory
let loaderInstance: SkillLoader | null = null;

export function getSkillLoader(skillsPath?: string): SkillLoader {
  if (!loaderInstance || (skillsPath && loaderInstance["skillsPath"] !== skillsPath)) {
    loaderInstance = new SkillLoader(
      skillsPath || process.env.CLAWMASUTRA_SKILLS_PATH || "../skills"
    );
  }
  return loaderInstance;
}
