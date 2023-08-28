'use strict';

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
            let filtered = false;
            const filterBtn = document.querySelector("#filterDate");
            filterBtn.classList.forEach(name => {
                if(name == "active"){
                    filtered = true;
                }
            });
            let sample = null;
            let date = new Date(Date.now());
            date = date.toISOString();
            date = date.slice(0, 10);;
            let buttonRefresh;
            switch(data.type){
                case "temperature":
                    const weatherInfo = data.value;
                    document.getElementById("temperature-weather").innerHTML = parseFloat(weatherInfo.temp, 10).toFixed(1) + "°C";
                    let chartInstance = Chart.getChart("chartWeather");
                    sample = chartInstance.data.labels[0];
                    if(!filtered && sample === undefined){
                        chartInstance.data.labels.push(weatherInfo.date+"\n"+weatherInfo.time);
                        chartInstance.data.datasets[0].data.push(weatherInfo.temp);
                        chartInstance.update();
                    }
                    if(sample !== undefined){
                        if(date == sample.slice(0, 10)){
                            chartInstance.data.labels.push(weatherInfo.date+"\n"+weatherInfo.time);
                            chartInstance.data.datasets[0].data.push(weatherInfo.temp);
                            chartInstance.update();
                        }
                    }
                    break;

                case "windows":
                    const windowsDate = data.value[0];
                    const windowsStates = data.value[2];
                    for (let i = 0; i < windowsStates.length; i++) {
                        waitForElementToBeAvailable("window-" + (i + 1)).then(function() {
                            document.getElementById("window-" + (i + 1)).innerHTML = windowsStates[i];
                            buttonRefresh = document.getElementById("refreshWindow " + (i + 1));
                            const cerchio = document.querySelector(".insights .window" + (i + 1) + " svg circle");
                            let chartInstance = Chart.getChart("chartWindow-" + (i+1));
                            sample = chartInstance.data.labels[0];
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
                            if(!filtered && sample === undefined){
                                chartInstance.data.labels.push(windowsDate.date+"\n"+windowsDate.time);
                                switch(windowsStates[i]){
                                    case "open":
                                        chartInstance.data.datasets[0].data.push(2);
                                        break;
                                    case "closed":
                                        chartInstance.data.datasets[0].data.push(1);
                                        break;
                                    case "error":
                                        chartInstance.data.datasets[0].data.push(0);
                                        break;
                                }
                                chartInstance.update();
                            }
                            if(sample !== undefined){
                                if(date == sample.slice(0, 10)){
                                    chartInstance.data.labels.push(windowsDate.date+"\n"+windowsDate.time);
                                    switch(windowsStates[i]){
                                        case "open":
                                            chartInstance.data.datasets[0].data.push(2);
                                            break;
                                        case "closed":
                                            chartInstance.data.datasets[0].data.push(1);
                                            break;
                                        case "error":
                                            chartInstance.data.datasets[0].data.push(0);
                                            break;
                                    }
                                    chartInstance.update();
                                }
                            }
                        });
                    }
                    break;

                case "doors":
                    const dateDoors = data.value[0];
                    const doorsStates = data.value[1];
                    for (let i = 0; i < doorsStates.length; i++) {
                        waitForElementToBeAvailable("door-" + (i + 1)).then(function() {
                            document.getElementById("door-" + (i + 1)).innerHTML = doorsStates[i];
                            buttonRefresh = document.getElementById("refreshDoor " + (i + 1));
                            const cerchio = document.querySelector(".insights .door" + (i + 1) + " svg circle");
                            let chartInstance = Chart.getChart("chartDoor-" + (i+1));
                            sample = chartInstance.data.labels[0];
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
                            if(!filtered && sample === undefined){
                                chartInstance.data.labels.push(dateDoors.date+"\n"+dateDoors.time);
                                switch(doorsStates[i]){
                                    case "open":
                                        chartInstance.data.datasets[0].data.push(2);
                                        break;
                                    case "closed":
                                        chartInstance.data.datasets[0].data.push(1);
                                        break;
                                    case "error":
                                        chartInstance.data.datasets[0].data.push(0);
                                        break;
                                }
                                chartInstance.update();
                            }
                            if(sample !== undefined){
                                if(date == sample.slice(0, 10)){
                                    chartInstance.data.labels.push(dateDoors.date+"\n"+dateDoors.time);
                                    switch(doorsStates[i]){
                                        case "open":
                                            chartInstance.data.datasets[0].data.push(2);
                                            break;
                                        case "closed":
                                            chartInstance.data.datasets[0].data.push(1);
                                            break;
                                        case "error":
                                            chartInstance.data.datasets[0].data.push(0);
                                            break;
                                    }
                                    chartInstance.update();
                                }
                            }
                        });
                    }
                    
                    break;
                
                case "heatpump":
                    const heatPumpInformations = data.value;
                    waitForElementToBeAvailable("heatpump").then(function() {
                        document.getElementById("heatpump").innerHTML = heatPumpInformations.state;
                        document.getElementById("temperature-heatpump").innerHTML = parseFloat(heatPumpInformations.temp, 10).toFixed(1) + "°C";
                        const cerchio = document.querySelector(".insights .heatpump svg circle");
                        let chartInstanceTemp = Chart.getChart("chartHeatPump");
                        let chartInstanceState = Chart.getChart("chartHeatPumpState");
                        sample = chartInstanceTemp.data.labels[0];
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
                        if(!filtered && sample === undefined){
                            chartInstanceTemp.data.labels.push(heatPumpInformations.date+"\n"+heatPumpInformations.time);
                            chartInstanceTemp.data.datasets[0].data.push(heatPumpInformations.temp);
                            chartInstanceState.data.labels.push(heatPumpInformations.date+"\n"+heatPumpInformations.time);
                            switch(heatPumpInformations.state){
                                case "on":
                                    chartInstanceState.data.datasets[0].data.push(2);
                                    break;
                                case "off":
                                    chartInstanceState.data.datasets[0].data.push(1);
                                    break;
                                case "error":
                                    chartInstanceState.data.datasets[0].data.push(0);
                                    break;
                            }
                            chartInstanceTemp.update();
                            chartInstanceState.update();
                        }
                        if(sample !== undefined){
                            if(date == sample.slice(0, 10)){
                                chartInstanceTemp.data.labels.push(heatPumpInformations.date+"\n"+heatPumpInformations.time);
                                chartInstanceTemp.data.datasets[0].data.push(heatPumpInformations.temp);
                                chartInstanceState.data.labels.push(heatPumpInformations.date+"\n"+heatPumpInformations.time);
                                switch(heatPumpInformations.state){
                                    case "on":
                                        chartInstanceState.data.datasets[0].data.push(2);
                                        break;
                                    case "off":
                                        chartInstanceState.data.datasets[0].data.push(1);
                                        break;
                                    case "error":
                                        chartInstanceState.data.datasets[0].data.push(0);
                                        break;
                                }
                                chartInstanceTemp.update();
                                chartInstanceState.update();
                            }
                        }
                    });

                    break;

                case "thermometer":
                    const thermometerInfo = data.value;
                    waitForElementToBeAvailable("temperature-room").then(function() {
                        if(thermometerInfo.temp){
                            let chartInstance = Chart.getChart("chartThermometer");
                            document.getElementById("temperature-room").innerHTML = parseFloat(thermometerInfo.temp).toFixed(1) + "°C";
                            sample = chartInstance.data.labels[0];
                            if(!filtered && sample === undefined){
                                chartInstance.data.labels.push(thermometerInfo.date+"\n"+thermometerInfo.time);
                                chartInstance.data.datasets[0].data.push(thermometerInfo.temp);
                                chartInstance.update();
                            }
                            if(sample !== undefined){
                                if(date == sample.slice(0, 10)){
                                    chartInstance.data.labels.push(thermometerInfo.date+"\n"+thermometerInfo.time);
                                    chartInstance.data.datasets[0].data.push(thermometerInfo.temp);
                                    chartInstance.update();
                                }
                            }
                        }
                        else{
                            document.getElementById("temperature-room").innerHTML = "-- °C";
                        }
                    });
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
			ws.onclose = function() {
                setTimeout(function(){
                    console.info("Connection to the backend closed. Reconnecting...");
                    init();
                  }, 5000);
            }
            routes(ws);
        }
    }

    win.WSClient ||= WSClient;

})(window);