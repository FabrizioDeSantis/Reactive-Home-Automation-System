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

    /**
     * Instances a new `HeatPumpComponent` component.
     * @param model {RestHeatPumpModel} A heatpump model
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
        this.#element.innerHTML = document.querySelector('script#heatpump-control-template').textContent;
        
        let element2 = document.createElement("div");
        element2.className = `heatpump`;
        element2.id = "hp";
        element2.innerHTML = document.querySelector('script#heatpump-template').textContent;
        
        const root = document.querySelector('#insights');
        
        root.appendChild(element2);

        //const windowNumber = this.#element.querySelector("#command-header");
        //windowNumber.innerHTML = `Window ${this.#model.id} - ${windowNumber.innerHTML}`;

        const onBtn = this.#element.querySelector("#buttonOn");
        const offBtn = this.#element.querySelector("#buttonOff");
        const setTempBtn = this.#element.querySelector("#buttonSetTemperature");

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
        return this.#element;
    }

    async turnOn() {
      console.debug("Attempting to turn on the heatpump");
      try{
        await this.#model.updateState("on");
      }catch(e){
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        section.classList.add("active");
        errorMessage.innerHTML = "Error. Heat pump is already on or is in error.";
      }
    }

    async turnOff() {
      console.debug("Attempting to turn off the heatpump");
      try{
        await this.#model.updateState("off");
      }catch(e){
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        section.classList.add("active");
        errorMessage.innerHTML = "Error. Heat pump is already off or is in error.";
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
        section.classList.add("active");
        errorMessage.innerHTML = "Error. Temperature is too high or heatpump off";
      }
    }

    async restart() {
      console.debug("Attempting to restart the heat pump");
      try{
        await this.#model.updateState("restart");
      }catch(e) {
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        section.classList.add("active");
        errorMessage.innerHTML = "Error.";
      }
    }
  }

  /* Exporting component */
  win.HeatPumpComponent ||= HeatPumpComponent;

})(window);