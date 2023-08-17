'use strict';

(function (win) {
  /**
   * Representation of a door.
   */
  class HeatPumpModel {
    #state;
    #temperatureOp;

    constructor(state, temperatureOp) {
        this.#state = state;
        this.#temperatureOp = temperatureOp;
    }

    //@formatter:off
    get state() { return this.#state; }
    set state(state) { this.#state = state; }
    get temperatureOp() { return this.#temperatureOp; }
    set temperatureOp(temperatureOp) { this.#temperatureOp = temperatureOp; }
    //@formatter:on
  }

  /**
   * A task that can be synchronized with the REST API.
   */
  class RestHeatPumpModel extends HeatPumpModel {
    /** @type {RestClient} */
    #client;

    /**
     * Instances a new `RestHeatPumpModel`.
     * @param state {string} A state
     * @param temperatureOp {string} A operation temperature
     * @param client {RestClient} A REST client
     */
    constructor(state, temperatureOp, client) {
      super(state, temperatureOp);
      this.#client = client;
    }

    toDto() {
      return {state: this.state, temperatureOp: this.temperatureOp};
    }

    async create() {
      let dto = this.toDto();
      dto = await this.#client.post('heatpump', dto);
      this.id = dto.id;
      return this;
    }

    async delete() {
      await this.#client.del(`heatpump`);
      return this;
    }

    async updateState(newState) {
      let dto = {state: newState};
      console.log("Changing heatpump state to " + newState);
      await this.#client.put(`heatpump/state`, dto);
      this.state = newState; 
      return this;
    }

    async updateTemperatureOp(newTemp){
      let dto = {temperatureOp: newTemp};
      console.log("Changing heatpump temperature to " + newTemp);
      await this.#client.put(`heatpump/temperatureOp`, dto);
      this.temperatureOp = newTemp;
      return this;
    }
  }

  /* Exporting models */
  win.RestHeatPumpModel ||= RestHeatPumpModel;
  win.HeatPumpModel ||= HeatPumpModel;

})(window);
