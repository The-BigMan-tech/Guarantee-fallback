import { findDefLocation } from 'fog-js';
import * as path from 'path';
import { workspace, ExtensionContext,languages, DefinitionProvider, CancellationToken, Definition, DefinitionLink, Position,TextDocument,Uri,Location,Range} from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
    let serverModule = context.asAbsolutePath(path.join('dist','lsp-server','server.js'));
    let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

    let serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: debugOptions
        }   
    };
    let clientOptions: LanguageClientOptions = { 
        documentSelector: [{ scheme: 'file', language: 'crown' }],
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher('**/.crown')
        }
    };
    context.subscriptions.push(
        languages.registerDefinitionProvider(
            {scheme:'file',language:'crown'},
            new DefProvider()
        )
    );
    client = new LanguageClient(
        'crownLanguaeServer',
        'Crown Language Server',
        serverOptions,
        clientOptions
    );
    client.start();
}
class DefProvider implements DefinitionProvider {
    public async provideDefinition(document: TextDocument, position: Position, token: CancellationToken):Promise<Definition | DefinitionLink[] | undefined> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) { return undefined; };

        const word = document.getText(wordRange);
        const defLocation = await findDefLocation(position.line,word);
        console.log('def at: ',word,'def: ',defLocation);

        if (!defLocation) { return undefined; };

        const uri = Uri.file(defLocation.uri);
        const range = new Range(
            new Position(defLocation.range.start.line,defLocation.range.start.character),
            new Position(defLocation.range.end.line,defLocation.range.end.character),
        );
        return new Location(uri,range);
    }
}
export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
