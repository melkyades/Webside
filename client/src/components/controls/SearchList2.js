import React from "react";
import Autosuggest from "react-autosuggest";
import match from "autosuggest-highlight/match";
import parse from "autosuggest-highlight/parse";
import { TextField, MenuItem, Box, Typography } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";

const styles = (theme) => ({
	container: {
		flexGrow: 1,
		position: "relative",
		//height: 250,
	},
	suggestion: {
		display: "block",
	},
	suggestionsList: {
		margin: 0,
		padding: 0,
		listStyleType: "none",
	},
});

const suggestionLimit = 5;

class SearchList2 extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			value: props.value || "",
			suggestions: [],
		};
	}

	filterSuggestions(value) {
		const inputValue = value.trim().toLowerCase();
		const inputLength = inputValue.length;
		let count = 0;
		return inputLength === 0 || !this.props.options
			? []
			: this.props.options.filter((o) => {
					const keep =
						count < suggestionLimit &&
						o.toLowerCase().slice(0, inputLength) === inputValue;
					if (keep) {
						count += 1;
					}
					return keep;
			  });
	}

	suggestionsFetchRequested = ({ value }) => {
		this.setState({ suggestions: this.filterSuggestions(value) });
	};

	suggestionsClearRequested = () => {
		this.setState({ suggestions: [] });
	};

	inputChanged = (event, { newValue }) => {
		//const handler = this.props.onChange;
		this.setState({ value: newValue });
	};

	valueChanged = (value) => {
		const handler = this.props.onChange;
		if (handler) {
			handler(value);
		}
	};

	renderInput = (inputProps) => {
		const { ref, ...other } = inputProps;
		return (
			<TextField
				fullWidth
				size="small"
				variant="outlined"
				InputProps={{ inputRef: ref, ...other }}
				onKeyPress={(event) => {
					if (event.key === "Enter" && this.state.suggestions.length > 0) {
						event.preventDefault();
						this.valueChanged(this.state.suggestions[0]);
					}
				}}
			/>
		);
	};

	renderSuggestionsContainer = (options) => {
		const { containerProps, children } = options;
		return (
			<Box {...containerProps} zIndex="tooltip">
				{children}
			</Box>
		);
	};

	renderSuggestion = (suggestion, { query, isHighlighted }) => {
		const matches = match(suggestion, query);
		const parts = parse(suggestion, matches);
		return (
			<MenuItem
				selected={isHighlighted}
				component="div"
				style={{ listStyleType: "none" }}
			>
				<Typography component="div">
					{parts.map((part, index) => {
						return part.highlight ? (
							<Box component="strong" key={index}>
								{part.text}
							</Box>
						) : (
							<Box component="span" key={index}>
								{part.text}
							</Box>
						);
					})}
				</Typography>
			</MenuItem>
		);
	};

	render() {
		const { classes } = this.props;
		return (
			<Autosuggest
				theme={{
					container: classes.container,
					suggestionsList: classes.suggestionsList,
					//suggestion: classes.suggestion,
				}}
				renderInputComponent={this.renderInput}
				suggestions={this.state.suggestions}
				onSuggestionsFetchRequested={this.suggestionsFetchRequested}
				onSuggestionsClearRequested={this.suggestionsClearRequested}
				renderSuggestionsContainer={this.renderSuggestionsContainer}
				getSuggestionValue={(s) => s}
				renderSuggestion={this.renderSuggestion}
				onSuggestionSelected={(event, suggestion) =>
					this.valueChanged(suggestion.suggestion)
				}
				inputProps={{
					placeholder: "Search...",
					value: this.state.value,
					onChange: this.inputChanged,
				}}
			/>
		);
	}
}

export default withStyles(styles)(SearchList2);
