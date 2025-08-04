// @ts-check

import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import configPrettier from "eslint-config-prettier/flat";
import pluginSimpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";

export default defineConfig([
    {
        languageOptions: {
            globals: globals.node,
        },
    },
    {
        name: "eslint recommended",
        ...eslint.configs.recommended,
    },
    {
        name: "import sort",
        plugins: { "simple-import-sort": pluginSimpleImportSort },
        rules: {
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",
        },
    },
    configPrettier,
]);
