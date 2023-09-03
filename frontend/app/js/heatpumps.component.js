(function (win) {

    /**
     * Given an HTML element representing a task, extracts the task's ID.
     * @param el {HTMLElement} An HTML element representing a task
     * @return {number} The task's ID
     */
    function windowIdOf(el) {
      const idStr = el.id.substring(7 /*'task-'.length*/);
      return parseInt(idStr, 10);
    }
  
    /**
     * A component that shows, adds and removes windows.
     */
    class HeatPumpsComponent {
      #element = null;
      #client = null;
      #wsclient = null;
      #heatpumps = [];
  
      /**
       * Instances this component.
       * @param client {RestClient} A REST client
       */
      constructor(client, wsclient) {
        this.#client = client;
        this.#wsclient = wsclient;
      }
  
      /**
       * Destroys this component, removing it from it's parent node.
       */
      destroy() {
        this.#element.remove();
      }
  
      /**
       * Initializes the component.
       * @return {Promise<HTMLElement>} The root element for this component.
       */
      async init() {
        this.#element = document.createElement('div');
  
        try {
          const resp = await this.#client.get(`heatpump`);

          const model = new RestHeatPumpModel(resp.state, resp.temperatureOp, this.#client);
          this.createHeatPumpComponent(model);
        } catch (e) {
          console.error('Something went wrong getting heatpump', e);
        }
  
        return this.#element;
      }
  
      createHeatPumpComponent(model) {
        const root = this.#element;
        const component = new HeatPumpComponent(model, this.#wsclient);
        this.#heatpumps.push({model, component});
        const el = component.init();
        root.appendChild(el);
        //component.on('completed', this.removeTask.bind(this));
      }
    }
  
    /* Exporting component */
    win.HeatPumpsComponent ||= HeatPumpsComponent;
  
  })(window);
  