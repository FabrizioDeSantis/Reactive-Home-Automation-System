'use strict';

import {v4 as uuid} from 'uuid';
import fetch from 'node-fetch';

async function makeRequest(type, url, data) {
  try {
    const response = await fetch(url, {
      method: type,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error:', error);
    return { error: 'Something went wrong' };
  }
}

/**
 * Initializes routes.
 * @param {Express} app Express application
 * @param {{iface: string, port: number}} config Configuration options
 */
export function routes(app, config) {

  app.put('/door', (req, resp) => {
    const {state, actual} = req.body;
    console.info("Changing door state to " + state);
    console.info("Actual state " + actual);
    if(state === actual) {
      resp.json({error: "Actual status already " + actual});
    }
    else{
      let dto = {state: state};
      makeRequest('PUT', "http://door-service:8083/door", dto).then((response) => {
        console.log('Response from server:', response);
      });
    }
  });

  app.put('/window/:id', (req, resp) => {
    const {state, actual} = req.body;
    const idRaw = req.params.id;
    console.debug('Attempting to update window', {id: idRaw, state});
    if(state == actual) {
      resp.json({error: "Actual state already " + actual});
    }
    else{
      let dto = {state: state};
      const id = parseInt(idRaw, 10);
      makeRequest('PUT', `http://window-service:8082/window/${encodeURIComponent(id)}`, dto).then((response) => {
            console.info('Response from actuator:', response);
            resp.status(304);
            resp.json({error: "Status not changed"});
        });
    }
});
}