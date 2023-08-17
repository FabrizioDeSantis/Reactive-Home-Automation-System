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
    class WindowsComponent {
      #element = null;
      #client = null;
      #windows = [];
  
      /**
       * Instances this component.
       * @param client {RestClient} A REST client
       */
      constructor(client) {
        this.#client = client;
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
        
        let newBtn = document.getElementById("buttonNewWindow");
        newBtn.addEventListener('click', ($event) => {
          $event.preventDefault();
          this.addWindow();
        });
  
        try {
          const resp = await this.#client.get(`windows`);
          resp.results.forEach(dto => {
            const model = new RestWindowModel(dto.id, dto.state, this.#client);
            this.createWindowComponent(model);
          });
        } catch (e) {
          console.error('Something went wrong getting tasks', e);
        }
  
        return this.#element;
      }
  
      removeSelectedTasks() {
        const inps = this.#element.querySelectorAll('.task-left input[type=checkbox]:checked');
        const tasks = Array.prototype.slice.apply(inps).map(el => ({id: taskIdOf(el)}));
        tasks.forEach(this.removeTask.bind(this));
      }
  
      createWindowComponent(model) {
        const root = this.#element;
        const component = new WindowComponent(model);
        this.#windows.push({model, component});
        const el = component.init();
        root.appendChild(el);
      }

      async addWindow() {
        console.log("Adding new window ...");
        console.log(this.#windows.length);
        const model = new RestWindowModel(undefined, "closed", this.#client);
        await model.create();
        console.log("Door successfully saved", {model: model.toDto()});
        this.createWindowComponent(model);
      }
    }
  
    /* Exporting component */
    win.WindowsComponent ||= WindowsComponent;
  
  })(window);
  