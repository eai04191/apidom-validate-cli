import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { validateFile } from "../bin/lib.mjs";

const fixture = (name: string): string =>
    fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

describe("validateFile", () => {
    it("returns no diagnostics for a valid OpenAPI 3.1 document", async () => {
        const diagnostics = await validateFile(fixture("valid.yaml"));
        assert.equal(diagnostics.length, 0);
    });

    it("reports the expected apidom-ls diagnostic codes for an invalid document", async () => {
        const diagnostics = await validateFile(fixture("invalid.yaml"));
        const codes = diagnostics
            .map((d) => d.code)
            .filter((code): code is number => typeof code === "number");

        // 10001: "type must be one of allowed values"
        // 10069: deprecated "example" warning
        assert.ok(codes.includes(10001), `expected code 10001 in ${String(codes)}`);
        assert.ok(codes.includes(10069), `expected code 10069 in ${String(codes)}`);
    });
});
