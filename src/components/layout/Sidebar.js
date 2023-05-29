import React, { Component } from "react";
import {
	List,
	ListItemIcon,
	ListItemButton,
	ListItemText,
	Divider,
	IconButton,
	Badge,
	Tooltip,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import TranscriptIcon from "../icons/TranscriptIcon";
import SearchIcon from "@mui/icons-material/Search";
import ResourcesIcon from "@mui/icons-material/PinDropRounded";
import ChangesBrowserIcon from "../icons/ChangesBrowserIcon";
import PeopleIcon from "@mui/icons-material/People";
import SaveImageIcon from "@mui/icons-material/CameraAlt";
import { withDialog } from "../dialogs/index";
import DrawerHeader from "./DrawerHeader";
import StyledDrawer from "./StyledDrawer";

class Sidebar extends Component {
	render() {
		const {
			expanded,
			onCollapse,
			onSaveImageClicked,
			onTranscriptClicked,
			unreadErrorsCount,
			onSearchClicked,
			changesCount,
			onResourcesClicked,
			onChangesClicked,
			onPeersClicked,
			unreadMessages,
		} = this.props;
		return (
			<StyledDrawer variant="permanent" open={expanded}>
				<DrawerHeader>
					<IconButton onClick={onCollapse}>
						<ChevronLeftIcon />
					</IconButton>
				</DrawerHeader>
				<Divider />
				<List>
					<ListItemButton onClick={onSaveImageClicked}>
						<ListItemIcon>
							<Tooltip title="Save image" placement="top">
								<SaveImageIcon />
							</Tooltip>
						</ListItemIcon>
						<ListItemText primary="Save image" />
					</ListItemButton>
					<ListItemButton onClick={onTranscriptClicked}>
						<ListItemIcon>
							<Tooltip title="Transcript" placement="top">
								<Badge
									badgeContent={unreadErrorsCount}
									color="secondary"
								>
									<TranscriptIcon />
								</Badge>
							</Tooltip>
						</ListItemIcon>
						<ListItemText primary="Transcript" />
					</ListItemButton>
					<ListItemButton onClick={onSearchClicked}>
						<ListItemIcon>
							<Tooltip title="Search" placement="top">
								<SearchIcon />
							</Tooltip>
						</ListItemIcon>
						<ListItemText primary="Search" />
					</ListItemButton>
					<ListItemButton onClick={onChangesClicked}>
						<ListItemIcon>
							<Tooltip title="Last Changes" placement="top">
								<Badge
									badgeContent={changesCount}
									color="secondary"
								>
									<ChangesBrowserIcon />
								</Badge>
							</Tooltip>
						</ListItemIcon>
						<ListItemText primary="Changes" />
					</ListItemButton>
					<ListItemButton onClick={onResourcesClicked}>
						<Tooltip title="Resources" placement="top">
							<ListItemIcon>
								<ResourcesIcon />
							</ListItemIcon>
						</Tooltip>
						<ListItemText primary="Resources" />
					</ListItemButton>
					<ListItemButton onClick={onPeersClicked}>
						<ListItemIcon>
							<Tooltip title="Chat" placement="top">
								<Badge
									badgeContent={unreadMessages}
									color="secondary"
								>
									<PeopleIcon />
								</Badge>
							</Tooltip>
						</ListItemIcon>
						<ListItemText primary="Peers" />
					</ListItemButton>
				</List>
				<Divider />
			</StyledDrawer>
		);
	}
}

export default withDialog()(Sidebar);
