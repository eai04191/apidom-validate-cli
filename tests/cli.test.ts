import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const CLI = fileURLToPath(new URL("../bin/apidom-validate-cli.mjs", import.meta.url));
const fixture = (name: string): string =>
    fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

interface CliResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
}

const stripAnsi = (input: string): string =>
    // eslint-disable-next-line no-control-regex
    input.replace(/\x1b\[[0-9;]*m/g, "");

const runCli = (args: readonly string[]): Promise<CliResult> =>
    new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [CLI, ...args], {
            env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
        });
        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (chunk: Buffer) => (stdout += chunk.toString()));
        child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
        child.on("error", reject);
        child.on("close", (exitCode) => {
            resolve({
                stdout: stripAnsi(stdout),
                stderr: stripAnsi(stderr),
                exitCode,
            });
        });
    });

describe("apidom-validate-cli (spawned)", () => {
    it("exits 0 and prints success for a valid document", async () => {
        const { stdout, exitCode } = await runCli([fixture("valid.yaml")]);
        assert.equal(exitCode, 0);
        assert.match(stdout, /Everything is OK/);
    });

    it("exits 1 and lists diagnostics for an invalid document", async () => {
        const { stdout, exitCode } = await runCli([fixture("invalid.yaml")]);
        assert.equal(exitCode, 1);
        assert.match(stdout, /error.*10001/);
        assert.match(stdout, /warning.*10069/);
        assert.match(stdout, /✖ \d+ problems? \(/);
    });

    it("exits 1 with an error message when the file does not exist", async () => {
        const { stderr, exitCode } = await runCli([fixture("does-not-exist.yaml")]);
        assert.equal(exitCode, 1);
        assert.match(stderr, /Error:/);
    });

    it("exits non-zero when the required positional argument is missing", async () => {
        const { exitCode } = await runCli([]);
        assert.notEqual(exitCode, 0);
    });
});
