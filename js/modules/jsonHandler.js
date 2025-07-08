import { mostrarToast } from './uiHelpers.js';

function getFormattedDateJSON() {
    const currentDate = new Date();
    return [
        currentDate.getFullYear(),
        String(currentDate.getMonth() + 1).padStart(2, '0'),
        String(currentDate.getDate()).padStart(2, '0'),
        String(currentDate.getHours()).padStart(2, '0'),
        String(currentDate.getMinutes()).padStart(2, '0'),
        String(currentDate.getSeconds()).padStart(2, '0')
    ].join('-');
}

export function exportToJSON() {
    try {
        const productList = JSON.parse(localStorage.getItem("productList")) || [];
        const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(productList))}`;
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `Respaldo_${getFormattedDateJSON()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        document.body.removeChild(downloadAnchorNode);
        mostrarToast('Éxito', 'El respaldo acaba de ser exportado a la carpeta de Descargas', 'success', 4000);
    } catch (error) {
        console.error("Error al exportar datos:", error);
        mostrarToast('Error', 'Hubo un error al exportar los datos. Por favor, intenta de nuevo.', 'danger', 4000);
    }
}

export function importFromJSON(event) {
    const file = event.target.files[0];
    if (!file) {
        mostrarToast('Advertencia', 'Por favor, selecciona un archivo.', 'info', 4000);
        return;
    }

    if (file.type !== "application/json") {
        mostrarToast('Advertencia', 'Por favor, selecciona un archivo JSON.', 'info', 4000);
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const jsonData = JSON.parse(event.target.result);
            const existingData = JSON.parse(localStorage.getItem("productList")) || [];
            const combinedData = [...existingData, ...jsonData];
            localStorage.setItem("productList", JSON.stringify(combinedData));
            
            const importedCount = jsonData.length;
            mostrarToast('Éxito', `Respaldo cargado con éxito. Se agregaron ${importedCount} productos.`, 'success', 4000);
            
            setTimeout(() => {
                location.reload();
            }, 1000);
            
            return true;
        } catch (error) {
            console.error("Error al analizar el archivo JSON:", error);
            mostrarToast('Error', 'El archivo no es un JSON válido. Por favor, selecciona un archivo JSON válido.', 'danger', 4000);
            return false;
        }
    };
    reader.onerror = function(event) {
        console.error("Error al leer el archivo:", event.target.error);
        mostrarToast('Error', 'Hubo un error al leer el archivo. Por favor, intenta de nuevo.', 'danger', 4000);
    };
    reader.readAsText(file);
}