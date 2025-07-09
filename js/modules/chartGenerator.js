import { getProductList } from './dataManager.js';
import { formatCurrency } from './currencyFormatter.js';
import { mostrarToast } from './uiHelpers.js';

let categoryChart;
let mostRegisteredCategoryText = '';

export function initializeCharts(page) {
    switch(page) {
        case 'balance':
            generateCategoryChart();
            break;
        case 'dashboard':
            generateDashboardCharts();
            break;
    }
}

export async function generateCategoryChart() {
    try {
        const productList = await getProductList();
        
        if (productList.length === 0) {
            const ctx = document.getElementById('categoryChart');
            if (ctx) {
                ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
                mostrarToast('Info', 'No hay datos para mostrar en el gráfico', 'info', 3000);
            }
            return;
        }

        const categoryData = {};

        productList.forEach(product => {
            const category = product.categoria || 'Sin categoría';
            const total = parseFloat(product.total) || 0;
            categoryData[category] = (categoryData[category] || 0) + total;
        });

        const labels = Object.keys(categoryData);
        const values = Object.values(categoryData);

        if (categoryChart) {
            categoryChart.destroy();
        }

        const ctx = document.getElementById('categoryChart');
        if (!ctx) {
            console.error('Elemento categoryChart no encontrado');
            return;
        }

        categoryChart = new Chart(ctx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total por cada categoría',
                    data: values,
                    backgroundColor: labels.map((_, i) => `hsl(${i * 360 / labels.length}, 70%, 50%)`),
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
                            font: { size: 12 },
                            color: 'green'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = formatCurrency(context.parsed);
                                return `${label}: ${value}`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error al generar gráfico de categorías:', error);
        mostrarToast('Error', 'No se pudo generar el gráfico de categorías', 'danger');
    }
}

export async function generateDashboardCharts() {
    try {
        const productList = await getProductList();
        
        if (productList.length === 0) {
            mostrarToast('Info', 'No hay datos para mostrar en las estadísticas', 'info', 3000);
            return;
        }

        const categoryData = {};
        const categoryCount = {};

        productList.forEach(product => {
            const category = product.categoria || 'Sin categoría';
            const total = parseFloat(product.total) || 0;
            
            if (categoryData[category]) {
                categoryData[category] += total;
                categoryCount[category]++;
            } else {
                categoryData[category] = total;
                categoryCount[category] = 1;
            }
        });

        const labels = Object.keys(categoryData);
        const totalValues = Object.values(categoryData);
        const countValues = Object.values(categoryCount);
        const averageValues = labels.map(label => categoryData[label] / categoryCount[label]);

        await generateDoughnutChart('averageSpendingChart', 'Promedio de gastos por categoría', labels, averageValues);
        
        const maxTotalIndex = maxIndex(totalValues);
        const minTotalIndex = minIndex(totalValues);
        
        await generateDoughnutChartWithLabel('mostExpensiveCategoryChart', 'Categoría con más gastos', 
            [labels[maxTotalIndex]], [Math.max(...totalValues)], 
            'Categoría con más gastos', labels[maxTotalIndex], 
            formatCurrency(Math.max(...totalValues))
        );
        
        await generateDoughnutChartWithLabel('leastExpensiveCategoryChart', 'Categoría con menos gastos', 
            [labels[minTotalIndex]], [Math.min(...totalValues)], 
            'Categoría con menos gastos', labels[minTotalIndex], 
            formatCurrency(Math.min(...totalValues))
        );
        
        const maxCountIndex = maxIndex(countValues);
        displayMostRegisteredCategory(labels[maxCountIndex], Math.max(...countValues));
        
    } catch (error) {
        console.error('Error al generar gráficos del dashboard:', error);
        mostrarToast('Error', 'No se pudieron generar las estadísticas', 'danger');
    }
}

async function generateDoughnutChart(chartId, chartLabel, labels, data) {
    const ctx = document.getElementById(chartId);
    if (!ctx) {
        console.error(`Elemento ${chartId} no encontrado`);
        return null;
    }

    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }

    return new Chart(ctx.getContext('2d'), {
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
        options: getChartOptions(chartLabel)
    });
}

async function generateDoughnutChartWithLabel(chartId, chartLabel, labels, data, titleText, categoryName, categoryValue) {
    const ctx = document.getElementById(chartId);
    if (!ctx) {
        console.error(`Elemento ${chartId} no encontrado`);
        return null;
    }

    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }

    return new Chart(ctx.getContext('2d'), {
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
            ...getChartOptions(),
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: [`${titleText}`, `(${categoryName})`, `${categoryValue}`],
                    font: { size: 18 },
                    color: 'gray'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.parsed);
                        }
                    },
                    titleColor: 'white',
                    bodyColor: 'white'
                }
            }
        }
    });
}

function getChartOptions(title = '') {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    font: { size: 13 },
                    color: 'gray'
                }
            },
            title: {
                display: !!title,
                text: title,
                font: { size: 18 },
                color: 'gray'
            },
            tooltip: {
                callbacks: {
                    title: (tooltipItem) => tooltipItem[0].label,
                    label: (tooltipItem) => formatCurrency(tooltipItem.raw)
                },
                titleColor: 'white',
                bodyColor: 'white'
            }
        },
        layout: {
            padding: { top: 20, bottom: 20 }
        },
        elements: { arc: { backgroundColor: '#333' } },
        backgroundColor: '#222'
    };
}

function maxIndex(arr) {
    if (arr.length === 0) return -1;
    return arr.indexOf(Math.max(...arr));
}

function minIndex(arr) {
    if (arr.length === 0) return -1;
    return arr.indexOf(Math.min(...arr));
}

function displayMostRegisteredCategory(category, value) {
    mostRegisteredCategoryText = `La categoría "${category}" es la que tiene más entradas, con ${value} registros`;
    const element = document.getElementById('mostRegisteredCategory');
    if (element) {
        element.innerText = mostRegisteredCategoryText;
    }
}

function generateColors(count) {
    return Array.from({ length: count }, (_, index) => 
        `hsla(${(index * 360 / count) + Math.random() * 60}, 70%, 50%, 0.8)`
    );
}

export function downloadChartAsPNG() {
    if (!categoryChart || typeof categoryChart.toBase64Image !== 'function') {
        mostrarToast('Error', 'El gráfico no está disponible para descargar', 'danger');
        return;
    }

    try {
        const link = document.createElement('a');
        link.href = categoryChart.toBase64Image();
        link.download = 'gráfico_categorías.png';
        link.click();
        mostrarToast('Éxito', 'Gráfico descargado como PNG', 'success');
    } catch (error) {
        console.error('Error al descargar el gráfico:', error);
        mostrarToast('Error', 'No se pudo descargar el gráfico', 'danger');
    }
}

export function getMostRegisteredCategoryText() {
    return mostRegisteredCategoryText;
}