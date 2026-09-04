import * as vscode from 'vscode';
import { Global } from './common/global';
import { MarkdownEditorProvider } from './provider/markdownEditorProvider';
import { MarkdownService } from './service/markdownService';
import { registerPlantumlServerCommand } from './service/plantumlServerService';

export async function activate(context: vscode.ExtensionContext) {
	await Global.init(context);
	const viewOption = { webviewOptions: { retainContextWhenHidden: true } };
	const markdownService = new MarkdownService(context);
	const markdownEditorProvider = new MarkdownEditorProvider(context);
	registerPlantumlServerCommand(context);
	context.subscriptions.push(
		vscode.commands.registerCommand('office-view-markdown.switch', (uri) => { markdownService.switchEditor(uri) }),
		vscode.commands.registerCommand('office-view-markdown.paste', () => { markdownService.loadClipboardImage() }),
		vscode.window.registerCustomEditorProvider("office-view-markdown.markdownViewer", markdownEditorProvider, viewOption)
	);
}

export function deactivate() { }
