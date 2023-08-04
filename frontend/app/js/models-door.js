'use strict';

(function (win) {
  /**
   * Representation of a door.
   */
  class DoorModel {
    #state;

    constructor(state) {
      this.#state = state;
    }

    //@formatter:off
    // get id() { return this.#id; }
    // set id(id) { this.#id = id; }
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
     * @param state {string} A description
     * @param client {RestClient} A rest client
     */
    constructor(state, client) {
      super(state);
      this.#client = client;
    }

    toDto() {
      // return {id: this.id, description: this.description, timestamp: this.timestamp};
      return {state: this.state};
    }

    async create() {
      let dto = this.toDto();
      dto = await this.#client.post('door', dto);
      // this.id = dto.id;
      return this;
    }

    async delete() {
      // await this.#client.del(`door/${encodeURIComponent(this.id)}`);
      await this.#client.del(`door`);
      return this;
    }

    async update(newState) {
      let dto = {state: newState};
      // await this.#client.put(`task/${encodeURIComponent(this.id)}`, dto);
      await this.#client.put(`door`, dto);
      this.state = newState;
      return this;
    }
  }

  /* Exporting models */
  win.RestDoorModel ||= RestDoorModel;
  win.DoorModel ||= DoorModel;

})(window);
