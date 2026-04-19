import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Diagnostic } from "vscode-languageserver-types";
import { DiagnosticSeverity } from "vscode-languageserver-types";

import { createSummary, formatDiagnostic } from "../bin/lib.mjs";

const stripAnsi = (input: string): string =>
    // eslint-disable-next-line no-control-regex
    input.replace(/\x1b\[[0-9;]*m/g, "");

const makeDiagnostic = (overrides: Partial<Diagnostic> = {}): Diagnostic => ({
    range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 1 },
    },
    severity: DiagnosticSeverity.Error,
    message: "sample",
    code: 10001,
    ...overrides,
});

describe("formatDiagnostic", () => {
    it("includes 1-based position, severity label, message, and code", () => {
        const diag = makeDiagnostic({
            range: {
                start: { line: 10, character: 20 },
                end: { line: 10, character: 30 },
            },
            severity: DiagnosticSeverity.Error,
            message: "type must be one of allowed values",
            code: 10001,
        });

        const output = stripAnsi(formatDiagnostic(diag));

        assert.match(output, /^ {2}11:21 {2}error {2}type must be one of allowed values {2}10001$/);
    });

    it("labels warnings correctly", () => {
        const diag = makeDiagnostic({
            severity: DiagnosticSeverity.Warning,
            message: "deprecated",
            code: 10069,
        });

        const output = stripAnsi(formatDiagnostic(diag));

        assert.match(output, /warning {2}deprecated/);
    });
});

describe("createSummary", () => {
    it("pluralizes correctly for a single error", () => {
        const diagnostics = [makeDiagnostic({ severity: DiagnosticSeverity.Error })];

        const summary = createSummary(diagnostics);

        assert.equal(summary.errorCount, 1);
        assert.equal(summary.warningCount, 0);
        assert.equal(summary.hasErrors, true);
        assert.equal(summary.message, "✖ 1 problem (1 error, 0 warnings)");
    });

    it("pluralizes correctly for multiple mixed diagnostics", () => {
        const diagnostics = [
            makeDiagnostic({ severity: DiagnosticSeverity.Error }),
            makeDiagnostic({ severity: DiagnosticSeverity.Error }),
            makeDiagnostic({ severity: DiagnosticSeverity.Warning }),
        ];

        const summary = createSummary(diagnostics);

        assert.equal(summary.errorCount, 2);
        assert.equal(summary.warningCount, 1);
        assert.equal(summary.hasErrors, true);
        assert.equal(summary.message, "✖ 3 problems (2 errors, 1 warning)");
    });

    it("reports hasErrors=false when only warnings exist", () => {
        const diagnostics = [makeDiagnostic({ severity: DiagnosticSeverity.Warning })];

        const summary = createSummary(diagnostics);

        assert.equal(summary.hasErrors, false);
    });

    it("treats missing severity as an error (matches apidom-ls default)", () => {
        const { severity: _unused, ...withoutSeverity } = makeDiagnostic();
        const diagnostics: Diagnostic[] = [withoutSeverity];

        const summary = createSummary(diagnostics);

        assert.equal(summary.errorCount, 1);
        assert.equal(summary.warningCount, 0);
    });
});
