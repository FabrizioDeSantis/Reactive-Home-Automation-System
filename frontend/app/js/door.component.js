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
        
      const root = document.querySelector('#insights');
        
      root.appendChild(element2);

      const doorNumber = this.#element.querySelector("#command-header");
      doorNumber.innerHTML = `Door ${this.#model.id} - ${doorNumber.innerHTML}`;

      const openBtn = this.#element.querySelector("#buttonOn");
      openBtn.id = `buttonOn ${this.#model.id}`;
      const closeBtn = this.#element.querySelector("#buttonOff");
      closeBtn.id = `buttonOff ${this.#model.id}`;
      let hdlrOpen = new Handler('click', openBtn, () => this.open());
      this.#handlers.push(hdlrOpen);
      let hdlrClose = new Handler('click', closeBtn, () => this.close());
      this.#handlers.push(hdlrClose);

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

    async open() {
      console.debug("Attempting to open the door");
      try{
        await this.#model.update("open");
      }catch(e) {
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        section.classList.add("active");
        errorMessage.innerHTML = "Error. Door already closed";
      }
    }

    async close() {
      console.debug("Attempting to close the door");
      try{
        await this.#model.update("closed");
      }catch(e) {
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        section.classList.add("active");
        errorMessage.innerHTML = "Error. Door already closed";
      }
    }

    async newDoor() {
      console.debug("Attempting to create new door");
      await this.#model.create();
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
  win.DoorComponent ||= DoorComponent;

})(window);
