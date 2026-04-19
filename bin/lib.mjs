// @ts-check

import { readFile } from "node:fs/promises";

import { getLanguageService } from "@swagger-api/apidom-ls";
import chalk from "chalk";
import { TextDocument } from "vscode-languageserver-textdocument";
import { DiagnosticSeverity } from "vscode-languageserver-types";

/**
 * @typedef {import('vscode-languageserver-types').Diagnostic} Diagnostic
 */

/** @type {Record<number, string>} */
const SEVERITY_LABELS = {
    [DiagnosticSeverity.Error]: "error",
    [DiagnosticSeverity.Warning]: "warning",
    [DiagnosticSeverity.Information]: "info",
    [DiagnosticSeverity.Hint]: "hint",
};

const COLORS = {
    error: chalk.red,
    warning: chalk.yellow,
    success: chalk.green,
    gray: chalk.gray,
};

const PADDING = " ".repeat(2);

/**
 * @param {Diagnostic} diagnostic
 * @returns {string}
 */
export function formatDiagnostic(diagnostic) {
    const { line, character } = diagnostic.range.start;
    const position = `${String(line + 1)}:${String(character + 1)}`;
    const severityLabel =
        (diagnostic.severity !== undefined && SEVERITY_LABELS[diagnostic.severity]) ?? "unknown";
    const severityColor = severityLabel === "error" ? COLORS.error : COLORS.warning;

    return (
        PADDING +
        [
            COLORS.gray(position),
            severityColor(severityLabel),
            diagnostic.message,
            diagnostic.code !== undefined ? COLORS.gray(diagnostic.code) : "",
        ]
            .filter(Boolean)
            .join(PADDING)
    );
}

/**
 * @param {Diagnostic[]} diagnostics
 * @returns {{message: string, hasErrors: boolean, errorCount: number, warningCount: number}}
 */
export function createSummary(diagnostics) {
    let errorCount = 0;
    let warningCount = 0;
    for (const diag of diagnostics) {
        const severity = diag.severity ?? DiagnosticSeverity.Error;
        if (severity === DiagnosticSeverity.Error) errorCount++;
        else if (severity === DiagnosticSeverity.Warning) warningCount++;
    }

    const problemCount = diagnostics.length;
    const problemText = problemCount === 1 ? "problem" : "problems";
    const errorText = errorCount === 1 ? "error" : "errors";
    const warningText = warningCount === 1 ? "warning" : "warnings";

    const issueDetails = `${String(errorCount)} ${errorText}, ${String(warningCount)} ${warningText}`;
    const message = `✖ ${String(problemCount)} ${problemText} (${issueDetails})`;

    return {
        message,
        hasErrors: errorCount > 0,
        errorCount,
        warningCount,
    };
}

/**
 * @param {Diagnostic[]} diagnostics
 * @param {string} uri
 */
export function printDiagnostics(diagnostics, uri) {
    if (diagnostics.length === 0) {
        return;
    }

    console.log(chalk.underline(uri));

    for (const diag of diagnostics) {
        if (diag.severity === undefined) continue;
        console.log(formatDiagnostic(diag));
    }

    const summary = createSummary(diagnostics);
    const summaryColor = summary.hasErrors ? COLORS.error : COLORS.warning;
    console.log("\n" + summaryColor.bold(summary.message));
}

/**
 * @param {string} source
 * @param {string} [uri]
 * @returns {Promise<Diagnostic[]>}
 */
export async function validateSource(source, uri = "source") {
    const languageService = getLanguageService({});
    const textDocument = TextDocument.create(uri, "apidom", 0, source);
    return languageService.doValidation(textDocument);
}

/**
 * @param {string} filePath
 * @returns {Promise<Diagnostic[]>}
 */
export async function validateFile(filePath) {
    const fileContent = await readFile(filePath, {
        encoding: "utf8",
        flag: "r",
    });
    return validateSource(fileContent, filePath);
}

export { COLORS };
