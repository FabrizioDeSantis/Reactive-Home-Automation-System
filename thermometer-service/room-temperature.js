function computeRoomTemperature(externalTemperature, windowsStates, doorsStates, temperatureOp, thermometerTemperature, maxTemperature) {

    // const externalTemperature = getTemperatureEsterna();
    // const windowsStates = getStatoFinestre();
    // const doorsStates = getStatoPorte();
    // const temperatureOp = getStatoPompaDiCalore();
    // const thermometerTemperature = getTemperaturaTermometro();

    let roomTemperature = thermometerTemperature;

    // const openWindows = Object.values(windowsStates).reduce((count, state) => count + (state === 'open' ? 1 : 0), 0);
    // const openDoors = Object.values(doorsStates).reduce((count, state) => count + (state === 'open' ? 1 : 0), 0);


    let openWindows = 0, openDoors = 0;
    
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

    const decrMultiplier = 0.1 * (openWindows + openDoors);
    const incrMultiplier = 0.1;

    const temperatureDifference = roomTemperature - externalTemperature;
    
    roomTemperature = Math.min(roomTemperature - temperatureDifference * decrMultiplier + temperatureOp * incrMultiplier, maxTemperature);
    
    console.info("Num finestre aperte " + openWindows);
    console.info("Num porte aperte " + openDoors);

    return roomTemperature;
}

export function actualRoomTemperature(sensorsInformation, currentTemperature){
    const extTemp = sensorsInformation.weather;
    const winStates = sensorsInformation.windows;
    const dStates = sensorsInformation.doors;
    const tempOp = sensorsInformation.heatpump._temperatureOp;
    const maxTemperature = 25;
    const temperature = computeRoomTemperature(extTemp, winStates, dStates, tempOp, currentTemperature, maxTemperature);

    return temperature;
}