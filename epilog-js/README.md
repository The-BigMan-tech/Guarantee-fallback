# TS-SCAFF

A reusable scaffold for building TypeScript libraries with modern tooling and optimized bundles.


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

4. Clear the main.ts and main.test files and configure the name and bin fields in your package.json file.

5. Use the provided npm scripts in package.json to run,build, bundle, minify, and debug your library.

6. Open the folder as the workspace root in VSCode to ensure proper debugging with source maps.


## PREREQUISITES

This scaffold assumes the following software and packages are installed globally on your system:

- **Node.js runtime** — to execute JavaScript code. Compatible with any version, provided SWC is configured correctly.

- **VSCode** — recommended for IntelliSense and debugging.

- **pnpm package manager** — to install dependencies and run scripts.

- **Git** — for version control.

---


## EXPLANATION OF THE COMMANDS
**compile:full**: Runs a full compilation of the src files

**compile:watch**: Optimizes for development by spawning a watcher that only compiles the files that change.

**bundle**: Bundles the compiled files into a bundle that still resembles the source.

**minify**: Used in the build pipeline to aggressively minify the bundle.It also links in a src map to the build folder for debugging.

**gen:types**: Used in the build pipeline to generate the types for your src files to be used in the bundle.

**watch:src**: Used to watch the src files.It can be used in conjuction with any command that needs to run in response to changes in the src files by using the format:
```shell
    pnpm run watch:src --exec \"command\"
```

**watch:build**: Similar to watch:src but for build files.

**build**: Runs a full pipeline to prepare your code for distribution.It removes the development src maps from the build folder because the ts src files wont be available in the final build for the maps to use.The distributed package will rather contain a map in the dist folder that maps to the build files.

**exec:main**: Executes the compiled files through the entry point;main.js.

**exec:main:watch**: Executes the compiled files on every compilation.

**exec:bundle**: Executes the final bundle from the build pipeline.

**test**: Runs your test suite.

**test:watch**: Runs your test suite on src files changes.

**test:mutation**: Runs mutation tests.

**lint:src**: Lints your src files.

**lint:watch**: Lints your src files whenever they change.

**lint:fix**: Attempts to fix lint errors in your src files


## PLEASE TAKE NOTE:

- Open this scaffold in VSCode as the root workspace folder for proper debugging and path resolution in root files.

- All source files should be under the src folder, with main.ts as the entry point of your program.
  
- The build pipeline removes dev src maps from the build folder.Only the final bundle src map is included.
  
- There are two main types of src maps that are generated.one during and for development that creates maps from the compiled files back to the ts source files so that the ts files can be debugged directly and another that maps the bundle file to the build files which are for the users of the library which is generated when the project is built.It maps to the build files because the typescript src files wont be included in the distrbuted package.

- Vscode has to be confiured in the launch.json file of the project to reference the minifed bundle or main.ts file depending on whether its the user or the developer.
  
- Import aliases must be consistent in both the Rollup and tsconfig files.
  
  - @alias imports only resolve in source files during bundling and not compilation, because path aliases are resolved at bundling time due to compiler limitations.
  
  - @alias imports can be used seamlessly in test files because they dont get compiled which allows the compiler to resolve aliases because their location is where they are executed.
  
- The target javascript environment must be consistent in the swc and typescript configs and the minify command
  
- Set **Insert Spaces on Tab** to true in VSCode to prevent false indentation errors flagged by ESLint.

- Test files are **not compiled** but executed directly via jiti; they’re not part of the final build.

- Watchers and other Node.js tools are dev-only and will **not be included** in the final browser-ready build.

- If you are not installing Verdaccio,please remove the registry key predefined in the .npmrc file at the root of the project as its set to point to the Verdaccio registry and make sure to run the verdaccio server if installed.Else,package install commands will hold because they will be waiting for the server.

- You can solve any indentation warning from the pre-configured eslint rules by adjusting them as you like or if you wish to stick with it but want to auto-solve indentation problems,then run:
    ```shell
        pnpm run lint:fix
    ```

- Mutation tests are available via pnpm run test:mutation for assessing test suite strength.Its is recommended to run them before major releases or as part of CI pipelines, but it is not required for every local build due to performance constraints or blocks due to minor issues

- It is recommened but not mandatory to:  
    -  Run the following command to compile the code during development.It ensures that only the files that have changed undergo compilation.
    ```shell
        pnpm run compile:watch
     ```

   - Have a separate terminal for the following command which will automatically run your compiled files on every compilation.It provides a good developer experience by having you focus on the code and whenever you want to check the output,you just view the terminal and hide it when you are finished.
  
    ```shell
        pnpm run exec:main:watch
    ```

    - Run the following commands in separate terminals for automatically running your tests and linting your source files
    
    ```shell
        pnpm run test:watch
    ```

    ```shell
        pnpm run lint:watch
    ```

    - Run the following to automatically build the codebase for distribution
    ```shell
        pnpm run build
    ```
---


## OPTIONAL 
For an improved developer experience, consider installing:

- **Verdaccio**: To create a local registry where you can publish to and install packages from for development purposes and to proxy installs from the npm-registry for caching to allow the packages to be reinstalled anywhere offline on subsequent installs.

- Vscode Extensions: 
    - **ESLint**:To integrate the project's eslint configuration seamlessly with vscode

    - **Prettify** TypeScript: For better Type Previews
    
    - **Pretty TypeScript Errors**: For more user-friendly error messages from ts in the editor
  
    - **Error Lens**:To flag errors using highlited inline text in the editor.

    - **Terminal keeper**:To save commonly used commands as terminals that can easily be spawned with its gui.It can    be better than runnig scripts from pkg.json directly in situations where the command shouldnt be scoped to a   particular project and can be reused everywhere like starting up the verdaccio server.

---

## FEATURES

- Well-configured npm scripts covering commonly needed tasks like linting, compiling, bundling, minifying, and testing.

- Source maps along with a .vscode/launch.json configuration for seamless debugging within VSCode.

- Tunable configuration files (rollup.config.js, .swcrc, tsconfig.json, etc.) ready for customization.

- Testing environment that runs TypeScript test files directly — no separate compilation step needed and provides a suite of tools for unit,property and mutation tests

- A watch-compile command which recompiles **only the files that changed** in the src directory for faster development.

- Output structure:

  - dist/ — production-ready, minified bundles.

  - build/ — compiled JavaScript files for debugging purposes.

- The final published package includes **only** the dist and build folders.
  
---

