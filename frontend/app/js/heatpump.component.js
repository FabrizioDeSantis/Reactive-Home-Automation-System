'use strict';

(function (win) {

  /**
   * Encapsulates the control and view logics behind a single task.
   */
  class HeatPumpComponent extends EventEmitter {
    /** @type {RestHeatPumpModel} */
    #model;
    /** @type {HTMLElement|null} */
    #element;
    /** @type {Handler[]} */
    #handlers = [];
    /** @type {HTMLElement|null} */
    #edit = null;
    #wsclient;

    /**
     * Instances a new `HeatPumpComponent` component.
     * @param model {RestHeatPumpModel} A heatpump model
     */
    constructor(model, wsclient) {
      super();
      this.#model = model;
      this.#wsclient = wsclient;
      this.#element = null;
      this.#handlers = [];
      this.#edit = null;
    }

    /**
     * Destroys this component, removing it from it's parent node.
     */
    destroy() {
      this.#handlers.forEach(h => h.unregister());
      this.#element.remove();
    }

    /**
     * Initializes the component.
     * @return {HTMLElement} The root element for this component.
     */
    init() {

        this.subscribeToHeatPump();

        this.#element = document.createElement("div");
        this.#element.className = "temp";
        this.#element.id = "temp";
        this.#element.innerHTML = document.querySelector('script#heatpump-control-template').textContent;
        
        let element2 = document.createElement("div");
        element2.className = `heatpump`;
        element2.id = "hp";
        element2.innerHTML = document.querySelector('script#heatpump-template').textContent;

        let elementChart = document.createElement("div");
        elementChart.className = "chartBox";
        elementChart.innerHTML = document.querySelector('script#heatpump-chart-template').textContent;

        let elementChartState = document.createElement("div");
        elementChartState.className = "chartBox";
        elementChartState.innerHTML = document.querySelector('script#heatpumpstate-chart-template').textContent;
        
        const root = document.querySelector('#insights');
        const rootCharts = document.querySelector('#charts');
        
        root.appendChild(element2);
        rootCharts.appendChild(elementChart);
        rootCharts.appendChild(elementChartState);
        let chartTemp = this.createChartTemperature();
        let chartState = this.createChartState();

        const onBtn = this.#element.querySelector("#buttonOn");
        const offBtn = this.#element.querySelector("#buttonOff");
        const setTempBtn = this.#element.querySelector("#buttonSetTemperature");
        const filterBtn = document.querySelector("#filterDate");
        const refreshBtn = document.querySelector("#refreshHeatPump");
        refreshBtn.id = `refreshHeatPump`;

        let hdlrOn = new Handler('click', onBtn, () => this.turnOn());
        this.#handlers.push(hdlrOn);
        let hdlrOff = new Handler('click', offBtn, () => this.turnOff());
        this.#handlers.push(hdlrOff);
        let hdlrSetTemp = new Handler('click', setTempBtn, () => this.updateTemperature());
        this.#handlers.push(hdlrSetTemp);
        let hdlrRestart = new Handler('click', refreshBtn, () => this.restart());
        this.#handlers.push(hdlrRestart);
        let hdlrFilter = new Handler('click', filterBtn, () => this.filter(chartState, chartTemp));
        this.#handlers.push(hdlrFilter);

        return this.#element;
    }

    waitForElementToBeAvailable(elementId) {
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

    subscribeToHeatPump(){
      const heatPumpObs = this.#wsclient.getHeatPumpObs();
      const filterBtn = document.querySelector("#filterDate");
      heatPumpObs.subscribe((data) => {
        let filtered = false;
        filterBtn.classList.forEach(name => {
          if (name == "active") {
            filtered = true;
          }
        });
        let date = new Date(Date.now());
        date = date.toISOString();
        date = date.slice(0, 10);
        const heatPumpInformations = data.value;
        this.waitForElementToBeAvailable("heatpump").then(function () {
            document.getElementById("heatpump").innerHTML = heatPumpInformations.state;
            document.getElementById("temperature-heatpump").innerHTML = parseFloat(heatPumpInformations.temp, 10).toFixed(1) + "°C";
            const cerchio = document.querySelector(".insights .heatpump svg circle");
            let chartInstanceTemp = Chart.getChart("chartHeatPump");
            let chartInstanceState = Chart.getChart("chartHeatPumpState");
            let sample = chartInstanceTemp.data.labels[0];
            let buttonRefresh = document.getElementById("refreshHeatPump");
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
      });
    }

    createChartTemperature(){
      const configHeatPump = {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
              label: 'Temperature Heat Pump (°C)',
              data: [],
              borderColor: "rgb(75, 192, 192)",
              borderWidth: 3,
              tension: 0.1,
              fill: false
              }]
        },
        options: {
            responsive: true,
            aspectRatio: 1,
            interaction: {
                intersect: false,
            },
            scales: {
                y: {
                    display: true,
                    title: {
                    display: true,
                    text: 'Value'
                    },
                    suggestedMin: 0,
                    suggestedMax: 25
                }
            }
        }
      };
      return new Chart(
        document.getElementById(`chartHeatPump`),
        configHeatPump
      );
    }

    createChartState(){
      var yLabels = {0: "error", 1: "off", 2: "on"};
      const configHeatPumpState = {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
              label: 'Heat Pump States',
              data: [],
              borderColor: "rgb(75, 192, 192)",
              borderWidth: 3,
              tension: 0.1,
              fill: false
              }]
        },
        options: {
            responsive: true,
            aspectRatio: 1,
            interaction: {
                intersect: false,
            },
            scales: {
                y: {
                    display: true,
                    title: {
                    display: true,
                    text: 'Value'
                    },
                    suggestedMin: 0,
                    suggestedMax: 2,
                    ticks: {
                        beginAtZero: true,
                        callback: function(value, index, values) {
                            return yLabels[value];
                        }
                    }
                }
            }
        }
      };
      return new Chart(
        document.getElementById(`chartHeatPumpState`),
        configHeatPumpState
      );
    }

    async filter(chartState, chartTemp){
      try{
        const resp = await this.#model.filter();
        let labels=[];
        let labels2=[];
        let values=[];
        let temperatures=[];
        resp.results.forEach(dto => {
          labels.push(dto.date+"\n"+dto.time);
          temperatures.push(dto.temp);
          switch(dto.state){
            case "on":
              values.push(2);
              break;
            case "off":
              values.push(1);
              break;
            case "error":
              values.push(0);
              break;
          }
        });
        for(let i=0; i< labels.length; i++){
          labels2.push(labels[i].slice(0, 10));
        }
        const startDate = document.getElementById("startDate");
        const endDate = document.getElementById("endDate");

        const filteredDates = labels2.filter((date, index) => date >= startDate.value && date <= endDate.value);
        const filteredStateValues = filteredDates.map((_, index) => values[index]);
        const filteredTempValues = filteredDates.map((_, index) => temperatures[index]);
        const filteredDatesTempVis = filteredDates.map((_, index) => labels[index]);
        const filteredDatesStateVis = [...filteredDatesTempVis];

        chartState.data.labels = filteredDatesStateVis;
        chartTemp.data.labels = filteredDatesTempVis;
        
        chartState.data.datasets[0].data = filteredStateValues;
        chartState.update();
        chartTemp.data.datasets[0].data = filteredTempValues;
        chartTemp.update();
        const filterBtn = document.querySelector("#filterDate");
        filterBtn.classList.add("active");
      }catch(e){
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        if(e.status == 408){
          errorMessage.innerHTML = "Request timed out: heat pump service is down.";
        }
        else{
          errorMessage.innerHTML = "Error.";
        }
        section.classList.add("active");
      }
    }

    async turnOn() {
      console.debug("Attempting to turn on the heat pump");
      try{
        await this.#model.updateState("on");
      }catch(e){
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        if(e.status == 408){
          errorMessage.innerHTML = "Request timed out: heat pump service is down.";
        }
        else{
          errorMessage.innerHTML = "Heat pump already on or is in error.";
        }
        section.classList.add("active");
      }
    }

    async turnOff() {
      console.debug("Attempting to turn off the heatpump");
      try{
        await this.#model.updateState("off");
      }catch(e){
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        if(e.status == 408){
          errorMessage.innerHTML = "Request timed out: heat pump service is down.";
        }
        else{
          errorMessage.innerHTML = "Heat pump already off or is in error.";
        }
        section.classList.add("active");
      }
    }

    async updateTemperature() {
      console.debug("Attempting to change heatpump temperature");
      let value = this.#element.querySelector("#tempOp").value;
      try{
        await this.#model.updateTemperatureOp(value);
      }catch(e){
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        if(e.status == 408){
          errorMessage.innerHTML = "Request timed out: heat pump service is down.";
        }
        else{
          errorMessage.innerHTML = "Heat pump off, heat pump in error or temperature out of range (0-60°C).";    
        }
        section.classList.add("active");
      }
    }

    async restart() {
      console.debug("Attempting to restart the heat pump");
      try{
        await this.#model.updateState("restart");
      }catch(e) {
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        if(e.status == 408){
          errorMessage.innerHTML = "Request timed out: heat pump service is down.";
        }
        else{
          errorMessage.innerHTML = "Unable to restart heat pump sensor.";
        }
        section.classList.add("active");
      }
    }
    
  }

  /* Exporting component */
  win.HeatPumpComponent ||= HeatPumpComponent;

})(window);