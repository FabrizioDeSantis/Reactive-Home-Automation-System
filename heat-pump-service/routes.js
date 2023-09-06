'use strict';

import {HeatPumpHandler} from './heat-pump-handler.js';
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

export class HeatPump {
  constructor(state, temperatureOp) {
      this._state = state;
      this._temperatureOp = temperatureOp;
  }

  //@formatter:off
  get state() { return this._state; }
  get temperatureOp() { return this._temperatureOp; }
  set state(state) { this._state = state; }
  set temperatureOp(temperatureOp) { this._temperatureOp = temperatureOp; }
  //@formatter:on
}

const heatPump = new HeatPump("error", 30);
const error_prob = 0.05;
let handler = null;

function toDTO(heatPump) {
  return {
      state: heatPump.state,
      temperatureOp: heatPump.temperatureOp
  };
}

export function retrieveState() {

  const heatPumpInformations = toDTO(heatPump);
  return heatPumpInformations;

}

export function simulateChanges(){
  if(Math.random() < error_prob){
    heatPump.state = "error";
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

  const ws = new WebSocket("ws://backend:8000");

  ws.on("open", () => {
    console.info("✅ Connected to backend");
    try {
      ws.send(JSON.stringify({"type": "subscribe", "source": "heatpump"}));

      if(handler === null){
        handler = new HeatPumpHandler(ws, config, `heatpump:${uuid()}`);
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

  app.put('/heatpump/state', (req, resp) => {
    if(!handler.death){
      const {state} = req.body;

      console.debug('Attempting to change heatpump state to ' + state);

      heatPump.state = state;

      if(state === "off"){
        heatPump.temperatureOp = 0;
      }
      
      handler._sendState();

      resp.status(200);
      resp.json({result: 'Success'});
    }
    else{
      console.info("❌ Microservice is down");
    } 
  });

  app.put('/heatpump/temperatureOp', (req, resp) => {
    if(!handler.death){
      const {temperatureOp} = req.body;

      console.debug('Attempting to change heatpump operation temperature to ' + temperatureOp);

      heatPump.temperatureOp = temperatureOp;
      handler._sendState();

      resp.status(200);
      resp.json({result: 'Success'});
    }
    else{
      console.info("❌ Microservice is down");
    }
  });

}