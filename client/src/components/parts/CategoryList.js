import React, { Component } from "react";
import FastCustomList from "../controls/FastCustomList";
import { IDEContext } from "../IDEContext";
import { withDialog } from "../dialogs/index";

class CategoryList extends Component {
	static contextType = IDEContext;

	constructor(props) {
		super(props);
		this.all = "All selectors";
	}

	categorySelected = (category) => {
		const selected = category === this.all ? null : category;
		if (this.props.onSelect) {
			this.props.onSelect(selected);
		}
	};

	addCategory = async () => {
		try {
			const category = await this.props.dialog.prompt({
				title: "New category",
			});
			if (category && this.props.onAdd) {
				this.props.onAdd(category);
			}
		} catch (error) {}
	};

	renameCategory = async (category) => {
		if (!category) {
			return;
		}
		try {
			const newName = await this.props.dialog.prompt({
				title: "Rename category",
				defaultValue: category,
			});
			await this.context.api.renameCategory(
				this.props.class.name,
				category,
				newName
			);
			if (this.props.onRename) {
				this.props.onRename(category, newName);
			}
		} catch (error) {
			this.context.reportError(error);
		}
	};

	removeCategory = async (category) => {
		if (!category) {
			return;
		}
		try {
			await this.context.api.removeCategory(this.props.class.name, category);
			if (this.props.onRemove) {
				this.props.onRemove(category);
			}
		} catch (error) {
			this.context.reportError(error);
		}
	};

	menuOptions() {
		return [
			{ label: "Add", action: this.addCategory },
			{ label: "Rename", action: this.renameCategory },
			{ label: "Remove", action: this.removeCategory },
		];
	}

	render() {
		let categories = this.props.categories;
		if (categories) {
			categories = [...categories];
			categories.unshift(this.all);
		}
		return (
			<FastCustomList
				items={categories}
				itemDivider={(item) => item === this.all}
				labelStyle={(item) => (item === this.all ? "italic" : "normal")}
				labelSize={(item) => (item === this.all ? "small" : "normal")}
				selectedItem={this.props.selected}
				onSelect={this.categorySelected}
				menuOptions={this.menuOptions()}
			/>
		);
	}
}

export default withDialog()(CategoryList);
