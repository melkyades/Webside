import React, { Component } from "react";
import { Grid, Box, IconButton, LinearProgress } from "@mui/material";
import AcceptIcon from "@mui/icons-material/CheckCircle";
import PopupMenu from "../controls/PopupMenu";
import { ide } from "../IDE";
import { container } from "../ToolsContainer";
import Scrollable from "../controls/Scrollable";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { linter, lintGutter } from "@codemirror/lint";
//import { material } from "@uiw/codemirror-theme-material";
//import { LRLanguage, LanguageSupport } from "@codemirror/language";
//import { styleTags, tags } from "@lezer/highlight";
import { SmalltalkParser } from "../../SmalltalkParser";
import { Tag } from "@lezer/highlight";
import { createTheme } from "@uiw/codemirror-themes";
import { StreamLanguage } from "@codemirror/language";
import { EditorSelection, Prec } from "@codemirror/state";

// This code is intended to be used when defining a parser from a Lezer grammar.
// const parser = SmalltalkParser.configure({
// 	props: [
// 		styleTags({
// 			argument: tags.variableName,
// 			temporary: tags.variableName,
// 		}),
// 	],
// });
// const language = LRLanguage.define({ parser: parser });
// const smalltalk = new LanguageSupport(smalltalk);

// This code makes use of a CodeMirror 5-like parser and should be replaced in the future by the Lezer grammar option abvove.

const newTags = {
	selector: Tag.define(),
	symbol: Tag.define(),
	argument: Tag.define(),
	temporary: Tag.define(),
	assignment: Tag.define(),
	string: Tag.define(),
	variable: Tag.define(),
	var: Tag.define(),
	meta: Tag.define(),
	bracket: Tag.define(),
	reserved: Tag.define(),
	return: Tag.define(),
	global: Tag.define(),
	number: Tag.define(),
	comment: Tag.define(),
	separator: Tag.define(),
};
SmalltalkParser.tokenTable = newTags;
const smalltalk = StreamLanguage.define(SmalltalkParser);

class CodeEditor extends Component {
	constructor(props) {
		super(props);
		this.editorRef = React.createRef();
		this.editorView = null;
		this.selectsRanges = true;
		this.state = {
			originalSource: props.source,
			source: props.source,
			selectedInterval: null,
			dirty: false,
			selectedRanges: [],
			menuOpen: false,
			menuPosition: { x: null, y: null },
			evaluating: false,
			progress: false,
		};
	}

	static getDerivedStateFromProps(props, state) {
		const {
			source,
			selectedInterval,
			selectedSelector,
			selectedIdentifier,
			evaluating,
		} = props;
		if (
			/*!state.dirty &&*/
			source !== state.originalSource ||
			JSON.stringify(selectedInterval) !==
				JSON.stringify(state.selectedInterval) ||
			selectedSelector !== state.selectedSelector ||
			selectedIdentifier !== state.selectedIdentifier
		) {
			const ranges =
				source && selectedInterval
					? [
							{
								from: selectedInterval.start - 1,
								anchor: selectedInterval.start - 1,
								to: selectedInterval.end,
								head: selectedInterval.end,
							},
					  ]
					: [];
			return {
				originalSource: source,
				selectedInterval: selectedInterval,
				selectedSelector: selectedSelector,
				selectedIdentifier: selectedIdentifier,
				source: source,
				selectedRanges: ranges,
				evaluating: evaluating,
				dirty: false,
			};
		}
		if (evaluating !== state.evaluating) {
			return {
				evaluating: evaluating,
			};
		}
		return null;
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (
			nextProps.source !== this.props.source ||
			JSON.stringify(nextProps.selectedInterval) !==
				JSON.stringify(this.props.selectedInterval) ||
			nextProps.selectedSelector !== this.props.selectedSelector ||
			nextProps.selectedIdentifier !== this.props.selectedIdentifier
		) {
			this.selectsRanges = true;
			return true;
		}
		// Review this as responding false none of local setState() calls trigger a re-rendering
		// For instance, openMenu(), which is intended to open the popup menu, never gets a rerendering (and so the menu open)
		return false;
	}

	componentDidUpdate() {
		if (this.selectsRanges && this.state.selectedRanges) {
			this.selectRanges(this.state.selectedRanges);
		}
		if (this.state.selectedSelector) {
			const ranges = this.rangesContainingSelector(
				this.state.selectedSelector
			);
			this.selectRanges(ranges);
		}
		if (this.state.selectedIdentifier) {
			const ranges = this.rangesContainingIdentifier(
				this.state.selectedIdentifier
			);
			this.selectRanges(ranges);
		}
	}

	editor() {
		return this.editorRef.current;
	}

	currentState() {
		return this.editorView.viewState.state;
	}

	selectedText() {
		if (!this.editorView) {
			return "";
		}
		const selection = this.currentState().selection;
		return selection ? this.textInRange(selection.main) : "";
	}

	textInRange(range) {
		return this.state.source.slice(range.from, range.to);
	}

	selectRanges(ranges) {
		if (ranges.length === 0) return;
		// This hack sucks!
		// It was the way I found to set selection after a rendering: the value changes but editorView
		// has a delay in updating its state, and so the first attempt to set the selection might fail
		// (as the new selection might surpass the previous value boundaries)
		for (let i = 0; i < 2; i++) {
			setTimeout(() => {
				try {
					this.editorView?.dispatch({
						selection: {
							anchor: ranges[0].anchor,
							head: ranges[0].head,
						},
						scrollIntoView: true,
					});
				} catch (error) {}
			}, 200 * i);
		}
	}

	inserText(text, position) {
		this.editorView.dispatch({
			changes: { from: position, to: position, insert: text },
		});
	}

	astRangesSatisfying(condition) {
		const ranges = [];
		const ast = this.props.ast;
		if (!ast) {
			return ranges;
		}
		this.traverseAst(ast, (node) => {
			if (condition(node)) {
				ranges.push({ anchor: node.start - 1, head: node.end });
			}
		});
		return ranges;
	}

	rangesContainingSelector(selector) {
		const ranges = [];
		const ast = this.props.ast;
		if (!ast) {
			// Should try by using a SearchCursor and selector as a string or regex
			return ranges;
		}
		return this.astRangesSatisfying(
			(node) =>
				(node.type === "Selector" || node.type === "Literal") &&
				node.value === selector
		);
	}

	rangesContainingIdentifier(identifier) {
		const ranges = [];
		const ast = this.props.ast;
		if (!ast) {
			// Should try by using a SearchCursor and selector as a string or regex
			return ranges;
		}
		return this.astRangesSatisfying(
			(node) => node.type === "Identifier" && node.value === identifier
		);
	}

	traverseAst(node, block) {
		block(node);
		if (node.children) {
			node.children.forEach((n) => {
				this.traverseAst(n, block);
			});
		}
	}

	astNodeAtOffset(offset) {
		const ast = this.props.ast;
		var node;
		if (ast) {
			this.traverseAst(ast, (n) => {
				if (
					n.start <= offset &&
					offset <= n.end &&
					(!node || (node.start <= n.start && n.end <= node.end))
				) {
					node = n;
				}
			});
		}
		return node;
	}

	openMenu = (event) => {
		event.preventDefault();
		this.setState({
			menuOpen: true,
			menuPosition: { x: event.clientX - 2, y: event.clientY - 4 },
		});
		this.forceUpdate(); // Check this according to the default response in shouldComponentUpdate()
	};

	closeMenu = () => {
		this.setState({ menuOpen: false });
		this.forceUpdate(); // Check this according to the default response in shouldComponentUpdate()
	};

	menuOptions() {
		const shortcuts = ide.settings.section("shortcuts");
		return [
			{ label: "Copy (Ctrl+c)", action: this.copyToClipboard },
			{ label: "Paste (Ctrl+v)", action: this.pasteFromClipboard },
			null,
			{
				label: "Do it (" + shortcuts.get("evaluateExpression") + ")",
				action: this.evaluateExpression,
			},
			{
				label: "Print it (" + shortcuts.get("showEvaluation") + ")",
				action: this.showEvaluation,
			},
			{
				label:
					"Inspect it (" + shortcuts.get("inspectEvaluation") + ")",
				action: this.inspectEvaluation,
			},
			{
				label: "Debug it (" + shortcuts.get("debugExpression") + ")",
				action: this.debugExpression,
			},
			{ label: "Profile it", action: this.profileExpression },
			{ label: "Google it", action: this.searchInGoogle },
			null,
			{
				label: "Browse class (" + shortcuts.get("browseClass") + ")",
				action: this.browseClass,
			},
			{
				label:
					"Browse senders (" + shortcuts.get("browseSenders") + ")",
				action: this.browseSenders,
			},
			{
				label:
					"Browse implementors (" +
					shortcuts.get("browseImplementors") +
					")",
				action: this.browseImplementors,
			},
			{
				label:
					"Browse class references (" +
					shortcuts.get("browseClassReferences") +
					")",
				action: this.browseClassReferences,
			},
			{
				label: "Search methods matching",
				action: this.browseMethodsMatching,
			},
			{
				label: "Search string references",
				action: this.browseStringReferences,
			},
		];
	}

	copyToClipboard = () => {
		const text = this.selectedText();
		navigator.clipboard.writeText(text);
	};

	pasteFromClipboard = () => {
		// OUTDATED
		navigator.clipboard.readText().then(
			(text) => {
				this.editor.replaceSelection(text);
			},
			(error) => console.log(error)
		);
	};

	acceptClicked = () => {
		if (this.props.onAccept) {
			this.props.onAccept(this.state.source);
		}
	};

	targetWord() {
		const selected = this.selectedText();
		if (selected.length > 0) {
			return selected;
		}
		if (this.editorView) {
			const range = this.currentState().wordAt(this.currentPosition());
			return this.textInRange(range);
		}
	}

	currentPosition() {
		if (this.editorView) {
			const state = this.currentState();
			if (state && state.selection && state.selection.main)
				return state.selection.main.from;
		}
	}

	targetSelector() {
		const selected = this.selectedText();
		if (selected.length > 0) {
			return selected.trim();
		}
		const position = this.currentPosition();
		const node = this.astNodeAtOffset(position);
		if (node && (node.type === "Selector" || node.type === "Literal")) {
			return node.value;
		}
		return this.targetWord();
	}

	searchInGoogle = () => {
		const url = "https://www.google.com/search?q=" + this.targetWord();
		window.open(url, "_blank").focus();
	};

	browseSenders = () => {
		container.browseSenders(this.targetSelector());
	};

	browseImplementors = () => {
		container.browseImplementors(this.targetSelector());
	};

	browseClass = (e, f) => {
		container.browseClass(this.targetWord());
	};

	browseClassReferences = () => {
		container.browseClassReferences(this.targetWord());
	};

	browseMethodsMatching = () => {
		container.browseMethodsMatching(this.targetWord());
	};

	browseStringReferences = () => {
		container.browseStringReferences(this.targetWord());
	};

	selectedExpression() {
		const expression = this.selectedText();
		if (expression.length > 0) {
			return expression;
		}
		return this.currentLine();
	}

	currentLine() {
		const state = this.currentState();
		if (state.selection.main) {
			return state.doc.lineAt(state.selection.main.head).text;
		}
	}

	debugExpression = async () => {
		const expression = this.selectedExpression();
		try {
			await container.debugExpression(expression, this.props.context);
		} catch (error) {}
	};

	profileExpression = async () => {
		const expression = this.selectedExpression();
		try {
			await container.profileExpression(expression, this.props.context);
		} catch (error) {}
	};

	evaluateExpression = async () => {
		const expression = this.selectedExpression();
		try {
			this.setState({ progress: true });
			await container.evaluateExpression(
				expression,
				false,
				false,
				this.props.context
			);
			this.setState({ progress: false }, this.triggerOnEvaluate());
		} catch (error) {
			this.setState({ progress: false });
		}
	};

	triggerOnEvaluate() {
		if (this.props.onEvaluate) {
			this.props.onEvaluate();
		}
	}

	showEvaluation = async () => {
		const expression = this.selectedExpression();
		try {
			this.setState({ progress: true });
			const object = await container.evaluateExpression(
				expression,
				false,
				false,
				this.props.context
			);
			this.setState({ progress: false });
			const selection = this.currentState().selection.main;
			this.inserText(
				" " + object.printString,
				Math.max(selection.head, selection.anchor)
			);
		} catch (error) {
			this.setState({ progress: false });
		}
	};

	inspectEvaluation = async () => {
		const expression = this.selectedExpression();
		try {
			this.setState({ progress: true });
			const object = await container.evaluateExpression(
				expression,
				false,
				true,
				this.props.context
			);
			this.setState({ progress: false });
			container.openInspector(object);
		} catch (error) {
			this.setState({ progress: false });
		}
	};

	annotations = () => {
		if (!this.props.annotations) {
			return [];
		}
		return this.props.annotations.map((a) => {
			return {
				from: a.from - 1,
				to: a.to - 1,
				severity: a.type,
				message: a.description,
			};
		});
	};

	setBreakpoint = (n) => {
		// OUTDATED
		var info = this.editor.lineInfo(n);
		this.editor.setGutterMarker(
			n,
			"breakpoints",
			info.gutterMarkers ? null : this.makeMarker()
		);
	};

	makeMarker() {
		// OUTDATED
		var marker = document.createElement("div");
		marker.style.color = "red";
		marker.innerHTML = "●";
		return marker;
	}

	renameTarget = () => {
		const target = this.targetWord();
		if (!target || target === "") {
			return;
		}
		if (this.props.onRename) {
			this.props.onRename(target);
		}
	};

	sourceChanged = (source) => {
		this.selectsRanges = false;
		this.setState(
			{
				source: source,
				dirty: true,
			},
			() => {
				if (this.props.onChange) {
					this.props.onChange(source);
				}
			}
		);
	};

	selectionChanged = (selection) => {
		this.selectsRanges = false;
	};

	adaptShortcut(shortcut) {
		const parts = shortcut.split("+");
		return parts[0] + "-" + parts[1];
	}

	extraKeys() {
		const shortcuts = ide.settings.section("shortcuts");
		return [
			{
				key: this.adaptShortcut(shortcuts.get("evaluateExpression")),
				run: this.evaluateExpression,
			},
			{
				key: this.adaptShortcut(shortcuts.get("inspectEvaluation")),
				run: this.inspectEvaluation,
			},
			{
				key: this.adaptShortcut(shortcuts.get("showEvaluation")),
				run: this.showEvaluation,
			},
			{
				key: this.adaptShortcut(shortcuts.get("debugExpression")),
				run: this.debugExpression,
			},
			{
				key: this.adaptShortcut(shortcuts.get("acceptCode")),
				run: this.acceptClicked,
			},
			{
				key: this.adaptShortcut(shortcuts.get("browseClass")),
				run: this.browseClass,
			},
			{
				key: this.adaptShortcut(shortcuts.get("browseSenders")),
				run: this.browseSenders,
			},
			{
				key: this.adaptShortcut(shortcuts.get("browseImplementors")),
				run: this.browseImplementors,
			},
			{
				key: this.adaptShortcut(shortcuts.get("browseClassReferences")),
				run: this.browseClassReferences,
			},
			{ key: "F2", run: this.renameTarget },
		];
	}

	theme() {
		const appearance = ide.settings.section("appearance");
		const mode = appearance.get("mode");
		return createTheme({
			theme: mode,
			settings: {
				//fontFamily: appearance.get("codeFont.family,
				background: appearance.section(mode).get("background"),
				foreground: "#75baff",
				caret: "#FFCC00",
				selection: "#80cbc433",
				selectionMatch: "#80cbc433",
				lineHighlight: "#8a91991a",
				gutterBackground: appearance.section(mode).get("background"),
				gutterForeground: "#8a919966",
			},
			styles: [
				{ tag: newTags.selector, color: "#d3dddd" },
				{ tag: newTags.symbol, color: "#3cd2dd" },
				{ tag: newTags.argument, color: "#f06520" },
				{ tag: newTags.temporary, color: "#81c9f3" },
				{ tag: newTags.assignment, color: "#ffffff" },
				{ tag: newTags.string, color: "#C3E88D" },
				{ tag: newTags.variable, color: "#268bd2" },
				{ tag: newTags.var, color: "#268bd2" },
				{ tag: newTags.meta, color: "#FFCB6B" },
				{ tag: newTags.bracket, color: "#9b9b9b" },
				{ tag: newTags.reserved, color: "#C792EA" },
				{ tag: newTags.return, color: "#72bb19" },
				{ tag: newTags.global, color: "#bb73b5" },
				{ tag: newTags.number, color: "#65a14e" },
				{ tag: newTags.comment, color: "#586e75", fontStyle: "italic" },
				{ tag: newTags.separator, color: "#b3bab6" },
			],
		});
	}

	render() {
		const { source, evaluating, progress, dirty, menuOpen, menuPosition } =
			this.state;
		const { showAccept, lineNumbers } = this.props;
		const acceptIcon = this.props.acceptIcon ? (
			React.cloneElement(this.props.acceptIcon)
		) : (
			<AcceptIcon
				size="large"
				color={dirty ? "primary" : "inherit"}
				style={{ fontSize: 30 }}
			/>
		);
		return (
			<Grid container spacing={1} style={{ height: "100%" }}>
				<Grid
					item
					xs={11}
					md={showAccept ? 11 : 12}
					lg={showAccept ? 11 : 12}
				>
					<Scrollable>
						<CodeMirror
							ref={this.editorRef}
							width="100%"
							height="100%"
							extensions={[
								smalltalk,
								EditorView.lineWrapping,
								lintGutter(),
								linter(this.annotations),
								Prec.highest(keymap.of(this.extraKeys())),
							]}
							theme={this.theme()}
							value={source}
							onChange={this.sourceChanged}
							onContextMenu={(event) => {
								this.openMenu(event);
							}}
							onCreateEditor={(view, state) => {
								this.editorView = view;
							}}
							readOnly={evaluating || progress}
							basicSetup={{
								lineNumbers: lineNumbers,
								closeBrackets: true,
								bracketMatching: true,
								highlightActiveLine: false,
								//allowMultipleSelections: true,
								drawSelection: true,
								//keymap: this.extraKeys(),
							}}
						/>
					</Scrollable>
					{(evaluating || progress) && (
						<LinearProgress variant="indeterminate" />
					)}
				</Grid>
				{showAccept && (
					<Grid item xs={1} md={1} lg={1}>
						<Box display="flex" justifyContent="center">
							<IconButton
								color="inherit"
								onClick={this.acceptClicked}
							>
								{acceptIcon}
							</IconButton>
						</Box>
					</Grid>
				)}
				<PopupMenu
					options={this.menuOptions()}
					open={menuOpen}
					position={menuPosition}
					onClose={this.closeMenu}
				/>
			</Grid>
		);
	}
}

export default CodeEditor;
