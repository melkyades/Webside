import React, { Component } from "react";
import { Grid, Paper, Box, TextField, IconButton } from "@material-ui/core";
import clsx from "clsx";
import CustomList from "../controls/CustomList";
import SendIcon from "@material-ui/icons/Send";

class Chat extends Component {
	constructor(props) {
		super(props);
		this.channel = this.props.channel;
		this.state = {
			selectedPeer: this.props.initialPeer,
			text: "",
		};
	}

	componentDidMount() {
		this.channel.onEvent("onPeersUpdated", this.peersUpdated, this);
		this.channel.onEvent("onMessageReceived", this.messageReceived, this);
	}

	componentWillUnmount() {
		this.channel.removeHandlers(this);
	}

	peersUpdated = (peers) => {
		const selected = this.state.selectedPeer
			? peers.find((c) => c.id === this.state.selectedPeer.id)
			: null;
		this.setState({ selectedPeer: selected });
	};

	messageReceived = (message) => {
		this.setState(this.state);
	};

	sendMessage = () => {
		this.channel.sendText(this.state.text, this.state.selectedPeer);
		this.setState({ text: "" });
	};

	peerSelected = (peer) => {
		this.channel.markSeenMessagesFrom(peer);
		this.setState({ selectedPeer: peer });
	};

	peerLabel = (peer) => {
		const unseen = this.channel.unseenMessagesFrom(peer);
		let label = peer.username;
		if (unseen > 0) {
			label = label + " (" + unseen + ")";
		}
		return label;
	};

	render() {
		const { selectedPeer, text } = this.state;
		const messages = this.channel.messagesFrom(selectedPeer);
		const styles = this.props.styles;
		const fixedHeightPaper = clsx(styles.paper, styles.fixedHeight);
		return (
			<Grid container spacing={1}>
				<Grid item xs={4} md={4} lg={4}>
					<Paper className={fixedHeightPaper} variant="outlined">
						<CustomList
							itemLabel={this.peerLabel}
							items={this.channel.peers}
							selectedItem={selectedPeer}
							onSelect={this.peerSelected}
						/>
					</Paper>
				</Grid>
				<Grid item xs={8} md={8} lg={8}>
					<Grid container spacing={1}>
						<Grid item xs={12} md={12} lg={12}>
							<Paper
								className={fixedHeightPaper}
								variant="outlined"
							>
								<CustomList
									itemLabel={(m) =>
										m.from.username +
										" (" +
										new Date(m.date).toLocaleTimeString() +
										"): " +
										m.text
									}
									items={messages}
								/>
							</Paper>
						</Grid>
						<Grid item xs={11} md={11} lg={11}>
							<TextField
								disabled={!selectedPeer}
								value={text}
								onChange={(event) =>
									this.setState({ text: event.target.value })
								}
								placeholder="Send a message ..."
								name="text"
								variant="outlined"
								fullWidth
								margin="dense"
								autoFocus
								type="text"
								onKeyPress={(event) => {
									if (event.key === "Enter") {
										this.sendMessage();
									}
								}}
							/>
						</Grid>
						<Grid item xs={1} md={1} lg={1}>
							<Box display="flex" justifyContent="center">
								<IconButton
									onClick={this.sendMessage}
									disabled={!selectedPeer || text === ""}
								>
									<SendIcon size="small" />
								</IconButton>
							</Box>
						</Grid>
					</Grid>
				</Grid>
			</Grid>
		);
	}
}

export default Chat;
