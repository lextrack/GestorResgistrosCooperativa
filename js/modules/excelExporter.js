import { formatCurrency } from './currencyFormatter.js';
import { mostrarToast } from './uiHelpers.js';
import { exportAllData } from './dataManager.js';

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

export async function exportToExcel() {
    try {
        const productList = await exportAllData();
        
        if (productList.length === 0) {
            mostrarToast('Advertencia', 'No hay datos para exportar', 'info', 3000);
            return;
        }

        const data = [
            ["Artículo", "Cantidad", "Precio", "Proveedor", "Fecha", "Categoría", "Duración", "Total"]
        ];

        productList.forEach(product => {
            data.push([
                product.articulo || '',
                product.cantidad || 0,
                formatCurrency(product.precio || 0),
                product.proveedor || '',
                formatDate(product.fecha),
                product.categoria || '',
                product.duracion || '',
                formatCurrency(product.total || 0)
            ]);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(data);
        
        worksheet["!cols"] = [
            { width: 35 }, // Artículo
            { width: 10 }, // Cantidad
            { width: 15 }, // Precio
            { width: 20 }, // Proveedor
            { width: 12 }, // Fecha
            { width: 15 }, // Categoría
            { width: 15 }, // Duración
            { width: 20 }  // Total
        ];

        if (worksheet["!cols"][7]) {
            worksheet["!cols"][7].alignment = { horizontal: "center", vertical: "center" };
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DatosTransacciones");

        const currentDate = new Date();
        const dateFormatted = [
            String(currentDate.getDate()).padStart(2, '0'),
            String(currentDate.getMonth() + 1).padStart(2, '0'),
            currentDate.getFullYear()
        ].join('-');

        const fileName = `DatosTransacciones_${dateFormatted}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        
        mostrarToast('Éxito', `Se exportaron ${productList.length} registros a Excel. El archivo se guardó en la carpeta de Descargas.`, 'success', 4000);
        
    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        mostrarToast('Error', 'Hubo un error al exportar los datos a Excel. Por favor, intenta de nuevo.', 'danger', 4000);
    }
}