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

export function actualRoomTemperature(sensorsInformation, currentTemperature, maxTemperature){
    const extTemp = sensorsInformation.weather;
    const winStates = sensorsInformation.windows;
    const dStates = sensorsInformation.doors;
    const heatPumpState = sensorsInformation.heatpump;

    const temperature = computeRoomTemperature(extTemp, winStates, dStates, heatPumpState, currentTemperature, maxTemperature);

    return temperature;
}