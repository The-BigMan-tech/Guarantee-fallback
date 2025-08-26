import ipc from 'node-ipc';
import { JSONRPCClient } from "json-rpc-2.0";

const client = new JSONRPCClient((jsonRPCRequest) =>
    new Promise((resolve, reject) => {
        ipc.config.silent = true;
        
        ipc.connectTo('epilog-ipc-server', () => {
            const server = ipc.of['epilog-ipc-server']; 
            server.on('connect', () => {
                server.emit('message',jsonRPCRequest);
            });
            server.on('message', (data: string) => {
                try {
                    const jsonRPCResponse = JSON.parse(data);
                    console.log('🚀 => :17 => jsonRPCResponse:', jsonRPCResponse);
                    resolve(client.receive(jsonRPCResponse));
                } catch (err) {
                    reject(err);
                } finally {
                    ipc.disconnect('epilog-ipc-server');
                }
            });
            server.on('error', reject);
        });
    })
);

client.request("checkFacts",'hello world').then(result => {
    console.log('Fact checker response:', result);
});
