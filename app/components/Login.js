/* eslint-disable react/button-has-type */
/* eslint-disable class-methods-use-this */
// @flow
import { remote, ipcRenderer } from 'electron';
import fs from 'fs';
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import { Redirect, Link } from 'react-router-dom';
import log from 'electron-log';
import { config, session, directories, eventEmitter } from '../index';
import navBar from './NavBar';
import routes from '../constants/routes';

// import styles from './Send.css';

type Props = {
  syncStatus: number,
  unlockedBalance: number,
  lockedBalance: number,
  transactions: Array<string>,
  handleSubmit: () => void,
  transactionInProgress: boolean
};

export default class Login extends Component<Props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      importkey: false,
      importseed: false,
      importCompleted: false,
      loginInProgress: false,
      userOpenedDifferentWallet: false,
      darkMode: session.darkMode
    };
    this.handleImportFromSeed = this.handleImportFromSeed.bind(this);
    this.handleImportFromKey = this.handleImportFromKey.bind(this);
    this.handleInitialize = this.handleInitialize.bind(this);
    this.handleLoginFailure = this.handleLoginFailure.bind(this);
    this.handleLoginInProgress = this.handleLoginInProgress.bind(this);
    this.refreshLogin = this.refreshLogin.bind(this);
  }

  componentDidMount() {
    this.interval = setInterval(() => this.refresh(), 1000);
    ipcRenderer.on('importSeed', this.handleImportFromSeed);
    ipcRenderer.on('importKey', this.handleImportFromKey);
    eventEmitter.on('initializeNewSession', this.handleInitialize);
    eventEmitter.on('loginInProgress', this.handleLoginInProgress);
    eventEmitter.on('refreshLogin', this.refreshLogin);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    ipcRenderer.off('importSeed', this.handleImportFromSeed);
    ipcRenderer.off('importKey', this.handleImportFromKey);
    eventEmitter.off('initializeNewSession', this.handleInitialize);
    eventEmitter.off('loginInProgress', this.handleLoginInProgress);
    eventEmitter.off('refreshLogin', this.refreshLogin);
  }

  handleLoginInProgress() {
    log.debug('Login in progress...');
    this.setState({
      loginInProgress: true
    });
  }

  handleLoginFailure() {
    this.setState({
      loginFailed: true,
      loginInProgress: false
    });
  }

  refreshLogin() {
    this.setState({
      userOpenedDifferentWallet: true
    });
  }

  handleInitialize() {
    this.setState({
      importCompleted: true
    });
  }

  handleImportFromSeed(evt, route) {
    clearInterval(this.interval);
    this.setState({
      importseed: true
    });
  }

  handleImportFromKey(evt, route) {
    clearInterval(this.interval);
    this.setState({
      importkey: true
    });
  }

  async handleSubmit(event) {
    eventEmitter.emit('loginInProgress');

    // We're preventing the default refresh of the page that occurs on form submit
    event.preventDefault();

    const password = event.target[0].value;

    if (password === undefined) {
      return;
    }
    eventEmitter.emit('initializeNewSession', password);
  }

  refresh() {
    this.setState(prevState => ({
      syncStatus: session.getSyncStatus()
    }));
  }

  render() {
    if (this.state.userOpenedDifferentWallet) {
      return <Redirect to="/" />;
    }
    if (this.state.loginFailed === true) {
      return <Redirect to="/login" />;
    }
    if (this.state.importseed === true) {
      return <Redirect to="/import" />;
    }
    if (this.state.importCompleted === true) {
      return <Redirect to="/" />;
    }
    return (
      <div>
      {this.state.darkMode === false && (
      <div className="fullwindow">
        {this.state.loginInProgress === false && (
          <div className="box loginbox has-background-light">
            <form onSubmit={this.handleSubmit}>
              <div className="field">
                <label className="label" htmlFor="scanheight">
                  Password
                  <div className="control">
                    <input
                      className="input is-large"
                      type="password"
                      placeholder="Enter your password..."
                      id="scanheight"
                    />
                  </div>
                </label>
              </div>
              <div className="buttons is-right">
                <button type="submit" className="button is-success is-large">
                  Login
                </button>
              </div>
            </form>
          </div>
        )}
        {this.state.loginInProgress === true && (
          <ReactLoading
            type="spin"
            color="#363636"
            height="25%"
            width="25%"
            className="loginspinner"
          />
        )}
      </div>
      )}
      {this.state.darkMode === true && (
        <div className="fullwindow has-background-dark">
          {this.state.loginInProgress === false && (
            <div className="box loginbox has-background-black">
              <form onSubmit={this.handleSubmit}>
                <div className="field">
                  <label className="label has-text-white" htmlFor="scanheight">
                    Password
                    <div className="control">
                      <input
                        className="input is-large"
                        type="password"
                        placeholder="Enter your password..."
                        id="scanheight"
                      />
                    </div>
                  </label>
                </div>
                <div className="buttons is-right">
                  <button type="submit" className="button is-success is-large">
                    Login
                  </button>
                </div>
              </form>
            </div>
          )}
          {this.state.loginInProgress === true && (
            <ReactLoading
              type="spin"
              color="#363636"
              height="25%"
              width="25%"
              className="loginspinner"
            />
          )}
        </div>
        )}
      </div>
    );
  }
}
