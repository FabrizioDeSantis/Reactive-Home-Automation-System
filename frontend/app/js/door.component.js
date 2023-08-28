'use strict';

(function (win) {

  /**
   * Encapsulates the control and view logics behind a single task.
   */
  class DoorComponent extends EventEmitter {
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
      this.#element.innerHTML = document.querySelector('script#doors-control-template').textContent;
        
      let element2 = document.createElement("div");
      element2.className = `door${this.#model.id}`;
      element2.id = "door";
      element2.innerHTML = document.querySelector('script#doors-template').textContent;
      const stat = element2.querySelector("#door");
      const h3 = element2.querySelector("#door-header");
      stat.id = `door-${this.#model.id}`;
      h3.innerHTML = `Door ${this.#model.id}`;
        
      let elementChart = document.createElement("div");
      elementChart.className = "chartBox";
      elementChart.innerHTML = document.querySelector('script#doors-chart-template').textContent;
      const span = elementChart.querySelector('#chartDoor');
      span.id = `chartDoor-${this.#model.id}`;
      
      const root = document.querySelector('#insights');
      const rootCharts = document.querySelector('#charts');

      root.appendChild(element2);
      rootCharts.appendChild(elementChart);
      let chart = this.createChart();

      const doorNumber = this.#element.querySelector("#command-header");
      doorNumber.innerHTML = `Door ${this.#model.id} - ${doorNumber.innerHTML}`;

      const openBtn = this.#element.querySelector("#buttonOn");
      openBtn.id = `buttonOn ${this.#model.id}`;
      const refreshBtn = document.querySelector("#refreshDoor");
      refreshBtn.id = `refreshDoor ${this.#model.id}`;
      const closeBtn = this.#element.querySelector("#buttonOff");
      closeBtn.id = `buttonOff ${this.#model.id}`;
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
      const configDoors = {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: `Door ${this.#model.id} States`,
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
        document.getElementById(`chartDoor-${this.#model.id}`),
        configDoors
      );
    }

    async filter(chart) {
      console.debug("Attempting to get filtered data graph");
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
      console.debug("Attempting to open the door");
      try{
        await this.#model.update("open");
      }catch(e) {
        console.log(e.status);
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        if(e.status == 408){
          errorMessage.innerHTML = "Request timed out: door service is down.";
        }
        else{
          errorMessage.innerHTML = "Door already open or is in error.";
        }
        section.classList.add("active");
      }
    }

    async close() {
      console.debug("Attempting to close the door");
      try{
        await this.#model.update("closed");
      }catch(e) {
        console.log(e.status);
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        if(e.status == 408){
          errorMessage.innerHTML = "Request timed out: door service is down.";
        }
        else{
          errorMessage.innerHTML = "Door already closed or is in error.";
        }
        section.classList.add("active");
      }
    }

    async restart() {
      console.debug("Attempting to restart the door");
      try{
        await this.#model.update("restart");
      }catch(e) {
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        section.classList.add("active");
        if(e.status == 408){
          errorMessage.innerHTML = "Request timed out: door service is down.";
        }
        else{
          errorMessage.innerHTML = "Unable to restart door sensor.";
        }
        section.classList.add("active");
      }
    }

    async newDoor() {
      console.debug("Attempting to create new door");
      try{
        await this.#model.create();
      }catch(e){
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        section.classList.add("active");
        if(e.status == 408){
          errorMessage.innerHTML = "Request timed out: door service is down.";
        }
        else{
          errorMessage.innerHTML = "Unable to add new door sensor.";
        }
        section.classList.add("active");
      }
    }

  }

  /* Exporting component */
  win.DoorComponent ||= DoorComponent;

})(window);
