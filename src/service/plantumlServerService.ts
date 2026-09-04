import * as vscode from 'vscode';
import {
    isPlantumlServerConfigured,
    PLANTUML_SERVER_SETTING_KEY,
    probePlantumlServer,
} from '@/common/plantumlServer';
import { Global } from '@/common/global';

export function openPlantumlServerSettings(): Thenable<unknown> {
    return vscode.commands.executeCommand('workbench.action.openSettings', PLANTUML_SERVER_SETTING_KEY);
}

export async function promptConfigurePlantumlServer(message: string): Promise<void> {
    const open = 'Open Settings';
    const choice = await vscode.window.showWarningMessage(message, open);
    if (choice === open) {
        await openPlantumlServerSettings();
    }
}

export async function runPlantumlServerConnectivityTest(): Promise<void> {
    const base = Global.getConfig<string>('plantuml.server', '') ?? '';
    if (!isPlantumlServerConfigured(base)) {
        await promptConfigurePlantumlServer(
            'PlantUML Server Base URL is not configured. Configure it in Settings before running the connectivity test.',
        );
        return;
    }

    try {
        const result = await probePlantumlServer(base);
        if (result.ok) {
            await vscode.window.showInformationMessage(
                `PlantUML Server connectivity test succeeded (HTTP ${result.status}${result.contentType ? `, ${result.contentType}` : ''}).`,
            );
            return;
        }
        await vscode.window.showErrorMessage(
            `PlantUML Server connectivity test failed: ${result.reason}`,
        );
    } catch (error) {
        await vscode.window.showErrorMessage(
            `PlantUML Server connectivity test failed: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

export function registerPlantumlServerCommand(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'office-view-markdown.plantuml.testServer',
            () => runPlantumlServerConnectivityTest(),
        ),
    );
}
