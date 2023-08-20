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
      const refreshBtn = document.querySelector("#refreshDoor");
      refreshBtn.id = `refreshDoor ${this.#model.id}`;
      const closeBtn = this.#element.querySelector("#buttonOff");
      closeBtn.id = `buttonOff ${this.#model.id}`;
      let hdlrOpen = new Handler('click', openBtn, () => this.open());
      this.#handlers.push(hdlrOpen);
      let hdlrClose = new Handler('click', closeBtn, () => this.close());
      this.#handlers.push(hdlrClose);
      let hdlrRestart = new Handler('click', refreshBtn, () => this.restart());
      this.#handlers.push(hdlrRestart);

      return this.#element;
    }

    async open() {
      console.debug("Attempting to open the door");
      try{
        await this.#model.update("open");
      }catch(e) {
        const section = document.querySelector("section");
        const errorMessage = document.querySelector("#error-message");
        section.classList.add("active");
        errorMessage.innerHTML = "Error. Door already closed or is in error.";
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
        errorMessage.innerHTML = "Error. Door already closed or is in error.";
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
        errorMessage.innerHTML = "Error.";
      }
    }

    async newDoor() {
      console.debug("Attempting to create new door");
      await this.#model.create();
    }

  }

  /* Exporting component */
  win.DoorComponent ||= DoorComponent;

})(window);
