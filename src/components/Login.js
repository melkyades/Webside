import React, { Component } from "react";
import {
	Button,
	TextField,
	Grid,
	FormHelperText,
	Typography,
	Link,
	Box,
} from "@mui/material";
import axios from "axios";
import { withNavigation } from "./withNavigation";

class Login extends Component {
	constructor(props) {
		super(props);
		this.state = {
			backend: "",
			developer: "",
			connecting: false,
			error: null,
			recentConnections: [],
		};
	}

	async componentDidMount() {
		await this.initializeRecentConnections();
	}

	backendChanged(uri) {
		this.setState({ backend: uri, error: null });
	}

	developerChanged(developer) {
		this.setState({ developer: developer });
	}

	connectClicked = async (event) => {
		event.preventDefault();
		const { backend, developer } = this.state;
		if (backend && backend !== "" && developer && developer !== "") {
			this.connect(backend, developer);
		} else {
			this.setState({
				error: "You must complete the fields",
				connecting: false,
			});
		}
	};

	async connect(backend, developer) {
		try {
			this.setState({ connecting: true });
			await axios.get(backend + "/dialect");
			this.props.navigate(
				"/ide?backend=" + backend + "&developer=" + developer
			);
		} catch (error) {
			this.setState({
				error: "Cannot connect to " + backend,
				connecting: false,
			});
		}
	}

	async initializeRecentConnections() {
		const connections = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key.startsWith("webside-settings")) {
				const data = localStorage.getItem(key);
				const connection = JSON.parse(data).connection;
				connections.push(connection);
			}
		}
		this.setState({ recentConnections: connections }, this.fetchLogos);
	}

	fetchLogos() {
		const connections = this.state.recentConnections;
		connections.forEach(async (c) => {
			try {
				let logo = await axios.get(c.backend + "/logo");
				c.logo = logo.data;
				this.setState({ recentConnections: connections });
			} catch (error) {}
		});
	}

	render() {
		const { backend, developer, error, connecting, recentConnections } =
			this.state;
		const buttonLabel = connecting ? "Connecting" : "Connect";
		return (
			<div
				sx={{
					display: "flex",
				}}
			>
				<Grid
					container
					direction="column"
					justifyContent="center"
					alignContent="center"
					alignItems="center"
					spacing={0}
					style={{ minHeight: "80vh" }}
				>
					<Grid item>
						<img
							alt="Webside"
							src={require("../resources/webSide.png")}
							width={200}
							height={100}
						/>
					</Grid>
					<Grid item>
						<form onSubmit={this.connectClicked}>
							<Grid
								container
								direction="column"
								spacing={1}
								alignItems="flex-end"
							>
								<Grid item>
									<TextField
										size="small"
										id="backend"
										label="Target Smalltalk URL"
										type="url"
										placeholder="URL"
										margin="dense"
										fullWidth
										name="backend"
										variant="outlined"
										value={backend || ""}
										onChange={(event) =>
											this.backendChanged(
												event.target.value
											)
										}
										required
										autoFocus
										disabled={connecting}
									/>
								</Grid>
								<Grid item>
									<TextField
										size="small"
										id="developer"
										label="Developer"
										type="text"
										placeholder="developer"
										margin="dense"
										fullWidth
										name="developer"
										variant="outlined"
										value={developer || ""}
										onChange={(event) =>
											this.developerChanged(
												event.target.value
											)
										}
										required
										disabled={connecting}
									/>
								</Grid>
								<Grid item>
									<Button
										variant="outlined"
										sx={{ textTransform: "none" }}
										type="submit"
										disabled={connecting}
									>
										{buttonLabel}
									</Button>
								</Grid>
								{error && (
									<Grid item>
										<FormHelperText>{error}</FormHelperText>
									</Grid>
								)}
								{recentConnections.length > 0 && (
									<Grid item>
										<Box
											display="flex"
											flexDirection="column"
											alignContent="center"
											justifyContent="center"
										>
											<Typography variant="subtitle1">
												Recent connections:
											</Typography>
											{recentConnections.map((c) => (
												<Box
													p={1}
													key={
														c.backend + c.developer
													}
													display="flex"
													flexDirection="row"
												>
													{c.logo && (
														<img
															src={
																"data:image/png;base64," +
																c.logo
															}
															width={20}
															height={20}
															alt={c.backend}
														/>
													)}
													<Link
														ml={1}
														key={c.backend}
														color="inherit"
														underline="hover"
														variant="body2"
														href="#"
														onClick={(event) => {
															event.preventDefault();
															this.connect(
																c.backend,
																c.developer
															);
														}}
													>
														{c.backend +
															" (" +
															c.developer +
															")"}
													</Link>
												</Box>
											))}
										</Box>
									</Grid>
								)}
							</Grid>
						</form>
					</Grid>
				</Grid>
			</div>
		);
	}
}

export default withNavigation(Login);
