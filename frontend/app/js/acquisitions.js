const ctx = document.getElementById('acquisitions');
const labels = [];
for (let i = 0; i < 11; ++i) {
  labels.push(i.toString());
}

const charData = [
    {
        type: 'line',
        data: {
        labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: [0, 20, 20, 60, 60, 120, 180, 120, 125, 105, 110, 170],
                borderColor: "rgb(255, 99, 132)",
                borderWidth: 3,
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
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
                    suggestedMin: -10,
                    suggestedMax: 200
                }
            }
        }
    },
    {
        type: 'line',
        data: {
        labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: [0, 20, 20, 60, 60, 120, 180, 1000, 125, 105, 110, 170],
                borderColor: "rgb(54, 162, 235)",
                borderWidth: 3,
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
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
                    suggestedMin: -10,
                    suggestedMax: 200
                }
            }
        }
    }
];

let currentChartIndex = 0;
let chart;
// chart = new Chart(ctx, charData[currentChartIndex]);


function showPreviousChart() {
    chart.destroy();
    currentChartIndex = (currentChartIndex - 1 + charData.length) % charData.length;
    chart = new Chart(ctx, charData[currentChartIndex]);
}

function showNextChart() {
    chart.destroy();
    currentChartIndex = (currentChartIndex + 1) % charData.length;
    chart = new Chart(ctx, charData[currentChartIndex]);
//     chart.data.datasets.forEach((dataset) => {
//         chart.data.labels.pop();
//         dataset.data.pop();
//     });
//     chart.update();
}

export function updateChart(newData) {
    
}

chart = new Chart(ctx, charData[currentChartIndex]);
$(document).ready(function() {
    $("button.control_prev").on("click", function(e) {
      e.preventDefault(); // Impedisce il comportamento predefinito del pulsante
      showPreviousChart();
    });

    $("button.control_next").on("click", function(e) {
      e.preventDefault(); // Impedisce il comportamento predefinito del pulsante
      showNextChart();
    });
  });
$("#prevBtn").click(showPreviousChart);
// $("#nextBtn").click(showNextChart);

// b = new Chart(ctx, {
//     type: 'line',
//     data: {
//       labels: labels,
//       datasets: [{
//         label: 'Temperature (°C)',
//         data: [0, 20, 20, 60, 60, 120, 180, 1000, 125, 105, 110, 170],
//         borderColor: "rgb(255, 99, 132)",
//         borderWidth: 3,
//         tension: 0.1,
//         fill: false
//       }]
//     },
//     options: {
//       responsive: true,
//       interaction: {
//         intersect: false,
//       },
//       scales: {
//         y: {
//             display: true,
//             title: {
//               display: true,
//               text: 'Value'
//             },
//             suggestedMin: -10,
//             suggestedMax: 200
//         }
//       }
//     }
// });