import React, { Component } from "react";
import FastCustomList from "../controls/FastCustomList";
import { ide } from "../IDE";
import { withDialog } from "../dialogs/index";

class VariableList extends Component {
	extendedVariables(variables) {
		let extended = [];
		if (variables) {
			const groups = {};
			variables.forEach((v) => {
				if (!groups[v.class]) {
					groups[v.class] = [];
				}
				groups[v.class].push(v);
			});
			Object.keys(groups).forEach((c) => {
				extended.push({ name: c, type: "separator" });
				groups[c].forEach((v) => extended.push(v));
			});
		}
		return extended;
	}

	variableSelected = (variable) => {
		const selected = variable.type === "separator" ? null : variable;
		if (this.props.onSelect) {
			this.props.onSelect(selected);
		}
	};

	addVariable = async () => {
		try {
			const name = await this.props.dialog.prompt({
				title: "New variable",
				required: true,
			});
			await ide.api.addInstanceVariable(this.props.class.name, name);
			if (this.props.onAdd) {
				this.props.onAdd();
			}
		} catch (error) {
			ide.reportError(error);
		}
	};

	renameVariable = async (variable) => {
		if (!variable) {
			return;
		}
		try {
			const newName = await this.props.dialog.prompt({
				title: "Rename variable",
				defaultValue: variable.name,
				required: true,
			});
			if (variable.type === "instance") {
				await ide.api.renameInstanceVariable(
					this.props.class.name,
					variable.name,
					newName
				);
			} else {
				await ide.api.renameClassVariable(
					this.props.class.name,
					variable.name,
					newName
				);
			}
			variable.name = newName;
			if (this.props.onRename) {
				this.props.onRename(variable, newName);
			}
		} catch (error) {
			ide.reportError(error);
		}
	};

	removeVariable = async (variable) => {
		if (!variable) {
			return;
		}
		try {
			if (variable.type === "instance") {
				await ide.api.removeInstanceVariable(
					this.props.class.name,
					variable.name
				);
			} else {
				await ide.api.removeClassVariable(
					this.props.class.name,
					variable.name
				);
			}
			if (this.props.onRemove) {
				this.props.onRemove();
			}
		} catch (error) {
			ide.reportError(error);
		}
	};

	moveVariableUp = async (variable) => {
		if (!variable) {
			return;
		}
		try {
			await ide.api.moveInstanceVariableUp(
				this.props.class.name,
				variable.name
			);
			if (this.props.onMoveUp) {
				this.props.onMoveUp(variable);
			}
		} catch (error) {
			ide.reportError(error);
		}
	};

	moveVariableDown = async (variable, target) => {
		if (!variable) {
			return;
		}
		try {
			await ide.api.moveInstanceVariableDown(
				this.props.class.name,
				variable.name,
				target
			);
			if (this.props.onRemove) {
				this.props.onRemove(variable);
			}
		} catch (error) {
			ide.reportError(error);
		}
	};

	menuOptions() {
		const options = [
			{ label: "Add", action: this.addVariable },
			{ label: "Rename", action: this.renameVariable },
			{ label: "Remove", action: this.removeVariable },
			{ label: "Move to superclass", action: this.moveVariableUp },
		];
		if (this.props.class && this.props.class.subclasses) {
			options.push({
				label: "Move to subclass",
				suboptions: this.props.class.subclasses.map((c) => {
					return {
						label: c.name,
						action: (v) => this.moveVariableDown(v, c.name),
					};
				}),
			});
		}
		return options;
	}

	render() {
		const variables = this.extendedVariables(this.props.variables);
		return (
			<FastCustomList
				itemLabel="name"
				itemDivider={(item) => item.type === "separator"}
				labelStyle={(item) => (item.type === "separator" ? "italic" : "normal")}
				labelSize={(item) => (item.type === "separator" ? "small" : "normal")}
				items={variables}
				selectedItem={this.props.selected}
				onSelect={this.variableSelected}
				menuOptions={this.menuOptions()}
			/>
		);
	}
}

export default withDialog()(VariableList);
