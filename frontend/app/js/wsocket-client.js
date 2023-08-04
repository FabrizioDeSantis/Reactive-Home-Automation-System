const ws = new WebSocket("ws://backend:8000");

ws.onopen = function() {
    ws.send(JSON.stringify({"type": "subscribe", "source": "client"}));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch(data.type){
        case "temperature":
            document.getElementById("temperature-weather").innerHTML = data.value.toFixed(1) + "°C";
            break;

        case "temperatures":
            //console.log(data.value);
            break;

        case "windows":
            const windowsStates = data.value;

            for (let i = 0; i < windowsStates.length; i++) {
                document.getElementById("window-" + (i + 1)).innerHTML = windowsStates[i];
                const cerchio = document.querySelector(".insights .window" + (i + 1) + " svg circle");
                switch(windowsStates[i]){
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
            break;

        case "doors":
            const doorsStates = data.value;

            for (let i = 0; i < doorsStates.length; i++) {
                document.getElementById("door-" + (i + 1)).innerHTML = doorsStates[i];
                const cerchio = document.querySelector(".insights .door" + (i + 1) + " svg circle");
                switch(doorsStates[i]){
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
            break;
        
        case "heatpump":
            const heatPumpInformations = data.value;

            document.getElementById("heatpump").innerHTML = heatPumpInformations.state;
            document.getElementById("temperature-heatpump").innerHTML = heatPumpInformations.temperatureOp.toFixed(1) + "°C";
            const cerchio = document.querySelector(".insights .heatpump svg circle");
            switch(heatPumpInformations.state){
                case "on":
                    cerchio.style.stroke = "#41f1b6";
                    break;
                case "off":
                    cerchio.style.stroke = "#363949";
                    break;
                case "error":
                    cerchio.style.stroke = "#ff7782";
                    break;
            }
            break;

        case "thermometer":
            console.log(data.value);
            document.getElementById("temperature-room").innerHTML = data.value.toFixed(1) + "°C";
            break;
    }
};