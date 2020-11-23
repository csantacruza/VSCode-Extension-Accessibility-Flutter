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

class AccessibilityAtributes {
	public semanticLabel: boolean;
	public excludeSemantic: boolean;
	public labelTextFormField: boolean;
	public hintTextFormField: boolean;


	constructor(semanticLabel: boolean = false,
		excludeSemantic: boolean = false,
		labelTextFormField: boolean = false,
		hintTextFormField: boolean = false,) {
		this.semanticLabel = semanticLabel;
		this.excludeSemantic = excludeSemantic;
		this.labelTextFormField = labelTextFormField;
		this.hintTextFormField = hintTextFormField;
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

	toString(): string {
		let msg;
		msg = "type: ".concat(this.type);
		msg += "\n";
		if(this.type == 'TextFormField'){
			msg += "labelText: ".concat(this.accessibilityAtributes.labelTextFormField.toString());
			msg += "\n";
			msg += "hintText: ".concat(this.accessibilityAtributes.hintTextFormField.toString());
			msg += "\n";
		}else{
			msg += "semancitc: ".concat(this.accessibilityAtributes.semanticLabel.toString());
		msg += "\n";
		msg += "exclude: ".concat(this.accessibilityAtributes.excludeSemantic.toString());
		msg += "\n";
		}
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
		var absenceLabelTextFormField = this.accessibilityAtributes.labelTextFormField === false;
		var absenceHintTextFormField = this.accessibilityAtributes.hintTextFormField === false;

		switch (this.type) {
			case 'Text':
				value = absenceSemantic;
				break;
			case 'Image':
			case 'Image.network':
			case 'Image.asset':
			case 'Image.memory':
			case 'Image.file':
				value = absenceSemantic;
				if(value){
					value = absenceExclude;
				}  
				break;
			case 'Icon':
				value = absenceSemantic;
				break;
			case 'IconButton':
			case 'MaterialButton':
			case 'OutlineButton':
			case 'RaisedButton':
			case 'TextButton':
			case 'FlatButton':
				value = absenceSemantic;
				if(value){
					value = absenceExclude;
				}  
				break;
			case 'TextFormField':
				value = absenceLabelTextFormField;
				if(value){
					value = absenceHintTextFormField;
				}
				break;
			default:
				value = absenceSemantic;
				if(value){
					value = absenceExclude;
				}  
				break;
		}
		return value;
	}

}

const widgets = [
	'Text',
	'Image',
	'Image.network',
	'Image.asset',
	'Image.memory',
	'Image.file',
	'IconButton',
	'FlatButton',
	'MaterialButton',
	'OutlineButton',
	'RaisedButton',
	'TextButton',
	'Icon',
	'TextFormField',
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
					'Text by default change the semantic label for the text value.\n';
				value += '🛠 [ RECOMMENDATION ]\n';
				value += '- If you wanna get extra information, add short description\n';

				break;
			case 'Image':
			case 'Image.network':
			case 'Image.asset':
			case 'Image.memory':
			case 'Image.file':
				value = 'Images don\'t have semantic label by default. For this reason can be confused for the users.\n';
				value += '🛠 [ RECOMMENDATION ]\n';
				value += '- If image is in the background or is only for decoration,it not need property semantic label.\n';
				value += '- If image will give information to the user, it need property semantic label.\n';
				break;
			case 'Icon':
				value = 'Icons by default don\'t have labels, for this reason people that use screen readers(TalkBack and VoiceOver) never will find this icon.\n';
				value += '🛠 [ RECOMMENDATION ]\n';
				value += '- If icon is only for decoration,it not need property semantic label.\n';
				value += '- If icon open or active new functionality,it need property semantic label.\n';
				break;
			case 'IconButton':
			case 'MaterialButton':
			case 'OutlineButton':
			case 'RaisedButton':
			case 'TextButton':
			case 'FlatButton':
				value = 'Button by default have the semantic label "Button" and this label don\'t give information about the action that will do when press the button\n';
				value += '🛠 [ RECOMMENDATION ]\n';
				value += 'Wrap the button widget in Semantics widget and change the property label with the action that do the button like "Back Button"\n';
				break;
			case 'TextFormField':
				value = 'TexFormField by default have the semantic label "TexField"\n';
				value += '🛠 [ RECOMMENDATION ]\n';
				value += '- Add labelText or hintText property to complement the default semantic label';
				break;
			default:
				value = 'Find more info about accesbility in : \n';
				value += 'https://flutter.dev/docs/development/accessibility-and-localization/accessibility';
				break;
		}
		return value;
	}

	showOutputChannel(data: Array<WidgetDetected>) {

		var rangeList: vscode.Range[] = [];

		this.outputChannel.clear();

		var initialMessage = 'Remember that you can see labels that will read screen readers(TalkBack and VoiceOver).\n';
		initialMessage += 'This function can be active with follow property: \n\nMaterialApp(\n showSemanticsDebugger: true, \n);\n\n';
		initialMessage += 'Find more info about accesbility in: \n';
		initialMessage += 'https://flutter.dev/docs/development/accessibility-and-localization/accessibility \n\n';

		this.outputChannel.appendLine(initialMessage);

		if (data.length === 0) {

			this.editor.setDecorations(textDecoration, []);

			setTimeout(() => {
				vscode.window.showInformationMessage('This file is now more accesible');
			}, 40)

		} else {
			this.outputChannel.appendLine(`[#] Found ${data.length} ${data.length ===1 ?'widget':'widgets'} with possible accessibility improvements\n`);

			for (let i = 0; i < data.length; i++) {
				var textline = data[i].firstLine;
				this.outputChannel.appendLine(`🟡 | Line ${textline.lineNumber + 1} → Widget: ${this.getTypeFromLine(textline.text)} | \n${this.getAdvice(data[i].type)}`);
				this.outputChannel.appendLine('');
				let range = textline.range;
				rangeList.push(range);
				//Zoom to first element
				if (i === 0) {
					this.editor.selection = new vscode.Selection(range.start, range.end);
					this.editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
				}
			}
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
		var accessibilityAtributes:AccessibilityAtributes = new AccessibilityAtributes();
		let widget;
		for (let i = 0; i < this.document.lineCount; i++) {
			var line = this.document.lineAt(i);
			var actualLine = line.text;


			//Find Widget
			if (this.findWidgetInLine(actualLine)) {
				console.log("[findWidget ] ------------- ".concat(actualLine.replace(' ','')));

				findWidget = true;
				firstLine = line;
				content.push(actualLine);
				//Find Close Bracket for Widget
				count = this.findCloseBracket(actualLine,0);
				this.setAccessibilityAtributtes(actualLine,accessibilityAtributes);
				if (count === 0 && firstLine !== null) {
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
				continue;
			}

			//Read lines inside the widget
			if (findWidget && firstLine !== null ) {

				if (!content.includes(actualLine)) {
					content.push(actualLine);
				}
				//Find Close Bracket for Widget
				var finalCount = this.findCloseBracket(actualLine,count);

				this.setAccessibilityAtributtes(actualLine,accessibilityAtributes);
			
				if (finalCount !== 0) {
					count = finalCount;
				} else {

					widget = new WidgetDetected(this.getTypeFromLine(firstLine.text), accessibilityAtributes, firstLine, content);

					if (widget.markForImproveAccesbilitiy()) {
						result.push(widget);
					}
					firstLine = null;
					findWidget = false;
					widget = null;
					accessibilityAtributes = new AccessibilityAtributes();
					content = [];
					count = 0;
					continue;
				}

			}
		}

		console.log('Widget to improve ',result.length.toString());
		for (let j = 0; j < result.length; j++) {

			console.log(result[j].toString());
		}
		this.showOutputChannel(result);
		return result;
	}

	setAccessibilityAtributtes(actualLine:string,access:AccessibilityAtributes){
	if (actualLine.includes('semanticsLabel:') || actualLine.includes('semanticLabel:')) {
		access.semanticLabel = true;
	}
	if (actualLine.includes('excludeFromSemantics:')) {
		access.excludeSemantic = true;
	}
	//Validate accessibility label in TextFormField
	if (actualLine.includes('labelText:')) {
		access.labelTextFormField = true;
	}
	if (actualLine.includes('hintText:')) {
		access.hintTextFormField = true;
	}
}

	findCloseBracket(line: string,actualCounter:number): number {
		var result = actualCounter;
		line.replace(' ','');
		for (let x = 0; x < line.length; x++) {
			if (line.charAt(x) === ")") {
				result = result - 1;
				if (result === 0) {
					return result;
				}
			} else if (line.charAt(x) === "(") {
				result = result + 1;
			}
		}
		return result;
	}

}

export const findFeatures = async (editor: vscode.TextEditor, context: vscode.Memento) => {
	// let buff = editor.document.getText();
	// let lines = buff.split('\n');


	let dartClass = new DartClass(editor, editor.document, outputChannel);

	await dartClass.identifyWidgets();
}


export const outputChannel = vscode.window.createOutputChannel(`Flutter Accessibility`);

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "Accessibility" is now active!');


	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

	context.subscriptions.push(vscode.commands.registerCommand('extension.accessibility.activate', () => {
		// The code you place here will be executed every time your command is executed
		var workspaceState = context.workspaceState;
		if (!vscode.window.activeTextEditor) {
			return; // No open text editor
		}
		if (vscode.window.activeTextEditor !== null && vscode.window.activeTextEditor !== undefined) {
			findFeatures(vscode.window.activeTextEditor, workspaceState);
			console.log("finish!!!");

			vscode.workspace.onDidSaveTextDocument((a) => {
				setTimeout(() => {
					if (vscode.window.activeTextEditor !== null && vscode.window.activeTextEditor !== undefined) {
						findFeatures(vscode.window.activeTextEditor, workspaceState);
						console.log("finish!!!");
					}
				}, 40);
			});
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.accessibility.desactive', () => {
		// The code you place here will be executed every time your command is executed
		deactivate();
	}))



	if (vscode.extensions.getExtension('dart-code.dart-code') !== undefined) {
		let statusButtons = createButtons(buttons);
		watchEditors(statusButtons);
		updateStatusbar(vscode.window.activeTextEditor, statusButtons);
	}
}

// this method is called when your extension is deactivated
export function deactivate() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return; // No open text editor
	}
	editor.setDecorations(textDecoration, []);
	vscode.window.showInformationMessage(`Desactivate of Flutter Accesible complete`);
}
