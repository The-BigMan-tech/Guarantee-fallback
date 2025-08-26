import { Command } from 'commander';
import { resolveDocToJson } from './resolver/resolver.js';
import { startIPCServer } from './fact-checker/rpc-server.js';

const program = new Command();
async function runCLI():Promise<void> {
    program
        .name('epilog')
        .description('Example CLI that calls a function using flags/options')
        .version('1.0.0');
    program
        .command('resolve')  // define the subcommand 'resolve'
        .description('Resolve .el files to json')
        .requiredOption('--src <srcPath>', 'path to DSL file')
        .option('--out <outputPath>', 'folder to output the DSL data structure')
        .action(async (options) => {
            await resolveDocToJson(options.src, options.out);
        });
    program
        .command('run')
        .description('Start the fact checker IPC server')
        .option('--port <port>', 'Port for IPC server', '3000')
        .action(async (options) => {
            const port = parseInt(options.port, 10);
            await startIPCServer(port);
        });
    await program.parseAsync(process.argv);
}
await runCLI();