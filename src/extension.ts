// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { TIMEOUT } from 'dns';
import { formatWithOptions } from 'util';
import * as vscode from 'vscode';
import buttons from './buttons/buttons';
import createButtons from './utils/create_buttons';
import updateStatusbar from './utils/update_statusbar';
import watchEditors from './utils/watch_editors';

const reload = () => {
	vscode.commands.executeCommand('workbench.action.reloadWindow')
}

const textDecoration = vscode.window.createTextEditorDecorationType({
	borderWidth: '1px',
	borderStyle: 'solid',
	overviewRulerColor: 'green',
	overviewRulerLane: vscode.OverviewRulerLane.Right,
	light: {
		// this color will be used in light color themes
		borderColor: 'darkblue'
	},
	dark: {
		// this color will be used in dark color themes
		borderColor: 'lightblue'
	}
});

const defaultDecoration = vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions>{
	textDecoration: 'none; opacity: 1', borderWidth: '0px',
});

// export enum TypeWidgetsDetected {
// 	Text,
// 	Image,
// 	Button,
// 	TextInput,
// 	Icon,
// 	None,
// }

class AccessibilityAtributes {
	public semanticLabel: boolean;
	public excludeSemantic: boolean;

	constructor(semanticLabel: boolean = false, excludeSemantic: boolean = false) {
		this.semanticLabel = semanticLabel;
		this.excludeSemantic = excludeSemantic;
	}
}

class WidgetDetected {
	accessibilityAtributes: AccessibilityAtributes;
	type: string;
	firstLine: vscode.TextLine;
	content: Array<string>;

	constructor(type: string,
		accessibilityAtributes: AccessibilityAtributes,
		firstLine: vscode.TextLine,
		content: Array<string>) {
		this.type = type;
		this.firstLine = firstLine;
		this.accessibilityAtributes = accessibilityAtributes;
		this.content = content;
	}

	getType(): string {
		return this.type;
	}
	// getTypeInString(): string {
	// 	var value = "";
	// 	switch (this.type) {
	// 		case TypeWidgetsDetected.Text:
	// 			value = 'Text';
	// 			break;
	// 		case TypeWidgetsDetected.Image:
	// 			value = 'Image';
	// 			break;
	// 		case TypeWidgetsDetected.Icon:
	// 			value = 'Icon';
	// 			break;
	// 		case TypeWidgetsDetected.Button:
	// 			value = 'Button';
	// 			break;
	// 		default:
	// 			value = 'None';
	// 			break;
	// 	}
	// 	return value;
	// }

	toString(): string {
		let msg;
		msg = "type: ".concat(this.type);
		msg += "\n";
		msg += "semancitc: ".concat(this.accessibilityAtributes.semanticLabel.toString());
		msg += "\n";
		msg += "exclude: ".concat(this.accessibilityAtributes.excludeSemantic.toString());
		msg += "\n";
		msg += "fisrtLine: ".concat(this.firstLine.text.concat(this.firstLine.lineNumber.toString()));
		msg += "\n";
		msg += "content: ".concat(this.content.toString());
		msg += "\n";
		return msg;
	}

	markForImproveAccesbilitiy(): boolean {
		var value = false;
		var absenceSemantic = this.accessibilityAtributes.semanticLabel === false;
		var absenceExclude = this.accessibilityAtributes.excludeSemantic === false;

		switch (this.getType()) {
			case 'Text':
				value = absenceSemantic;
				break;
			case 'Image':
			case 'Image.network':
			case 'Image.asset':
			case 'Image.memory':
			case 'Image.file':
				value = absenceSemantic || absenceExclude;
				break;
			case 'Icon':
				value = absenceSemantic;
				break;
			case 'Button':
				value = absenceSemantic || absenceExclude;
				break;
			default:
				value = absenceSemantic || absenceExclude;
				break;
		}
		return value;
	}

}

const widgets = [
	'Text',
	'Image.network',
	'Image.asset',
	'Image',
	'Button',
	'Icon',
]

class DartClass {
	editor: vscode.TextEditor;
	document: vscode.TextDocument;
	outputChannel: vscode.OutputChannel;
	// lines: Array<vscode.TextLine>;
	// constructor(editor: vscode.TextEditor, lines: Array<vscode.TextLine>) {
	constructor(editor: vscode.TextEditor, document: vscode.TextDocument, ouutputChannel: vscode.OutputChannel) {
		this.editor = editor;
		this.document = document;
		this.outputChannel = ouutputChannel;
	}



	getLocationInfo(fileInUri: any, pathWithoutFile: string, lineText: string | any[], line: number, match: any[]) {
		var rootPath = vscode.workspace.rootPath + '/';
		var outputFile = pathWithoutFile.replace(rootPath, '');
		var startCol = lineText.indexOf(match[0]);
		var endCol = lineText.length;
		var location = outputFile + ' ' + (line + 1) + ':' + (startCol + 1);

		return {
			uri: fileInUri,
			absPath: pathWithoutFile,
			relativePath: location,
			startCol: startCol,
			endCol: endCol
		};
	};


	getAdvice(type: string) {
		var value = '';
		switch (type) {
			case 'Text':
				value =
					'By default the screen reader read the same value in the text. And sometimes this could be confuse for the user.';
				break;
			case 'Image':
			case 'Image.network':
			case 'Image.asset':
			case 'Image.memory':
			case 'Image.file':
				value = 'Images dont have label by default. For this reason can be confused for the users';
				break;
			case 'Icon':
				value = '';
				break;
			case 'Button':
				value = '';
				break;
			case 'TextInput':
				value = '';
				break;
			default:
				value = 'Find more info about accesbility in : ';
				break;
		}
		return value;
	}

	showOutputChannel(data: Array<WidgetDetected>) {

		var rangeList: vscode.Range[] = [];

		this.outputChannel.clear();


		if (data.length === 0) {

			this.editor.setDecorations(textDecoration, []);

			setTimeout(() => {
				vscode.window.showInformationMessage('Your program is now more accesible');
			}, 40)

		} else {
			for (let i = 0; i < data.length; i++) {
				var textline = data[i].firstLine;
				this.outputChannel.appendLine(`| Line ${textline.lineNumber + 1} | Widget: ${this.getTypeFromLine(textline.text)} | \n${this.getAdvice(data[i].type)}`);
				this.outputChannel.appendLine('');
				let range = textline.range;
				rangeList.push(range);
				//Zoom to first element
				if (i === 0) {
					this.editor.selection = new vscode.Selection(range.start, range.end);
					this.editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
				}
			}
			console.log(this.editor.selections, 'selections[data = muchos]')
			this.editor.setDecorations(textDecoration, rangeList);
			setTimeout(() => {
				vscode.window.showInformationMessage(`Detected ${data.length} ${data.length === 1 ? 'widget' : 'widgets'} that can improve accessibility`);
			}, 40)
			this.outputChannel.show(true);
		}




	}

	findWidgetInLine(line: string) {
		var result = false;
		widgets.forEach((widget) => {
			if (line.includes(widget.concat('('))) {
				result = true;
			}
		});
		return result;
	}

	getTypeFromLine(line: string) {
		var result = 'None';
		widgets.forEach((widget) => {
			if (line.includes(widget.concat('('))) {
				result = widget;
			}
		});
		return result;
	}

	async identifyWidgets() {
		let result: WidgetDetected[] = [];
		var firstLine = null;
		let count = 0;
		var content = [];
		var findWidget = false;
		var accessibilityAtributes = new AccessibilityAtributes();
		let widget;
		for (let i = 0; i < this.document.lineCount; i++) {
			var line = this.document.lineAt(i);
			var actualLine = line.text;


			//Find Widget
			if (this.findWidgetInLine(actualLine)) {
				console.log("[findWidget ] ------------- ".concat(actualLine));
				count++;
				findWidget = true;
				firstLine = line;
				content.push(actualLine)
				continue;
			}

			//Read lines below the widget
			if (findWidget && firstLine != null) {
				if (count === 0) {
					widget = new WidgetDetected(this.getTypeFromLine(firstLine.text), accessibilityAtributes, firstLine, content);
					if (widget.markForImproveAccesbilitiy()) {
						result.push(widget);
					}
					firstLine = null;
					findWidget = false;
					widget = null;
					accessibilityAtributes = new AccessibilityAtributes();
					content = [];
					continue;
				}
				if (!content.includes(actualLine)) {
					content.push(actualLine);
				}



				//Find Close Bracket for Widget
				if (actualLine.includes(')') || actualLine.includes('}') || actualLine.includes(']')) {
					count--;
				} else if (actualLine.includes('(') || actualLine.includes('{') || actualLine.includes('[')) {
					count++;
				}
				//Search especific property
				if (actualLine.includes('semanticsLabel:')) {
					accessibilityAtributes.semanticLabel = true;
				}

			}
		}

		console.log(result.length.toString());
		for (let j = 0; j < result.length; j++) {

			console.log(result[j].toString());
		}
		this.showOutputChannel(result);
		return result;
	}



}

export const findFeatures = async (editor: vscode.TextEditor, context: vscode.Memento) => {
	// let buff = editor.document.getText();
	// let lines = buff.split('\n');

	let document = editor.document;

	let dartClass = new DartClass(editor, document, outputChannel);

	await dartClass.identifyWidgets();
}


export const outputChannel = vscode.window.createOutputChannel(`Flutter Accessibility`);

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "Accessibility" is now active!');
	var workspaceState = context.workspaceState;

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return; // No open text editor
	}
	context.subscriptions.push(vscode.commands.registerCommand('extension.accessibility.activate', () => {
		// The code you place here will be executed every time your command is executed

		const document = editor.document;
		findFeatures(editor, workspaceState);
		console.log("finish!!!");


		vscode.workspace.onDidSaveTextDocument((a) => {
			setTimeout(() => {
				findFeatures(editor, workspaceState);
			}, 40);
		});
	}));

	// context.subscriptions.push(vscode.commands.registerCommand('extension.accessibility.desactive', () => {
	// 	// The code you place here will be executed every time your command is executed

	// 	context.subscriptions.pop();
	// 	const editor = vscode.window.activeTextEditor;
	// 	if (!editor) {
	// 		return; // No open text editor
	// 	}
	// 	editor.setDecorations(textDecoration,[]);

	// }))



	if (vscode.extensions.getExtension('dart-code.dart-code') !== undefined) {
		let statusButtons = createButtons(buttons);
		watchEditors(statusButtons);
		updateStatusbar(editor, statusButtons);
	}
}

// this method is called when your extension is deactivated
export function deactivate() {
}
