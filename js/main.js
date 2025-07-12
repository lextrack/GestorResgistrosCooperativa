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
import { 
    initializePWA, checkInstallPromotion, setupPWAFeatures 
} from './modules/pwaInstaller.js';

import { 
    createCloudBackup, 
    getLastCloudBackup, 
    restoreCloudBackup,
    getBackupStats,
    cleanupOldBackups,
    checkCloudConnection
} from './modules/cloudBackup.js';

let currentPage = 1;
let totalPages = 1;

async function initializePage() {
    const path = window.location.pathname.split('/').pop();

    try {
        initializePWA();
        setupPWAFeatures();
        console.log('PWA: Características inicializadas correctamente');
    } catch (error) {
        console.warn('PWA: Error al inicializar características PWA:', error);
    }

    setupCommonEventListeners();
    
    if (path.includes('balance.html')) {
        await initializeBalancePage();
    } else if (path.includes('dashboard.html')) {
        await initializeDashboardPage();
    } else {
        await initializeIndexPage();
    }

    setTimeout(() => {
        try {
            checkInstallPromotion();
        } catch (error) {
            console.warn('PWA: Error al verificar promoción de instalación:', error);
        }
    }, 3000);
}

async function initializeBalancePage() {
    await generateCategoryChart();
    
    document.getElementById('downloadPNG')?.addEventListener('click', () => {
        downloadChartAsPNG();
    });
    
    document.getElementById('downloadPDF')?.addEventListener('click', () => {
        downloadSingleChartPDF('categoryChart');
    });
}

async function initializeDashboardPage() {
    await generateDashboardCharts();
    
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

async function initializeIndexPage() {
    setDefaultDate();
    await showData();
    
    document.getElementById("Submit")?.addEventListener("click", AddData);
    document.getElementById("searchInput")?.addEventListener("input", searchData);
    document.getElementById("exportExcel")?.addEventListener("click", exportToExcel);
    document.getElementById("exportJSON")?.addEventListener("click", exportToJSON);
    document.getElementById("importJSON")?.addEventListener("change", importFromJSON);
    
    setupModalEventListeners();
}

function setupModalEventListeners() {
    document.getElementById('confirmCreateBackup')?.addEventListener('click', async () => {
        await executeCreateBackup();
    });

    document.getElementById('confirmRestoreBackup')?.addEventListener('click', async () => {
        await executeRestoreBackup();
    });
}

function setupCommonEventListeners() {
    document.getElementById("precio")?.addEventListener("input", function() {
        formatInputPrice(this);
        updateTotal();
    });
    document.getElementById("cantidad")?.addEventListener("input", updateTotal);
}

function setDefaultDate() {
    const fechaInput = document.getElementById("fecha");
    if (fechaInput) {
        const today = new Date();
        const formattedDate = today.getFullYear() + '-' + 
                            String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                            String(today.getDate()).padStart(2, '0');
        fechaInput.value = formattedDate;
    }
}

async function AddData() {
    if (validateForm()) {
        const product = {
            articulo: document.getElementById("articulo").value,
            cantidad: document.getElementById("cantidad").value,
            precio: parseFloat(document.getElementById("precio").value.replace(/\./g, '').replace(',', '.')),
            proveedor: document.getElementById("proveedor").value,
            fecha: document.getElementById("fecha").value,
            categoria: document.getElementById("categoria").value,
            duracion: document.getElementById("duracion").value,
            total: parseInt(document.getElementById("cantidad").value) * 
                   parseFloat(document.getElementById("precio").value.replace(/\./g, '').replace(',', '.'))
        };

        try {
            await addProduct(product);
            await showData();
            resetForm();
            setDefaultDate();
            await updateTotalSum();
            
            if (window.location.pathname.includes('dashboard.html')) {
                await generateDashboardCharts();
            }
            
            mostrarToast('Éxito', 'Producto agregado correctamente', 'success');
        } catch (error) {
            mostrarToast('Error', 'No se pudo agregar el producto', 'danger');
        }
    }
}

function validateForm() {
    const articulo = document.getElementById("articulo").value;
    const fecha = document.getElementById("fecha").value;
    
    if (!articulo) {
        mostrarToast('Error', 'Debes indicar el nombre del artículo', 'danger');
        return false;
    }
    
    if (!fecha) {
        mostrarToast('Error', 'Debes seleccionar una fecha', 'danger');
        return false;
    }
    
    return true;
}

async function showData() {
    try {
        const productList = await getProductList();
        const reversedList = [...productList].reverse();
        const { displayedItems, totalPages: calculatedPages } = paginateItems(reversedList, currentPage);
        totalPages = calculatedPages;
        
        renderTable(displayedItems, productList.length);
        renderPagination(currentPage, totalPages, changePage);
        await updateTotalSum();
    } catch (error) {
        console.error('Error al mostrar datos:', error);
        mostrarToast('Error', 'No se pudieron cargar los datos', 'danger');
    }
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
                <td>${formatDate(product.fecha)}</td>
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

function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString + 'T00:00:00');
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    };
    
    return date.toLocaleDateString('es-CL', options);
}

async function changePage(newPage) {
    if (newPage < 1) currentPage = 1;
    else if (newPage > totalPages) currentPage = totalPages;
    else currentPage = newPage;
    
    await showData();
}

async function deleteData(index) {
    try {
        await deleteProduct(index);
        await showData();
        await updateTotalSum();
        
        if (window.location.pathname.includes('dashboard.html')) {
            await generateDashboardCharts();
        } else if (window.location.pathname.includes('balance.html')) {
            await generateCategoryChart();
        }
        
        mostrarToast('Éxito', 'Producto eliminado correctamente', 'success');
    } catch (error) {
        mostrarToast('Error', 'No se pudo eliminar el producto', 'danger');
    }
}

async function updateData(index) {
    try {
        toggleFormButtons(false);
        
        const productList = await getProductList();
        const product = productList[index];
        
        document.getElementById("articulo").value = product.articulo;
        document.getElementById("cantidad").value = product.cantidad;
        document.getElementById("precio").value = product.precio;
        document.getElementById("proveedor").value = product.proveedor;
        document.getElementById("fecha").value = product.fecha || '';
        document.getElementById("categoria").value = product.categoria;
        document.getElementById("duracion").value = product.duracion;
        document.getElementById("total").value = product.total;

        const updateButton = document.querySelector("#Update");
        if (updateButton) {
            updateButton.onclick = async function() {
                if (validateForm()) {
                    const updatedProduct = {
                        articulo: document.getElementById("articulo").value,
                        cantidad: document.getElementById("cantidad").value,
                        precio: parseFloat(document.getElementById("precio").value.replace(/\./g, '').replace(',', '.')),
                        proveedor: document.getElementById("proveedor").value,
                        fecha: document.getElementById("fecha").value,
                        categoria: document.getElementById("categoria").value,
                        duracion: document.getElementById("duracion").value,
                        total: parseInt(document.getElementById("cantidad").value) * 
                               parseFloat(document.getElementById("precio").value.replace(/\./g, '').replace(',', '.'))
                    };

                    try {
                        await updateProduct(index, updatedProduct);
                        await showData();
                        resetForm();
                        setDefaultDate();
                        toggleFormButtons(true);
                        await updateTotalSum();
                        
                        if (window.location.pathname.includes('dashboard.html')) {
                            await generateDashboardCharts();
                        } else if (window.location.pathname.includes('balance.html')) {
                            await generateCategoryChart();
                        }
                        
                        mostrarToast('Éxito', 'Producto actualizado correctamente', 'success');
                    } catch (error) {
                        mostrarToast('Error', 'No se pudo actualizar el producto', 'danger');
                    }
                }
            };
        }
    } catch (error) {
        mostrarToast('Error', 'No se pudo cargar el producto para editar', 'danger');
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

async function updateTotalSum() {
    try {
        const total = await calculateTotalSum();
        const totalSumElement = document.getElementById("totalSum");
        if (totalSumElement) {
            totalSumElement.innerText = formatCurrency(total);
        }
    } catch (error) {
        console.error('Error al actualizar suma total:', error);
    }
}

async function searchData() {
    const searchInput = document.getElementById("searchInput")?.value.toLowerCase();
    
    if (!searchInput) {
        await showData();
        return;
    }

    try {
        const searchedProducts = await searchProducts(searchInput);
        const { displayedItems, totalPages: calculatedPages } = paginateItems(searchedProducts, 1);
        totalPages = calculatedPages;
        
        renderTable(displayedItems, searchedProducts.length);
        renderPagination(1, totalPages, changePage);
    } catch (error) {
        mostrarToast('Error', 'Error al buscar productos', 'danger');
    }
}

async function createBackupCloud() {
    try {
        const productList = await getProductList();
        const recordCount = productList.length;
        
        if (recordCount === 0) {
            showResultModal('Sin Datos', 'No hay registros para respaldar.', 'warning');
            return;
        }

        if (recordCount > 10000) {
            showResultModal('Demasiados Datos', 
                `Tienes ${recordCount} registros, pero el máximo permitido es 10,000. 
                Considera limpiar datos antiguos primero.`, 'warning');
            return;
        }

        try {
            const stats = await getBackupStats();
            document.getElementById('currentRecordCount').innerHTML = `
                <div class="backup-info">
                    <strong>📊 Registros a respaldar:</strong> ${recordCount}<br>
                    <strong>☁️ Respaldos existentes:</strong> ${stats?.totalBackups || 0}<br>
                    <strong>🗜️ Respaldos comprimidos:</strong> ${stats?.compressedBackups || 0}<br>
                    <strong>📅 Último respaldo:</strong> ${stats?.latestBackup || 'Nunca'}<br>
                    ${stats?.totalSpaceSaved !== 'N/A' ? `<strong>💾 Espacio ahorrado:</strong> ${stats.totalSpaceSaved}<br>` : ''}
                </div>
            `;
        } catch (statsError) {
            console.warn('No se pudieron obtener estadísticas:', statsError);
            document.getElementById('currentRecordCount').innerHTML = `
                <strong>📊 Registros a respaldar:</strong> ${recordCount}<br>
                <em>Cargando información de respaldos...</em>
            `;
        }
        
        const modal = new bootstrap.Modal(document.getElementById('createBackupModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error al preparar respaldo:', error);
        showResultModal('Error', 'No se pudo preparar el respaldo: ' + error.message, 'danger');
    }
}

async function executeCreateBackup() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('createBackupModal'));
    const contentDiv = document.getElementById('createBackupContent');
    const progressDiv = document.getElementById('createBackupProgress');
    const confirmButton = document.getElementById('confirmCreateBackup');
    
    try {
        contentDiv.style.display = 'none';
        progressDiv.style.display = 'block';
        confirmButton.disabled = true;
        
        const result = await createCloudBackup();
        
        if (result.success) {
            modal.hide();
            
            let message = `Se creó un respaldo en la nube con ${result.recordCount} registros.<br>`;
            message += `<strong>Tamaño final:</strong> ${result.size}`;
            
            if (result.compressed) {
                message += `<br><strong>🗜️ Comprimido:</strong> ${result.originalSize} → ${result.size} (${result.compressionSavings} menos)`;
            }
            
            showResultModal('Respaldo Exitoso', message, 'success');
        }
        
    } catch (error) {
        console.error('Error al crear respaldo:', error);
        modal.hide();
        showResultModal('Error', 'No se pudo crear el respaldo: ' + error.message, 'danger');
    } finally {
        contentDiv.style.display = 'block';
        progressDiv.style.display = 'none';
        confirmButton.disabled = false;
    }
}

async function restoreLastBackup() {
    try {
        const lastBackup = await getLastCloudBackup();
        
        if (!lastBackup) {
            showResultModal('Sin Respaldos', 'No hay respaldos disponibles en la nube.', 'info');
            return;
        }

        let backupInfo = `
            <div class="backup-status success">
                <i class="bi bi-cloud-check"></i>
                <strong>Último respaldo encontrado:</strong><br>
                📅 <strong>Fecha:</strong> ${lastBackup.date}<br>
                📊 <strong>Registros:</strong> ${lastBackup.recordCount}<br>
                📦 <strong>Versión:</strong> ${lastBackup.version}
        `;
        
        if (lastBackup.isCompressed) {
            backupInfo += `<br>🗜️ <strong>Comprimido:</strong> ${lastBackup.originalSize} → ${lastBackup.compressedSize} (${lastBackup.compressionRatio}% menos)`;
        } else {
            backupInfo += `<br>📄 <strong>Sin comprimir:</strong> ${lastBackup.originalSize || 'N/A'}`;
        }
        
        backupInfo += `
            </div>
        `;

        document.getElementById('backupInfo').innerHTML = backupInfo;
        
        const modal = new bootstrap.Modal(document.getElementById('restoreBackupModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error al obtener información del respaldo:', error);
        showResultModal('Error', 'No se pudo obtener información del respaldo: ' + error.message, 'danger');
    }
}

async function executeRestoreBackup() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('restoreBackupModal'));
    const contentDiv = document.getElementById('restoreBackupContent');
    const progressDiv = document.getElementById('restoreBackupProgress');
    const confirmButton = document.getElementById('confirmRestoreBackup');
    
    try {
        const lastBackup = await getLastCloudBackup();
        
        if (!lastBackup) {
            modal.hide();
            showResultModal('Error', 'No se encontró el respaldo a restaurar.', 'danger');
            return;
        }

        contentDiv.style.display = 'none';
        progressDiv.style.display = 'block';
        confirmButton.disabled = true;
        
        const result = await restoreCloudBackup(lastBackup.id);
        
        if (result.success) {
            modal.hide();
            
            let message = `Se restauraron ${result.recordCount} registros del ${result.backupDate}.`;
            if (result.wasCompressed) {
                message += `<br>🗜️ <em>Los datos fueron descomprimidos automáticamente.</em>`;
            }
            message += `<br><br>La página se recargará automáticamente.`;
            
            showResultModal('Restauración Exitosa', message, 'success');
            
            setTimeout(() => location.reload(), 3000);
        }
        
    } catch (error) {
        console.error('Error al restaurar respaldo:', error);
        modal.hide();
        showResultModal('Error', 'No se pudo restaurar el respaldo: ' + error.message, 'danger');
    } finally {
        contentDiv.style.display = 'block';
        progressDiv.style.display = 'none';
        confirmButton.disabled = false;
    }
}

function showResultModal(title, message, type = 'info') {
    const modal = document.getElementById('resultModal');
    const modalTitle = document.getElementById('resultModalLabel');
    const modalBody = document.getElementById('resultModalBody');
    
    let icon, colorClass;
    switch(type) {
        case 'success':
            icon = 'bi-check-circle';
            colorClass = 'text-success';
            break;
        case 'danger':
            icon = 'bi-exclamation-triangle';
            colorClass = 'text-danger';
            break;
        case 'warning':
            icon = 'bi-exclamation-triangle';
            colorClass = 'text-warning';
            break;
        default:
            icon = 'bi-info-circle';
            colorClass = 'text-info';
    }
    
    modalTitle.innerHTML = `<i class="bi ${icon} ${colorClass}"></i> ${title}`;
    modalBody.innerHTML = `<div class="backup-status ${type}"><i class="bi ${icon}"></i> ${message}</div>`;
    
    const resultModal = new bootstrap.Modal(modal);
    resultModal.show();
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
window.searchData = searchData;
window.formatInputPrice = formatInputPrice;
window.downloadChartAsPNG = downloadChartAsPNG;
window.downloadSingleChartPDF = downloadSingleChartPDF;
window.exportToExcel = exportToExcel;
window.exportToJSON = exportToJSON;
window.importFromJSON = importFromJSON;
window.createBackupCloud = createBackupCloud;
window.restoreLastBackup = restoreLastBackup;

document.addEventListener('DOMContentLoaded', initializePage);