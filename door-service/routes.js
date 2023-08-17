'use strict';

import {DoorHandler} from './door-handler.js';
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

export class Door {
  constructor(doorId, state) {
      this._doorId = doorId;
      this._state = state;
  }

  //@formatter:off
  get doorId() { return this._doorId; }
  get state() { return this._state; }
  set state(state) { this._state = state; }
  //@formatter:on
}

const seq = sequencer();
const doors = [];

const id = seq();
doors.push(new Door(id, `closed`));


function toDTO(door) {
  return {
      doorId: door.doorId,
      state: door.state,
  };
}

export function retrieveStates() {
  const statesList = [];

  for (const door of doors) {
    const doorState = toDTO(door);
    statesList.push(doorState);
  }

  return statesList;
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
      ws.send(JSON.stringify({"type": "subscribe", "source": "door"}));
      handler = new DoorHandler(ws, config, `door:${uuid()}`);
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

  app.put('/door/:id', (req, resp) => {
    const {state} = req.body;
    const idRaw = req.params.id;
    console.debug('Attempting to update door', {id: idRaw, state});

    if (!isInteger(idRaw)) {
      resp.status(400);
      resp.json({error: 'Invalid door identifier'});
      return;
    }

    const id = parseInt(idRaw, 10);
    const door = doors.find(t => t.doorId === id);
    door.state = state;
    handler._sendState();
    resp.status(200);
    resp.json({result: "Success"});
  });

  app.post('/door', (req, resp) => {
    const {state} = req.body;
    const door = new Door(seq(), state);
    doors.push(door);
    handler._sendState();
    resp.status(201);
    resp.json({result: "Success"});
  });

}