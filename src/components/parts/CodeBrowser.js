import React, { Component } from "react";
import {
	Grid,
	Paper,
	Link,
	ToggleButton,
	ToggleButtonGroup,
} from "@mui/material";
import { ide } from "../IDE";
import { container } from "../ToolsContainer";
import CodeEditor from "./CodeEditor";
//import clsx from "clsx";

class CodeBrowser extends Component {
	constructor(props) {
		super(props);
		this.state = {
			method: null,
			selectedMode: "source",
		};
	}

	static getDerivedStateFromProps(props, state) {
		const selected = state.selectedMode;
		const mode =
			!props.method && selected === "source"
				? "definition"
				: (selected === "definition" || selected === "comment") &&
				  props.method &&
				  props.method !== state.method
				? "source"
				: selected;
		if (props.method === state.method && mode === selected) {
			return null;
		}
		return {
			selectedMode: mode,
			method: props.method,
		};
	}

	defineClass = async (definition) => {
		// if (!this.props.class) {
		// 	return;
		// }
		const pack = this.props.package;
		const species = this.props.class;
		const classname = species ? species.name : null;
		const superclass = species ? species.superclass : null;
		const packagename = species ? species.package : pack ? pack.name : null;
		try {
			const change = await ide.api.defineClass(
				classname,
				superclass,
				packagename,
				definition
			);
			const species = await ide.api.classNamed(change.className);
			if (this.props.onDefineClass) {
				this.props.onDefineClass(species);
			}
		} catch (error) {
			ide.reportError(error);
		}
	};

	renameClass = async (target) => {
		if (
			target !== this.props.class.name &&
			target !== this.props.class.superclass
		) {
			return;
		}
		try {
			const newName = await ide.prompt({
				title: "Rename class",
				defaultValue: target,
				required: true,
			});
			await ide.api.renameClass(target, newName);
			this.props.class.name = newName;
			if (this.props.onRenameClass) {
				this.props.onRenameClass(this.props.class);
			}
		} catch (error) {
			ide.reportError(error);
		}
	};

	commentClass = async (comment) => {
		if (!this.props.class) {
			return;
		}
		try {
			await ide.api.commentClass(this.props.class.name, comment);
			const species = await ide.api.classNamed(this.props.class.name);
			if (this.props.onCommentClass) {
				this.props.onCommentClass(species);
			}
		} catch (error) {
			ide.reportError(error);
		}
	};

	compileMethod = async (source) => {
		if (!this.props.class) {
			return;
		}
		try {
			const pack = this.props.package;
			const species = this.props.class;
			const method = this.props.method;
			const packagename = method
				? method.package
				: species
				? species.package
				: pack
				? pack.name
				: null;
			const category = method ? method.category : null;
			const classname = species
				? species.name
				: method
				? method.methodClass
				: null;
			const change = await ide.api.compileMethod(
				classname,
				packagename,
				category,
				source
			);
			const compiled = await ide.api.method(classname, change.selector);
			if (this.props.onCompileMethod) {
				this.props.onCompileMethod(compiled);
			}
		} catch (error) {
			this.handleCompilationError(error, source);
		}
	};

	async handleCompilationError(error, source) {
		const method = this.props.method;
		if (!method) {
			return;
		}
		method.source = source;
		const data = error.data;
		if (data && data.suggestions && data.suggestions.length > 0) {
			const chosen = await ide.choose({
				title: data.description,
				message: "What do you want to do?",
				items: data.suggestions.map((s) => s.description),
				defaultValue: data.suggestions[0].description,
			});
			const suggestion = chosen
				? data.suggestions.find((s) => s.description === chosen)
				: null;
			if (chosen) {
				try {
					let method;
					for (const change of suggestion.changes) {
						const applied = await ide.api.postChange(change);
						method = await ide.api.method(
							this.props.class.name,
							applied.selector
						);
					}
					if (this.props.onCompileMethod) {
						this.props.onCompileMethod(method);
					}
				} catch (inner) {
					this.handleCompilationError(
						inner,
						suggestion.changes[suggestion.changes.length - 1]
							.sourceCode
					);
				}
			}
		} else {
			if (data && data.interval) {
				method.annotations = [
					{
						from: data.interval.start,
						to: data.interval.end,
						type: "error",
						description: data.description,
					},
				];
			} else {
				const description = data ? data.description : null;
				ide.reportError(description || "Unknown compilation error");
			}
			this.setState({ method: method });
		}
	}

	availableModes = () => {
		const modes = [
			{ mode: "definition", label: "Class definition" },
			{ mode: "comment", label: "Class comment" },
		];
		const method = this.props.method;
		if (method) {
			modes.push({ mode: "source", label: "Method definition" });
			if (method.bytecodes) {
				modes.push({ mode: "bytecodes", label: "Bytecodes" });
			}
			if (method.disassembly) {
				modes.push({ mode: "disassembly", label: "Disassembly" });
			}
		}
		return modes;
	};

	currentSource = () => {
		const species = this.props.class;
		const method = this.props.method;
		let source;
		switch (this.state.selectedMode) {
			case "comment":
				source = species ? species.comment : "";
				break;
			case "definition":
				source = species ? species.definition : "";
				break;
			case "source":
				source = method ? method.source : "";
				break;
			case "bytecodes":
				source = method ? method.bytecodes || "" : "";
				break;
			case "disassembly":
				source = method ? method.disassembly || "" : "";
				break;
			default:
		}
		return source;
	};

	currentAst = () => {
		return this.state.selectedMode === "source"
			? this.props.method
				? this.props.method.ast
				: null
			: null;
	};

	currentCodeMode = () => {
		let mode;
		switch (this.state.selectedMode) {
			case "comment":
				mode = "text";
				break;
			case "disassembly":
				mode = "assembler";
				break;
			default:
				mode = "smalltalk";
		}
		return mode;
	};

	currentAuthor = () => {
		if (this.state.selectedMode === "source") {
			const method = this.props.method;
			return method ? method.author : "";
		}
		return "";
	};

	currentTimestamp = () => {
		const method = this.props.method;
		if (
			this.state.selectedMode === "source" &&
			method &&
			method.timestamp &&
			method.timestamp !== ""
		) {
			return new Date(method.timestamp).toLocaleString();
		}
		return "";
	};

	currentPackage = () => {
		const species = this.props.class;
		const method = this.props.method;
		if (this.state.selectedMode === "source" && method) {
			return method.package;
		}
		if (species) {
			return species.package;
		}
		return "";
	};

	currentAnnotations = () => {
		if (this.state.selectedMode === "source") {
			const method = this.props.method;
			return method ? method.annotations : [];
		}
		return "";
	};

	modeChanged = (event, mode) => {
		this.setState({ selectedMode: mode });
	};

	acceptClicked = (source) => {
		switch (this.state.selectedMode) {
			case "comment":
				this.commentClass(source);
				break;
			case "definition":
				this.defineClass(source);
				break;
			case "source":
				this.compileMethod(source);
				break;
			default:
		}
	};

	render() {
		const mode = this.state.selectedMode;
		const author = this.currentAuthor();
		const timestamp = this.currentTimestamp();
		const packagename = this.currentPackage();
		const {
			selectedInterval,
			selectedSelector,
			selectedIdentifier,
			onTooltipShow,
			onTooltipClick,
		} = this.props;
		return (
			<Grid container spacing={1}>
				<Grid item xs={12} md={12} lg={12}>
					<ToggleButtonGroup
						label="primary"
						value={mode}
						exclusive
						onChange={this.modeChanged}
					>
						{this.availableModes().map((m) => (
							<ToggleButton
								value={m.mode}
								variant="outlined"
								size="small"
								key={m.mode}
							>
								{m.label}
							</ToggleButton>
						))}
					</ToggleButtonGroup>
				</Grid>
				<Grid item xs={12} md={12} lg={12}>
					<Paper
						variant="outlined"
						style={{ height: "100%", minHeight: 300 }}
					>
						<CodeEditor
							context={this.props.context}
							lineNumbers={false}
							source={this.currentSource()}
							mode={this.currentCodeMode()}
							ast={this.currentAst()}
							annotations={this.currentAnnotations()}
							selectedInterval={selectedInterval}
							selectedSelector={selectedSelector}
							selectedIdentifier={selectedIdentifier}
							showAccept
							onAccept={this.acceptClicked}
							onRename={(target) => this.renameClass(target)}
							onTooltipShow={onTooltipShow}
							onTooltipClick={onTooltipClick}
						/>
					</Paper>
				</Grid>
				<Grid item xs={12} md={12} lg={12}>
					{timestamp ? "Modified on " : ""}
					{timestamp}
					{author ? " by " : ""}
					{author && (
						<Link
							href="#"
							onClick={() => container.openChat(author)}
						>
							{author}
						</Link>
					)}
					{timestamp || author ? " - " : ""}
					{packagename && (
						<Link
							href="#"
							onClick={() => container.browsePackage(packagename)}
						>
							{packagename}
						</Link>
					)}
				</Grid>
			</Grid>
		);
	}
}

export default CodeBrowser;
