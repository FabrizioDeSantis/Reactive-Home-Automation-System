'use strict';

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
    set windowId(windowId) { this._windowId = windowId; }
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
const services = new Map();
const windows = [];
const doors = [];
const temperatures = [];
const clients = new Map();

// for (let i = 0; i < 5; i++) {
//     const id = seq();
//     tasks.push(new Task(id, `Spend more time hacking #${id}`));
// }

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
          switch(data.type){
            case "subscribe":
                switch(data.source){
                    case "client":
                        console.info("🙍🏻‍♂️ Frontend connected");
                        clients.set(ws, "client");
                        break;
                    
                    case "temperature":
                        console.info("🌦️ Weather microservice connected");
                        clients.set(ws, "temperature");
                        clients.set("weather", null);
                        ws.send(JSON.stringify({"type": "subscribe", "target": "temperature"}));
                        break;
    
                    case "window":
                        console.info("🪟 Windows microservice connected");
                        clients.set(ws, "window");
                        clients.set("windows", []);
                        ws.send(JSON.stringify({"type": "subscribe", "target": "windows"}));
                        break;
                    
                    case "door":
                        console.info("🚪 Doors microservice connected");
                        clients.set(ws, "door");
                        clients.set("doors", []);
                        ws.send(JSON.stringify({"type": "subscribe", "target": "doors"}));
                        break;

                    case "heatpump":
                        console.info("🔥 HeatPump microservice connected");
                        clients.set(ws, "heatpump");
                        ws.send(JSON.stringify({"type": "subscribe", "target": "heatpump"}));
                        break;

                    case "thermometer":
                        console.info("🌡️ Thermometer microservice connected");
                        clients.set(ws, "thermometer");
                        ws.send(JSON.stringify({"type": "subscribe", "target": "thermometer"}));
                        break;
                }
                break;

            case "temperature":
                console.info("New temperature received from the weather microservice: " + data.value);
                temperatures.push(data.value);
                services.set("weather", data.value);
                for (let [keyWS, value] of clients) {
                    if(value == "client"){
                        keyWS.send(JSON.stringify({"type": "temperature", "value": data.value}));
                    }
                }
                break;

            case "windows":
                const windowsStates = data.states.map((window) => window.state);
                const windowsIds = data.states.map((window) => window.windowId);

                if(windows.length != windowsStates.length){
                    for (let i = 0; i < (windowsStates.length - windows.length); i++) {
                        windows.push(new Window(null, windowsStates[i]));
                    }
                }

                for (let i = 0; i < windows.length; i++) {
                    windows[i].windowId = windowsIds[i];
                    windows[i].state = windowsStates[i];
                }

                services.set("windows", windows);

                for (let [keyWS, value] of clients) {
                    if(value == "client"){
                        keyWS.send(JSON.stringify({"type": "windows", "value": windowsStates}));
                    }
                    if(value == "thermometer"){
                        keyWS.send(JSON.stringify({"type": "services", "value": Object.fromEntries(services)}));
                    }
                } 
                break;
            
            case "doors":
                const doorsStates = data.states.map((door) => door.state);
                const doorIds = data.states.map((door) => door.doorId);

                if(doors.length != doorsStates.length){
                    for (let i = 0; i < (doorsStates.length - doors.length); i++) {
                        doors.push(new Door(doorsStates[i]));
                    }
                }

                services.set("doors", doors);

                for (let [keyWS, value] of clients) {
                    if(value == "client"){
                        keyWS.send(JSON.stringify({"type": "doors", "value": doorsStates}));
                    }
                    if(value == "thermometer"){
                        keyWS.send(JSON.stringify({"type": "services", "value": Object.fromEntries(services)}));
                    }
                }
                break;
            
            case "heatpump":
                for (let [keyWS, value] of clients) {
                    if(value == "client"){
                        keyWS.send(JSON.stringify({"type": "heatpump", "value": data.state}));
                    }
                }
                break;
            
            case "thermometer":
                for (let [keyWS, value] of clients) {
                    if(value == "client"){
                        keyWS.send(JSON.stringify({"type": "thermometer", "value": data.value}));
                    }
                }
                break;
          }
        } catch (error) {
          console.error('Error during processing of the message:', error);
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
