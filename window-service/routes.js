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
const error_prob = 0.05;
let handler = null;

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

export function simulateChanges(){
  for(let window of windows) {
    if(Math.random() < error_prob){
      window.state = "error";
    }
  }
}

/**
 * Registers a new handler for the WS channel.
 * @param ws {WebSocket} The WebSocket client
 * @param handler {WeatherHandler} The WebSocket handler
 */
function registerHandler(app, config, ws, handler) {

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

    setTimeout(function(){
      console.info("Connection to the backend closed. Reconnecting...");
      routes(app, config);
    }, 5000);
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

  let ws = new WebSocket("ws://backend:8000");

  ws.on("open", () => {
    console.info("✅ Connected to backend");
    try {
      ws.send(JSON.stringify({"type": "subscribe", "source": "window"}));
      
      if(handler === null){
        handler = new WindowHandler(ws, config, `window:${uuid()}`);
      }
      else{
        handler.ws = ws;
      }
     
      registerHandler(app, config, ws, handler);
      
    } catch (e) {
      console.error('💥 Failed to register WS handler, closing connection', e);
      ws.close();
    }
  });

  // ws.on("close", () => {
  //   setTimeout(function(){
  //     console.info("Connection to the backend closed. Reconnecting...");
  //     routes(app, config);
  //   }, 5000);
  // });

  ws.on("error", () => {
    setTimeout(function(){
      console.info("Connection to the backend failed. Reconnecting...");
      routes(app, config);
    }, 2000);
  });

  app.put('/window/:id', (req, resp) => {
    if(!handler.death){
      const {state} = req.body;
      const idRaw = req.params.id;
      console.debug('Attempting to update window ', {id: idRaw, state});
  
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
      resp.json({result: 'Window state successfully changed'});
    }
    else{
      console.info("❌ Microservice is down");
    }
  });

  app.post('/window', (req, resp) => {
    if(!handler.death){
      const {state} = req.body;
      const window = new Window(seq(), state);
      windows.push(window);
      console.info(window);
      handler._sendState();
      resp.status(201);
      resp.json({result: "Window successfully created"});
    }
    else{
      console.info("❌ Microservice is down");
    }
  });

}