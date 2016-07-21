
import R from 'ramda';
import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import Reducers from '../reducers/';
import { getViewableSize, isChromeApp } from '../utils/browser';
import { EditorMiddleware } from '../middlewares';
import * as Actions from '../actions';
import Selectors from '../selectors';
import Serializer from '../serializers/mock';
import Editor from './Editor';
import SnackBar from './SnackBar';
import Toolbar from './Toolbar';
import EventListener from 'react-event-listener';
import SkyLight from 'react-skylight';

import DevTools from './DevTools';
const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;

export default class App extends React.Component {

  constructor(props) {
    super(props);

    this.serializer = new Serializer();
    const initialState = this.serializer.getState();

    this.store = createStore(Reducers, initialState, EditorMiddleware);
    this.state = {
      size: getViewableSize(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT),
    };

    this.onResize = this.onResize.bind(this);
    this.onUpload = this.onUpload.bind(this);
    this.onLoad = this.onLoad.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  onResize() {
    this.setState(
      R.set(
        R.lensProp('size'),
        getViewableSize(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT),
        this.state
      )
    );
  }

  onUpload() {
    if (isChromeApp) {
      this.store.dispatch(Actions.upload());
    } else {
      this.suggestToInstallApplication();
    }
  }

  onLoad(json) {
    this.store.dispatch(Actions.loadProjectFromJSON(json));
  }

  onSave() {
    const projectJSON = Selectors.Project.getJSON(this.store.getState());
    const url = `data:text/json;charset=utf8,${encodeURIComponent(projectJSON)}`;
    window.open(url, '_blank');
    window.focus();
  }

  suggestToInstallApplication() {
    this.refs.suggestToInstallApplication.show();
  }

  render() {
    const devToolsInstrument = (isChromeApp) ? <DevTools /> : null;

    return (
      <div>
        <EventListener target={window} onResize={this.onResize} />
        <Provider store={this.store}>
          <div>
            <Toolbar
              meta={meta}
              onUpload={this.onUpload}
              onLoad={this.onLoad}
              onSave={this.onSave}
            />
            <Editor size={this.state.size} />
            <SnackBar />
            {devToolsInstrument}
          </div>
        </Provider>
        <SkyLight
          dialogStyles={{
            height: 'auto',
          }}
          ref="suggestToInstallApplication"
          title="Oops! You need a Chrome App!"
        >
          <p>
            To use this feature you have to install a Chrome Application.<br />
            It's free.
          </p>
          <p>
            <a href="#">Open in Chrome Store</a>
          </p>
        </SkyLight>
      </div>
    );
  }
}
