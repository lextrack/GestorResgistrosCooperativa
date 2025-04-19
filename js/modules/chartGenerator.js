import { getProductList } from './dataManager.js';
import { formatCurrency } from './currencyFormatter.js';

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

export function generateCategoryChart() {
    const productList = getProductList();
    const categoryData = {};

    productList.forEach(product => {
        categoryData[product.categoria] = (categoryData[product.categoria] || 0) + product.total;
    });

    const labels = Object.keys(categoryData);
    const values = Object.values(categoryData);

    if (categoryChart) {
        categoryChart.destroy();
    }

    const ctx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(ctx, {
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
                }
            }
        }
    });
}

export function generateDashboardCharts() {
    const productList = getProductList();
    const categoryData = {};
    const categoryCount = {};

    productList.forEach(product => {
        if (categoryData[product.categoria]) {
            categoryData[product.categoria] += product.total;
            categoryCount[product.categoria]++;
        } else {
            categoryData[product.categoria] = product.total;
            categoryCount[product.categoria] = 1;
        }
    });

    const labels = Object.keys(categoryData);
    const totalValues = Object.values(categoryData);
    const countValues = Object.values(categoryCount);
    const averageValues = labels.map(label => categoryData[label] / categoryCount[label]);

    generateDoughnutChart('averageSpendingChart', 'Promedio de gastos por categoría', labels, averageValues);
    generateDoughnutChartWithLabel('mostExpensiveCategoryChart', 'Categoría con más gastos', 
        [labels[maxIndex(totalValues)]], [Math.max(...totalValues)], 
        'Categoría con más gastos', labels[maxIndex(totalValues)], 
        formatCurrency(Math.max(...totalValues))
    );
    generateDoughnutChartWithLabel('leastExpensiveCategoryChart', 'Categoría con menos gastos', 
        [labels[minIndex(totalValues)]], [Math.min(...totalValues)], 
        'Categoría con menos gastos', labels[minIndex(totalValues)], 
        formatCurrency(Math.min(...totalValues))
    );
    displayMostRegisteredCategory(labels[maxIndex(countValues)], Math.max(...countValues));
}

function generateDoughnutChart(chartId, chartLabel, labels, data) {
    const ctx = document.getElementById(chartId).getContext('2d');
    return new Chart(ctx, {
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

function generateDoughnutChartWithLabel(chartId, chartLabel, labels, data, titleText, categoryName, categoryValue) {
    const ctx = document.getElementById(chartId).getContext('2d');
    return new Chart(ctx, {
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
                    label: (tooltipItem) => tooltipItem.raw
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
    return Array.from({ length: count }, () => 
        `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`
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