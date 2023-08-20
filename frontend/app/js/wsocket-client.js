import { addData } from "./acquisitions.js";
import {myChartThermometer} from "./acquisitions.js";
import {myChartWeather} from "./acquisitions.js";

const ws = new WebSocket("ws://backend:8000");
let buttonRefresh;

ws.onopen = function() {
    ws.send(JSON.stringify({"type": "subscribe", "source": "client"}));
};

function waitForElementToBeAvailable(elementId) {
    return new Promise(function(resolve) {
        var checkElementInterval = setInterval(function() {
            var elemento = document.getElementById(elementId);
            if (elemento) {
                clearInterval(checkElementInterval);
                resolve(elemento);
            }
        }, 100);
    });
}

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch(data.type){
        case "temperature":
            const info = data.value;
            const [time, temp] = info.split('-');
            document.getElementById("temperature-weather").innerHTML = parseFloat(temp, 10).toFixed(1) + "°C";
            addData(myChartWeather, time, temp);
            break;

        case "temperatures":
            console.log(data.value);
            // const temperatures = data.value;
            // for(let i = 0; i < temperatures.length; i++){
            //     addData(myChartWeather, 1, temperatures[i]);
            // }
            break;

        case "windows":
            const windowsStates = data.value;
            for (let i = 0; i < windowsStates.length; i++) {
                waitForElementToBeAvailable("window-" + (i + 1)).then(function() {
                    document.getElementById("window-" + (i + 1)).innerHTML = windowsStates[i];
                    buttonRefresh = document.getElementById("refreshWindow " + (i + 1));
                    const cerchio = document.querySelector(".insights .window" + (i + 1) + " svg circle");
                    switch(windowsStates[i]){
                        case "open":
                            cerchio.style.stroke = "#41f1b6";
                            buttonRefresh.classList.remove("active");
                            break;
                        case "closed":
                            cerchio.style.stroke = "#363949";
                            buttonRefresh.classList.remove("active");
                            break;
                        case "error":
                            cerchio.style.stroke = "#ff7782";
                            buttonRefresh.classList.add("active");
                            break;
                    }
                });
            }
            break;

        case "doors":
            const doorsStates = data.value;
            for (let i = 0; i < doorsStates.length; i++) {
                waitForElementToBeAvailable("door-" + (i + 1)).then(function() {
                    document.getElementById("door-" + (i + 1)).innerHTML = doorsStates[i];
                    buttonRefresh = document.getElementById("refreshDoor " + (i + 1));
                    const cerchio = document.querySelector(".insights .door" + (i + 1) + " svg circle");
                    switch(doorsStates[i]){
                        case "open":
                            cerchio.style.stroke = "#41f1b6";
                            buttonRefresh.classList.remove("active");
                            break;
                        case "closed":
                            cerchio.style.stroke = "#363949";
                            buttonRefresh.classList.remove("active");
                            break;
                        case "error":
                            cerchio.style.stroke = "#ff7782";
                            buttonRefresh.classList.add("active");
                            break;
                    }
                });
            }
            
            break;
        
        case "heatpump":
            const heatPumpInformations = data.value;
            const tOp = parseInt(heatPumpInformations.temperatureOp, 10)
            document.getElementById("heatpump").innerHTML = heatPumpInformations.state;
            document.getElementById("temperature-heatpump").innerHTML = tOp.toFixed(1) + "°C";
            const cerchio = document.querySelector(".insights .heatpump svg circle");
            buttonRefresh = document.getElementById("refreshHeatPump");
            switch(heatPumpInformations.state){
                case "on":
                    cerchio.style.stroke = "#41f1b6";
                    buttonRefresh.classList.remove("active");
                    break;
                case "off":
                    cerchio.style.stroke = "#363949";
                    buttonRefresh.classList.remove("active");
                    break;
                case "error":
                    cerchio.style.stroke = "#ff7782";
                    buttonRefresh.classList.add("active");
                    break;
            }
            break;

        case "thermometer":
            const infoT = data.value;
            const [timeT, tempT] = infoT.split('-');
            document.getElementById("temperature-room").innerHTML = parseFloat(tempT, 10).toFixed(1) + "°C";
            //document.getElementById("temperature-weather").innerHTML = data.value.toFixed(1) + "°C";
            //addData(myChartWeather, time, temp);
            document.getElementById("temperature-room").innerHTML = parseFloat(tempT, 10).toFixed(1) + "°C";
            addData(myChartThermometer, timeT, tempT);
            break;
    }
};