import { isAbsolute, parse } from 'path';
import * as vscode from 'vscode';
import { Global } from './global';

export function adjustImgPath(uri: vscode.Uri, ext: string = 'png') {
    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const uuid = crypto.randomUUID().replace(/-/g, '');
    const workspacePath = getWorkspacePath(uri);
    const imgPath = Global.getConfig<string>("pasterImgPath")
        .replace("${fileName}", parse(uri.fsPath).name.replace(/\s/g, ''))
        .replace("${now}", now.getTime() + "")
        .replace("${date}", date)
        .replace("${uuid}", uuid)
        .replace("${ext}", ext);
    const fullPath = imgPath.replace("${workspaceDir}", workspacePath);
    let relPath = imgPath.replace(/\$\{workspaceDir\}\/?/, '');
    if (
        Global.getConfig<boolean>("pasteImageToWorkspacePath", false)
        && workspacePath
        && !isAbsolute(imgPath)
    ) {
        relPath = relPath.replace(/^[/\\]+/, '');
        return {
            relPath: `/${relPath}`,
            fullPath: `${workspacePath}/${relPath}`.replace(/\\/g, "/"),
        };
    }
    return {
        relPath,
        fullPath,
    };
}

/**
 * 根据uri获取其工作空间路径
 * @param uri 
 * @returns 
 */
export function getWorkspacePath(uri: vscode.Uri): string {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length == 0) return '';
    const workspacePath = folders[0]?.uri?.fsPath;
    if (folders.length > 1) {
        for (const folder of folders) {
            if (uri.fsPath.includes(folder.uri.fsPath)) {
                return folder.uri.fsPath;
            }
        }
    }
    return workspacePath;
}
