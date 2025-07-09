import { mostrarToast } from './uiHelpers.js';
import { exportAllData, importData } from './dataManager.js';

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

export async function exportToJSON() {
    try {
        const productList = await exportAllData();
        const cleanedData = productList.map(product => {
            const { id, timestamp, ...cleanProduct } = product;
            return cleanProduct;
        });
        
        const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(cleanedData, null, 2))}`;
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `Respaldo_${getFormattedDateJSON()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        document.body.removeChild(downloadAnchorNode);
        
        mostrarToast('Éxito', `El respaldo de ${cleanedData.length} registros fue exportado a la carpeta de Descargas`, 'success', 4000);
    } catch (error) {
        console.error("Error al exportar datos:", error);
        mostrarToast('Error', 'Hubo un error al exportar los datos. Por favor, intenta de nuevo.', 'danger', 4000);
    }
}

export async function importFromJSON(event) {
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
    reader.onload = async function(event) {
        try {
            const jsonData = JSON.parse(event.target.result);
            
            if (!Array.isArray(jsonData)) {
                mostrarToast('Error', 'El archivo JSON debe contener un array de productos.', 'danger', 4000);
                return;
            }

            const isValidData = jsonData.every(item => 
                item && typeof item === 'object' && 
                item.hasOwnProperty('articulo') && 
                item.hasOwnProperty('precio')
            );

            if (!isValidData) {
                mostrarToast('Error', 'El archivo JSON no tiene la estructura correcta.', 'danger', 4000);
                return;
            }

            const cleanedData = jsonData.map(product => {
                const { id, timestamp, ...cleanProduct } = product;
                return cleanProduct;
            });

            await importData(cleanedData);
            
            const importedCount = cleanedData.length;
            mostrarToast('Éxito', `Respaldo cargado con éxito. Se agregaron ${importedCount} productos.`, 'success', 4000);
            
            setTimeout(() => {
                location.reload();
            }, 1500);
            
        } catch (error) {
            console.error("Error al analizar el archivo JSON:", error);
            if (error.name === 'SyntaxError') {
                mostrarToast('Error', 'El archivo no es un JSON válido. Verifica la sintaxis del archivo.', 'danger', 4000);
            } else {
                mostrarToast('Error', 'Hubo un error al procesar el archivo. Intenta de nuevo.', 'danger', 4000);
            }
        }
    };

    reader.onerror = function(event) {
        console.error("Error al leer el archivo:", event.target.error);
        mostrarToast('Error', 'Hubo un error al leer el archivo. Por favor, intenta de nuevo.', 'danger', 4000);
    };

    reader.readAsText(file);
}