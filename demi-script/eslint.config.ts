import eslint from '@eslint/js';
import tsEslint from 'typescript-eslint';
import globals from 'globals'; // npm package that exports common global vars
import importPlugin from "eslint-plugin-import";

const srcFiles =  [
    'src/**/*.ts', 
    'src/**/*.tsx',
    'src/**/*.js', 
    'src/**/*.jsx',
]
const testFiles =  [
    'tests/**/*.ts', 
    'tests/**/*.tsx',
    'tests/**/*.js', 
    'tests/**/*.jsx'
]
const config = tsEslint.config(
    eslint.configs.recommended,
    tsEslint.configs.recommended,
    tsEslint.configs.strict,
    tsEslint.configs.stylistic,
    {
        ignores: ["eslint.config.ts","vitest.config.ts","./build/**","./dist/**","./src/generated/**"],
    },
    { // Apply environment globals for JavaScript files
        files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },  
    },
    {
        files:[...srcFiles,...testFiles],
        rules:{//i used warnings to prevent noise that can distract the dev from actual type errors
            'indent':['warn',4],
            'no-mixed-spaces-and-tabs': 'warn',
            'semi': ['warn', 'always'],
        },
    },
    {
        files:[...srcFiles,...testFiles], 
        rules: {
            "@typescript-eslint/explicit-function-return-type": "warn",
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/no-extraneous-class": [
                "warn", { 
                    "allowStaticOnly": true 
                }
            ],
            "@typescript-eslint/naming-convention": [
                "warn",
                {
                    "selector": "variable",
                    "modifiers": ["const"],
                    "format": ["camelCase", "UPPER_CASE"]
                },
                {
                    "selector": "variable",
                    "format": ["camelCase"]
                },
                {
                    "selector": "function",
                    "format": ["camelCase"]
                },
                {
                    "selector": "class",
                    "format": ["PascalCase"]
                },
                {
                    "selector": "classMethod",
                    "format": ["camelCase"]
                },
                {
                    "selector": "classProperty",
                    "format": ["camelCase"]
                },
                {
                    "selector": "classProperty",
                    "modifiers": ["readonly"],
                    "format": ["UPPER_CASE"]
                }
            ]   
        }
    },
    {
        files:srcFiles,//test files are allowed to import ts files directly because they use jiti
        plugins: {
            import: importPlugin,
        },
        rules: {
            "import/extensions": [
                "error",
                "ignorePackages",
                {
                    "js": "always",
                    "ts": "never",
                    "tsx": "never"
                }
            ]
        },
        settings: {
            "import/resolver": {
                "node": {
                    "extensions": [".js", ".jsx", ".ts", ".tsx"]
                }
            }
        }
    }
);
export default config as any;//the cast is a workaround till the project maintainers resolve type issues