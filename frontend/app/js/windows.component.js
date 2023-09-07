(function (win) {

    /**
     * Given an HTML element representing a task, extracts the task's ID.
     * @param el {HTMLElement} An HTML element representing a task
     * @return {number} The task's ID
     */
    function windowIdOf(el) {
      const idStr = el.id.substring(7 /*'task-'.length*/);
      return parseInt(idStr, 10);
    }
  
    /**
     * A component that shows, adds and removes windows.
     */
    class WindowsComponent {
      #element = null;
      #client = null;
      #wsclient = null;
      #windows = [];
  
      /**
       * Instances this component.
       * @param client {RestClient} A REST client
       */
      constructor(client, wsclient) {
        this.#client = client;
        this.#wsclient = wsclient;
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
        this.subscribeToWindows();
        this.#element = document.createElement('div');
        
        let newBtn = document.getElementById("buttonNewWindow");
        newBtn.addEventListener('click', ($event) => {
          $event.preventDefault();
          this.addWindow();
        });
  
        try {
          const resp = await this.#client.get(`windows`);
          resp.results.forEach(dto => {
            const model = new RestWindowModel(dto.id, dto.state, this.#client);
            this.createWindowComponent(model);
          });
        } catch (e) {
          console.error('Something went wrong getting tasks', e);
        }
  
        return this.#element;
      }

      waitForElementToBeAvailable(elementId) {
        return new Promise(function (resolve) {
            var checkElementInterval = setInterval(function () {
                var elemento = document.getElementById(elementId);
                if (elemento) {
                    clearInterval(checkElementInterval);
                    resolve(elemento);
                }
            }, 100);
        });
      }

      subscribeToWindows(){
        const windowsObs = this.#wsclient.getWindowsObs();
        const filterBtn = document.querySelector("#filterDate");
        windowsObs.subscribe((data) => {
          let filtered = false;
          filterBtn.classList.forEach(name => {
            if (name == "active") {
              filtered = true;
            }
          });
          let date = new Date(Date.now());
          date = date.toISOString();
          date = date.slice(0, 10);
          const dateWindows = data.value[0];
          const windowsIds = data.value[1];
          const windowsStates = data.value[2];
          for (let i = 0; i < windowsIds.length; i++) {
            this.waitForElementToBeAvailable("window-" + (i + 1)).then(function() {
              document.getElementById("window-" + windowsIds[i]).innerHTML = windowsStates[i];
              let buttonRefresh = document.getElementById("refreshWindow " + windowsIds[i]);
              const cerchio = document.querySelector(".insights .window" + windowsIds[i] + " svg circle");
              let chartInstance = Chart.getChart("chartWindow-" + windowsIds[i]);
              let sample = chartInstance.data.labels[0];
              switch (windowsStates[i]) {
                case "open":
                  cerchio.style.stroke = "#41f1b6";
                  buttonRefresh.classList.remove("active");
                  break;
                case "closed":
                  cerchio.style.stroke = "#363949";
                  buttonRefresh.classList.remove("active");
                  break;
                case "error":
                  cerchio.style.stroke = "#ff7782";
                  buttonRefresh.classList.add("active");
                  break;
              }
              if (!filtered && sample === undefined) {
                chartInstance.data.labels.push(dateWindows.date + "\n" + dateWindows.time);
                switch (windowsStates[i]) {
                  case "open":
                    chartInstance.data.datasets[0].data.push(2);
                    break;
                  case "closed":
                    chartInstance.data.datasets[0].data.push(1);
                    break;
                  case "error":
                    chartInstance.data.datasets[0].data.push(0);
                    break;
                }
                chartInstance.update();
              }
              if (sample !== undefined) {
                if (date == sample.slice(0, 10)) {
                  chartInstance.data.labels.push(dateWindows.date + "\n" + dateWindows.time);
                  switch (windowsStates[i]) {
                    case "open":
                      chartInstance.data.datasets[0].data.push(2);
                      break;
                    case "closed":
                      chartInstance.data.datasets[0].data.push(1);
                      break;
                    case "error":
                      chartInstance.data.datasets[0].data.push(0);
                      break;
                  }
                  chartInstance.update();
                }
              }
            });
          }
        });
      }

      createWindowComponent(model) {
        const root = this.#element;
        const component = new WindowComponent(model, this.#wsclient);
        this.#windows.push({model, component});
        const el = component.init();
        root.appendChild(el);
      }

      async addWindow() {
        console.log("Adding new window ...");
        console.log(this.#windows.length);
        const model = new RestWindowModel(undefined, "closed", this.#client);
        await model.create();
        console.log("Window successfully saved", {model: model.toDto()});
        this.createWindowComponent(model);
      }
    }
  
    /* Exporting component */
    win.WindowsComponent ||= WindowsComponent;
  
  })(window);
  