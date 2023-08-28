'use strict';

(function (win) {
  /**
   * Representation of a door.
   */
  class WeatherModel {
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
  class RestWeatherModel extends WeatherModel {
    /** @type {RestClient} */
    #client;

    /**
     * Instances a new `RestWeatherModel`.
     * @param client {RestClient} A rest client
     */
    constructor(client) {
      super();
      this.#client = client;
    }

    async filter(){
      const resp = await this.#client.get(`weatherData`);
      return resp;
    }
  }

  /* Exporting models */
  win.RestWeatherModel ||= RestWeatherModel;
  win.WeatherModel ||= WeatherModel;

})(window);
