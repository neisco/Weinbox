import { defineConfig } from "eslint/config";
import * as nextPluginPkg from "@next/eslint-plugin-next";
import * as tsPluginPkg from "@typescript-eslint/eslint-plugin";

const nextPlugin = nextPluginPkg.default ?? nextPluginPkg;
const tsPlugin = tsPluginPkg.default ?? tsPluginPkg;

export default defineConfig({
  plugins: {
    "@next": nextPlugin,
    "@typescript-eslint": tsPlugin
  },
  extends: [
    "plugin:@next/next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  ignorePatterns: [".next/**", "out/**", "build/**", "next-env.d.ts"],
});
