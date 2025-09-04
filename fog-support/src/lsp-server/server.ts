import {
    createConnection,
    ProposedFeatures,
    TextDocuments,
    TextDocumentSyncKind
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

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
    connection.console.log(`Document changed. Current length: ${text.length} text: ${text}`);
});

documents.listen(connection);
connection.listen();
