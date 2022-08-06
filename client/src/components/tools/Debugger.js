import React, { PureComponent } from "react";
import {
	Grid,
	Paper,
	IconButton,
	Tooltip,
	Typography,
} from "@material-ui/core";
import clsx from "clsx";
import { Icon } from "@iconify/react";
import RestartIcon from "@iconify/icons-mdi/replay";
import StepIntoIcon from "@iconify/icons-mdi/debug-step-into";
import StepOverIcon from "@iconify/icons-mdi/debug-step-over";
import StepThroughIcon from "../icons/StepThroughIcon";
import ResumeIcon from "@iconify/icons-mdi/play";
import TerminateIcon from "@iconify/icons-mdi/stop";
import { IDEContext } from "../IDEContext";
import FrameList from "../parts/FrameList";
import BindingTable from "../parts/BindingTable";
import CodeBrowser from "../parts/CodeBrowser";

class Debugger extends PureComponent {
	static contextType = IDEContext;

	constructor(props) {
		super(props);
		this.state = {
			frames: [],
			selectedFrame: null,
		};
	}

	componentDidMount() {
		this.context.messageChannel.onEvent("onMessageReceived", (message) => {
			if (message.type === "debuggerEvent") {
				//this.updateFrames();
			}
		});
		this.updateFrames();
	}

	async updateFrames() {
		try {
			const frames = await this.context.api.getDebuggerFrames(this.props.id);
			var frame;
			if (frames.length > 0) {
				frame = frames[0];
				await this.updateFrame(frame);
			}
			this.setState({
				frames: frames,
				selectedFrame: frame,
			});
		} catch (error) {
			this.context.reportError(error);
		}
	}

	frameSelected = async (frame) => {
		await this.updateFrame(frame);
		const bindings = frame ? frame.bindings || [] : [];
		const binding = bindings.find((b) => b.name === "self");
		this.setState({ selectedFrame: frame });
	};

	updateFrame = async (frame) => {
		try {
			if (!frame.method) {
				const info = await this.context.api.getDebuggerFrame(
					this.props.id,
					frame.index
				);
				frame.method = info.method;
				frame.class = info.class;
				frame.interval = info.interval;
			}
			if (!frame.bindings) {
				const bindings = await this.context.api.getFrameBindings(
					this.props.id,
					frame.index
				);
				frame.bindings = bindings;
			}
		} catch (error) {
			this.context.reportError(error);
		}
	};

	stepIntoClicked = async () => {
		try {
			await this.context.api.stepIntoDebugger(
				this.props.id,
				this.state.selectedFrame.index
			);
			this.notifyEvent("stepInto");
			this.updateFrames();
		} catch (error) {
			this.context.reportError(error);
		}
	};

	stepOverClicked = async () => {
		try {
			await this.context.api.stepOverDebugger(
				this.props.id,
				this.state.selectedFrame.index
			);
			this.notifyEvent("stepOver");
			this.updateFrames();
		} catch (error) {
			this.context.reportError(error);
		}
	};

	stepThroughClicked = async () => {
		try {
			await this.context.api.stepThroughDebugger(
				this.props.id,
				this.state.selectedFrame.index
			);
			this.notifyEvent("stepThrough");
			this.updateFrames();
		} catch (error) {
			this.context.reportError(error);
		}
	};

	restartClicked = async () => {
		try {
			await this.context.api.restartDebugger(
				this.props.id,
				this.state.selectedFrame.index
			);
			this.notifyEvent("restart");
			this.updateFrames();
		} catch (error) {
			this.context.reportError(error);
		}
	};

	resumeClicked = async () => {
		try {
			await this.context.api.resumeDebugger(this.props.id);
			this.context.closeDebugger(this.props.id);
		} catch (error) {
			this.context.reportError(error);
		}
	};

	terminateClicked = async () => {
		try {
			await this.context.api.terminateDebugger(this.props.id);
			this.context.closeDebugger(this.props.id);
		} catch (error) {
			this.context.reportError(error);
		}
	};

	methodCompiled = async (method) => {
		const selected = this.state.selectedFrame.method;
		if (method.selector !== selected.selector) {
			return;
		}
		try {
			await this.context.api.restartDebugger(
				this.props.id,
				this.state.selectedFrame.index,
				true
			);
			this.updateFrames();
		} catch (error) {
			this.context.reportError(error);
		}
	};

	notifyEvent(event) {
		this.context.messageChannel.sendDebuggerEvent(event, this.props.id);
	}

	evaluationContext() {
		const frame = this.state.selectedFrame;
		return frame
			? {
					debugger: this.props.id,
					frame: frame.index,
			  }
			: {};
	}

	render() {
		const { frames, selectedFrame } = this.state;
		const styles = this.props.styles;
		const fixedHeightPaper = clsx(styles.paper, styles.fixedHeight);
		return (
			<Grid container spacing={1}>
				<Grid item xs={12} md={12} lg={12}>
					<Grid
						container
						spacing={1}
						direction="row"
						alignItems="center"
						justify="center"
					>
						<Grid item xs={4} md={4} lg={4}>
							<Tooltip title="Step into" placement="top">
								<IconButton
									style={{ color: "#2ba5de" }}
									onClick={this.stepIntoClicked}
									size="medium"
								>
									<Icon icon={StepIntoIcon} />
								</IconButton>
							</Tooltip>
							<Tooltip title="Step over" placement="top">
								<IconButton
									style={{ color: "#2ba5de" }}
									onClick={this.stepOverClicked}
									size="medium"
								>
									<Icon icon={StepOverIcon} />
								</IconButton>
							</Tooltip>
							<Tooltip title="Step through" placement="top">
								<IconButton
									style={{ color: "#2ba5de" }}
									onClick={this.stepThroughClicked}
									size="medium"
								>
									<StepThroughIcon />
								</IconButton>
							</Tooltip>
							<Tooltip title="Restart" placement="top">
								<IconButton
									style={{ color: "#2ba5de" }}
									onClick={this.restartClicked}
									size="medium"
								>
									<Icon icon={RestartIcon} />
								</IconButton>
							</Tooltip>
							<Tooltip title="Resume" placement="top">
								<IconButton
									style={{ color: "#3bba5d" }}
									onClick={this.resumeClicked}
									size="medium"
								>
									<Icon icon={ResumeIcon} />
								</IconButton>
							</Tooltip>
							<Tooltip title="Terminate" placement="top">
								<IconButton
									style={{ color: "#ba4343" }}
									onClick={this.terminateClicked}
									size="medium"
								>
									<Icon icon={TerminateIcon} />
								</IconButton>
							</Tooltip>
						</Grid>
						<Grid item xs={8} md={8} lg={8}>
							<Typography variant="h6">{this.props.title || ""}</Typography>
						</Grid>
					</Grid>
				</Grid>
				<Grid item xs={12} md={12} lg={12}>
					<Grid container spacing={1}>
						<Grid item xs={12} md={8} lg={8}>
							<Paper className={fixedHeightPaper} variant="outlined">
								<FrameList
									frames={frames}
									selected={selectedFrame}
									onSelect={this.frameSelected}
								/>
							</Paper>
						</Grid>
						<Grid item xs={12} md={4} lg={4}>
							<BindingTable
								styles={styles}
								id={this.props.id}
								frame={selectedFrame}
							/>
						</Grid>
					</Grid>
				</Grid>
				<Grid item xs={12} md={12} lg={12}>
					<CodeBrowser
						context={this.evaluationContext()}
						styles={styles}
						class={selectedFrame ? selectedFrame.class : null}
						method={selectedFrame ? selectedFrame.method : null}
						selectedInterval={selectedFrame ? selectedFrame.interval : null}
						onCompileMethod={this.methodCompiled}
						onDefineClass={this.classDefined}
						onCommentClass={this.classCommented}
					/>
				</Grid>
			</Grid>
		);
	}
}

export default Debugger;
