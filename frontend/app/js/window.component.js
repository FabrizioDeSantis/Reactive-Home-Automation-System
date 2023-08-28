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

    /**
     * Instances a new `DoorComponent` component.
     * @param model {RestDoorModel} A door model
     */
    constructor(model) {
      super();
      this.#model = model;
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

        return this.#element;
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