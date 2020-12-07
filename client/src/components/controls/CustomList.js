import React, { Component } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box} from '@material-ui/core';
import PopupMenu from './PopupMenu';
import Scrollable from './Scrollable';

class CustomList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      menuOpen: false,
      menuPosition: {x: null, y: null},
      filterText: '',
    }
  }

  createItems = () => {
    if (!this.props.items) {return []};
    return (
      this.props.items.map((item, index) => {
        const label = this.getItemLabel(item);
        const icon = this.getItemIcon(index);
        const divider = this.getItemDivider(item);
        const selected = this.props.selectedItem === item;
        return (
          <ListItem
            disableGutters={divider}
            autoFocus={selected}
            style={{paddingTop: 0, paddingBottom: 0}}
            button
            divider={divider}
            key={"item" + index}
            selected={selected}
            onClick={event => this.itemSelected(item)}
            //onKeyDown={this.keyPressed}
            onContextMenu={this.openMenu}>
              {icon && <Box pr={1}>{icon}</Box>}
              <ListItemText primary={<Box fontWeight={selected? "fontWeightMedium" : "fontWeightRegular"}>{label}</Box>}/>
          </ListItem>
        )
      })
    )
  }

  itemSelected = (item) => {
    const handler = this.props.onSelect;
    if (handler) {handler(item)}
  }

  getItemDivider = (item) => {
    const getter = this.props.itemDivider;
    if (!getter) {return false}    
    if (typeof getter == "string")  {return item[getter]}
    return getter(item)
  }

  getItemLabel = (item) => {
    const getter = this.props.itemLabel;
    if (!getter) {return item}    
    if (typeof getter == "string")  {return item[getter]}
    return getter(item)
  }

  getItemIcon = (index) => {
    const icons = this.props.icons;
    if (icons && index < icons.length && icons[index]) {
      return (
        <ListItemIcon style={{minWidth: 0}}>
          {icons[index]}
        </ListItemIcon>
      )
    }
  }

  openMenu = (event) => {
    event.preventDefault();
    this.setState({menuOpen: true, menuPosition: {x: event.clientX - 2, y: event.clientY - 4}})
  }

  closeMenu = () => {
    this.setState({menuOpen: false});
  }

  menuOptionClicked = (option) => {
    const selected = this.props.selectedItem; 
    if (option.action) {option.action(selected)}
  }

  moveUp = () => {
    const items = this.props.items;
    const index = items.indexOf(this.props.selectedItem);
    if (index > 0) {
      this.itemSelected(items[index - 1]);
    }
  }

  moveDown = () => {
    const items = this.props.items;
    const index = items.indexOf(this.props.selectedItem);
    if (index < items.length - 1) {
      this.itemSelected(items[index + 1]);
    }
  }

  clearFilter() {
    this.setState({filterText: ''})
  }

  keyPressed = (event) => {
    event.preventDefault();
    if (event.key === 'ArrowUp') {this.moveUp()}
    if (event.key === 'ArrowDown') {this.moveDown()}
    if (event.key === 'Escape') {
      this.clearFilter()
    } else {
      const prefix = this.state.filterText + event.key;
      this.setState({filterText: prefix})
      const item = this.props.items.find(i => {
        const label = this.getItemLabel(i);
        return label && label.startsWith(prefix);
      });
      if (item) {this.itemSelected(item)}
    }
  }

  render () {
    return (
      <Scrollable>
          <List
            onContextMenu={this.openMenu}
            onKeyDown={this.keyPressed}
            style={{paddingTop: 0, paddingBottom: 0}}>
                {this.createItems()}
          </List>
          <PopupMenu
            options={this.props.menuOptions}
            open={this.state.menuOpen}
            position={this.state.menuPosition}
            onOptionClick={this.menuOptionClicked}
            onClose={this.closeMenu}/>
      </Scrollable>
    )
  }
}

export default CustomList;
