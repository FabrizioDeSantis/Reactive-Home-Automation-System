(function (win) {

    /**
     * Given an HTML element representing a task, extracts the task's ID.
     * @param el {HTMLElement} An HTML element representing a task
     * @return {number} The task's ID
     */
    function taskIdOf(el) {
      const idStr = el.id.substring(5 /*'task-'.length*/);
      return parseInt(idStr, 10);
    }
  
    /**
     * A component that shows, adds and removes tasks.
     */
    class DoorsComponent {
      #element = null;
      #client = null;
      #doors = [];
  
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
        let newBtn = document.getElementById("buttonNewDoor");
        newBtn.addEventListener('click', ($event) => {
          $event.preventDefault();
          this.addDoor();
        });
  
        try {
          const resp = await this.#client.get(`doors`);
          resp.results.forEach(dto => {
            const model = new RestDoorModel(dto.id, dto.state, this.#client);
            this.createDoorComponent(model);
          });
        } catch (e) {
          console.error('Something went wrong getting doors information', e);
        }
  
        return this.#element;
      }
  
      async removeTask(task) {
        // try {
        //   let i = this.#tasks.findIndex(t => t.model.id === task.id);
        //   if (i >= 0) {
        //     console.log(`Deleting task ${task.id}...`);
        //     const {model} = this.#tasks[i];
        //     await model.delete();
        //     console.log(`Task ${model.id}, '${model.description}' successfully deleted!`);
  
        //     // this must be repeated as other things might have changed
        //     i = this.#tasks.findIndex(t => t.model.id === task.id);
        //     const {component} = this.#tasks[i];
        //     component.destroy();
        //     this.#tasks.splice(i, 1);
        //   }
        // } catch (e) {
        //   console.error(`Cannot delete task ${task.id}`, e);
        // }
      }
  
      removeSelectedTasks() {
        const inps = this.#element.querySelectorAll('.task-left input[type=checkbox]:checked');
        const tasks = Array.prototype.slice.apply(inps).map(el => ({id: taskIdOf(el)}));
        tasks.forEach(this.removeTask.bind(this));
      }
  
      createDoorComponent(model) {
        const root = this.#element;
        const component = new DoorComponent(model);
        this.#doors.push({model, component});
        const el = component.init();
        root.appendChild(el);
      }
  
      async addTask(form) {
        const inp = form.querySelector('input');
        const desc = (inp.value || '').trim();
        if (desc) {
          console.log(`Saving new task '${desc}'...`);
          const model = new RestTaskModel(undefined, desc, this.#client);
          await model.create();
          console.log('Task successfully saved', {model: model.toDto()});
          this.createTaskComponent(model);
        }
      }

      async addDoor() {
        console.log("Adding new door ...");
        console.log(this.#doors.length);
        const model = new RestDoorModel(undefined, "closed", this.#client);
        await model.create();
        console.log("Door successfully saved", {model: model.toDto()});
        this.createDoorComponent(model);
      }
    }
  
    /* Exporting component */
    win.DoorsComponent ||= DoorsComponent;
  
  })(window);
  