import { describe, it, expect, vi, beforeEach } from "vitest";
import { PolicyService } from "./policy.service";

// Mock minimatch
vi.mock("minimatch", () => ({
    minimatch: (text: string, pattern: string) => {
        // Simple mock implementation for testing logic
        if (pattern === "*") return true;
        if (pattern === "allow_*") return text.startsWith("allow_");
        if (pattern === "deny_*") return text.startsWith("deny_");
        return text === pattern;
    }
}));

describe("PolicyService", () => {
    let service: PolicyService;

    beforeEach(() => {
        service = new PolicyService();
    });

    describe("evaluateAccess", () => {
        it("should deny if explicitly denied", () => {
            const policy = {
                rules: {
                    allow: ["*"],
                    deny: ["deny_*"]
                }
            };
            expect(service.evaluateAccess(policy, "deny_tool")).toBe(false);
        });

        it("should allow if matched in allow list", () => {
            const policy = {
                rules: {
                    allow: ["allow_*"]
                }
            };
            expect(service.evaluateAccess(policy, "allow_tool")).toBe(true);
        });

        it("should deny by default if not matched", () => {
            const policy = {
                rules: {
                    allow: ["allow_*"]
                }
            };
            expect(service.evaluateAccess(policy, "other_tool")).toBe(false);
        });

        it("should handle empty allow list (deny all)", () => {
            const policy = {
                rules: {
                    allow: []
                }
            };
            expect(service.evaluateAccess(policy, "any_tool")).toBe(false);
        });
    });
});
