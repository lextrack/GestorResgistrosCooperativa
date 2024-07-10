document.addEventListener('DOMContentLoaded', (event) => {
    generateCharts();

    document.getElementById('downloadPNG').addEventListener('click', function() {
        downloadPNG();
    });
});

function generateCharts() {
    var productList = JSON.parse(localStorage.getItem("productList")) || [];

    var categoryData = {};
    var categoryCount = {};
    productList.forEach(function(product) {
        if (categoryData[product.categoria]) {
            categoryData[product.categoria] += product.total;
            categoryCount[product.categoria]++;
        } else {
            categoryData[product.categoria] = product.total;
            categoryCount[product.categoria] = 1;
        }
    });

    var labels = Object.keys(categoryData);
    var totalValues = Object.values(categoryData);
    var countValues = Object.values(categoryCount);

    var averageValues = labels.map(label => categoryData[label] / categoryCount[label]);

    generateDoughnutChart('averageSpendingChart', 'Promedio de gastos por categoría', labels, averageValues);
    generateDoughnutChartWithLabel('mostExpensiveCategoryChart', 'Categoría con más gastos', [labels[maxIndex(totalValues)]], [Math.max(...totalValues)], 'Categoría con más gastos', labels[maxIndex(totalValues)], formatCurrency(Math.max(...totalValues)));
    generateDoughnutChartWithLabel('leastExpensiveCategoryChart', 'Categoría con menos gastos', [labels[minIndex(totalValues)]], [Math.min(...totalValues)], 'Categoría con menos gastos', labels[minIndex(totalValues)], formatCurrency(Math.min(...totalValues)));
    displayMostRegisteredCategory(labels[maxIndex(countValues)], Math.max(...countValues));
}

function generateDoughnutChart(chartId, chartLabel, labels, data) {
    var ctx = document.getElementById(chartId).getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: chartLabel,
                data: data,
                backgroundColor: generateColors(data.length),
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 13 
                        },
                        color: 'green' 
                    }
                },
                title: {
                    display: true,
                    text: chartLabel,
                    font: {
                        size: 18
                    },
                    color: 'white'
                },
                labels: {
                    render: 'value'
                }
            }
        }
    });
}

function generateDoughnutChartWithLabel(chartId, chartLabel, labels, data, titleText, categoryName, categoryValue) {
    var ctx = document.getElementById(chartId).getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: chartLabel,
                data: data,
                backgroundColor: generateColors(data.length),
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: [`${titleText}`, `(${categoryName})`, `${categoryValue}`],
                    font: {
                        size: 18
                    },
                    color: 'white'
                },
                labels: {
                    render: 'value'
                }
            }
        }
    });
}

function displayMostRegisteredCategory(category, value) {
    document.getElementById('mostRegisteredCategory').innerText = `${category}: con ${value} registros`;
}

function maxIndex(arr) {
    return arr.indexOf(Math.max(...arr));
}

function minIndex(arr) {
    return arr.indexOf(Math.min(...arr));
}

function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const color = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`;
        colors.push(color);
    }
    return colors;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
}

function downloadPNG() {
    html2canvas(document.querySelector("#averageSpendingChart"), {
        onrendered: function(canvas) {
            saveAs(canvas.toDataURL(), "averageSpendingChart.png");
        }
    });
    html2canvas(document.querySelector("#mostExpensiveCategoryChart"), {
        onrendered: function(canvas) {
            saveAs(canvas.toDataURL(), "mostExpensiveCategoryChart.png");
        }
    });
    html2canvas(document.querySelector("#leastExpensiveCategoryChart"), {
        onrendered: function(canvas) {
            saveAs(canvas.toDataURL(), "leastExpensiveCategoryChart.png");
        }
    });
}

function saveAs(uri, filename) {
    var link = document.createElement('a');
    if (typeof link.download === 'string') {
        link.href = uri;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        window.open(uri);
    }
}
