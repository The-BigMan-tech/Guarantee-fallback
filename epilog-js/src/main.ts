import ipc from 'node-ipc';
import { JSONRPCClient } from "json-rpc-2.0";

const client = new JSONRPCClient((jsonRPCRequest) =>
    new Promise((resolve, reject) => {
        ipc.config.silent = true;
        
        ipc.connectTo('epilog-ipc-server', () => {
            const server = ipc.of['epilog-ipc-server']; 
            server.on('connect', () => {//make the request.the request should not be stringified
                server.emit('message',jsonRPCRequest);
            });
            server.on('message', (data: string) => {//get the response
                try {
                    const jsonRPCResponse = JSON.parse(data);
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
    console.log('Fact checker response:', result);//hanlde the response
});
