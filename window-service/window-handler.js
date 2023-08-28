'use strict';

import {DateTime} from 'luxon';
import {anIntegerWithPrecision} from './random.js';
import {EventEmitter} from 'events';
import {retrieveStates} from './routes.js';
import {simulateChanges} from './routes.js';

class ValidationError extends Error {
  #message;

  constructor(msg) {
    super(msg);
    this.#message = msg;
  }

  get message() {
    return this.#message;
  }
}

/**
 * A WebSocket handler to deal with window's state subscriptions.
 */
export class WindowHandler extends EventEmitter {
  #ws;
  #config;
  #name;
  #timeout;
  #buffer;
  #death;

  /**
   * Instances a new weather handler.
   * @param ws {WebSocket} The WebSocket client
   * @param config {{iface:string,port:number,failures:boolean,delays:boolean,frequency:number,timeToLive:number}} Configuration
   * @param name {string} A name for this handler
   */
  constructor(ws, config, name) {
    super();
    this.#ws = ws;
    this.#config = config;
    this.#name = name;
    this.#buffer = [];
  }

  get name() {
    return this.#name;
  }

  get death(){
    return this.#death;
  }

  set ws(ws) {
    this.#ws = ws;
  }

  /**
   * Handles incoming messages.
   * @param msg {string} An incoming JSON message
   */
  onMessage(msg) {
    let json;
    try {
      json = this._validateMessage(msg);
    } catch (e) {
      this._send({error: e.message});
      return;
    }

    // @formatter:off
    switch (json.type) {
      case 'subscribe': this._onSubscribe(); break;
      case 'unsubscribe': this._onUnsubscribe(); break;
    }
    // @formatter:on
  }

  stop() {
    if (this.#timeout) {
      clearTimeout(this.#timeout);
    }
    // if (this.#death) {
    //   clearTimeout(this.#death);
    // }
  }

  start() {
    console.debug('⭐️ New connection received', {handler: this.#name});
  }

  /**
   * Validates an incoming message.
   * @param msg {string} Any message string that can be parsed as JSON
   * @return {any} An object representing the incoming message
   * @private
   */
  _validateMessage(msg) {
    if (!msg) {
      throw new ValidationError('Invalid inbound message');
    }
    const json = JSON.parse(msg);
    if (json.type !== 'subscribe' && json.type !== 'unsubscribe') {
      throw new ValidationError('Invalid message type');
    }
    if (json.target !== 'windows') {
      throw new ValidationError('Invalid subscription target');
    }
    return json;
  }

  /**
   * Generates a random delay in milliseconds.
   * @return {number} Milliseconds
   * @private
   */
  _someMillis() {
    return anIntegerWithPrecision(this.#config.frequency, 0.2);
  }

/**
 * Sends the window state message.
 */
  _sendState(){
    const states = retrieveStates();
    const msg = {type: 'windows', dateTime: DateTime.now().toISO(), states};

    // message is always appended to the buffer
    this.#buffer.push(msg);

    if(!this.#death){
      // messages are dispatched immediately if delays are disabled or a random number is
      // generated greater than `delayProb` messages
      if (!this.#config.delays || Math.random() > this.#config.delayProb) {
        for (const bMsg of this.#buffer) {
          this._send(bMsg);
        }
        this.#buffer = [];
      } else {
        console.info(`💤 Due to network delays, ${this.#buffer.length} messages are still queued`, {handler: this.#name});
      }
    }
  }

  /**
   * Sends any message through the WebSocket channel.
   * @param msg Any message
   * @private
   */
  _send(msg) {
    console.debug('💬 Dispatching message', {handler: this.#name});
    this.#ws.send(JSON.stringify(msg));
  }

  _simulateError(){
    if (this.#config.failures && Math.random() < this.#config.errorProb && !this.#death) {
      console.info('🚦 Simulating state change', {handler: this.#name});
      simulateChanges();
      this._sendState();
      return;
    }
  }

  _simulateDowntime(){
    if(!this.#death && Math.random() < this.#config.downProb){
      console.info("📉 Simulating downtime", {handler: this.#name});
      this.#death = true;
    }
    else if(this.#death){
      console.info("📈 Microservice up", {handler: this.#name});
      this.#death = false;
    } 
  }

  _onSubscribe() {
    if (this.#timeout) {
      if(!this.#timeout._destroyed){
        return;
      }
    }

    console.debug('🪟 Subscribing to window state', {handler: this.#name});
    this._sendState();
    const callback = () => {
      this._simulateError();
      this.#timeout = setTimeout(callback, this._someMillis());
    };
    this.#timeout = setTimeout(callback, 0);

    const callbackDownTime = () => {
      this._simulateDowntime();
      setTimeout(callbackDownTime, 2.0 * this._someMillis());
    };
    setTimeout(callbackDownTime, 0);
  }

  _onUnsubscribe() {
    if (!this.#timeout) {
      return;
    }
    clearTimeout(this.#timeout);
    this.#timeout = 0;
    this._send({ack: true});
  }
}