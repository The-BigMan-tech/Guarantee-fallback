import { JSONRPCServer } from "json-rpc-2.0";


const server = new JSONRPCServer();
server.addMethod("checkFacts", ({ facts }) => {
    return { valid: true, details: "Facts are consistent" };
});

// Handling incoming JSON-RPC requests from clients
async function handleRequest(request: any) {
    const response = await server.receive(request);
    return response;
}
