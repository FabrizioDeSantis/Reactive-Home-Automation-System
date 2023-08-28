'use strict';

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
        const timeoutError = new Error('Request timed out');
        timeoutError.status = 408;
        reject(timeoutError);
      }, timeout);
    });
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    const result = await response;
    return result;
  }catch(e){
    console.error('Error:', e);
    if(e.status){
      return { status: e.status, message: 'Something went wrong' };
    }
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
    makeRequest('POST', `http://door-service:8083/door`, dto, 3000).then((response) => {
        console.log('Response from service:', response);
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
        else{
          resp.status(201);
          resp.json({result: "Door successfully added"});
        }
      });
  });

  app.post('/window', (req, resp) => {
    const {state} = req.body;

    console.debug('Attempting to create new window with state: ', {state});

    let dto = {state: state};
    makeRequest('POST', `http://window-service:8082/window`, dto, 3000).then((response) => {
        console.log('Response from service:', response);
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
        else{
          resp.status(201);
          resp.json({result: "Window successfully added"});
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
            console.info('Response from heatpump microservice: ', response);
            if(response.status === 408){
              resp.status(408);
              resp.json({error: "Request timed out"});
              return;
            }
            else if(response.status === 400){
              resp.status(400);
              resp.json({error: "Heatpump state not changed"});
              return;
            }
            else{
              resp.status(200);
              resp.json({result: "Heatpump state successfully changed"});
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
      return;
    }
    else{

      if(parseInt(temperatureOp, 10) > 60) {
        resp.status(400);
        resp.json({error: "Operation temperature is too high"});
        return;
      }
      else if(parseInt(temperatureOp, 10) < 0){
        resp.status(400);
        resp.json({error: "Operation temperature must be positive"})
        return;
      }
      else{
        let dto = {temperatureOp: temperatureOp};

        makeRequest('PUT', `http://heatpump-service:8084/heatpump/temperatureOp`, dto, 3000).then((response) => {
              console.info('Response from heatpump microservice: ', response);
              if(response.status === 408){
                resp.status(408);
                resp.json({error: "Request timed out"});
                return;
              }
              else if(response.status === 400){
                resp.status(400);
                resp.json({error: "Operation temperature not changed"});
                return;
              }
              else{
                resp.status(200);
                resp.json({result: "Operation temperature successfully changed"});
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
      resp.json({error: 'Error updating door state'});
    }
    else{
      if(state === "restart"){
        state = "closed";
      }
      let dto = {state: state};
      const id = parseInt(idRaw, 10);
      makeRequest('PUT', `http://door-service:8083/door/${encodeURIComponent(id)}`, dto, 3000).then((response) => {
        console.log('Response from service:', response);
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
        else{
          resp.status(200);
          resp.json({result: "State of door " + id + " successfully changed"});
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
            console.info('Response from window:', response);
            if(response.status === 408){
              resp.status(408);
              resp.json({error: "Request timed out"});
              return;
            }
            else if(response.status === 400){
              resp.status(400);
              resp.json({error: "Window state not changed"});
              return;
            }
            else{
              resp.status(200);
              resp.json({result: "State of window " + id + " successfully changed"});
            }
        });
    }
});
}