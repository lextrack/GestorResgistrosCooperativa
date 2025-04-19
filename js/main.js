import { 
    getProductList, addProduct, deleteProduct, updateProduct, 
    calculateTotalSum, searchProducts, itemsPerPage 
} from './modules/dataManager.js';
import { formatCurrency, formatInputPrice } from './modules/currencyFormatter.js';
import { 
    generateCategoryChart, generateDashboardCharts, 
    downloadChartAsPNG, getMostRegisteredCategoryText 
} from './modules/chartGenerator.js';
import { downloadSingleChartPDF, downloadChartsPDF } from './modules/pdfExporter.js';
import { exportToExcel } from './modules/excelExporter.js';
import { exportToJSON, importFromJSON } from './modules/jsonHandler.js';
import { mostrarToast, resetForm, toggleFormButtons } from './modules/uiHelpers.js';
import { renderPagination, paginateItems } from './modules/pagination.js';

let currentPage = 1;
let totalPages = 1;

function initializePage() {
    const path = window.location.pathname.split('/').pop();

    setupCommonEventListeners();
    
    if (path.includes('balance.html')) {
        initializeBalancePage();
    } else if (path.includes('dashboard.html')) {
        initializeDashboardPage();
    } else {
        initializeIndexPage();
    }
}

function initializeBalancePage() {
    generateCategoryChart();
    
    document.getElementById('downloadPNG')?.addEventListener('click', () => {
        downloadChartAsPNG();
    });
    
    document.getElementById('downloadPDF')?.addEventListener('click', () => {
        downloadSingleChartPDF('categoryChart');
    });
}

function initializeDashboardPage() {
    generateDashboardCharts();
    
    document.getElementById('downloadPNG')?.addEventListener('click', () => {
        const chartIds = ['averageSpendingChart', 'mostExpensiveCategoryChart', 'leastExpensiveCategoryChart'];
        
        chartIds.forEach(chartId => {
            const chart = Chart.getChart(chartId);
            if (chart) {
                const link = document.createElement('a');
                link.href = chart.toBase64Image();
                link.download = `${chartId}.png`;
                link.click();
            }
        });
    });

    document.getElementById('downloadPDF')?.addEventListener('click', async () => {
        try {
            await downloadChartsPDF(
                ['averageSpendingChart', 'mostExpensiveCategoryChart', 'leastExpensiveCategoryChart'],
                'Estadísticas',
                getMostRegisteredCategoryText()
            );
        } catch (error) {
            mostrarToast('Error', 'Hubo un problema al generar el PDF', 'danger');
        }
    });
}

function initializeIndexPage() {
    showData();
    
    document.getElementById("Submit")?.addEventListener("click", AddData);
    document.getElementById("searchInput")?.addEventListener("input", searchData);
    document.getElementById("exportExcel")?.addEventListener("click", exportToExcel);
    document.getElementById("exportJSON")?.addEventListener("click", exportToJSON);
    document.getElementById("importJSON")?.addEventListener("change", importFromJSON);
}

function setupCommonEventListeners() {
    document.getElementById("precio")?.addEventListener("input", function() {
        formatInputPrice(this);
        updateTotal();
    });
    document.getElementById("cantidad")?.addEventListener("input", updateTotal);
}

function AddData() {
    if (validateForm()) {
        const product = {
            articulo: document.getElementById("articulo").value,
            cantidad: document.getElementById("cantidad").value,
            precio: parseFloat(document.getElementById("precio").value.replace(/\./g, '').replace(',', '.')),
            proveedor: document.getElementById("proveedor").value,
            categoria: document.getElementById("categoria").value,
            duracion: document.getElementById("duracion").value,
            total: parseInt(document.getElementById("cantidad").value) * 
                   parseFloat(document.getElementById("precio").value.replace(/\./g, '').replace(',', '.'))
        };

        addProduct(product);
        showData();
        resetForm();
        calculateTotalSum();
        
        if (window.location.pathname.includes('dashboard.html')) {
            generateDashboardCharts();
        }
    }
}

function validateForm() {
    const articulo = document.getElementById("articulo").value;
    if (!articulo) {
        mostrarToast('Error', 'Debes indicar el nombre del artículo', 'danger');
        return false;
    }
    return true;
}

function showData() {
    const productList = getProductList().reverse();
    const { displayedItems, totalPages: calculatedPages } = paginateItems(productList, currentPage);
    totalPages = calculatedPages;
    
    renderTable(displayedItems, productList.length);
    renderPagination(currentPage, totalPages, changePage);
    calculateTotalSum();
}

function renderTable(products, totalLength) {
    const tbody = document.querySelector("#crudTable tbody");
    if (!tbody) return;
    
    let html = "";
    let totalSum = 0;
    const startIndex = (currentPage - 1) * itemsPerPage;
    
    products.forEach((product, index) => {
        const originalIndex = totalLength - 1 - (startIndex + index);
        totalSum += parseFloat(product.total);
        
        html += `
            <tr>
                <td>${product.articulo}</td>
                <td>${product.cantidad}</td>
                <td>${formatCurrency(product.precio)}</td>
                <td>${product.proveedor}</td>
                <td>${product.categoria}</td>
                <td>${product.duracion}</td>
                <td>${formatCurrency(product.total)}</td>
                <td>
                    <button onclick="window.deleteData(${originalIndex})" class="btn btn-danger">Borrar</button>
                    <button onclick="window.updateData(${originalIndex})" class="btn btn-warning m-1">Editar</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    
    const totalSumElement = document.getElementById("totalSum");
    if (totalSumElement) {
        totalSumElement.innerText = formatCurrency(totalSum);
    }
}

function changePage(newPage) {
    if (newPage < 1) currentPage = 1;
    else if (newPage > totalPages) currentPage = totalPages;
    else currentPage = newPage;
    
    showData();
}

function deleteData(index) {
    deleteProduct(index);
    showData();
    calculateTotalSum();
    
    if (window.location.pathname.includes('dashboard.html')) {
        generateDashboardCharts();
    } else if (window.location.pathname.includes('balance.html')) {
        generateCategoryChart();
    }
}

function updateData(index) {
    toggleFormButtons(false);
    
    const productList = getProductList();
    const product = productList[index];
    
    document.getElementById("articulo").value = product.articulo;
    document.getElementById("cantidad").value = product.cantidad;
    document.getElementById("precio").value = product.precio;
    document.getElementById("proveedor").value = product.proveedor;
    document.getElementById("categoria").value = product.categoria;
    document.getElementById("duracion").value = product.duracion;
    document.getElementById("total").value = product.total;

    const updateButton = document.querySelector("#Update");
    if (updateButton) {
        updateButton.onclick = function() {
            if (validateForm()) {
                const updatedProduct = {
                    articulo: document.getElementById("articulo").value,
                    cantidad: document.getElementById("cantidad").value,
                    precio: parseFloat(document.getElementById("precio").value.replace(/\./g, '').replace(',', '.')),
                    proveedor: document.getElementById("proveedor").value,
                    categoria: document.getElementById("categoria").value,
                    duracion: document.getElementById("duracion").value,
                    total: parseInt(document.getElementById("cantidad").value) * 
                           parseFloat(document.getElementById("precio").value.replace(/\./g, '').replace(',', '.'))
                };

                updateProduct(index, updatedProduct);
                showData();
                resetForm();
                toggleFormButtons(true);
                calculateTotalSum();
                
                if (window.location.pathname.includes('dashboard.html')) {
                    generateDashboardCharts();
                } else if (window.location.pathname.includes('balance.html')) {
                    generateCategoryChart();
                }
            }
        };
    }
}

function updateTotal() {
    const cantidad = document.getElementById("cantidad").value;
    const precioInput = document.getElementById("precio");
    if (!precioInput) return;
    
    const precio = parseFloat(precioInput.value.replace(/\./g, '').replace(',', '.'));
    const totalElement = document.getElementById("total");
    
    if (totalElement) {
        totalElement.value = isNaN(cantidad) || isNaN(precio) ? 0 : cantidad * precio;
    }
}

function searchData() {
    const searchInput = document.getElementById("searchInput")?.value.toLowerCase();
    
    if (!searchInput) {
        showData();
        return;
    }

    const searchedProducts = searchProducts(searchInput);
    const { displayedItems, totalPages: calculatedPages } = paginateItems(searchedProducts, 1);
    totalPages = calculatedPages;
    
    renderTable(displayedItems, searchedProducts.length);
    renderPagination(1, totalPages, changePage);
}

window.selectCategoria = function(categoria) {
    document.getElementById("categoria").value = categoria;
    const dropdown = document.getElementById("dropdownCategoria");
    if (dropdown) dropdown.innerHTML = categoria;
};

window.AddData = AddData;
window.deleteData = deleteData;
window.updateData = updateData;
window.changePage = changePage;
window.selectCategoria = function(categoria) {
    document.getElementById("categoria").value = categoria;
    const dropdown = document.getElementById("dropdownCategoria");
    if (dropdown) dropdown.innerHTML = categoria;
};
window.searchData = searchData;
window.formatInputPrice = formatInputPrice;
window.downloadChartAsPNG = downloadChartAsPNG;
window.downloadSingleChartPDF = downloadSingleChartPDF;

document.addEventListener('DOMContentLoaded', initializePage);