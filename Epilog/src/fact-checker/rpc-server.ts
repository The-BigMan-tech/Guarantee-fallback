import chalk from "chalk";
import ipc from 'node-ipc';
import { JSONRPCServer } from "json-rpc-2.0";
import stringify from "safe-stable-stringify";

const server = new JSONRPCServer();
server.addMethod("checkFacts", (params) => {
    console.log('checkFacts params:', params);
    return { valid: true, details: "Facts are consistent" };
});

export async function startIPCServer(): Promise<void> {
    console.log(chalk.green('Running the epilog fact checker...'));
    ipc.config.id = 'epilog-ipc-server';
    ipc.config.silent = false;

    ipc.serve(() => {
        ipc.server.on('message', async (data, socket) => {
            console.log('🚀 => :19 => startIPCServer => data:', typeof data,data);
            try {
                const response = stringify(await server.receive(data));
                console.log('🚀 => :22 => startIPCServer => response:',typeof response,response);
                if (response) {
                    ipc.server.emit(socket, 'message', response);
                }
            } catch (err) {
                console.error('Error handling JSON-RPC request:', err);
            }
        });
    });
    ipc.server.start();
    console.log(chalk.green(`node-ipc JSON-RPC IPC server listening as '${ipc.config.id}'`));
}
