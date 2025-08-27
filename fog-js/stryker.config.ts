import { PartialStrykerOptions } from '@stryker-mutator/api/core';

const config: PartialStrykerOptions = {
    mutate: [
        'src/**/*.ts',
        '!tests/**/*.ts',        // exclude test folders from mutation
        '!**/*.spec.ts',
        '!**/*.test.ts',
    ],
    testRunner: 'vitest',
    plugins: ["@stryker-mutator/vitest-runner","@stryker-mutator/typescript-checker"],
    packageManager: 'pnpm',
    coverageAnalysis: 'perTest',       // best for mutation testing
    checkers: ['typescript'],//detects mutations on types
    tsconfigFile: 'tsconfig.json',
    disableTypeChecks: true,//prevents mutations on types to bypass which orevents false flags
    concurrency: 4,
    reporters: ['clear-text','progress','html'],
    //@ts-expect-error The LogLevel enum throws errors of undefined.
    logLevel:"off",       // disables console logging
    clearTextReporter: {
        reportTests: false,
        reportMutants: false,
        reportScoreTable: true
    }
};

export default config;
