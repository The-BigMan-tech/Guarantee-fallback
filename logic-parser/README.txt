LIB-SCAFFOLD
-------------
A reusable scaffold for building TypeScript libraries with modern tooling and optimized bundles.

Note: This scaffold should be opened in VSCode as the root workspace folder for proper debugging and path resolution.The tooling expects all your src files to be under the src folder and main.ts to be the entrypoint of your program.Import aliases must be consistent in both the rollup and tsconfig.@alias imports will only work in ts src files when running the bundle not the build file directly because aliases are resolved at bundling time because of compiler limitations to resolve paths at compile time for the emitted files.@alias imports will work seamlessly in test files because they directly read ts src files

PREREQUISITES
-------------

This scaffold assumes you have the following software and packages installed globally on your system:

- Node.js runtime — executes the JavaScript code. Compatible with any version, as long as you configure SWC to compile to your desired target and it is supported by SWC.

- SWC compiler — compiles TypeScript source files to JavaScript.

- pnpm package manager — installs project dependencies and runs scripts.

- Rollup bundler — bundles compiled source files and dependencies into a single bundle.

- Terser — minifies the bundle into a lightweight, production-ready script.

- TypeScript Compiler (tsc) — generates type declarations (.d.ts) with preserved JSDoc comments.

- Nodemon — watches src files and restarts execution on file changes.

- VSCode — recommended for IntelliSense support and debugging.

- Git — for version control.

- Vitest for testing the library to ensure features arent broken during development

FEATURES
--------

- Preconfigured scripts for common TypeScript library development tasks.

- Source map files and a properly configured .vscode/launch.json for smooth debugging within VSCode.

- Tunable configuration files (rollup.config.js, SWC config, tsconfig.json, etc.) ready for customization.

- Generates two output folders on build:

  - dist/ — contains the production-ready minified bundle.

  - build/ — contains compiled JavaScript files for debugging purposes.

- On publishing, only dist and build folders are included.

USAGE
-----

1. Clone or download this scaffold.

2. Install dependencies via `pnpm install`.

3. Use the provided npm scripts in package.json to build, bundle, minify, and debug your library.

4. Open the folder as the workspace root in VSCode to ensure proper debugging with source maps.
