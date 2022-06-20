import React, { Component } from "react";
import CustomTree from "../controls/CustomTree";
import { IDEContext } from "../IDEContext";

class ObjectTree extends Component {
	static contextType = IDEContext;

	browseClass = (object) => {
		if (object) {
			this.context.browseClass(object.class);
		}
	};

	inspect = (object) => {
		if (object) {
			this.context.inspectObject(object);
		}
	};

	browseReferences = (object) => {};

	menuOptions() {
		return [
			{ label: "Browse class", action: this.browseClass },
			// { label: "Inspect", action: this.inspect },
		];
	}

	objectPath(object) {
		let path = "";
		object.path.forEach((s) => (path = path + "/" + s));
		return path;
	}

	render() {
		const roots = this.props.roots;
		return (
			<CustomTree
				items={roots ? roots : []}
				itemLabel="slot"
				itemId={(o) => this.objectPath(o)}
				children={"slots"}
				onExpand={this.props.onExpand}
				onSelect={this.props.onSelect}
				selectedItem={this.props.selected}
				menuOptions={this.menuOptions()}
			/>
		);
	}
}
export default ObjectTree;
