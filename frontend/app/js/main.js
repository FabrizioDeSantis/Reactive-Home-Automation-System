'use strict';

(async function () {
  const client = new RestClient('/api');
  const root = document.querySelector('#info');
  const prova = document.querySelector('#prova');
  /** @type {{init:()=>Promise<HTMLElement>,destroy:()=>void}[]} */
  const components = [];
  /** @type {{unsubscribe:() => void}|null} */
  let subscription = null;

  async function init() {
    //const token = localStorage.getItem('id_token');
    let elem, /** @type {{init:()=>Promise<HTMLElement>,destroy:()=>void}} */ comp;
    let elem_window, /** @type {{init:()=>Promise<HTMLElement>,destroy:()=>void}} */ comp_window;
    let elem_door, /** @type {{init:()=>Promise<HTMLElement>,destroy:()=>void}} */ comp_door;
    const token = true;
    if (token) {
      // initializes the tasks
      comp_window = new WindowsComponent(client);
      const model = new RestDoorModel("open", client);
      comp_door = new DoorComponent(model);
      elem_door = await comp_door.init();
      if (subscription) {
        subscription.unsubscribe();
      }
      subscription = null;
      elem_window = await comp_window.init();
      components.forEach(c => c.destroy());
      await root.appendChild(elem_window);
      components.push(comp_window);
      components.push(comp_door);
    } else {
      // initializes the login panel
      comp = new LoginComponent(client);
      subscription = comp.on('authenticated', init);
      elem = await comp.init();
      components.forEach(c => c.destroy());
      await prova.appendChild(elem);
      components.push(comp);
    }
  }

  // initializes the components
  await init();
  console.info('🏁 Application initialized');

})();
