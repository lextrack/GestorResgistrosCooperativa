var categoryChart; 

function generateChart() {
    var productList = JSON.parse(localStorage.getItem("productList")) || [];

    var categoryData = {};
    productList.forEach(function(product) {
        if (categoryData[product.categoria]) {
            categoryData[product.categoria] += product.total;
        } else {
            categoryData[product.categoria] = product.total;
        }
    });

    var labels = Object.keys(categoryData);
    var values = Object.values(categoryData);

    if (categoryChart) {
        categoryChart.destroy();
    }

    var ctx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total por cada categoría',
                data: values,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 10 
                        },
                        color: 'white'
                    }
                },
                y: {
                    ticks: {
                        font: {
                            size: 12 
                        },
                        color: 'red'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 13 
                        },
                        color: 'green' 
                    }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', (event) => {
    generateChart();
});

function downloadChartAsPNG() {
    var link = document.createElement('a');
    link.href = categoryChart.toBase64Image();
    link.download = 'grafico_categorias.png';
    link.click();
}