/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        include: ['tests/**/*.test.ts', 'src/**/*.spec.ts'], // custom globs
        globals: true, // optional: use global test functions without imports
        environment: 'node',
    },
})
