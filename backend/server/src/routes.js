'use strict'
import fetch from 'node-fetch';

function sequencer() {
    let i = 1;
    return function () {
        const n = i;
        i++;
        return n;
    }
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
    constructor(doorId, state) {
        this._doorId = doorId;
        this._state = state;
    }

    //@formatter:off
    get doorId() { return this._doorId; }
    set doorId(doorId) { this._doorId = doorId; }
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
const heatpumpInformations = [];
const stateAndDatesDoors = [];
const stateAndDatesWindows = [];
const clients = new Map();
const temperaturesAndDatesWeather = [];
const tempAndDatesThermometer = [];
let heatPump = null;
/////
const windowsMap = new Map();
const doorsMap = new Map();

// windowsMap.set(1, [{date: "2023-08-25", time:"12:00:00", state: "open"}]);
/////

function toDTOWindow(window) {
    return {
        id: window.windowId,
        state: window.state
    };
}

function toDTODoor(doors) {
    return {
        id: doors.doorId,
        state: doors.state
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

function retrieveDate(dateRaw){
    let completeDate = new Date(dateRaw);

    let hours = completeDate.getHours();
    let minutes = completeDate.getMinutes();
    let seconds = completeDate.getSeconds();

    let year = completeDate.getFullYear();
    let month = completeDate.getMonth() + 1;
    let day = completeDate.getDate();

    let time = `${hours}:${minutes}:${seconds}`;
    let date = `${day}-${month}-${year}`;
    if(month.toString().length == 1){
        month = "0" + month;
    }
    if(day.toString().length == 1){
        day = "0" + day;
    }

    time = `${hours}:${minutes}:${seconds}`;
    date = `${year}-${month}-${day}`;

    return {time: time, date: date};
}

async function makeRequest(type, url, data) {
    try {
      const response = await fetch(url, {
        method: type,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response;
      return result;
    } catch (error) {
      console.error('Error:', error);
      return { error: 'Something went wrong' };
    }
}

function sendAllData(){
    // const windowsStates = windows.map((window) => window.state);
    // const doorsStates = doors.map((door) => door.state);

    for (let [keyWS, value] of clients) {
        if(value == "client"){
            console.log("Sending all data to frontend");

            keyWS.send(JSON.stringify({"type": "windows", "value": stateAndDatesWindows[stateAndDatesWindows.length-1]}));
            keyWS.send(JSON.stringify({"type": "temperature", "value": temperaturesAndDatesWeather[temperaturesAndDatesWeather.length-1]}));
            keyWS.send(JSON.stringify({"type": "thermometer", "value": tempAndDatesThermometer[tempAndDatesThermometer.length-1]}));
            keyWS.send(JSON.stringify({"type": "heatpump", "value": heatpumpInformations[heatpumpInformations.length-1]}));
            keyWS.send(JSON.stringify({"type": "doors", "value": stateAndDatesDoors[stateAndDatesDoors.length-1]}));
        }
    } 
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
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          let temp = null;
          let resultDate = null;
          let combinedInfo = null;
          switch(data.type){
            case "subscribe":
                switch(data.source){
                    case "client":
                        console.info("🙍🏻‍♂️ Frontend connected");
                        clients.set(ws, "client");
                        sendAllData();
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
                        clients.set("heatpump", null);
                        ws.send(JSON.stringify({"type": "subscribe", "target": "heatpump"}));
                        break;

                    case "thermometer":
                        console.info("🌡️ Thermometer microservice connected");
                        clients.set(ws, "thermometer");
                        ws.send(JSON.stringify({"type": "services", "value": Object.fromEntries(services)}));
                        ws.send(JSON.stringify({"type": "subscribe", "target": "thermometer"}));
                        break;
                }
                break;

            case "temperature":
                console.info("New temperature received from the weather microservice: " + data.value);
                temp = data.value;
                resultDate = retrieveDate(data.dateTime);

                console.info("New temperature received from the weather microservice: " + temp);
                console.info("Combined time: " + resultDate.time);
                console.info("Combined date: " + resultDate.date);

                services.set("weather", data.value);

                temperaturesAndDatesWeather.push({date: resultDate.date, time: resultDate.time, temp: temp});
                
                services.set("weather", data.value);
                for (let [keyWS, value] of clients) {
                    if(value == "client"){
                        keyWS.send(JSON.stringify({"type": "temperature", "value": {date: resultDate.date, time: resultDate.time, temp: temp}}));
                    }
                    if(value == "thermometer"){
                        keyWS.send(JSON.stringify({"type": "services", "value": Object.fromEntries(services)}));
                    }
                }

                break;

            case "windows":
                const windowsStates = data.states.map((window) => window.state);
                const windowsIds = data.states.map((window) => window.windowId);
                const numWindows = windowsStates.length - windows.length;

                resultDate = retrieveDate(data.dateTime);

                console.info("New states received from the windows microservice: " + windowsStates);
                console.info("Combined time: " + resultDate.time);
                console.info("Combined date: " + resultDate.date);

                if(windows.length != windowsStates.length){
                    for (let i = 0; i < numWindows; i++) {
                        windows.push(new Window(null, null));
                    }
                }

                for (let i = 0; i < windows.length; i++) {
                    windows[i].windowId = windowsIds[i];
                    windows[i].state = windowsStates[i];
                    let current = windowsMap.get(windowsIds[i]);
                    if(current){
                        const extData = windowsMap.get(windowsIds[i]);
                        extData.push({date: resultDate.date, time: resultDate.time, state: windowsStates[i]});
                    }
                    else{
                        windowsMap.set(windowsIds[i], [{date: resultDate.date, time: resultDate.time, state: windowsStates[i]}]);
                    }
                }

                services.set("windows", windows);
                combinedInfo = [resultDate, windowsIds, windowsStates];
                stateAndDatesWindows.push(combinedInfo);

                for (let [keyWS, value] of clients) {
                    if(value == "client"){
                        keyWS.send(JSON.stringify({"type": "windows", "value": combinedInfo}));
                    }
                    if(value == "thermometer"){
                        keyWS.send(JSON.stringify({"type": "services", "value": Object.fromEntries(services)}));
                    }
                } 
                break;
            
            case "doors":
                const doorsStates = data.states.map((door) => door.state);
                const doorsIds = data.states.map((door) => door.doorId);

                resultDate = retrieveDate(data.dateTime);

                console.info("New states received from the doors microservice: " + doorsStates);
                console.info("Combined time: " + resultDate.time);
                console.info("Combined date: " + resultDate.date);

                if(doors.length != doorsStates.length){
                    for (let i = 0; i < (doorsStates.length - doors.length); i++) {
                        doors.push(new Door(null, null));
                    }
                }

                for (let i = 0; i < doors.length; i++) {
                    doors[i].doorId = doorsIds[i];
                    doors[i].state = doorsStates[i];
                    let current = doorsMap.get(doorsIds[i]);
                    if(current){
                        const extDataDoors = doorsMap.get(doorsIds[i]);
                        extDataDoors.push({date: resultDate.date, time: resultDate.time, state: doorsStates[i]});
                    }
                    else{
                        doorsMap.set(doorsIds[i], [{date: resultDate.date, time: resultDate.time, state: doorsStates[i]}]);
                    }
                }

                services.set("doors", doors);
                combinedInfo = [resultDate, doorsStates];
                stateAndDatesDoors.push(combinedInfo);

                for (let [keyWS, value] of clients) {
                    if(value == "client"){
                        //keyWS.send(JSON.stringify({"type": "doors", "value": doorsStates}));
                        keyWS.send(JSON.stringify({"type": "doors", "value": combinedInfo}));
                    }
                    if(value == "thermometer"){
                        keyWS.send(JSON.stringify({"type": "services", "value": Object.fromEntries(services)}));
                    }
                }
                break;
            
            case "heatpump":
                const state = data.value.state;
                const temperatureOp = parseInt(data.value.temperatureOp, 10);
                
                resultDate = retrieveDate(data.dateTime);

                console.info("New temperature received from the heatpump microservice: " + temperatureOp);
                console.info("Combined time heatpump: " + resultDate.time);
                console.info("Combined date heatpump: " + resultDate.date);

                if(heatPump === null){
                    heatPump = new HeatPump(state, temperatureOp);
                }
                else{
                    heatPump.state = state;
                    heatPump.temperatureOp = temperatureOp;
                }

                heatpumpInformations.push({date: resultDate.date, time: resultDate.time, temp: temperatureOp, state: state});

                services.set("heatpump", heatPump);

                for (let [keyWS, value] of clients) {
                    if(value == "client"){
                        keyWS.send(JSON.stringify({"type": "heatpump", "value": {date: resultDate.date, time: resultDate.time, temp: temperatureOp, state: state}}));
                    }
                    if(value == "thermometer"){
                        keyWS.send(JSON.stringify({"type": "services", "value": Object.fromEntries(services)}));
                    }
                }
                break;
            
            case "thermometer":
                console.info("New temperature received from the thermometer microservice: " + data.roomTemp);
                const tempT = data.roomTemp;

                resultDate = retrieveDate(data.dateTime);

                console.info("New temperature received from the thermometer microservice: " + tempT);
                console.info("Combined time: " + resultDate.time);
                console.info("Combined date: " + resultDate.date);
                
                services.set("thermometer", data.roomTemp);
                
                tempAndDatesThermometer.push({date: resultDate.date, time: resultDate.time, temp: tempT});

                for (let [keyWS, value] of clients) {
                    if(value == "client"){
                        //keyWS.send(JSON.stringify({"type": "thermometer", "value": data.value}));
                        keyWS.send(JSON.stringify({"type": "thermometer", "value": {date: resultDate.date, time: resultDate.time, temp: tempT}}));
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
        oidc.tokens(req, resp);
    });

    app.get("/windows", authenticate, (req, resp) => {
        const objects = windows.map(toDTOWindow);
        resp.json({
            total: objects.length,
            results: objects
        });
    });

    app.get("/windowData/:id", authenticate, (req, resp) => {
        const idRaw = req.params.id;
        if (!isInteger(idRaw)) {
            resp.status(400);
            resp.json({error: 'Invalid door identifier'});
            return;
        }
        const id = parseInt(idRaw, 10)
        const objects = windowsMap.get(id);
        console.log(objects);
        resp.json({
            total: objects.length,
            results: objects
        });
    });

    app.get("/doorData/:id", authenticate, (req, resp) => {
        const idRaw = req.params.id;
        if (!isInteger(idRaw)) {
            resp.status(400);
            resp.json({error: 'Invalid door identifier'});
            return;
        }
        const id = parseInt(idRaw, 10)
        const objects = doorsMap.get(id);
        console.log(objects);
        resp.json({
            total: objects.length,
            results: objects
        });
    });

    app.get("/heatpumpData", authenticate, (req, resp) => {
        const objects = heatpumpInformations;
        resp.json({
            total: objects.length,
            results: objects
        });
    });

    app.get("/thermometerData", authenticate, (req, resp) => {
        const objects = tempAndDatesThermometer;
        resp.json({
            total: objects.length,
            results: objects
        });
    });

    app.get("/weatherData", authenticate, (req, resp) => {
        const objects = temperaturesAndDatesWeather;
        resp.json({
            total: objects.length,
            results: objects
        });
    });

    app.get("/doors", authenticate, (req, resp) => {
        const objects = doors.map(toDTODoor);
        resp.json({
            total: objects.length,
            results: objects
        });
    });

    app.get("/heatpump", authenticate, (req, resp) => {
        const object = heatPump;
        resp.json({
            result: object
        });
    });

    app.put('/heatpump/state', authenticate, (req, resp) => {
        const {state} = req.body;

        console.debug('Attempting to change heatpump state to ' + state);

        let dto = {state: state, actual: heatPump.state};

        makeRequest('PUT', `http://actuator:8086/heatpump/state`, dto).then((response) => {
            console.log('Response from actuator:', response);
            if(response.status === 408){
              resp.status(408);
              resp.json({error: "Request timed out"});
              return;
            }
            else if(response.status === 400){
                resp.status(400);
                resp.json({error: "Heatpump state not changed"});
                console.info("Heatpump state not updated");
                return;
            }
            else {
                resp.status(200);
                resp.json({result: "Heatpump state successfully updated"});
                heatPump.state = state;
                console.info('Heatpump state successfully updated: ', {heatPump});
            }
        });
    });

    app.put('/heatpump/temperatureOp', authenticate, (req, resp) => {
        const {temperatureOp} = req.body;

        console.debug('Attempting to change heatpump operation temperature to ' + temperatureOp);

        let dto = {state: heatPump.state, temperatureOp: temperatureOp};

        makeRequest('PUT', `http://actuator:8086/heatpump/temperatureOp`, dto).then((response) => {
            console.log('Response from actuator:', response);
            if(response.status === 408){
              resp.status(408);
              resp.json({error: "Request timed out"});
              return;
            }
            else if(response.status === 400){
                resp.status(400);
                resp.json({error: "Operation temperature not changed"});
                console.info("Heatpump operation temperature not updated");
                return;
            }
            else {
                resp.status(200);
                resp.json({result: "Operation temperature successfully updated"});
                heatPump.temperatureOp = temperatureOp;
                console.info('Heatpump operation temperature successfully updated: ', {heatPump});
            }
        });
    })

    app.put('/window/:id', authenticate, (req, resp) => {
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

        if (!window) {
            resp.status(404);
            resp.json({error: 'Window not found'});
            return;
        }
        let dto = {state: state, actual: window.state};
        makeRequest('PUT', `http://actuator:8086/window/${encodeURIComponent(id)}`, dto).then((response) => {
            console.info('Response from actuator:', response.json());
            if(response.status === 400){
                resp.status(400);
                resp.json({error: "Window state not changed"});
                return;
            }
            else if(response.status === 408){
                resp.status(408);
                resp.json({error: "Requeste timed out"});
                return;
            }
            else {
                resp.status(200);
                resp.json({result: "Windows state successfully changed"});
                window.state = state;
                console.info('Window successfully updated', {window});
            }
        });
    });

    app.post('/door', authenticate, (req, resp) => {
        const {state} = req.body;
        console.log("Attempting to create a new door", {state: state});
        let dto = {state: state};

        makeRequest('POST', `http://actuator:8086/door`, dto).then((response) => {
            console.info('Response from actuator:', response.json());
            if(response.status === 408){
              resp.status(408);
              resp.json({error: "Request timed out"});
              return;
            }
            else if(response.status === 400){
                resp.status(400);
                resp.json({error: "Door not added"});
                return;
            }
            else {
                resp.status(201);
                const door = new Door(doors.length, state);
                resp.json(toDTODoor(door));
            }
        });
    });

    app.post('/window', authenticate, (req, resp) => {
        const {state} = req.body;
        console.log("Attempting to create a new window", {state: state});
        let dto = {state: state};

        makeRequest('POST', `http://actuator:8086/window`, dto).then((response) => {
            console.info('Response from actuator:', response.json());
            if(response.status === 408){
              resp.status(408);
              resp.json({error: "Request timed out"});
              return;
            }
            else if(response.status === 400){
                resp.status(400);
                resp.json({error: "Window not added"});
                return;
            }
            else {
                resp.status(201);
                const window = new Window(windows.length, state);
                resp.json(toDTOWindow(window));
            }
        });
    });

    app.put('/door/:id', authenticate, (req, resp) => {
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
        if (!door) {
            resp.status(404);
            resp.json({error: 'Door not found'});
            return;
        }
        let dto = {state: state, actual: door.state};
        
        makeRequest('PUT', `http://actuator:8086/door/${encodeURIComponent(id)}`, dto).then((response) => {
            console.log('Response from actuator:', response.json());
            if(response.status === 408){
              resp.status(408);
              resp.json({error: "Request timed out"});
              return;
            }
            else if(response.status === 400){
                resp.status(400);
                resp.json({error: "Door state not changed"});
                return;
            }
            else {
                resp.status(200);
                resp.json({result: "Door state successfully changed"});
            }
        });

        door.state = state;
        console.info('Door successfully updated', {door});
    });

}
