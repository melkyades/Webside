import React, { Component } from "react";
import {
	Grid,
	Paper,
	Box,
	Button,
	TextField,
	Typography,
} from "@material-ui/core";
import { IDEContext } from "../IDEContext";
import ChangesTable from "../parts/ChangesTable";
import API from "../API";

class CodeMigrator extends Component {
	static contextType = IDEContext;

	constructor(props) {
		super(props);
		const packages = this.props.package ? [this.props.package] : [];
		const classes = this.props.class ? [this.props.class] : [];
		const methods = this.props.method ? [this.props.method] : [];
		var sourceLabel = this.props.package || this.props.class || "";
		if (this.props.method) {
			sourceLabel = this.props.method.class + ">>" + this.props.method.selector;
		}
		this.state = {
			sources: { packages: packages, classes: classes, methods: methods },
			sourceLabel: sourceLabel,
			targetURL: "",
			changes: [],
			generating: false,
			migrating: false,
			selectedChange: null,
		};
	}

	generateChanges = async () => {
		const sources = this.state.sources;
		var change;
		const changes = [];
		this.setState({ changes: [], generating: true });
		await Promise.all(
			sources.packages.map(async (name) => {
				const pack = await this.context.api.getPackage(name);
				await Promise.all(
					pack.classes.map(async (classname) => {
						const species = await this.context.api.getClass(classname);
						const chs = await this.classChanges(species);
						changes.push(...chs);
					})
				);
			})
		);
		await Promise.all(
			sources.classes.map(async (name) => {
				const species = await this.context.api.getClass(name);
				const chs = await this.classChanges(species);
				changes.push(...chs);
			})
		);
		changes.push(...this.methodChanges(sources.methods));
		this.setState({ changes: changes, generating: false });
	};

	classChanges = async (species) => {
		const changes = [];
		const change = {
			type: "AddClass",
			author: this.context.api.author,
			class: species.name,
			label: species.name,
			package: species.package,
			definition: species.definition,
		};
		changes.push(change);
		const methods = await this.context.api.getMethods(species.name, true);
		const chs = this.methodChanges(methods);
		changes.push(...chs);
		return changes;
	};

	methodChanges = (methods) => {
		const changes = [];
		methods.forEach((m) => {
			const change = {
				type: "AddMethod",
				author: this.context.api.author,
				class: m.class,
				label: m.class + ">>" + m.selector,
				package: m.package,
				sourceCode: m.source,
			};
			changes.push(change);
		});
		return changes;
	};

	applyChanges = async () => {
		const api = new API(
			this.state.targetURL,
			this.context.api.author,
			this.reportError,
			this.reportChange
		);
		await Promise.all(
			this.state.changes.map(async (change) => {
				try {
					await api.postChange(change);
					change.color = "#28a745";
				} catch (error) {
					change.error = error.data;
					change.color = "#dc3545";
				}
			})
		);
		this.setState({ changes: this.state.changes });
	};

	render() {
		const {
			targetURL,
			changes,
			selectedChange,
			generating,
			migrating,
			sourceLabel,
		} = this.state;
		const error =
			selectedChange && selectedChange.error
				? selectedChange.error.description
				: null;
		return (
			<Grid container spacing={1}>
				<Grid item xs={12} md={12} lg={12}>
					<Typography variant="h6" color="primary">
						Migrate: {sourceLabel}
					</Typography>
				</Grid>
				<Grid item xs={12} md={12} lg={12}>
					<TextField
						value={targetURL}
						onChange={(event) =>
							this.setState({ targetURL: event.target.value })
						}
						placeholder="Target URL ..."
						name="text"
						variant="outlined"
						fullWidth
						margin="dense"
						autoFocus
						type="text"
						disabled={migrating || generating}
					/>
				</Grid>
				<Grid item xs={12} md={12} lg={12}>
					<Paper variant="outlined" style={{ height: 400 }}>
						<ChangesTable
							styles={this.props.styles}
							style={{ height: "100%" }}
							changes={changes}
							onSelect={(change) => this.setState({ selectedChange: change })}
						/>
					</Paper>
				</Grid>
				<Grid item xs={12} md={12} lg={12}>
					<Box
						display="flex"
						flexWrap="nowrap"
						alignItems="right"
						justifyContent="right"
					>
						<Button
							variant="outlined"
							disabled={generating || migrating}
							onClick={this.generateChanges}
						>
							Generate changes
						</Button>
						<Button
							variant="outlined"
							disabled={
								generating || migrating || changes.length === 0 || !targetURL
							}
							onClick={this.applyChanges}
						>
							Apply changes
						</Button>
					</Box>
				</Grid>
				{error && (
					<Grid item xs={12} md={12} lg={12}>
						<Paper variant="outlined" style={{ minHeight: 200 }}>
							{error}
						</Paper>
					</Grid>
				)}
			</Grid>
		);
	}
}

export default CodeMigrator;
