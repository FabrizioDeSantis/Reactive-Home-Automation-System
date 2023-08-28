'use strict';

(function (win) {
  /**
   * Representation of a door.
   */
  class DoorModel {
    #id;
    #state;

    constructor(id, state) {
      this.#id = id;
      this.#state = state;
    }

    //@formatter:off
    get id() { return this.#id; }
    set id(id) { this.#id = id; }
    get state() { return this.#state; }
    set state(state) { this.#state = state; }
    //@formatter:on
  }

  /**
   * A task that can be synchronized with the REST API.
   */
  class RestDoorModel extends DoorModel {
    /** @type {RestClient} */
    #client;

    /**
     * Instances a new `RestTaskModel`.
     * @param id {int} A id
     * @param state {string} A description
     * @param client {RestClient} A rest client
     */
    constructor(id, state, client) {
      super(id, state);
      this.#client = client;
    }

    toDto() {
      // return {id: this.id, description: this.description, timestamp: this.timestamp};
      return {id: this.id, state: this.state};
    }

    async create() {
      let dto = this.toDto();
      dto = await this.#client.post('door', dto);
      console.log(dto);
      this.id = dto.id;
      return this;
    }

    async delete() {
      await this.#client.del(`door/${encodeURIComponent(this.id)}`);
      return this;
    }

    async update(newState) {
      let dto = {state: newState};
      console.log("Changing Door " + this.id + " to " + newState);
      await this.#client.put(`door/${encodeURIComponent(this.id)}`, dto);
      this.state = newState;
      return this;
    }

    async filter(){
      const resp = await this.#client.get(`doorData/${encodeURIComponent(this.id)}`);
      return resp;
    }
  }

  /* Exporting models */
  win.RestDoorModel ||= RestDoorModel;
  win.DoorModel ||= DoorModel;

})(window);
