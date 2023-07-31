const ws = new WebSocket("ws://backend:8000");

ws.onopen = function() {
    ws.send(JSON.stringify({"type": "subscribe", "source": "client"}));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if(data.type == "temperature") {
        document.getElementById("temperature-weather").innerHTML = Math.round(data.value) + "°C";
    }
    else if (data.type == "windows") {
        document.getElementById("window-1").innerHTML = data.value;
        const cerchio = document.querySelector(".insights .windows1 svg circle");
        switch(data.value){
            case "open":
                cerchio.style.stroke = "#41f1b6";
                break;
            case "closed":
                cerchio.style.stroke = "#363949";
                break;
            case "error":
                cerchio.style.stroke = "#ff7782";
                break;
        }
    }
};