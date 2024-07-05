import * as vscode from 'vscode';
import { FileButtonProvider } from './treeProvider';

export function activate(context: vscode.ExtensionContext) {
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	const fileButtonsProvider = new FileButtonProvider(rootPath);
	context.subscriptions.push(vscode.window.registerTreeDataProvider('djangoTabs', fileButtonsProvider));
	context.subscriptions.push(vscode.commands.registerCommand('djangoTabs.refresh', () => fileButtonsProvider.refresh()));

	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
		if (editor) {
			fileButtonsProvider.refresh();
		}
	}));
}

export function deactivate() {}
