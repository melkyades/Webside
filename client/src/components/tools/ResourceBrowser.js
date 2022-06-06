import React, { Component } from "react";
import { Grid, Paper, List, ListItem, ListItemText } from "@material-ui/core";
import CustomTable from "../controls/CustomTable";
import Inspector from "./Inspector";
import { IDEContext } from "../IDEContext";
import InspectorIcon from "../icons/InspectorIcon";
import WorkspaceIcon from "../icons/WorkspaceIcon";
import DebuggerIcon from "../icons/DebuggerIcon";
import TestRunnerIcon from "../icons/TestRunnerIcon";
import MemoryIcon from "../icons/MemoryIcon";
import clsx from "clsx";
import MemoryStats from "./MemoryStats";

class ResourceBrowser extends Component {
	static contextType = IDEContext;
	constructor(props) {
		super(props);
		this.state = {
			selectedType: null,
			resources: [],
			selectedResource: null,
		};
	}

	typeSelected = async (type) => {
		var resources;
		try {
			switch (type) {
				case "Objects":
					resources = await this.context.api.getObjects();
					break;
				case "Workspaces":
					resources = await this.context.api.getWorkspaces();
					break;
				case "Debuggers":
					resources = await this.context.api.getDebuggers();
					break;
				case "Test Runs":
					resources = await this.context.api.getTestRuns();
					break;
				default:
			}
		} catch (error) {
			this.context.reportError(error);
		}
		this.setState({ selectedType: type, resources: resources });
	};

	resourceIcon(type) {
		var icon;
		switch (type) {
			case "Objects":
				icon = <InspectorIcon />;
				break;
			case "Workspaces":
				icon = <WorkspaceIcon />;
				break;
			case "Debuggers":
				icon = <DebuggerIcon />;
				break;
			case "Test Runs":
				icon = <TestRunnerIcon />;
				break;
			case "Memory":
				icon = <MemoryIcon />;
				break;
			default:
				icon = <InspectorIcon />;
		}
		return icon;
	}

	resourceSelected = (resource) => {
		this.setState({ selectedResource: resource });
	};

	inspectObject = (object) => {
		if (object) {
			this.context.inspectObject(object);
		}
	};

	unpinObject = async (object) => {
		try {
			await this.context.api.unpinObject(object.id);
			this.setState({
				resources: this.state.resources.filter((r) => r.id !== object.id),
			});
		} catch (error) {
			this.context.reportError(error);
		}
	};

	objectOptions() {
		return [
			{ label: "Inspect", action: this.inspectObject },
			{ label: "Unpin", action: this.unpinObject },
		];
	}

	openWorkspace = (workspace) => {
		if (workspace) {
			this.context.openWorkspace(workspace.id);
		}
	};

	workspaceOptions() {
		return [{ label: "Open", action: this.openWorkspace }];
	}

	openDebugger = (d) => {
		if (d) {
			this.context.openDebugger(d.id);
		}
	};

	openTestRun = (t) => {
		if (t) {
			this.context.openTestRunner(t.id, t.name);
		}
	};

	debuggerOptions() {
		return [{ label: "Open", action: this.openDebugger }];
	}

	testRunOptions() {
		return [{ label: "Open", action: this.openTestRun }];
	}

	menuOptions() {
		var options;
		switch (this.state.selectedType) {
			case "Objects":
				options = this.objectOptions();
				break;
			case "Workspaces":
				options = this.workspaceOptions();
				break;
			case "Debuggers":
				options = this.debuggerOptions();
				break;
			case "Test Runs":
				options = this.testRunOptions();
				break;
			default:
		}
		return options;
	}

	objectColumns() {
		return [
			{ field: "id", label: "ID", align: "left" },
			{ field: "class", label: "Class", align: "left", minWidth: 200 },
			{
				field: "printString",
				label: "Print String",
				minWidth: 200,
				align: "left",
			},
		];
	}

	workspaceColumns() {
		return [
			{ field: "id", label: "ID", align: "left" },
			{ field: "owner", label: "Owner", align: "center" },
		];
	}

	debuggerColumns() {
		return [
			{ field: "id", label: "ID", align: "left" },
			{ field: "creator", label: "Creator", align: "center" },
			{
				field: "description",
				label: "Description",
				align: "left",
				minWidth: 200,
			},
		];
	}

	testRunColumns() {
		return [
			{ field: "id", label: "ID", align: "left" },
			{ field: "name", label: "Name", align: "left" },
			{ field: "total", label: "Tests", align: "right" },
			{ field: "running", label: "Running", align: "center" },
		];
	}

	resourceColumns(type) {
		var columns;
		switch (type) {
			case "Objects":
				columns = this.objectColumns();
				break;
			case "Workspaces":
				columns = this.workspaceColumns();
				break;
			case "Debuggers":
				columns = this.debuggerColumns();
				break;
			case "Test Runs":
				columns = this.testRunColumns();
				break;
			default:
		}
		return columns;
	}

	render() {
		const { selectedType, resources, selectedResource } = this.state;
		const rows = resources;
		const columns = this.resourceColumns(selectedType);
		const styles = this.props.styles;
		const ow = selectedResource && selectedType === "object" ? 6 : 10;
		const fixedHeightPaper = clsx(styles.paper, styles.fixedHeight);
		return (
			<Grid container spacing={1}>
				<Grid item xs={2} md={2} lg={2}>
					<List>
						{["Objects", "Workspaces", "Debuggers", "Test Runs", "Memory"].map(
							(type) => (
								<ListItem
									button
									key={type}
									selected={type === selectedType}
									onClick={(event) => this.typeSelected(type)}
								>
									{this.resourceIcon(type)}
									<ListItemText primary={type} />
								</ListItem>
							)
						)}
					</List>
				</Grid>
				<Grid item xs={ow} md={ow} lg={ow}>
					{selectedType && selectedType !== "Memory" && (
						<Paper className={fixedHeightPaper} variant="outlined">
							<CustomTable
								styles={styles}
								columns={columns}
								rows={rows}
								onSelect={this.resourceSelected}
								menuOptions={this.menuOptions()}
							/>
						</Paper>
					)}
					{selectedType === "Memory" && <MemoryStats />}
				</Grid>
				{selectedResource && selectedType === "object" && (
					<Grid item xs={4} md={4} lg={4}>
						<Paper variant="outlined">
							<Inspector
								styles={styles}
								root={selectedResource}
								showWorkspace={false}
							/>
						</Paper>
					</Grid>
				)}
			</Grid>
		);
	}
}

export default ResourceBrowser;
