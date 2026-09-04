import * as vscode from 'vscode';

export class Util {
    public static buildPath(data: string, webview: vscode.Webview, contextPath: string | vscode.Uri): string {
        const baseUri = typeof contextPath === 'string' ? vscode.Uri.file(contextPath) : contextPath;
        return data.replace(/((src|href)=("|')?)(\/\/)/gi, "$1http://")
            .replace(/((src|href)=("|'))((?!(?:https?:|#|data:|mailto:|javascript:|blob:)).+?["'])/gi, "$1" + webview.asWebviewUri(baseUri) + "/$4");
    }

}
