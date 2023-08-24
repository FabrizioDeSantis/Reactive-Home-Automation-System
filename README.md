# Reactive Home Automation System
An automated system, based on Docker, composed of:
  - a **frontend**, that graphically visualizes the main information about sensors' state;
  - a **backend**, that receives the requests from the frontend;
  - an **actuator**, that acts as an intermediator for REST calls;
  - several **sensors**, that provide information of different nature.
In order to be able to use the application, **authentication** is required; particularly, social login with Google have been implemented.
The application is accessible via HTTP at this url: http://desantis-invitto.soi2223.unipr.it:8080.

## Frontend
It is used by the user to access to and use the Web application, provided it has been authenticated. It is divided into three main sections:
  - a **dashboard**, used to visualize the available sensors, their state and specific information;
  - a **control panel**, used by the user to give commands to the sensors (e.g. open/close door X, set operation temperature of the heatpump, ...);
  - a section for **graphs**, which displays the trend of the external, internal and heat pump temperatures and the history of the states of the sensors.

Each sensor has a dedicated component that is dinamically created once the sensor is added. The frontend is connected to the backend via Web Socket, from which it receives sensors' information and to which it forwards commands.
When the user connects to the url provided above, the frontend sends the following JSON message to the backend:
```javascript
{"type": "subscribe", "source": "client"}
```
indicating to the backend that is intends subscribing to the sensors' information. Once the frontend is subscribed to the backend, it will receive new information when it is available. When an error occurs, a pop up message explaining the error appears.

## Backend
It is responsible to collect information from the microservices and forward it to the frontend. It also receives requests from the latter, which are furtherly forwarded to the actuator microservice.
The backend exposes the 8000 port for WS connections.
It receives two types of messages:
  - subscription;
  - informational.

A **subscribe** message has the following structure:
```javascript
{"type": "subscribe", "source": "X"}
```
where X represents the microservice subscribing to the backend. Once a subscribe message is received from a microservice, the backend in turn subscribes to the sensor's information sending a message with the same structure to it.
An **information** message has the following structure:
```javascript
{type: 'X', dateTime: DateTime.now().toISO(), value}
```
where X is the microservice and value contains all the information of the sensor.

## Actuator
It is managed by a microservice that exposes port 8086. Its purpose is to act as an intermediator for REST calls: it receives the requests from the backend, it performs some validity checks and then forwards the request (if valid) to the correct microservice.
The following function is used to forward the request to a specific microservice:
```javascript
async function makeRequest(type, url, data, timeout) {
  try{
    const fetchPromise = fetch(url, {
      method: type,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timed out'));
      }, timeout);
    });
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    const result = await response;
    return result;
  }catch(e){
    console.error('Error:', e);
    return { e: 'Something went wrong' };
  }
}
```
Since a microservice can simulate downtime periods, an error is generated if the request does not receive a response within a specified time.
The outcome of a request is communicated to the backend and it can be either:
  - an **error**;
  - a **success**.

An error message has the following structure:
```javascript
{error: "X"}
```
while a success message is formed as:
```javascript
{result: "X"}
```
In both cases X represents the message describing the error or the successful result; furthermore a status code is sent with the response too.

## Sensors
They are managed by dedicated microservices, that expose unique ports.
The following table illustrates the available sensors:
| Microservice       | Exposed port | Description                                                |
|--------------------|--------------|------------------------------------------------------------|
| weather-service    | 8081         | It provides information about the external temperature     |
| window-service     | 8082         | It manages the state of a certain number of window sensors |
| door-service       | 8083         | It manages the state of a certain number of door sensors   |
| heat-pump-service  | 8084         | It manages the state of a heatpump, including its operation temperature |
| thermometer-service| 8085         | It simulates the trend of the room temperature according to the states of the other sensors and the external temperature |
Main properties of microservices:
| Property   | Description                                     | Available for        |
|------------|-------------------------------------------------|----------------------|
|            |                                                 | 🌦️ | 🚪 | 🪟 | 🌡️ | 🔥 |
|------------|-------------------------------------------------|----|---|----|----|---|
| ERROR_PROB | The probability that an error occurs            | ✔  | ✔ | ✔  | ✔  | ✔ |
| DOWN_PROB  | The probability that the microservice goes down | ✘  | ✔ | ✔  | ✘  | ✔ |
| DELAY_PROB | The probability that a message will be delayed  | ✔  | ✔ | ✔  | ✔  | ✔ |
| FREQUENCY  | The frequency of dispatch of messages           | ✔  | ✘ | ✘  | ✔  | ✘ |

### Window service
It is responsible of managing a certain number of windows, that can vary dynamically.
Each window is characterized by a numeric id and a state, which can be either "open", "closed" or "error". The microservice keeps track of state changes of the windows due to:
  - errors: periodically the microservice simulates the possibility of windows going in the "error" state;
  - requests coming from the frontend (received by the actuator): the user can triggerate the opening or closing of a window.

Furthermore, periodically the microservice simulates the possibility of unavailability. During this period of time, any request is not satisfied.

### Door service
It is responsible of managing a certain number of doors, that can vary dynamically.
Each door is characterized by a numeric id and a state, which can be either "open", "closed" or "error". The microservice keeps track of state changes of the doors due to:
  - errors: periodically the microservice simulates the possibility of doors going in the "error" state;
  - requests coming from the frontend (received by the actuator): the user can triggerate the opening or closing of a door.

Furthermore, periodically the microservice simulates the possibility of unavailability. During this period of time, any request is not satisfied.

### Heatpump service
It is responsible of managing a heatpump, that is characterized by a state, which can be either "on", "off" or "error", and a operation temperature, expressed in °C, which must be in the range [0, 60]. The microservice keeps track of state changes of the heatpump due to:
  - errors: periodically the microservice simulates the possibility of the heatpump going in the "error" state;
  - requests coming from the frontend (received by the actuator): the user can triggerate the power on or off of the heatpump.

The user can also modify the operation temperature, that of couse must satisfy the constraint mentioned above.
Furthermore, periodically the microservice simulates the possibility of unavailability. During this period of time, any request is not satisfied.

### Thermometer service
It is responsible of the simulation of the room temperature according to the states of the other sensors and the weather conditions. The base temperature is set to 20°C.
The room temperature is computed periodically calling the following function:
```javascript
function computeRoomTemperature(externalTemperature, windowsStates, doorsStates, heatPumpState, thermometerTemperature, maxTemperature) {

    let roomTemperature = thermometerTemperature;

    let openWindows = 0, openDoors = 0, temperatureOp = 0;
    
    for(let state in windowsStates){
        if(windowsStates[state]._state === 'open'){
            openWindows++;
        }
    }

    for(let state in doorsStates){
        if(doorsStates[state]._state === 'open'){
            openDoors++;
        }
    }

    const decrMultiplier = 0.01 * (openWindows + openDoors);
    const incrMultiplier = 0.01;

    if(heatPumpState != undefined){
        temperatureOp = heatPumpState._temperatureOp;
    }
    if(externalTemperature == null){
        externalTemperature = 0;
    }

    const temperatureDifference = roomTemperature - externalTemperature;
    
    roomTemperature = Math.min(roomTemperature - temperatureDifference * decrMultiplier + temperatureOp * incrMultiplier, maxTemperature);
 
    return roomTemperature;
}
```
in which open doors and windows play the role of bringing the temperature closer to the external one, while the heatpump is responsible only for increasing the temperature.
The microservice periodically computes the current room temperature and it sends it to the backend only if the new value is different from the previous one.

### Weather service
It is responsible of periodically send the information regarding the external temperature.
For more information consult the documentation at the following link: https://github.com/SOI-Unipr/weather-service.

## Execution
Docker must be installed and the engine must be running.
A single instruction is necessary:
```console
docker-compose up --build
```
launched in the main folder.
