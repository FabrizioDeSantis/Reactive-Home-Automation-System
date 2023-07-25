'use strict';

import {WindowHandler} from './window-handler.js';
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
  windows.push(new Window(id, `CLOSED`));
}

function toDTO(window) {
  return {
      windowId: window.windowId,
      state: window.state,
  };
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
 * @param {WebSocketServer} wss WebSocket server
 * @param {{iface: string, port: number}} config Configuration options
 */
export function routes(app, wss, config) {

  app.get('/state', authenticate, (req, resp) => {
    console.debug('Retrieving window state', {principal: req.principal.email});

    const objects = tasks.map(toDTO);
    resp.json({
        total: objects.length,
        results: objects
    });
});

  wss.on('connection', ws => {
    try {
      const handler = new WindowHandler(ws, config, `window:${uuid()}`);
      registerHandler(ws, handler);
    } catch (e) {
      console.error('💥 Failed to register WS handler, closing connection', e);
      ws.close();
    }
  });
}