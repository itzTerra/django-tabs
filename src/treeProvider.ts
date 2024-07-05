import * as vscode from 'vscode';
import * as path from 'path';
import { pathExists } from './utils';

const PARENT_DIR_TO_TYPE_DEFAULTS: Record<string, string> = {
    "managers": "Manager",
    "models": "Model",
    "serializers": "Serializer",
    "views": "View",
    "urls": "Url"
};

export class FileButtonProvider implements vscode.TreeDataProvider<Tab> {
	private _onDidChangeTreeData: vscode.EventEmitter<Tab | undefined | void> = new vscode.EventEmitter<Tab | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Tab | undefined | void> = this._onDidChangeTreeData.event;

    private get mapParentDirToType(): Record<string, string> {
        const config = vscode.workspace.getConfiguration("djangoTabs").get<Record<string, string>>("config");
        if (!config || Object.keys(config).length === 0) {
            vscode.workspace.getConfiguration("djangoTabs").update("config", PARENT_DIR_TO_TYPE_DEFAULTS, vscode.ConfigurationTarget.Global);
            return PARENT_DIR_TO_TYPE_DEFAULTS;
        }
        return config;
    }

	constructor(private workspaceRoot: string | undefined) { }

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: Tab): vscode.TreeItem {
		return {
            label: element.label,
            description: element.uri?.fsPath.split(path.sep).slice(-3).join(path.sep),
            resourceUri: element.uri,
            command: element.uri ? {
                command: 'vscode.open',
                title: 'Open File',
                arguments: [element.uri]
            } : undefined,
            iconPath: element.uri ? vscode.ThemeIcon.File : undefined
        };
	}

	getChildren(element?: Tab): Thenable<Tab[]> {
		if (!this.workspaceRoot || element) {
			return Promise.resolve([]);
		}
        const activeDocument = vscode.window.activeTextEditor?.document;
        if (!activeDocument || activeDocument.isUntitled || activeDocument.languageId !== "python") {
            return Promise.resolve([]);
        }

        const mapParentDirToType = this.mapParentDirToType;
        const parentDir = path.dirname(activeDocument.fileName);
        const parentDirName = path.basename(parentDir);
        if (!Object.keys(mapParentDirToType).includes(parentDirName)) {
            return Promise.resolve([]);
        }
        const tabs: Tab[] = [];
        const djangoAppDir = path.dirname(parentDir);
        const activeFileName = path.basename(activeDocument.fileName);
        for (const [dirName, type] of Object.entries(mapParentDirToType)) {
            this.addTabIfUri(tabs, type, this.lookForFile(djangoAppDir, dirName, activeFileName));
        }
        return Promise.resolve(tabs);
	}

    lookForFile(appDir: string, folderName: string, activeFileName: string): vscode.Uri | undefined {
        const filePath = path.join(appDir, folderName, activeFileName);
        if (pathExists(filePath)) {
            return vscode.Uri.file(filePath);
        }
        const filePathCaseInsensitive = path.join(appDir, folderName, activeFileName.toLowerCase());
        if (pathExists(filePathCaseInsensitive)) {
            return vscode.Uri.file(filePathCaseInsensitive);
        }
        return undefined;
    }

    addTabIfUri(tabs: Tab[], type: string, fileUri?: vscode.Uri): void {
        if (fileUri) {
            tabs.push(new Tab(type, fileUri));
        }
    }
}

export class Tab {
    constructor(
        public readonly type: string,
        public readonly uri?: vscode.Uri,
    ) { }

    get label(): string {
        return this.type;
    }
}

