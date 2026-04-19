#!/usr/bin/env node

// @ts-check

import { defineCommand, runMain } from "citty";

import { COLORS, printDiagnostics, validateFile } from "./lib.mjs";

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
        const message = error instanceof Error ? error.message : String(error);
        console.error(COLORS.error(`Error: ${message}`));
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
        void main(args);
    },
});

void runMain(command);
