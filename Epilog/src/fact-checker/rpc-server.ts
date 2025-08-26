import chalk from "chalk";
import ipc from 'node-ipc';
import { JSONRPCServer } from "json-rpc-2.0";
import stringify from "safe-stable-stringify";

const server = new JSONRPCServer();
server.addMethod("checkFacts",({ text }:{text:string})  => {
    console.log(chalk.cyan('checkFacts params:'), text);
    return { valid: true, details: "Facts are consistent" };
});

export async function startIPCServer(): Promise<void> {
    ipc.config.id = 'epilog-ipc-server';
    ipc.config.silent = false;

    ipc.serve(() => {
        ipc.server.on('message', async (data, socket) => {//receive request from the client
            console.log(chalk.cyan('Request: '),data);
            try {
                const response = stringify(await server.receive(data));//route request to the appropriate controller
                if (response) {
                    ipc.server.emit(socket, 'message', response);//return response back to the client.The response must be stringified
                }
            } catch (err) {
                console.error('Error handling JSON-RPC request:', err);
            }
        });
    });
    ipc.server.start();
    console.log(chalk.green(`The epilog fact checker is listening with the id '${ipc.config.id}'`));
}
