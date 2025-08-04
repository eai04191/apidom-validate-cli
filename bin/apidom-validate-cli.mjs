#!/usr/bin/env node

// @ts-check

import { readFile } from "node:fs/promises";

import { getLanguageService } from "@swagger-api/apidom-ls";
import chalk from "chalk";
import { defineCommand, runMain } from "citty";
import { TextDocument } from "vscode-languageserver-textdocument";
import { DiagnosticSeverity } from "vscode-languageserver-types";

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
 * @typedef {import('vscode-languageserver-types').Diagnostic} Diagnostic
 */

/**
 * @param {Diagnostic} diagnostic
 * @returns {string}
 */
function formatDiagnostic(diagnostic) {
    const { line, character } = diagnostic.range.start;
    const position = `${line + 1}:${character + 1}`;
    const severityLabel = SEVERITY_LABELS[diagnostic.severity] || "unknown";
    const severityColor =
        severityLabel === "error" ? COLORS.error : COLORS.warning;

    return (
        PADDING +
        [
            COLORS.gray(position),
            severityColor(severityLabel),
            diagnostic.message,
            COLORS.gray(diagnostic.code),
        ]
            .filter(Boolean)
            .join(PADDING)
    );
}

/**
 * @param {Diagnostic[]} diagnostics
 * @returns {{message: string, hasErrors: boolean}}
 */
function createSummary(diagnostics) {
    const counts = diagnostics.reduce((acc, diag) => {
        const severity = diag.severity || DiagnosticSeverity.Error;
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
    }, {});

    const problemCount = diagnostics.length;
    const errorCount = counts[DiagnosticSeverity.Error] || 0;
    const warningCount = counts[DiagnosticSeverity.Warning] || 0;
    const problemText = problemCount === 1 ? "problem" : "problems";
    const errorText = errorCount === 1 ? "error" : "errors";
    const warningText = warningCount === 1 ? "warning" : "warnings";

    const issueDetails = [
        `${errorCount} ${errorText}`,
        `${warningCount} ${warningText}`,
    ].join(", ");
    const message = `✖ ${problemCount} ${problemText} (${issueDetails})`;

    return {
        message,
        hasErrors: errorCount > 0,
    };
}

/**
 * @param {Diagnostic[]} diagnostics
 * @param {string} uri
 */
function printDiagnostics(diagnostics, uri) {
    if (diagnostics.length === 0) {
        return;
    }

    console.log(chalk.underline(uri));

    diagnostics
        .filter((diag) => diag.severity !== undefined)
        .forEach((diag) => console.log(formatDiagnostic(diag)));

    const summary = createSummary(diagnostics);
    const summaryColor = summary.hasErrors ? COLORS.error : COLORS.warning;
    console.log("\n" + summaryColor.bold(summary.message));
}

/**
 * @param {string} filePath
 * @returns {Promise<Diagnostic[]>}
 */
async function validateFile(filePath) {
    const fileContent = await readFile(filePath, {
        encoding: "utf8",
        flag: "r",
    });
    const languageService = getLanguageService({});
    const textDocument = TextDocument.create(
        filePath,
        "apidom",
        0,
        fileContent,
    );

    return languageService.doValidation(textDocument);
}

/**
 * @param { { input: string } } args
 */
async function main(args) {
    const { input: path } = args;

    try {
        const validationResult = await validateFile(path);

        if (validationResult.length === 0) {
            console.log(COLORS.success("Everything is OK"));
            process.exit(0);
        }

        printDiagnostics(validationResult, path);
        process.exit(1);
    } catch (error) {
        console.error(COLORS.error(`Error: ${error.message}`));
        process.exit(1);
    }
}

const command = defineCommand({
    meta: {
        name: "apidom-validate-cli",
        description: "Validate Apidom files",
    },
    args: {
        input: {
            type: "positional",
            description: "Path to the Apidom file to validate",
            required: true,
        },
    },
    run({ args }) {
        main(args);
    },
});

runMain(command);
