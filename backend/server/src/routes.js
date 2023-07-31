'use strict';

import {WebSocket} from 'ws';

function sequencer() {
    let i = 1;
    return function () {
        const n = i;
        i++;
        return n;
    }
}

class Task {
    constructor(id, description) {
        this._id = id;
        this._description = description;
        this._timestamp = new Date();
    }

    //@formatter:off
    get id() { return this._id; }
    get description() { return this._description; }
    set description(description) { this._description = description; }
    get timestamp() { return this._timestamp; }
    //@formatter:on
}

class Window {
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

class Door {
    constructor(state) {
        this._state = state;
    }

    //@formatter:off
    get state() { return this._state; }
    set state(state) { this._state = state; }
    //@formatter:on
}

class HeatPump {
    constructor(state, temperatureOp) {
        this._state = state;
        this._temperatureOp = temperatureOp;
    }

    //@formatter:off
    get state() { return this._state; }
    get temperatureOp() {return this._temperatureOp; }
    set state(state) { this._state = state; }
    set temperatureOp(temperatureOp) { this._temperatureOp = temperatureOp; }
    //@formatter:on
}

class Thermometer {
    constructor(temperature) {
        this._temperature = temperature;
    }

    //@formatter:off
    get temperature() { return this._temperature; }
    set temperature(temperature) { this._temperature = temperature; }
    //@formatter:on
}

const seq = sequencer();
const tasks = [];
const clients = new Map();

for (let i = 0; i < 5; i++) {
    const id = seq();
    tasks.push(new Task(id, `Spend more time hacking #${id}`));
}

function toDTO(task) {
    return {
        id: task.id,
        description: task.description,
        timestamp: task.timestamp // should be converted according to ISO8601
    };
}

function isNonBlank(str) {
    return typeof str === 'string' && str.trim();
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
 * Initializes routes.
 * @param {Express} app Express application
 * @param {OIDCMiddleware} oidc OpenID Connect middleware
 * @param {WebSocketServer} wss WebSocket server
 * @param {{iface: string, port: number, auth: boolean, oidc: {redirect: string, clientId: string, secret: string}}} config Configuration options
 */
export function routes(app, wss, oidc, config) {
    const authenticate = config.auth ? (req, res, next) => oidc.validate(req, res, next) : (_req, _res, next) => next();
    
    wss.on('connection', (ws) => {
      console.log("Client connesso");
      //ws.send(JSON.stringify({"type": "subscribe", "target": "temperature"}));
      // type, source/target
      //console.info(ws);
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          if(data.type == "subscribe" && data.source == "temperature"){
            // gestire casistica di iscrizione microservizio temperatura
            console.info("weather service iscritto");
            clients.set(ws, "temperature");
            ws.send(JSON.stringify({"type": "subscribe", "target": "temperature"}));
          }
          else if(data.type == "subscribe" && data.source == "client"){
            // gestire casistica client
            console.info("frontend connesso");
            clients.set(ws, "client");
          }
          else if(data.type == "subscribe" && data.source == "window") {
            // gestire casistica windows
            console.info("windows service connesso");
            clients.set(ws, "window");
            ws.send(JSON.stringify({"type": "subscribe", "target": "state"}));
          }
          if(data.type == "temperature") {
            // arrivo nuova temperatura
            console.info(data.value);
            for (let [keyWS, value] of clients) {
                if(value == "client"){
                    keyWS.send(JSON.stringify({"type": "temperature", "value": data.value}));
                }
            }
          }
          else if(data.type == "windows") {
            // arrivo nuova temperatura
            for (let [keyWS, value] of clients) {
                if(value == "client"){
                    keyWS.send(JSON.stringify({"type": "windows", "value": data.state}));
                }
            }
          }
        } catch (error) {
          console.error('Errore durante l\'elaborazione del messaggio:', error);
        }
      });
    });

    app.get('/login', (req, resp) => {
        oidc.login(req, resp);
    });

    app.get('/tokens', (req, resp) => {
        // noinspection JSIgnoredPromiseFromCall
        oidc.tokens(req, resp);
    });

    app.get('/tasks', authenticate, (req, resp) => {
        console.debug('Retrieving all tasks', {principal: req.principal.email});

        const objects = tasks.map(toDTO);
        resp.json({
            total: objects.length,
            results: objects
        });
    });

    app.post('/task', authenticate, (req, resp) => {
        const {description} = req.body;
        console.debug('Attempting to crete a new task', {description, principal: req.principal.email});

        if (!isNonBlank(description)) {
            resp.status(400);
            resp.json({error: 'Missing task description'});
            return;
        }
        if (description.trim().length > 50) {
            resp.status(400);
            resp.json({error: 'Too long task description'});
            return;
        }

        const task = new Task(seq(), description.trim());
        tasks.push(task);
        console.info('Task successfully created', {task, principal: req.principal.email});

        resp.status(201);
        resp.json(toDTO(task));
    });

    app.put('/task/:id', authenticate, (req, resp) => {
        const {description} = req.body;
        const idRaw = req.params.id;
        console.debug('Attempting to update task', {id: idRaw, description, principal: req.principal.email});

        if (!isNonBlank(description)) {
            resp.status(400);
            resp.json({error: 'Missing task description'});
            return;
        }
        if (description.trim().length > 50) {
            resp.status(400);
            resp.json({error: 'Too long task description'});
            return;
        }
        if (!isInteger(idRaw)) {
            resp.status(400);
            resp.json({error: 'Invalid task identifier'});
            return;
        }
        const id = parseInt(idRaw, 10);
        const task = tasks.find(t => t.id === id);
        if (!task) {
            resp.status(404);
            resp.json({error: 'Task not found'});
            return;
        }

        task.description = description.trim();
        resp.status(200);
        console.info('Task successfully updated', {task, principal: req.principal.email});

        resp.json(toDTO(task));
    });

    app.delete('/task/:id', authenticate, (req, resp) => {
        const idRaw = req.params.id;
        console.debug('Attempting to delete task', {id: idRaw, principal: req.principal.email});

        if (!isInteger(idRaw)) {
            resp.status(400);
            resp.json({error: 'Invalid task identifier'});
            return;
        }
        const id = parseInt(idRaw, 10);
        const j = tasks.findIndex(t => t.id === id);
        if (j < 0) {
            resp.status(404);
            resp.json({error: 'Task not found'});
            return;
        }
        const [task] = tasks.splice(j, 1);

        console.info('Task successfully deleted', {task, principal: req.principal.email});
        resp.status(200);
        resp.json(toDTO(task));
    });
}
