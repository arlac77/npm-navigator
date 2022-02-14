import { readFile } from "fs/promises";
import { mkdirSync, readFileSync } from "fs";
import { execFile } from "child_process";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

const encodingOptions = { encoding: "utf8" };

export default defineConfig(async ({ command, mode }) => {
  const pkg = JSON.parse(
    await readFile(
      new URL("package.json", import.meta.url).pathname,
      encodingOptions
    )
  );

  const production = mode === "production";
  let target = "http://localhost:12345";

  if (!production) {
    mkdirSync("build/db", { recursive: true });
    const konsum = execFile(
      "node",
      [
        "node_modules/@konsumation/konsum/src/konsum-cli.mjs",
        "-c",
        "tests/config",
        "start"
      ],
      (error, stdout, stderr) => console.log(error, stdout, stderr)
    );

    const { http } = JSON.parse(
      readFileSync("tests/config/config.json", encodingOptions)
    );

    target = `http://localhost:${http.port}/`;
  }

  const base = "/services/konsum/";
  const api = `${base}api`;

  process.env["VITE_API"] = api;
  process.env["VITE_NAME"] = pkg.name;
  process.env["VITE_DESCRIPTION"] = pkg.description;
  process.env["VITE_VERSION"] = pkg.version;

  return {
    root: "src",
    base,
    worker: { format: "es" },
    plugins: [
      svelte({
        compilerOptions: {
          dev: !production
        }
      })
    ],
    optimizeDeps: {
      exclude: [
        ...Object.keys(pkg.dependencies).filter(d => d.startsWith("svelte"))
      ]
    },

    build: {
      outDir: "../build",
      target: "esnext",
      emptyOutDir: true,
      minify: production,
      sourcemap: true
    },

    server: {
      proxy: {
        [api]: {
          target,
          rewrite: path => path.substring(api.length)
        }
      }
    }
  };
});
