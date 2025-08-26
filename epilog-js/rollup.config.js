import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import dts from 'rollup-plugin-dts';
import url from "url";
import path from 'path';
import { typescriptPaths } from 'rollup-plugin-typescript-paths';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
	{
		input: './build/src/main.js', // Your entry file
		output: {
			file: './dist/bundle.js',
			format: 'es', 
			name: 'Bundle', 
			sourcemap: true // Generate sourcemap
		},
		plugins: [
			resolve(), // Helps Rollup find npm packages
			commonjs(), // Converts CommonJS modules to ES6
			typescriptPaths(),
			alias({
				entries: [
					{ find: '@src', replacement:path.resolve(__dirname, 'src') },
				],
			}),
		]
	},
	{
		input: './build/types/src/main.d.ts', // Entry point to your emitted `.d.ts` files
		output: {
			file: './dist/bundle-min.d.ts', // Single bundled declaration output
			format: 'es',
		},
		plugins: [dts()],
	},
];
