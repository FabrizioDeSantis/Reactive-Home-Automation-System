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
```{"type": "subscribe", "source": "client"}```
indicating to the backend that is intends subscribing to the sensors' information. Once the frontend is subscribed to the backend, it will receive new information when it is available. When an error occurs, a pop up message explaining the error appears.

## Backend
It is responsible to collect information from the microservices and forward it to the frontend. It also receives requests from the latter, which are furtherly forwarded to the actuator microservice.
The backend exposes the 8000 port for WS connections.
It receives two types of messages:
  - subscription;
  - informational.

A **subscribe** message has the following structure:
```{"type": "subscribe", "source": "X"}```
where X represents the microservice subscribing to the backend. Once a subscribe message is received from a microservice, the backend in turn subscribes to the sensor's information sending a message with the same structure to it.
An **information** message has the following structure:
```{type: 'X', dateTime: DateTime.now().toISO(), value};```
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
```{error: "X"}```
while a success message is formed as:
```{result: "X"}```
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


## Execution
Docker must be installed and the engine must be running.
A single instruction is necessary:
```docker-compose up --build```
launched in the main folder.
