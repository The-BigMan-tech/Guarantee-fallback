import {
    createConnection,
    ProposedFeatures,
    TextDocuments,
    TextDocumentSyncKind
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {analyzeDocument} from "fog-js";

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize(() => {
    return {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental
        }
    };
});

documents.onDidChangeContent(change => {
    const text = change.document.getText();
    const srcPath = change.document.uri;
    analyzeDocument(text,srcPath).then(diagnostics=>{
        console.log('🚀 => :24 => analysis:',diagnostics);
        connection.sendDiagnostics({
            uri: change.document.uri,
            diagnostics:diagnostics
        });
    });
    connection.console.log(`Document changed. Current length: ${text.length} text: ${text}`);
});

documents.listen(connection);
connection.listen();
