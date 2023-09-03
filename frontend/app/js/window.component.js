'use strict';

(function (win) {

  /**
   * Encapsulates the control and view logics behind a single task.
   */
  class WindowComponent extends EventEmitter {
    /** @type {RestTaskModel} */
    #model;
    /** @type {HTMLElement|null} */
    #element;
    /** @type {Handler[]} */
    #handlers = [];
    /** @type {HTMLElement|null} */
    #edit = null;
    /** @type {WSClient} */
    #wsclient;

    /**
     * Instances a new `DoorComponent` component.
     * @param model {RestDoorModel} A door model
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
        this.#element = document.createElement("div");
        this.#element.className = "temp";
        this.#element.id = "temp";
        this.#element.innerHTML = document.querySelector('script#windows-control-template').textContent;
        
        let element2 = document.createElement("div");
        element2.className = `window${this.#model.id}`;
        element2.id = "window";
        element2.innerHTML = document.querySelector('script#windows-template').textContent;
        const stat = element2.querySelector("#window");
        const h3 = element2.querySelector("#window-header");
        stat.id = `window-${this.#model.id}`;
        h3.innerHTML = `Window ${this.#model.id}`;
        
        let elementChart = document.createElement("div");
        elementChart.className = "chartBox";
        elementChart.innerHTML = document.querySelector('script#windows-chart-template').textContent;
        const span = elementChart.querySelector('#chartWindow');
        span.id = `chartWindow-${this.#model.id}`;

        const root = document.querySelector('#insights');
        const rootCharts = document.querySelector('#charts');
        
        root.appendChild(element2);
        rootCharts.appendChild(elementChart);
        let chart = this.createChart();

        const windowNumber = this.#element.querySelector("#command-header");
        windowNumber.innerHTML = `Window ${this.#model.id} - ${windowNumber.innerHTML}`;
        
        const openBtn = this.#element.querySelector("#buttonOn");
        openBtn.id = `buttonOn ${this.#model.id}`;
        const closeBtn = this.#element.querySelector("#buttonOff");
        closeBtn.id = `buttonOff ${this.#model.id}`;
        const refreshBtn = document.querySelector("#refreshWindow");
        refreshBtn.id = `refreshWindow ${this.#model.id}`;
        const filterBtn = document.querySelector("#filterDate");
        let hdlrOpen = new Handler('click', openBtn, () => this.open());
        this.#handlers.push(hdlrOpen);
        let hdlrClose = new Handler('click', closeBtn, () => this.close());
        this.#handlers.push(hdlrClose);
        let hdlrRestart = new Handler('click', refreshBtn, () => this.restart());
        this.#handlers.push(hdlrRestart);
        let hdlrFilter = new Handler('click', filterBtn, () => this.filter(chart));
        this.#handlers.push(hdlrFilter);

        this.subscribeToWindows(filterBtn, refreshBtn);

        return this.#element;
    }

    waitForElementToBeAvailable(elementId) {
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

    subscribeToWindows(filterBtn, buttonRefresh){
      const windowsObs = this.#wsclient.getWindowsObs();
      windowsObs.subscribe((data) => {
        let filtered = false;
        filterBtn.classList.forEach(name => {
          if(name == "active"){
            filtered = true;
          }
        });
        let date = new Date(Date.now());
        date = date.toISOString();
        date = date.slice(0, 10);
        const windowsDate = data.value[0];
        const windowsId = data.value[1];
        const windowsStates = data.value[2];
        const index = windowsId.indexOf(this.#model.id);
        console.log(index);
        document.getElementById("window-" + this.#model.id).innerHTML = windowsStates[index];
        buttonRefresh = document.getElementById("refreshWindow " + this.#model.id);
        const cerchio = document.querySelector(".insights .window" + this.#model.id + " svg circle");
        let chartInstance = Chart.getChart("chartWindow-" + this.#model.id);
        let sample = chartInstance.data.labels[0];
        switch(windowsStates[index]){
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
          switch(windowsStates[index]){
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
            switch(windowsStates[index]){
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

    createChart() {
      var yLabels = {0: "error", 1: "closed", 2: "open"};
      const configWindows = {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: `Window ${this.#model.id} States`,
            data: [],
            borderColor: "#363949",
            borderWidth: 3,
            tension: 0.1,
            fill: false
          }
          ]
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
        document.getElementById(`chartWindow-${this.#model.id}`),
        configWindows
      );
    }

    async filter(chart) {
      try{
        const resp = await this.#model.filter();
        let labels=[];
        let labels2=[];
        let values=[];
        resp.results.forEach(dto => {
          labels.push(dto.date+"\n"+dto.time);
          switch(dto.state){
            case "open":
              values.push(2);
              break;
            case "closed":
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
        const filteredValues = filteredDates.map((_, index) => values[index]);
        const filteredDatesVis = filteredDates.map((_, index) => labels[index]);
        
        chart.data.labels = filteredDatesVis;
        chart.data.datasets[0].data = filteredValues;
        chart.update();
        
      }catch(e){
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        section.classList.add("active");
        errorMessage.innerHTML = "Error.";
      }
    }

    async open() {
      console.debug("Attempting to open the window");
      try{
        await this.#model.update("open");
      }catch(e){
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        if(e.status == 408){
          errorMessage.innerHTML = "Request timed out: window service is down.";
        }
        else{
          errorMessage.innerHTML = "Window already open or is in error.";
        }
        section.classList.add("active");
      }
    }

    async close() {
      console.debug("Attempting to close the window");
      try{
        await this.#model.update("closed");
      } catch(e){
        console.log(e.status);
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        if(e.status == 408){
          errorMessage.innerHTML = "Request timed out: window service is down.";
        }
        else{
          errorMessage.innerHTML = "Window already closed or is in error.";
        }
        section.classList.add("active");
      }
    }

    async restart() {
      console.debug("Attempting to restart the window");
      try{
        await this.#model.update("restart");
      }catch(e) {
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        if(e.status == 408){
          errorMessage.innerHTML = "Request timed out: window service is down.";
        }
        else{
          errorMessage.innerHTML = "Unable to restart window sensor.";
        }
        section.classList.add("active");
      }
    }

    async newWindow() {
      console.debug("Attempting to create new window");
      try{
        await this.#model.create();
      }catch(e){
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        section.classList.add("active");
        if(e.status == 408){
          errorMessage.innerHTML = "Request timed out: window service is down.";
        }
        else{
          errorMessage.innerHTML = "Unable to add new window sensor.";
        }
        section.classList.add("active");
      }
    }
  }

  /* Exporting component */
  win.WindowComponent ||= WindowComponent;

})(window);