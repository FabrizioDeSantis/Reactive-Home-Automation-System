'use strict';

import {v4 as uuid} from 'uuid';
import fetch from 'node-fetch';

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

/**
 * Initializes routes.
 * @param {Express} app Express application
 * @param {{iface: string, port: number}} config Configuration options
 */
export function routes(app, config) {

  app.post('/door', (req, resp) => {
    const {state} = req.body;

    console.debug('Attempting to create new door with state: ', {state});

    let dto = {state: state};
    makeRequest('POST', `http://door-service:8083/door`, dto, 2000).then((response) => {
        console.log('Response from service:', response.json());
        if(response.status === 400){
          resp.status(400);
          resp.json({error: "Door not added"});
        }
        else{
          resp.status(201);
          resp.json({result: "Success"});
        }
      });
  });

  app.post('/window', (req, resp) => {
    const {state} = req.body;

    console.debug('Attempting to create new window with state: ', {state});

    let dto = {state: state};
    makeRequest('POST', `http://window-service:8082/window`, dto, 3000).then((response) => {
        console.log('Response from service:', response.json());
        if(response.status === 400){
          resp.status(400);
          resp.json({error: "Window not added"});
        }
        else{
          resp.status(201);
          resp.json({result: "Success"});
        }
      });
  });

  app.put('/heatpump/state', (req, resp) => {
    let {state, actual} = req.body;

    console.debug('Attempting to update heatpump state to ', {state});

    if(state == actual || (actual === "error" && state !== "restart")) {
      resp.status(400);
      resp.json({error: "Heatpump already " + actual});
    }
    else{
      if(state === "restart"){
        state = "off";
      }
      let dto = {state: state};
      makeRequest('PUT', `http://heatpump-service:8084/heatpump/state`, dto, 3000).then((response) => {
            console.info('Response from heatpump microservice: ', response.json());
            if(response.status === 400){
              resp.status(400);
              resp.json({error: "State not changed"});
            }
            else{
              resp.status(200);
              resp.json({result: "Success"});
            }
      });
    }
  });

  app.put('/heatpump/temperatureOp', (req, resp) => {
    let {state, temperatureOp} = req.body;

    console.debug('Attempting to update heatpump operation temperature to ', {temperatureOp});

    if(state === "off" || state === "error") {
      resp.status(400);
      resp.json({error: "Heatpump state is " + state});
    }
    else{

      if(parseInt(temperatureOp, 10) > 60) {
        resp.status(400);
        resp.json({error: "Operation temperature is too high"});
      }
      else{
        let dto = {temperatureOp: temperatureOp};

        makeRequest('PUT', `http://heatpump-service:8084/heatpump/temperatureOp`, dto, 3000).then((response) => {
              console.info('Response from heatpump microservice: ', response.json());
              if(response.status === 400){
                resp.status(400);
                resp.json({error: "Operation temperature not changed"});
              }
              else{
                resp.status(200);
                resp.json({result: "Success"});
              }
        });
      }
    }
  });

  app.put('/door/:id', (req, resp) => {
    let {state, actual} = req.body;
    const idRaw = req.params.id;
    console.debug('Attempting to update door', {id: idRaw, state});
    if(state === actual || (actual === "error" && state !== "restart")) {
      resp.status(400);
      resp.json({error: 'Error'});
    }
    else{
      if(state === "restart"){
        state = "closed";
      }
      let dto = {state: state};
      const id = parseInt(idRaw, 10);
      makeRequest('PUT', `http://door-service:8083/door/${encodeURIComponent(id)}`, dto, 3000).then((response) => {
        console.log('Response from service:', response.json());
        if(response.status === 400){
          resp.status(400);
          resp.json({error: "Status not changed"});
        }
        else{
          resp.status(200);
          resp.json({result: "Success"});
        }
      });
    }
  });

  app.put('/window/:id', (req, resp) => {
    let {state, actual} = req.body;
    const idRaw = req.params.id;
    console.debug('Attempting to update window', {id: idRaw, state});
    if(state === actual || (actual === "error" && state !== "restart")) {
      resp.status(400);
      resp.json({error: "Actual state already " + actual});
      return;
    }
    else{
      if(state === "restart"){
        state = "closed";
      }
      let dto = {state: state};
      const id = parseInt(idRaw, 10);
      makeRequest('PUT', `http://window-service:8082/window/${encodeURIComponent(id)}`, dto, 3000).then((response) => {
            console.info('Response from window:', response.json());
            if(response.status === 400){
              resp.status(400);
              resp.json({error: "Status not changed"});
            }
            else{
              resp.status(200);
              resp.json({result: "Success"});
            }
        });
    }
});
}