'use strict';

(async function () {
  const client = new RestClient('/api');
  const root = document.querySelector('#info');
  const rootDoor = document.querySelector('#info-door');
  const rootPump = document.querySelector('#info-pump');
  const prova = document.querySelector('#prova');
  /** @type {{init:()=>Promise<HTMLElement>,destroy:()=>void}[]} */
  const components = [];
  /** @type {{unsubscribe:() => void}|null} */
  let subscription = null;

  async function init() {
    const token = localStorage.getItem('id_token');
    let elem, /** @type {{init:()=>Promise<HTMLElement>,destroy:()=>void}} */ comp;
    let elem_window, /** @type {{init:()=>Promise<HTMLElement>,destroy:()=>void}} */ comp_window;
    let elem_door, /** @type {{init:()=>Promise<HTMLElement>,destroy:()=>void}} */ comp_door;
    let elem_pump, /** @type {{init:()=>Promise<HTMLElement>,destroy:()=>void}} */ comp_pump;
    //const token = true;
    if (token) {
      //document.body.classList.toggle("enable-theme-var");
      comp_window = new WindowsComponent(client);
      comp_door = new DoorsComponent(client);
      comp_pump = new HeatPumpsComponent(client);
      if (subscription) {
        subscription.unsubscribe();
      }
      subscription = null;
      elem_pump = await comp_pump.init();
      elem_window = await comp_window.init();
      elem_door = await comp_door.init();
      components.forEach(c => c.destroy());
      await rootPump.appendChild(elem_pump);
      await rootDoor.appendChild(elem_door);
      await root.appendChild(elem_window);
      components.push(comp_pump);
      components.push(comp_door);
      components.push(comp_window);
    } else {
      // initializes the login panel
      //document.body.classList.toggle("disable-theme-var");
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