'use strict';

(function (win) {
  /**
   * Representation of a door.
   */
  class WindowModel {
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
  class RestWindowModel extends WindowModel {
    /** @type {RestClient} */
    #client;

    /**
     * Instances a new `RestTaskModel`.
     * @param id {int} A id
     * @param state {string} A state
     * @param client {RestClient} A rest client
     */
    constructor(id, state, client) {
      super(id, state);
      this.#client = client;
    }

    toDto() {
      return {id: this.id, state: this.state};
    }

    async create() {
      let dto = this.toDto();
      dto = await this.#client.post('window', dto);
      this.id = dto.id;
      return this;
    }

    async delete() {
      await this.#client.del(`window/${encodeURIComponent(this.id)}`);
      return this;
    }

    async update(newState) {
      let dto = {state: newState};
      console.log("Changing Windows " + this.id + " to " + newState);
      console.log(`window/${encodeURIComponent(this.id)}`);
      await this.#client.put(`window/${encodeURIComponent(this.id)}`, dto);
      this.state = newState;
      return this;
    }
  }

  /* Exporting models */
  win.RestWindowModel ||= RestWindowModel;
  win.WindowModel ||= WindowModel;

})(window);
