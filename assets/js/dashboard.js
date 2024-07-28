document.addEventListener('DOMContentLoaded', (event) => {
    generateCharts();

    document.getElementById('downloadPNG').addEventListener('click', function() {
        downloadPNG();
    });

    document.getElementById('downloadPDF').addEventListener('click', function() {
        downloadPDF();
    });
});

let mostRegisteredCategoryText = '';

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
                        color: 'gray' 
                    }
                },
                title: {
                    display: true,
                    text: chartLabel,
                    font: {
                        size: 18
                    },
                    color: 'gray' 
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItem) {
                            return tooltipItem[0].label;
                        },
                        label: function(tooltipItem) {
                            return tooltipItem.raw;
                        }
                    },
                    titleColor: 'white',  
                    bodyColor: 'white'  
                },
                labels: {
                    render: 'value',
                    fontColor: 'white' 
                }
            },
            layout: {
                padding: {
                    top: 20,
                    bottom: 20
                }
            },
            elements: {
                arc: {
                    backgroundColor: '#333',
                }
            },
            backgroundColor: '#222', 
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
                    color: 'gray' 
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItem) {
                            return tooltipItem[0].label;
                        },
                        label: function(tooltipItem) {
                            return tooltipItem.raw;
                        }
                    },
                    titleColor: 'white', 
                    bodyColor: 'white' 
                },
                labels: {
                    render: 'value',
                    fontColor: 'white'
                }
            },
            layout: {
                padding: {
                    top: 20,
                    bottom: 20
                }
            },
            elements: {
                arc: {
                    backgroundColor: '#333',
                }
            },
            backgroundColor: '#222',
        }
    });
}

function maxIndex(arr) {
    return arr.indexOf(Math.max(...arr));
}

function minIndex(arr) {
    return arr.indexOf(Math.min(...arr));
}

function displayMostRegisteredCategory(category, value) {
    mostRegisteredCategoryText = `La categoría "${category}" es la que tiene más entradas, con ${value} registros`;
    document.getElementById('mostRegisteredCategory').innerText = mostRegisteredCategoryText;
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
    const chartIds = ['averageSpendingChart', 'mostExpensiveCategoryChart', 'leastExpensiveCategoryChart'];

    chartIds.forEach(chartId => {
        html2canvas(document.getElementById(chartId)).then(canvas => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `${chartId}.png`;
            link.click();
        });
    });
}

//Imagina si Adobe ni su formato PDF no existira, la vida sería mejor
async function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'letter');
    const chartIds = ['averageSpendingChart', 'mostExpensiveCategoryChart', 'leastExpensiveCategoryChart'];
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const imgWidth = pageWidth - 2 * margin;

    pdf.setFontSize(15);
    pdf.text('Estadísticas', pageWidth / 2, margin / 2, { align: 'center' });
    
    if (mostRegisteredCategoryText) {
        pdf.setFontSize(8);
        pdf.text(mostRegisteredCategoryText, pageWidth / 2, margin, { align: 'center' });
    }

    let y = margin + 10;

    for (const chartId of chartIds) {
        try {
            const canvas = await html2canvas(document.getElementById(chartId));
            const imgData = canvas.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

            if (y + imgHeight > pageHeight) {
                pdf.addPage();
                y = margin;
            }

            pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
            y += imgHeight + 10;
        } catch (error) {
            alert(`Error al generar el canvas para el gráfico ${chartId}: ${error.message}`);
            return;
        }
    }

    pdf.save('gráficos_estadísticos.pdf');
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