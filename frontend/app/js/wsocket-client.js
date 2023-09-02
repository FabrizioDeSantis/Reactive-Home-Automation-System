'use strict';

(function (win) {

    const { Subject, filter } = rxjs;
    const dataSubject = new Subject();

    function waitForElementToBeAvailable(elementId) {
        return new Promise(function (resolve) {
            var checkElementInterval = setInterval(function () {
                var elemento = document.getElementById(elementId);
                if (elemento) {
                    clearInterval(checkElementInterval);
                    resolve(elemento);
                }
            }, 100);
        });
    }

    function createFilteredObs(dataType) {
        return dataSubject.pipe(
            filter((data) => data.type === dataType)
        );
    }

    function routes(ws) {
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            dataSubject.next(data);
            let filtered = false;
            const filterBtn = document.querySelector("#filterDate");
            filterBtn.classList.forEach(name => {
                if (name == "active") {
                    filtered = true;
                }
            });
            let sample = null;
            let date = new Date(Date.now());
            date = date.toISOString();
            date = date.slice(0, 10);;
            let buttonRefresh;
            switch (data.type) {
                // case "doors":
                //     const dateDoors = data.value[0];
                //     const doorsStates = data.value[1];
                //     for (let i = 0; i < doorsStates.length; i++) {
                //         waitForElementToBeAvailable("door-" + (i + 1)).then(function() {
                //             document.getElementById("door-" + (i + 1)).innerHTML = doorsStates[i];
                //             buttonRefresh = document.getElementById("refreshDoor " + (i + 1));
                //             const cerchio = document.querySelector(".insights .door" + (i + 1) + " svg circle");
                //             let chartInstance = Chart.getChart("chartDoor-" + (i+1));
                //             sample = chartInstance.data.labels[0];
                //             switch(doorsStates[i]){
                //                 case "open":
                //                     cerchio.style.stroke = "#41f1b6";
                //                     buttonRefresh.classList.remove("active");
                //                     break;
                //                 case "closed":
                //                     cerchio.style.stroke = "#363949";
                //                     buttonRefresh.classList.remove("active");
                //                     break;
                //                 case "error":
                //                     cerchio.style.stroke = "#ff7782";
                //                     buttonRefresh.classList.add("active");
                //                     break;
                //             }
                //             if(!filtered && sample === undefined){
                //                 chartInstance.data.labels.push(dateDoors.date+"\n"+dateDoors.time);
                //                 switch(doorsStates[i]){
                //                     case "open":
                //                         chartInstance.data.datasets[0].data.push(2);
                //                         break;
                //                     case "closed":
                //                         chartInstance.data.datasets[0].data.push(1);
                //                         break;
                //                     case "error":
                //                         chartInstance.data.datasets[0].data.push(0);
                //                         break;
                //                 }
                //                 chartInstance.update();
                //             }
                //             if(sample !== undefined){
                //                 if(date == sample.slice(0, 10)){
                //                     chartInstance.data.labels.push(dateDoors.date+"\n"+dateDoors.time);
                //                     switch(doorsStates[i]){
                //                         case "open":
                //                             chartInstance.data.datasets[0].data.push(2);
                //                             break;
                //                         case "closed":
                //                             chartInstance.data.datasets[0].data.push(1);
                //                             break;
                //                         case "error":
                //                             chartInstance.data.datasets[0].data.push(0);
                //                             break;
                //                     }
                //                     chartInstance.update();
                //                 }
                //             }
                //         });
                //     }

                //     break;

                case "heatpump":
                    const heatPumpInformations = data.value;
                    waitForElementToBeAvailable("heatpump").then(function () {
                        document.getElementById("heatpump").innerHTML = heatPumpInformations.state;
                        document.getElementById("temperature-heatpump").innerHTML = parseFloat(heatPumpInformations.temp, 10).toFixed(1) + "°C";
                        const cerchio = document.querySelector(".insights .heatpump svg circle");
                        let chartInstanceTemp = Chart.getChart("chartHeatPump");
                        let chartInstanceState = Chart.getChart("chartHeatPumpState");
                        sample = chartInstanceTemp.data.labels[0];
                        buttonRefresh = document.getElementById("refreshHeatPump");
                        switch (heatPumpInformations.state) {
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
                        if (!filtered && sample === undefined) {
                            chartInstanceTemp.data.labels.push(heatPumpInformations.date + "\n" + heatPumpInformations.time);
                            chartInstanceTemp.data.datasets[0].data.push(heatPumpInformations.temp);
                            chartInstanceState.data.labels.push(heatPumpInformations.date + "\n" + heatPumpInformations.time);
                            switch (heatPumpInformations.state) {
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
                        if (sample !== undefined) {
                            if (date == sample.slice(0, 10)) {
                                chartInstanceTemp.data.labels.push(heatPumpInformations.date + "\n" + heatPumpInformations.time);
                                chartInstanceTemp.data.datasets[0].data.push(heatPumpInformations.temp);
                                chartInstanceState.data.labels.push(heatPumpInformations.date + "\n" + heatPumpInformations.time);
                                switch (heatPumpInformations.state) {
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

            }
        };
    }

    function reconnect(wsUrl) {
        const ws = new WebSocket(wsUrl);

        return ws;
    }

    class WSClient {
        constructor(baseUrl) {
            this._baseUrl = baseUrl;
            this._ws = null;
            this._isConnected = false;
        }

        createWebSocket() {
            const url = document.baseURI.replace(/^http/, 'ws');
            const wsUrl = new URL(this._baseUrl + "/", url);
            this._ws = new WebSocket(wsUrl);
            this._isConnected = true;

            this._ws.onopen = () => {
                console.info("✅ Connected to backend");
                setTimeout(() => {
                    this.subscribe();
                }, 3000);       
            };

            this._ws.onclose = () => {
                if (this._isConnected) {
                    console.info("⛔️ Connection to the backend closed. Reconnecting...");
                    this._isConnected = false;

                    setTimeout(() => {
                        this.createWebSocket();
                    }, 5000);
                }
            };

            routes(this._ws);
        }

        async init() {
            this.createWebSocket();
        }

        subscribe(){
            this._ws.send(JSON.stringify({"type": "subscribe", "source": "client"}));
        }

        getTemperatureObs() {
            return createFilteredObs("temperature");
        }

        getThermometerObs() {
            return createFilteredObs("thermometer");
        }

        getWindowsObs() {
            return createFilteredObs("windows");
        }

        getDoorsObs() {
            return createFilteredObs("doors");
        }

        waitForElementToBeAvailable(elementId) {
            return new Promise(function (resolve) {
                var checkElementInterval = setInterval(function () {
                    var element = document.getElementById(elementId);
                    if (element) {
                        clearInterval(checkElementInterval);
                        resolve(element);
                    }
                }, 100);
            });
        }
    }

    win.WSClient ||= WSClient;

})(window);