import React, { Component, PureComponent } from 'react';
import { withStyles } from '@material-ui/core/styles';
import {
  Container,
  createMuiTheme,
  CssBaseline,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Drawer,
  Box
} from '@material-ui/core';
import styles from './styles';
import { ThemeProvider } from '@material-ui/styles';
import { amber, blue } from '@material-ui/core/colors';
import AddIcon from '@material-ui/icons/AddCircle';
import API from './components/API';
import { AppContext } from './AppContext';
import { DialogProvider } from './components/dialogs';
import TranscriptIcon from './components/icons/TranscriptIcon';
import ClassBrowserIcon from './components/icons/ClassBrowserIcon';
import MethodBrowserIcon from './components/icons/MethodBrowserIcon';
import WorkspaceIcon from './components/icons/WorkspaceIcon';
import InspectorIcon from './components/icons/InspectorIcon';
import ChangesBrowserIcon from './components/icons/ChangesBrowserIcon';
import DebuggerIcon from './components/icons/DebuggerIcon';
import TestRunnerIcon from './components/icons/TestRunnerIcon';
import Titlebar from './components/layout/Titlebar'
import Sidebar from './components/layout/Sidebar';
import TabControl from './components/controls/TabControl';
import Transcript from './components/tools/Transcript';
import SystemBrowser from './components/tools/SystemBrowser';
import ClassBrowser from './components/tools/ClassBrowser';
import MethodBrowser from './components/tools/MethodBrowser';
import Inspector from './components/tools/Inspector';
import Workspace from './components/tools/Workspace';
import ChangesBrowser from './components/tools/ChangesBrowser';
import Debugger from './components/tools/Debugger';
import TestRunner from './components/tools/TestRunner';
import Profiler from './components/tools/Profiler';

const smalltalk = 'Bee';
var port;
var baseUri;
var mainPrimaryColor;
var mainSecondaryColor;

switch (smalltalk) {
  case "Bee": 
    port = 9000 //window.location.port;
    baseUri = `http://${window.location.hostname}:${port}/bee`;
    mainPrimaryColor = amber[300];
    mainSecondaryColor = amber[800];
    break;  
  case "Pharo":
    port = 9001 //window.location.port;
    baseUri = `http://${window.location.hostname}:${port}/pharo`;
    mainPrimaryColor = blue[300];
    mainSecondaryColor = blue[800];
    break;
  default:
}

const theme = createMuiTheme({
  typography: {
    fontFamily: '"Segoe UI"',
    fontSize: 13,
    button: {
      textTransform: "none"
    }
  },
  palette: {
    type: "dark",
    primary: {
      main: mainPrimaryColor,
      //background: "303030"
    },
    secondary: {
      main: mainSecondaryColor,
    },
    text: {
      primary: "#aaaaaa",
      secondary: "#00000"
    },
    background: {
      paper: '#303030',
    }
  },
});

class App extends PureComponent {
  constructor(props){
    super(props);
    this.api = new API(baseUri, 'guest', this.reportError, this.reportChange);
    this.state = {
      sidebarExpanded: false,
      addPageMenuOpen: false,
      selectedPage: null,
      transcriptOpen: false,
      transcriptText: 'Welcome to Webside!\r\rA web Smalltalk IDE built with ReactJS.',
      pages: [],
      projectNames: [],
      classNames: [],
    }
  }

  componentDidMount() {
    this.getNames();
    this.openClassBrowser('Fraction')
  }

  getNames = async () => {
    try {
      const projectNames = await this.api.getProjectNames();
      const classNames = await this.api.getClassNames();
      this.setState({projectNames: projectNames, classNames: classNames})
    }
    catch (error) {this.reportError(error)}
  }

  addPage(label, icon, component) {
    const page = {
      label: label,
      icon: icon,
      component: component};
    const pages = this.state.pages;
    pages.push(page);
    this.setState({pages: pages, selectedPage: page})
  }

  pageSelected = (page) => {
    this.setState({selectedPage: page})
  }

  removePage = (page) => {
    if (page.component.type.name === 'Inspector') {
      this.api.unpinObject(page.component.props.id)
    }
    if (page.component.type.name === 'Debugger') {
      this.api.deleteDebugger(page.component.props.id)
    }
    if (page.component.type.name === 'TestRunner') {
      this.api.deleteTestRun(page.component.props.id)
    }
    if (page.component.type.name === 'Workspace') {
      this.api.deleteWorkspace(page.component.props.id)
    }
    const {pages, selectedPage} = this.state;
    let i = pages.indexOf(page);
    const j = pages.indexOf(selectedPage);
    const selected = (i <= j)? pages[Math.max(i - 1, 0)] : selectedPage;
    this.setState({pages: pages.filter(p => p !== page), selectedPage: selected})
  }

  openTranscript() {
    const transcript = <Transcript styles={this.props.classes} text={this.state.transcriptText}/>;
    this.addPage('Transcript', <TranscriptIcon />, transcript);
  }

  openInspectors() {
    this.api.getObjects()
      .then(objects => {objects.forEach(o => this.openInspector(o))})
      .catch(error => {})
  }

  openSystemBrowser = (projectname) => {
    const browser = <SystemBrowser styles={this.props.classes} root={projectname}/>;
    this.addPage(browser.props.root || 'System Browser', <ClassBrowserIcon className={this.props.classes.classBrowserIcon} />, browser);
  }

  openClassBrowser = (classname) => {
    const browser = <ClassBrowser styles={this.props.classes} root={classname}/>;
    this.addPage(browser.props.root || 'Class Browser', <ClassBrowserIcon className={this.props.classes.classBrowserIcon} />, browser);
  }

  openMethodBrowser = (methods, title = 'Methods') => {
    const browser = <MethodBrowser styles={this.props.classes} methods={methods}/>;
    this.addPage(title + ' (' + methods.length + ')', <MethodBrowserIcon className={this.props.classes.methodBrowserIcon} />, browser);
  }

  openWorkspace = (id) => {
    const workspace = <Workspace styles={this.props.classes} key={id} id={id}/>;
    this.addPage('Workspace', <WorkspaceIcon className={this.props.classes.workspaceIcon} />, workspace);
  }

  openDebugger = (id, title = 'Debugger') => {
    const tool = <Debugger styles={this.props.classes} key={id} id={id}/>;
    this.addPage(title, <DebuggerIcon className={this.props.classes.debuggerIcon} />, tool);
  }

  closeDebugger = (id) => {
    const page = this.state.pages.find(p => p.component.type.name === 'Debugger' && p.component.props.id === id);
    if (page) {this.removePage(page)}
  }

  openInspector = (object) => {
    const inspector = <Inspector styles={this.props.classes} key={object.id} root={object} id={object.id} showWorkspace/>;
    this.addPage('Inspecting: ' + object.class, <InspectorIcon className={this.props.classes.workspaceIcon} />, inspector);
  }

  openChangesBrowser = (changes, title = 'Changes') => {
    const browser = <ChangesBrowser styles={this.props.classes} changes={changes}/>;
    this.addPage(title + ' (' + changes.length + ')', <ChangesBrowserIcon className={this.props.classes.changesBrowserIcon} />, browser);
  }

  openTestRunner = (id, title = 'Test Runner') => {
    const tool = <TestRunner styles={this.props.classes} key={id} id={id}/>;
    this.addPage(title, <TestRunnerIcon className={this.props.classes.testRunnerIcon} />, tool);
  }

  openProfiler = (id, title = 'Profiler') => {
    const tool = <Profiler styles={this.props.classes} key={id} id={id}/>;
    this.addPage(title, <TestRunnerIcon className={this.props.classes.testRunnerIcon} />, tool);
  }

  browseSenders = (selector) => {
    this.api.getSenders(selector)
      .then(methods => this.openMethodBrowser(methods, 'Senders of ' + selector)); 
  }

  browseLocalSenders = (selector, classname) => {
    this.api.getLocalSenders(selector, classname)
      .then(methods => this.openMethodBrowser(methods, 'Local senders of ' + selector)); 
  }

  browseImplementors = (selector) => {
    this.api.getImplementors(selector)
      .then(methods => this.openMethodBrowser(methods, 'Implementors of ' + selector)); 
  }

  browseLocalImplementors = (selector, classname) => {
    this.api.getLocalImplementors(selector, classname)
      .then(methods => this.openMethodBrowser(methods, 'Local implementors of ' + selector)); 
  }

  browseReferences = (classname) => {
    this.api.getReferences(classname)
      .then(methods => this.openMethodBrowser(methods, 'References to ' + classname)); 
  }

  browseLastChanges = async () => {
    try {
      const changes = await this.api.getChanges();
      this.openChangesBrowser(changes, 'Last changes');
    }
    catch (error) {this.reportError(error)}
  }

  debugExpression = async (expression, context) => {
    const id = await this.api.debugExpression(expression, context);
    this.openDebugger(id, 'Debugging expression');
  }

  evaluateExpression = async (expression, pin, context) => {
    try {
      const evaluation = await this.api.evaluateExpression(expression, false, pin, context);
      const object = await this.api.getObject(evaluation.id);
      return object;
    }
    catch (error) {
      if (error.data && error.data.process) {
        // const debug = await this.confirm(error.description, 'Stack tracke:\r' + error.stack + '\r\rDo you want to debug it?');
        // (debug)? this.openDebugger(error.debugger) : this.reportError(error.description);
        const id = await this.api.createDebugger(error.data.process)
        this.openDebugger(id);
      }
    }
  }

  runTest = async (classname, selector) => {
    const status = await this.api.runTest(classname, selector);
    this.openTestRunner(status.id, 'Test ' + selector); 
  }

  runTestClass = async (classname) => {
    const status = await this.api.runTestClass(classname);
    this.openTestRunner(status.id, 'Test ' + classname);
  }

  profileExpression = async (expression, context) => {
    const id = await this.api.profileExpression(expression, context);
    this.openProfiler(id)
  }

  expandSidebar = () => {
    this.setState({sidebarExpanded: true});
  };
  
  collapseSidebar = () => {
    this.setState({sidebarExpanded: false});
  };

  reportError = (text) => {
    this.setState(
      {
        transcriptText: this.state.transcriptText + '\r' + text,
        transcriptOpen: true,
    })
  }

  reportChange = async (change) => {
    //this triggers unnecessary renders!!!
    // const changes = await this.api.getChanges(); 
    // this.setState({changesCount: changes.length})
  }

  addSystemBrowserClicked = () => {
    this.setState({addPageMenuOpen: false})
    this.openSystemBrowser()
  }

  addClassBrowserClicked = () => {
    this.setState({addPageMenuOpen: false})
    this.openClassBrowser()
  }

  addWorkspaceClicked = async () => {
    this.setState({addPageMenuOpen: false})
    try {
      const id = await this.api.createWorkspace();
      this.openWorkspace(id)
    }
    catch (error) {this.reportError(error)}
  }

  toggleShowTranscript = () => {
    this.setState({transcriptOpen: !this.state.transcriptOpen});
  }

  render() {
    console.log('render app')
    const context = {
      api: this.api,
      projectNames: this.state.projectNames,
      classNames: this.state.classNames,
      browseClass: this.openClassBrowser,
      browseSenders: this.browseSenders,
      browseLocalSenders: this.browseLocalSenders,
      browseImplementors: this.browseImplementors,
      browseLocalImplementors: this.browseLocalImplementors,
      browseReferences: this.browseReferences,
      evaluateExpression: this.evaluateExpression,
      debugExpression: this.debugExpression,
      profileExpression: this.profileExpression,
      runTest: this.runTest,
      runTestClass: this.runTestClass,
      openDebugger: this.openDebugger,
      closeDebugger: this.closeDebugger,
      inspectObject: this.openInspector,
      reportError: this.reportError};
    const styles = this.props.classes;
    return (
      <ThemeProvider theme={theme}>
        <AppContext.Provider value={context}>
          <DialogProvider>
            <div className={styles.root}>           
              <CssBaseline/>
              <Titlebar
                title={smalltalk + ' Web IDE (Powered by Webside)'}
                appName={smalltalk}
                styles={styles}
                sidebarExpanded={this.state.sidebarExpanded}
                expandSidebar={this.expandSidebar}
                searchOptions={this.state.classNames || []}/>
              <Sidebar
                styles={styles}
                expanded={this.state.sidebarExpanded}
                onTranscript={this.toggleShowTranscript}
                changesCount={this.state.changesCount}
                onChanges={this.browseLastChanges}
                onClose={this.collapseSidebar}/>
              <main className={styles.content}>
                <div className={styles.appBarSpacer} />
                <Container className={styles.container}>
                  <Grid container spacing={1}>
                    <Grid item xs={11} md={11} lg={11}>
                        <TabControl
                          styles={styles}
                          selectedPage={this.state.selectedPage}
                          pages={this.state.pages}
                          onSelect={this.pageSelected}
                          onClose={this.removePage}/>
                    </Grid>
                    <Grid item xs={1} md={1} lg={1}>
                      <IconButton id="addPageButton" color="primary" onClick={() => {this.setState({addPageMenuOpen: true})}}>
                        <AddIcon style={{fontSize: 40}}/>
                      </IconButton>
                      <Menu
                        id="addPageMenu"
                        anchorEl={document.getElementById("addPageButton")}
                        keepMounted
                        open={this.state.addPageMenuOpen}
                        onClose={() => {this.setState({addPageMenuOpen: false})}}>
                          <MenuItem onClick={this.addSystemBrowserClicked}>
                            <Box display="flex" flexWrap="nowrap" alignItems="center" justifyContent="center">
                              <Box pt={1} pr={1}>
                                <ClassBrowserIcon/>
                              </Box>
                              <Box>
                                System Browser
                              </Box>
                            </Box>
                          </MenuItem>
                          <MenuItem onClick={this.addClassBrowserClicked}>
                            <Box display="flex" flexWrap="nowrap" alignItems="center" justifyContent="center">
                              <Box pt={1} pr={1}>
                                <ClassBrowserIcon/>
                              </Box>
                              <Box>
                                Class Browser
                              </Box>
                            </Box>
                          </MenuItem>
                          <MenuItem onClick={this.addWorkspaceClicked}>
                            <Box display="flex" flexWrap="nowrap" alignItems="center" justifyContent="center">
                              <Box pt={1} pr={1}>
                                <WorkspaceIcon/>
                              </Box>
                              <Box>
                                Workspace
                              </Box>
                            </Box>
                          </MenuItem>
                      </Menu>
                    </Grid>
                    <React.Fragment key="bottom">
                      <Drawer
                        anchor="bottom"
                        variant="persistent"
                        open={this.state.transcriptOpen}
                        onClose={() => this.setState({transcriptOpen: false})}>
                        <Transcript
                          styles={styles}
                          text={this.state.transcriptText}
                          onChange={text => this.setState({transcriptText: text})}/>
                      </Drawer>
                    </React.Fragment>
                  </Grid>
                </Container>
              </main>
            </div>
          </DialogProvider>
        </AppContext.Provider>
      </ThemeProvider>
    )
  }
}

export default withStyles(styles)(App);
