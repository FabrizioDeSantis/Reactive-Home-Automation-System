'use strict';

(function (win) {
  /**
   * Representation of a door.
   */
  class ThermometerModel {
    #temp;

    constructor() {
      this.#temp = null;
    }

    //@formatter:off
    get temp() { return this.#temp; }
    set temp(temp) { this.#temp = temp; }
    //@formatter:on
  }

  /**
   * A task that can be synchronized with the REST API.
   */
  class RestThermometerModel extends ThermometerModel {
    /** @type {RestClient} */
    #client;

    /**
     * Instances a new `RestThermometerModel`.
     * @param client {RestClient} A rest client
     */
    constructor(client) {
      super();
      this.#client = client;
    }

    async filter(){
      const resp = await this.#client.get(`thermometerData`);
      return resp;
    }
  }

  /* Exporting models */
  win.RestThermometerModel ||= RestThermometerModel;
  win.ThermometerModel ||= ThermometerModel;

})(window);
