# LIB-SCAFFOLD

A reusable scaffold for building TypeScript libraries with modern tooling and optimized bundles.

---

## NOTE

- Open this scaffold in VSCode as the root workspace folder for proper debugging and path resolution.
  
- The clean scripts assume a windows environment.So configure for your target platform if its different.
  
- All source files should be under the src folder, with main.ts as the entry point of your program.
  
- Import aliases must be consistent in both Rollup and tsconfig.json.
  
  - @alias imports only work in .ts source files during bundling, not when running compiled files directly, because path aliases are resolved at bundling time due to compiler limitations.
  
  - @alias imports work seamlessly in test files since tests run directly from source .ts files.
  
- The target js environment must be consistent in the swc,typescript and terser configs
  
- Set **Insert Spaces on Tab** to true in VSCode to prevent false indentation errors flagged by ESLint.

- Test files are **not compiled** but executed directly via jiti; they’re not part of the final build.

- Watchers and other Node.js tools are dev-only and will **not be included** in the final browser-ready build.

---

## USAGE

### Automatic setup

Use the CLI tool:
```shell
    ts-scaff --name <project-name>
```

### Manual setup

1. Clone or download this scaffold repository.

2. Remove the .git folder to avoid inadvertently pushing changes to the original repo.

3. Run:
```shell
    pnpm install
```

4. Use the provided npm scripts in package.json to run,build, bundle, minify, and debug your library.

5. Open the folder as the workspace root in VSCode to ensure proper debugging with source maps.

---

## PREREQUISITES

This scaffold assumes the following software and packages are installed globally on your system:

- Node.js runtime — to execute JavaScript code. Compatible with any version, provided SWC is configured correctly.

- SWC compiler — to compile TypeScript source files.

- pnpm package manager — to install dependencies and run scripts.

- Rollup bundler — to bundle compiled source and dependencies.

- Terser — to minify the bundle into a production-ready script.

- TypeScript compiler (tsc) — to generate type declaration files (.d.ts) preserving JSDoc.

- Nodemon — to watch src files and restart execution on changes.

- VSCode — recommended for IntelliSense and debugging.

- Git — for version control.

- Verdaccio — to create a local registry where you can publish to and install packages from for development purposes and to proxy installs from the npm-registry for caching to allow the packages to be reinstalled anywhere offline on subsequent installs.

---

## OPTIONAL VSCode EXTENSIONS

For an improved developer experience, consider installing:

- ESLint:To integrate the project's eslint configuration seamlessly with vscode

- Error Lens:To flag errors using highlited inline text in the editor.

- Terminal keeper:To save commonly used commands as terminals that can easily be spawned with its gui.It can be better than runnig scripts from pkg.json directly in situations where the command shouldnt be scoped to a particular project and can be reused everywhere like starting up the verdaccio server.

---

## FEATURES

- Well-configured npm scripts covering commonly needed tasks like linting, compiling, bundling, minifying, and testing.

- Source maps along with a .vscode/launch.json configuration for seamless debugging within VSCode.

- Tunable configuration files (rollup.config.js, .swcrc, tsconfig.json, etc.) ready for customization.

- Testing environment that runs TypeScript test files directly — no separate compilation step needed.

- A watch-compile command which recompiles **only the files that changed** in the src directory for faster development.

- Output structure:

  - dist/ — production-ready, minified bundles.

  - build/ — compiled JavaScript files for debugging purposes.

- The final published package includes **only** the dist and build folders.

---