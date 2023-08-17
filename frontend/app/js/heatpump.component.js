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

        let hdlrOn = new Handler('click', onBtn, () => this.turnOn());
        this.#handlers.push(hdlrOn);
        let hdlrOff = new Handler('click', offBtn, () => this.turnOff());
        this.#handlers.push(hdlrOff);
        let hdlrSetTemp = new Handler('click', setTempBtn, () => this.updateTemperature());
        this.#handlers.push(hdlrSetTemp);
        return this.#element;
    }

    edit() {
      if (this.#edit) {
        this.#edit.classList.remove('hidden');
      } else {
        this.#edit = document.createElement('div');
        this.#edit.className = 'task-edit';
        this.#edit.innerHTML = document.querySelector('script#task-edit-template').textContent;

        const btnSave = this.#edit.querySelector('button[name=save]');
        let hdlr = new Handler('click', btnSave, () => this.save());
        this.#handlers.push(hdlr);

        const btnCancel = this.#edit.querySelector('button[name=cancel]');
        hdlr = new Handler('click', btnCancel, () => this.cancel());
        this.#handlers.push(hdlr);
      }

      const inp = this.#edit.querySelector('input');
      inp.value = this.#model.description;

      const children = [
        this.#element.querySelector('.task-left'),
        this.#element.querySelector('.task-right')];

      children.forEach(c => c.classList.add('hidden'));
      this.#element.append(this.#edit);
    }

    async turnOn() {
      console.debug("Attempting to turn on the heatpump");
      await this.#model.updateState("on");
    }

    async turnOff() {
      console.debug("Attempting to turn off the heatpump");
      await this.#model.updateState("off");
    }

    async updateTemperature() {
      console.debug("Attempting to change heatpump temperature");
      let value = this.#element.querySelector("#tempOp").value;
      await this.#model.updateTemperatureOp(value);
    }

    async save() {
      if (this.#edit) {
        const newDesc = (this.#edit.querySelector('input').value || '').trim();
        if (newDesc) {
          try {
            console.debug(`Attempting to update task ${this.#model.id} with '${newDesc}'...`);
            await this.#model.update(newDesc);
          } catch (e) {
            console.log(`Cannot update task ${this.#model.id}`);
          }
        }
        this._update();
        this._hideEditField();
      }
    }

    cancel() {
      this._hideEditField();
    }

    complete() {
      this.emit('completed', this.#model);
    }

    _hideEditField() {
      if (this.#edit) {
        this.#edit.classList.add('hidden');
      }

      const children = [
        this.#element.querySelector('.task-left'),
        this.#element.querySelector('.task-right')];
      children.forEach(c => c.classList.remove('hidden'));
    }

    _update() {
      if (this.#element) {
        const lbl = this.#element.querySelector('label');
        lbl.textContent = this.#model.description;
      }
    }
  }

  /* Exporting component */
  win.HeatPumpComponent ||= HeatPumpComponent;

})(window);