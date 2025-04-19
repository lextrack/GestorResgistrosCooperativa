import { formatCurrency } from './currencyFormatter.js';
import { mostrarToast } from './uiHelpers.js';

export function exportToExcel() {
    const productList = JSON.parse(localStorage.getItem("productList")) || [];
    
    const data = [
        ["Artículo", "Cantidad", "Precio", "Proveedor", "Categoría", "Duración", "", "Total"]
    ];

    productList.forEach(product => {
        data.push([
            product.articulo,
            product.cantidad,
            formatCurrency(product.precio),
            product.proveedor,
            product.categoria,
            product.duracion,
            "", 
            formatCurrency(product.total)
        ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet["!cols"] = [
        { width: 35 },
        { width: 10 },
        { width: 15 },
        { width: 20 },
        { width: 15 },
        { width: 15 },
        { width: 20 },
        { width: 20 }
    ];

    worksheet["!cols"][7].alignment = { horizontal: "center", vertical: "center" };

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
    mostrarToast('Éxito', 'La planilla de Excel acaba de ser exportada a la carpeta de Descargas', 'success', 4000);
}