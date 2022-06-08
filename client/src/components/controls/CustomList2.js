import React, { Component } from "react";
import {
	ListItem,
	ListItemText,
	ListItemIcon,
	ListItemButton,
	Box,
	TextField,
} from "@material-ui/core";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import PopupMenu from "./PopupMenu";
import Scrollable from "./Scrollable";
import Scrollbar from "react-scrollbars-custom";

class CustomList2 extends Component {
	constructor(props) {
		super(props);
		this.state = {
			menuOpen: false,
			menuPosition: { x: null, y: null },
			filterEnabled: false,
			filterText: "",
		};
	}

	itemDoubleClicked = (item) => {
		const handler = this.props.onDoubleClick;
		if (handler) {
			handler(item);
		}
	};

	itemSelected = (item) => {
		const handler = this.props.onSelect;
		if (handler) {
			handler(item);
		}
	};

	getItemDivider = (item) => {
		const getter = this.props.itemDivider;
		if (!getter) {
			return false;
		}
		if (typeof getter == "string") {
			return item[getter];
		}
		return getter(item);
	};

	getItemLabel = (item) => {
		const getter = this.props.itemLabel;
		if (!getter) {
			return item;
		}
		if (typeof getter == "string") {
			return item[getter];
		}
		return getter(item);
	};

	getItemIcon = (item) => {
		const getter = this.props.itemIcon;
		if (!getter) {
			return null;
		}
		if (typeof getter == "function") {
			return getter(item);
		}
		return null;
	};

	openMenu = (event) => {
		event.preventDefault();
		this.setState({
			menuOpen: true,
			menuPosition: { x: event.clientX - 2, y: event.clientY - 4 },
		});
	};

	closeMenu = () => {
		this.setState({ menuOpen: false });
	};

	menuOptionClicked = (option) => {
		const selected = this.props.selectedItem;
		if (option.action) {
			option.action(selected);
		}
	};

	moveUp = () => {
		const items = this.props.items;
		const index = items.indexOf(this.props.selectedItem);
		if (index > 0) {
			this.itemSelected(items[index - 1]);
		}
	};

	moveDown = () => {
		const items = this.props.items;
		const index = items.indexOf(this.props.selectedItem);
		if (index < items.length - 1) {
			this.itemSelected(items[index + 1]);
		}
	};

	clearFilter() {
		this.setState({ filterEnabled: false, filterText: "" });
	}

	keyDown = (event) => {
		event.preventDefault();
		const key = event.key;
		if (key === "ArrowUp") {
			this.clearFilter();
			this.moveUp();
		}
		if (key === "ArrowDown") {
			this.clearFilter();
			this.moveDown();
		}
		if (key === "Escape") {
			this.clearFilter();
		}
		if (key.length === 1 && /[a-zA-Z0-9-_ ]/.test(key)) {
			this.setState({ filterEnabled: true, filterText: key });
		} else {
			return true;
		}
	};

	renderRow = ({ index, style }) => {
		const item = this.props.items[index];
		const label = this.getItemLabel(item);
		const icon = this.getItemIcon(item);
		const divider = this.getItemDivider(item);
		const selected = this.props.selectedItem === item;
		return (
			<div style={style}>
				<ListItem
					disableGutters={divider}
					style={{
						paddingTop: 0,
						paddingBottom: 0,
						paddingLeft: 0,
						paddingRight: 0,
					}}
					button
					divider={divider}
					key={"item" + index}
					selected={selected}
					onClick={(event) => this.itemSelected(item)}
					onDoubleClick={(event) => this.itemDoubleClicked(item)}
					onContextMenu={this.openMenu}
				>
					<Box p={0} style={{ minWidth: 10 }}>
						<ListItemIcon style={{ minWidth: 0 }}>{icon}</ListItemIcon>
					</Box>
					<ListItemText
						primary={
							<Box
								fontWeight={selected ? "fontWeightMedium" : "fontWeightRegular"}
							>
								{label}
							</Box>
						}
					/>
				</ListItem>
			</div>
		);
	};

	render() {
		return (
			<AutoSizer>
				{({ height, width }) => (
					<List
						height={height}
						width={width}
						itemSize={30}
						itemCount={this.props.items.length}
						overscanCount={5}
						onKeyDown={this.keyDown}
						style={{ paddingTop: 0, paddingBottom: 0 }}
						outerElementType={Scrollbar}
					>
						{this.renderRow}
					</List>
				)}
			</AutoSizer>
		);
	}
}

export default CustomList2;
