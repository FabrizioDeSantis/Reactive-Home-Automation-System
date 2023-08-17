'use strict';

import {WindowHandler} from './window-handler.js';
import { WebSocket } from 'ws';
import {v4 as uuid} from 'uuid';

function sequencer() {
  let i = 1;
  return function () {
      const n = i;
      i++;
      return n;
  }
}

export class Window {
  constructor(windowId, state) {
      this._windowId = windowId;
      this._state = state;
  }

  //@formatter:off
  get windowId() { return this._windowId; }
  get state() { return this._state; }
  set state(state) { this._state = state; }
  //@formatter:on
}

const seq = sequencer();
const windows = [];

for (let i = 0; i < 2; i++) {
  const id = seq();
  windows.push(new Window(id, `closed`));
}

function toDTO(window) {
  return {
      windowId: window.windowId,
      state: window.state,
  };
}

function isInteger(n) {
  if (typeof n === 'number') {
      return true;
  }
  if (typeof n === 'string') {
      try {
          parseInt(n, 10);
          return true;
      } catch (_) {
          return false;
      }
  }
  return false;
}

export function retrieveStates() {
  const statesList = [];

  for (const window of windows) {
    const windowState = toDTO(window);
    statesList.push(windowState);
  }

  return statesList;
}

/**
 * Registers a new handler for the WS channel.
 * @param ws {WebSocket} The WebSocket client
 * @param handler {WeatherHandler} The WebSocket handler
 */
function registerHandler(ws, handler) {

  const removeAllListeners = () => {
    ws.removeListener('handler', handlerCb);
    ws.removeListener('ping', pingCb);
    ws.removeListener('close', closeCb);
    ws.removeListener('error', errorCb);
  };

  function pingCb() {
    console.trace('🏐 Ping-Pong', {handler:handler.name},);
    ws.pong();
  }

  function handlerCb(msg) {
    try {
      handler.onMessage(msg);
    } catch (e) {
      console.error('💢 Unexpected error while handling inbound message', {handler:handler.name}, e);
    }
  }

  function closeCb() {
    console.info('⛔ WebSocket closed', {handler:handler.name},);
    handler.stop();
    removeAllListeners();
  }

  function errorCb(err) {
    console.error('💥 Error occurred', {handler:handler.name}, err);
    handler.stop();
    removeAllListeners();
    ws.close();
  }

  ws.on('message', handlerCb);
  ws.on('ping', pingCb);
  ws.on('close', closeCb);
  ws.on('error', errorCb);

  handler.on('error', (err) => {
    errorCb(err);
  });

  // starts the handler
  handler.start();
}

/**
 * Initializes routes.
 * @param {Express} app Express application
 * @param {{iface: string, port: number}} config Configuration options
 */
export function routes(app, config) {

  const ws = new WebSocket("ws://backend:8000");
  let handler = null;
  ws.on("open", () => {
    console.info("✅ Connected to backend");
    try {
      ws.send(JSON.stringify({"type": "subscribe", "source": "window"}));
      handler = new WindowHandler(ws, config, `window:${uuid()}`);
      registerHandler(ws, handler);
    } catch (e) {
      console.error('💥 Failed to register WS handler, closing connection', e);
      ws.close();
    }
  });
  ws.on("close", () => {
    setTimeout(function(){
      ws = new WebSocket("ws://backend:8000");
    }, 1000);
  });

  app.put('/window/:id', (req, resp) => {
    const {state} = req.body;
    const idRaw = req.params.id;
    console.debug('Attempting to update window', {id: idRaw, state});

    if (!isInteger(idRaw)) {
      resp.status(400);
      resp.json({error: 'Invalid window identifier'});
      return;
    }

    const id = parseInt(idRaw, 10);
    const window = windows.find(t => t.windowId === id);
    window.state = state;
    handler._sendState();
    resp.status(200);
    resp.json({result: 'Success'});
  });

  app.post('/window', (req, resp) => {
    const {state} = req.body;
    const window = new Window(seq(), state);
    windows.push(window);
    console.info(window);
    handler._sendState();
    resp.status(201);
    resp.json({result: "Success"});
  });

}