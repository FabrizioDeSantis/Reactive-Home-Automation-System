(function (win) {

    /**
     * Given an HTML element representing a task, extracts the task's ID.
     * @param el {HTMLElement} An HTML element representing a task
     * @return {number} The task's ID
     */
    function taskIdOf(el) {
      const idStr = el.id.substring(5 /*'task-'.length*/);
      return parseInt(idStr, 10);
    }
  
    /**
     * A component that shows, adds and removes tasks.
     */
    class DoorsComponent {
      #element = null;
      #client = null;
      #wsclient = null;
      #doors = [];
  
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
        this.subscribeToDoors();
        this.#element = document.createElement('div');
        let newBtn = document.getElementById("buttonNewDoor");
        newBtn.addEventListener('click', ($event) => {
          $event.preventDefault();
          this.addDoor();
        });
  
        try {
          const resp = await this.#client.get(`doors`);
          resp.results.forEach(dto => {
            const model = new RestDoorModel(dto.id, dto.state, this.#client);
            this.createDoorComponent(model);
          });
        } catch (e) {
          console.error('Something went wrong getting doors information', e);
        }
        return this.#element;
      }
  
      createDoorComponent(model) {
        const root = this.#element;
        const component = new DoorComponent(model, this.#wsclient);
        this.#doors.push({model, component});
        const el = component.init();
        root.appendChild(el);
      }

      async addDoor() {
        console.log("Adding new door ...");
        console.log(this.#doors.length);
        const model = new RestDoorModel(undefined, "closed", this.#client);
        await model.create();
        console.log("Door successfully saved", {model: model.toDto()});
        this.createDoorComponent(model);
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

      subscribeToDoors(){
        const doorsObs = this.#wsclient.getDoorsObs();
        const filterBtn = document.querySelector("#filterDate");
        doorsObs.subscribe((data) => {
          let filtered = false;
          filterBtn.classList.forEach(name => {
            if (name == "active") {
              filtered = true;
            }
          });
          let date = new Date(Date.now());
          date = date.toISOString();
          date = date.slice(0, 10);
          const dateDoors = data.value[0];
          const doorsIds = data.value[1];
          const doorsStates = data.value[2];
          for (let i = 0; i < doorsIds.length; i++) {
            this.waitForElementToBeAvailable("door-" + (i + 1)).then(function() {
              document.getElementById("door-" + doorsIds[i]).innerHTML = doorsStates[i];
              let buttonRefresh = document.getElementById("refreshDoor " + doorsIds[i]);
              const cerchio = document.querySelector(".insights .door" + doorsIds[i] + " svg circle");
              let chartInstance = Chart.getChart("chartDoor-" + doorsIds[i]);
              let sample = chartInstance.data.labels[0];
              switch (doorsStates[i]) {
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
                chartInstance.data.labels.push(dateDoors.date + "\n" + dateDoors.time);
                switch (doorsStates[i]) {
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
                  chartInstance.data.labels.push(dateDoors.date + "\n" + dateDoors.time);
                  switch (doorsStates[i]) {
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
    }
  
    /* Exporting component */
    win.DoorsComponent ||= DoorsComponent;
  
  })(window);
  