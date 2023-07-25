const themeToggler = document.querySelector(".theme-toggler");

// change theme
themeToggler.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme-var");
    //themeToggler.querySelector("span").classList.toggle("active");
    themeToggler.querySelector("span:nth-child(1)").classList.toggle("active");
    themeToggler.querySelector("span:nth-child(2)").classList.toggle("active");
})

const ws = new WebSocket("ws://10.88.0.11:8000");
ws.onopen = () => {
    console.log("Connessione websocket stabilita con il server di backend");
};
ws.onmessage = (event) => {
    const dataDisplay = document.getElementById("temperature-weather");
    dataDisplay.innerHTML = event.data;
};