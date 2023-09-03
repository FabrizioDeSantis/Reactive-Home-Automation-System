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

        getHeatPumpObs(){
            return createFilteredObs("heatpump");
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