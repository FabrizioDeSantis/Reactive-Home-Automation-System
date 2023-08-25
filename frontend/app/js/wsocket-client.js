// import { addData } from "./acquisitions.js";
// import {myChartThermometer} from "./acquisitions.js";
// import {myChartWeather} from "./acquisitions.js"
// import {myChartHeatPump} from "./acquisitions.js";
'use strict';

// const ws = new WebSocket("ws://backend:8000");
// let buttonRefresh;
// const token = localStorage.getItem('id_token');
// if(token){
//     console.log("Loggato");
// }
// else{
//     console.log("Non loggato");
// }

(function (win){

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

    function routes(ws){
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            let buttonRefresh;
            switch(data.type){
                case "temperature":
                    const info = data.value;
                    const [time, date, temp] = info.split('/');
                    document.getElementById("temperature-weather").innerHTML = parseFloat(temp, 10).toFixed(1) + "°C";
                    window.myChartWeather.data.labels.push(date+"\n"+time);
                    window.myChartWeather.data.datasets.forEach((dataset) => {
                        dataset.data.push(temp);
                    });
                    window.myChartWeather.update();
                    // addData(myChartWeather, date, temp);
                    break;

                case "temperatures":
                    const temperatures = data.value;
                    // for(let i = 0; i < temperatures.length; i++){
                    //     addData(myChartWeather, temperatures[i][0], temperatures[i][1]);
                    // }
                    break;

                case "windows":
                    const windowsStates = data.value;
                    for (let i = 0; i < windowsStates.length; i++) {
                        waitForElementToBeAvailable("window-" + (i + 1)).then(function() {
                            document.getElementById("window-" + (i + 1)).innerHTML = windowsStates[i];
                            buttonRefresh = document.getElementById("refreshWindow " + (i + 1));
                            const cerchio = document.querySelector(".insights .window" + (i + 1) + " svg circle");
                            let chartInstance = Chart.getChart("chartWindow-" + (i+1));
                            chartInstance.data.labels.push(1);
                            switch(windowsStates[i]){
                                case "open":
                                    cerchio.style.stroke = "#41f1b6";
                                    buttonRefresh.classList.remove("active");
                                    chartInstance.data.datasets[0].data.push(2);
                                    break;
                                case "closed":
                                    cerchio.style.stroke = "#363949";
                                    buttonRefresh.classList.remove("active");
                                    chartInstance.data.datasets[0].data.push(1);
                                    break;
                                case "error":
                                    cerchio.style.stroke = "#ff7782";
                                    buttonRefresh.classList.add("active");
                                    chartInstance.data.datasets[0].data.push(0);
                                    break;
                            }
                            chartInstance.update();
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
                            let chartInstance = Chart.getChart("chartDoor-" + (i+1));
                            chartInstance.data.labels.push(1);
                            switch(doorsStates[i]){
                                case "open":
                                    cerchio.style.stroke = "#41f1b6";
                                    buttonRefresh.classList.remove("active");
                                    chartInstance.data.datasets[0].data.push(2);
                                    break;
                                case "closed":
                                    cerchio.style.stroke = "#363949";
                                    buttonRefresh.classList.remove("active");
                                    chartInstance.data.datasets[0].data.push(1);
                                    break;
                                case "error":
                                    cerchio.style.stroke = "#ff7782";
                                    buttonRefresh.classList.add("active");
                                    chartInstance.data.datasets[0].data.push(0);
                                    break;
                            }
                            chartInstance.update();
                        });
                    }
                    
                    break;
                
                case "heatpump":
                    const heatPumpInformations = data.value;
                    const [timeH, dateH, tempH, stateH] = heatPumpInformations.split('/');
                    waitForElementToBeAvailable("heatpump").then(function() {
                        document.getElementById("heatpump").innerHTML = stateH;
                        console.log(tempH);
                        document.getElementById("temperature-heatpump").innerHTML = parseFloat(tempH, 10).toFixed(1) + "°C";
                        const cerchio = document.querySelector(".insights .heatpump svg circle");
                        window.myChartHeatPump.data.labels.push(dateH+"\n"+timeH);
                        window.myChartHeatPump.data.datasets.forEach((dataset) => {
                            dataset.data.push(tempH);
                        });
                        window.myChartHeatPump.update();
                        buttonRefresh = document.getElementById("refreshHeatPump");
                        switch(stateH){
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
                    });

                    break;

                case "thermometer":
                    const infoT = data.value;
                    const [timeT, tempT] = infoT.split('-');
                    document.getElementById("temperature-room").innerHTML = parseFloat(tempT).toFixed(1) + "°C";
                    // addData(myChartThermometer, timeT, tempT);
                    break;
            }
        };
    }

    class WSClient{
        /**
         * Instances a new `WebSocket Client`.
         * @param baseUrl {string?} Optional baseUrl (in questo caso è /ws)
         */
        constructor(baseUrl) {
            this._baseUrl = baseUrl;
        }
        async init(){
            const url = document.baseURI.replace(/^http/, 'ws');
            const wsUrl = new URL(this._baseUrl + "/", url);
            const ws = new WebSocket(wsUrl);
            
            ws.onopen = function() {
                ws.send(JSON.stringify({"type": "subscribe", "source": "client"}));
            };
            routes(ws);
        }
    }

    win.WSClient ||= WSClient;

})(window);