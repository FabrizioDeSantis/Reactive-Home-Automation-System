'use strict';

import {ThermometerHandler} from './thermometer-handler.js';
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

export class Thermometer {
  constructor(thermometerId, temperature) {
      this._thermometerId= thermometerId;
      this._temperature = temperature;
  }

  //@formatter:off
  get thermometerId() { return this._thermometerId; }
  get temperature() { return this._temperature; }
  set temperature(temperature) { this._temperature = temperature; }
  //@formatter:on
}

const seq = sequencer();

const id = seq();
const thermometer = new Thermometer(id, 0);

function toDTO(thermometer) {
  return {
    thermometerId: thermometer.thermometerId,
      temperature: thermometer.temperature
  };
}

export function retrieveState() {

  const thermometerInformations = toDTO(thermometer);
  return thermometerInformations.temperature;

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
  ws.on("open", () => {
    console.info("Connected to backend");
    try {
      ws.send(JSON.stringify({"type": "subscribe", "source": "thermometer"}));
      const handler = new ThermometerHandler(ws, config, `thermometer:${uuid()}`);
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

}