/**
 * Web extension host entry (`package.json#browser`) for the Markdown editor.
 */
import * as vscode from 'vscode';
import { Global } from './common/global';
import { FileUtil } from './common/fileUtil';
import { MarkdownEditorProvider } from './provider/markdownEditorProvider';
import { MarkdownService } from './service/markdownService';

export async function activate(context: vscode.ExtensionContext) {
	await Global.init(context);
	FileUtil.init(context);

	const viewOption = { webviewOptions: { retainContextWhenHidden: true } };
	const markdownService = new MarkdownService(context);
	const markdownEditorProvider = new MarkdownEditorProvider(context, { isWeb: true });

	context.subscriptions.push(
		vscode.commands.registerCommand('office-view-markdown.switch', (uri) => { markdownService.switchEditor(uri); }),
		vscode.window.registerCustomEditorProvider('office-view-markdown.markdownViewer', markdownEditorProvider, viewOption),
	);
}

export function deactivate() { }
