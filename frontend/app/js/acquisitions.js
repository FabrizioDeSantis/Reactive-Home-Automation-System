const ctx = document.getElementById('acquisitions');
const labels = [];
for (let i = 0; i < 12; ++i) {
  labels.push(i.toString());
}

// const charData = [
//     {
//         type: 'line',
//         data: {
//         labels: [1],
//             datasets: [{
//                 label: 'Temperature Weather (°C)',
//                 data: [1],
//                 borderColor: "rgb(255, 99, 132)",
//                 borderWidth: 3,
//                 tension: 0.1,
//                 fill: false
//             }]
//         },
//         options: {
//             plugins: {
//                 zoom: {
//                   zoom: {
//                     pan: {
//                         enabled: true,
//                     },
//                     wheel: {
//                       enabled: true,
//                     },
//                     pinch: {
//                       enabled: true
//                     },
//                     mode: 'x',
//                   }
//                 }
//               },
//             responsive: true,
//             interaction: {
//                 intersect: false,
//             },
//             scales: {
//                 y: {
//                     display: true,
//                     title: {
//                     display: true,
//                     text: 'Value'
//                     },
//                     suggestedMin: 0,
//                     suggestedMax: 25
//                 },
//                 x: {
//                     maxDataPoints: 5
//                 }
//             }
//         }
//     },
//     {
//         type: 'line',
//         data: {
//         labels: labels,
//             datasets: [{
//                 label: 'Temperature Thermometer (°C)',
//                 data: [0, 20, 20, 60, 60, 120, 180, 1000, 125, 105, 110, 170],
//                 borderColor: "rgb(54, 162, 235)",
//                 borderWidth: 3,
//                 tension: 0.1,
//                 fill: false
//             }]
//         },
//         options: {
//             responsive: true,
//             interaction: {
//                 intersect: false,
//             },
//             scales: {
//                 y: {
//                     display: true,
//                     title: {
//                     display: true,
//                     text: 'Value'
//                     },
//                     suggestedMin: 0,
//                     suggestedMax: 25
//                 }
//             }
//         }
//     }
// ];

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
    labels: labels,
    datasets: [{
        label: 'Temperature Heat Pump (°C)',
        data: [0, 20, 20, 60, 60, 120, 180, 1000, 125, 105, 110, 170],
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

export function addData(chart, label, newData) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(newData);
    });
    chart.update();
} 

window.myChartWeather = myChartWeather;
window.myChartThermometer = myChartThermometer;
export {myChartWeather, myChartThermometer};