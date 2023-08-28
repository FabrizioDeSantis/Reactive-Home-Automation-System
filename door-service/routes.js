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
const error_prob = 0.05;
let handler = null;

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

export function simulateChanges(){
  for(let door of doors) {
    if(Math.random() < error_prob){
      door.state = "error";
    }
  }
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

// function restartHandler(ws, handler){

// }

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
      ws.send(JSON.stringify({"type": "subscribe", "source": "door"}));

      if(handler === null){
        handler = new DoorHandler(ws, config, `door:${uuid()}`);      
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

  ws.on("close", () => {

  });

  ws.on("error", () => {
    setTimeout(function(){
      console.info("Connection to the backend failed. Reconnecting...");
      routes(app, config);
    }, 2000);
  });

  app.put('/door/:id', (req, resp) => {
    if(!handler.death){
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
    }
    else{
      console.info("❌ Microservice is down");
    }
    
  });

  app.post('/door', (req, resp) => {
    if(!handler.death){
      const {state} = req.body;
      const door = new Door(seq(), state);
      doors.push(door);
      handler._sendState();
      resp.status(201);
      resp.json({result: "Success"});
    }
    else{
      console.info("❌ Microservice is down");
    }
  });

}