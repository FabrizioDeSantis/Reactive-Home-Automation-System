'use strict';

(function (win) {

  /**
   * Encapsulates the control and view logics behind a single task.
   */
  class ThermometerComponent extends EventEmitter {
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
     * Instances a new `ThermometerComponent` component.
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
        this.#element.className = "thermometer";
        this.#element.innerHTML = document.querySelector('script#thermometer-template').textContent;

        let elementChart = document.createElement("div");
        elementChart.className = "chartBox";
        elementChart.innerHTML = document.querySelector('script#thermometer-chart-template').textContent;

        const root = document.querySelector('#insights');
        const rootCharts = document.querySelector('#charts');

        root.appendChild(this.#element);
        rootCharts.append(elementChart);
        let chart = this.createChart();

        const filterBtn = document.querySelector("#filterDate");
        let hdlrFilter = new Handler('click', filterBtn, () => this.filter(chart));
        this.#handlers.push(hdlrFilter);

        this.subscribeToThermometer(filterBtn);

        return this.#element;
    }

    subscribeToThermometer(filterBtn){
      const thermometerObs = this.#wsclient.getThermometerObs();
      thermometerObs.subscribe((data) => {
        let filtered = false;
        filterBtn.classList.forEach(name => {
          if(name == "active"){
            filtered = true;
          }
        });
        let date = new Date(Date.now());
        date = date.toISOString();
        date = date.slice(0, 10);;
        const thermometerInfo = data.value;
        if(thermometerInfo !== undefined){
          let chartInstance = Chart.getChart("chartThermometer");
          document.getElementById("temperature-room").innerHTML = parseFloat(thermometerInfo.temp).toFixed(1) + "°C";
          let sample = chartInstance.data.labels[0];
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
    }

    createChart() {
        const configThermometer = {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Temperature Thermometer (°C)',
                    data: [],
                    borderColor: "rgb(54, 162, 235)",
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
            document.getElementById(`chartThermometer`),
            configThermometer
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
          values.push(dto.temp);
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

  }

  /* Exporting component */
  win.ThermometerComponent ||= ThermometerComponent;

})(window);
