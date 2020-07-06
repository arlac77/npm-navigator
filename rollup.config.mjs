import { readFileSync } from "fs";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import virtual from "@rollup/plugin-virtual";
import inject from "@rollup/plugin-inject";

import svelte from "rollup-plugin-svelte";
import postcss from "rollup-plugin-postcss";
import postcssImport from "postcss-import";

import { terser } from "rollup-plugin-terser";
import dev from "rollup-plugin-dev";
import consts from "rollup-plugin-consts";

const production = !process.env.ROLLUP_WATCH;
const dist = "public";
const port = 5000;

export default () => {
  const { name, description, version, config } = JSON.parse(
    readFileSync("./package.json", { endoding: "utf8" })
  );

  return {
    input: "src/main.mjs",
    output: {
      interop: false,
      sourcemap: true,
      format: "esm",
      file: `${dist}/bundle.mjs`,
      plugins: [production && terser()]
    },
    plugins: [
      virtual({
        "node-fetch": "export default fetch",
        stream: "export class Readable {}"
      }),
      inject({
        Buffer: ["buffer", "Buffer"]
      }),
      consts({
        name,
        version,
        description,
        ...config
      }),
      postcss({
        extract: true,
        sourcemap: true,
        minimize: production,
        plugins: [postcssImport]
      }),
      svelte({
        dev: !production,
        css: css => css.write(`${dist}/bundle.svelte.css`)
      }),
      resolve({
        browser: true,
        preferBuiltins: false,
        dedupe: importee =>
          importee === "svelte" || importee.startsWith("svelte/")
      }),
      commonjs(),
      !production &&
        dev({
          port,
          dirs: [dist],
          spa: `${dist}/index.html`,
          basePath: config.base,
          proxy: { [`${config.api}/*`]: [config.proxyTarget, { https: true }] }
        })
    ],
    watch: {
      clearScreen: false
    }
  };
};
