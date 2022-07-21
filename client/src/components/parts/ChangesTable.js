import React, { Component } from "react";
import CustomTable from "../controls/CustomTable";
import { IDEContext } from "../IDEContext";

class ChangesTable extends Component {
	static contextType = IDEContext;

	constructor(props) {
		super(props);
		this.state = {
			selectedChange: null,
		};
	}

	changeSelected = (change) => {
		this.setState({ selectedChange: change });
		if (this.props.onSelect) {
			this.props.onSelect(change);
		}
	};

	browseClass = (change) => {
		if (change) {
			this.context.browseClass(change.class);
		}
	};

	menuOptions() {
		return [{ label: "Browse", action: this.browseClass }];
	}

	render() {
		const styles = this.props.styles;
		const rows = this.props.changes;
		const columns = [
			{ field: "type", label: "Type", minWidth: 150, align: "left" },
			{ field: "label", label: "Target", minWidth: 250, align: "left" },
			{ field: "package", label: "Package", minWidth: 150, align: "left" },
			{ field: "author", label: "Author", minWidth: 150, align: "center" },
			{
				field: "timestamp",
				label: "Timestamp",
				minWidth: 200,
				align: "left",
				formatter: (ts) => {
					return ts ? ts.toLocaleString("en-US") : "";
				},
			},
		];
		return (
			<CustomTable
				style={{ height: "100%" }}
				styles={styles}
				columns={columns}
				rows={rows}
				onSelect={this.changeSelected}
				menuOptions={this.menuOptions()}
			/>
		);
	}
}

export default ChangesTable;
