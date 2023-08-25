const datapoints2 = [0, 0, 2, 0, 1, 0];
const labels = [];
for (let i = 0; i < 12; ++i) {
  labels.push(i.toString());
}
var yLabels = {0: "error", 1: "off", 2: "on"};

// Weather chart

const dataWeather = {
    labels: [],
    datasets: [{
        label: 'Temperature Weather (°C)',
        data: [],
        borderColor: "rgb(255, 99, 132)",
        borderWidth: 3,
        tension: 0.1,
        fill: false
        }]
};

  // config 
const configWeather = {
    type: 'line',
    data: dataWeather,
    options: {
        responsive: true,
        aspectRatio: 1,
        interaction: {
            intersect: false,
        },
        scales: {
            y: {
                display: true,
                title: {
                display: true,
                text: 'Value'
                },
                suggestedMin: 0,
                suggestedMax: 25
            }
        }
    }
  };

  // render init block
const myChartWeather = new Chart(
    document.getElementById('chartWeather'),
    configWeather
);

// Thermometer chart

const dataThermometer = {
    labels: [],
    datasets: [{
        label: 'Temperature Thermometer (°C)',
        data: [],
        borderColor: "rgb(54, 162, 235)",
        borderWidth: 3,
        tension: 0.1,
        fill: false
        }]
};

// config 
const configThermometer = {
    type: 'line',
    data: dataThermometer,
    options: {
        responsive: true,
        aspectRatio: 1,
        interaction: {
            intersect: false,
        },
        scales: {
            y: {
                display: true,
                title: {
                display: true,
                text: 'Value'
                },
                suggestedMin: 0,
                suggestedMax: 25
            }
        }
    }
  };

  // render init block
const myChartThermometer = new Chart(
    document.getElementById('chartThermometer'),
    configThermometer
);

// Heat Pump

const dataHeatPump = {
    labels: [],
    datasets: [{
        label: 'Temperature Heat Pump (°C)',
        data: [],
        borderColor: "rgb(75, 192, 192)",
        borderWidth: 3,
        tension: 0.1,
        fill: false
        }]
};

// config 
const configHeatPump = {
    type: 'line',
    data: dataHeatPump,
    options: {
        responsive: true,
        aspectRatio: 1,
        interaction: {
            intersect: false,
        },
        scales: {
            y: {
                display: true,
                title: {
                display: true,
                text: 'Value'
                },
                suggestedMin: 0,
                suggestedMax: 25
            }
        }
    }
  };

  // render init block
const myChartHeatPump = new Chart(
    document.getElementById('chartHeatPump'),
    configHeatPump
);

const dataHeatPumpState = {
    labels: [],
    datasets: [{
        label: 'Heat Pump States',
        data: datapoints2,
        borderColor: "rgb(75, 192, 192)",
        borderWidth: 3,
        tension: 0.1,
        fill: false
        }]
};

// config 
const configHeatPumpState = {
    type: 'line',
    data: dataHeatPumpState,
    options: {
        responsive: true,
        aspectRatio: 1,
        interaction: {
            intersect: false,
        },
        scales: {
            y: {
                display: true,
                title: {
                display: true,
                text: 'Value'
                },
                suggestedMin: 0,
                suggestedMax: 2,
                ticks: {
                    beginAtZero: true,
                    callback: function(value, index, values) {
                        return yLabels[value];
                    }
                }
            }
        }
    }
  };

  // render init block
const myChartHeatPumpState = new Chart(
    document.getElementById('chartHeatPumpState'),
    configHeatPumpState
);

export function addData(chart, label, newData) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(newData);
    });
    chart.update();
} 

window.myChartWeather = myChartWeather;
window.myChartThermometer = myChartThermometer;
window.myChartHeatPump = myChartHeatPump;
export {myChartWeather, myChartThermometer, myChartHeatPump};