var itemsPerPage = 5;
var currentPage = 1;
var totalPages = 5;

function validateForm(){
    var articulo = document.getElementById("articulo").value;
    var cantidad = document.getElementById("cantidad").value;
    var precio = document.getElementById("precio").value;
    var proveedor = document.getElementById("proveedor").value;
    var duracion = document.getElementById("duracion").value;

    if(articulo == ""){
        alert("Debes indicar el nombre del artículo");
        return false;
    }
    return true;
}

function selectCategoria(categoria) {
    document.getElementById("categoria").value = categoria;

    document.getElementById("dropdownCategoria").innerHTML = categoria;
}

function formatCurrency(value) {
    return parseFloat(value).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
}

function formatInputPrice(input) {
    let value = input.value.replace(/\D/g, '');
    let formattedValue = '';

    if (value.length > 0) {
        formattedValue = parseInt(value).toLocaleString('es-CL');
    }

    input.value = formattedValue;
}

function mostrarToast(titulo, mensaje, tipo = 'info', duracion = 4000) {
    const toastEl = document.getElementById('liveToast');
    
    toastEl.querySelector('.toast-header strong').textContent = titulo;
    toastEl.querySelector('.toast-body').textContent = mensaje;
    
    toastEl.className = `toast ${tipo}`;
    
    const toast = new bootstrap.Toast(toastEl, {
        delay: duracion,
        autohide: true
    });
    toast.show();
}

function AddData() {
    if (validateForm()) {
        var articulo = document.getElementById("articulo").value;
        var cantidad = document.getElementById("cantidad").value;
        var precio = parseFloat(document.getElementById("precio").value.replace(/\./g, '').replace(',', '.'));
        var proveedor = document.getElementById("proveedor").value;
        var categoria = document.getElementById("categoria").value;
        var duracion = document.getElementById("duracion").value;
        var total = parseInt(cantidad) * precio;

        var productList;
        if (localStorage.getItem("productList") == null) {
            productList = [];
        } else {
            productList = JSON.parse(localStorage.getItem("productList"));
        }

        productList.push({
            articulo: articulo,
            cantidad: cantidad,
            precio: precio,
            proveedor: proveedor,
            categoria: categoria,
            duracion: duracion,
            total: total
        });

        localStorage.setItem("productList", JSON.stringify(productList));
        showData();

        document.getElementById("articulo").value = "";
        document.getElementById("cantidad").value = "0";
        document.getElementById("precio").value = "0";
        document.getElementById("proveedor").value = "";
        document.getElementById("categoria").value = "";
        document.getElementById("duracion").value = "";
        document.getElementById("total").value = "";

        document.getElementById("dropdownCategoria").innerHTML = "Seleccionar Categoría";

        calculateTotalSum();
    }
}

function showData() {
    var productList;
    if (localStorage.getItem("productList") == null) {
        productList = [];
    } else {
        productList = JSON.parse(localStorage.getItem("productList"));
    }

    productList.reverse();

    totalPages = Math.ceil(productList.length / itemsPerPage);

    var startIndex = (currentPage - 1) * itemsPerPage;
    var endIndex = startIndex + itemsPerPage;
    var displayedProducts = productList.slice(startIndex, endIndex);

    var html = "";
    var totalSum = 0;
    displayedProducts.forEach(function (element, index) {
        let originalIndex = productList.length - 1 - (startIndex + index);
        html += "<tr>";
        html += "<td>" + element.articulo + "</td>";
        html += "<td>" + element.cantidad + "</td>";
        html += "<td>" + formatCurrency(element.precio) + "</td>";
        html += "<td>" + element.proveedor + "</td>";
        html += "<td>" + element.categoria + "</td>";
        html += "<td>" + element.duracion + "</td>";
        html += "<td>" + formatCurrency(element.total) + "</td>";
        html +=
            '<td><button onclick="deleteData(' +
            originalIndex +
            ')" class="btn btn-danger">Borrar</button><button onclick="updateData(' +
            originalIndex +
            ')" class="btn btn-warning m-1">Editar</button></td>';
        html += "</tr>";

        totalSum += parseFloat(element.total);
    });

    document.querySelector("#crudTable tbody").innerHTML = html;
    calculateTotalSum();

    let paginationHtml = '<button class="btn btn-danger" onclick="changePage(' + (currentPage - 1) + ')" ' + (currentPage === 1 ? 'disabled' : '') + '>&lt;</button>';
    paginationHtml += '<button class="btn btn-danger" onclick="changePage(1)">Primero</button>';
    if (totalPages > 5) {
        let startPage = currentPage - 2;
        let endPage = currentPage + 2;
        if (startPage < 1) {
            startPage = 1;
            endPage = 5;
        } else if (endPage > totalPages) {
            endPage = totalPages;
            startPage = totalPages - 4;
        }
        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += '<button class="btn btn-danger" onclick="changePage(' + i + ')" ' + (currentPage === i ? 'style="background-color: #7a2640"' : '') + '>' + i + '</button>';
        }
    } else {
        for (let i = 1; i <= totalPages; i++) {
            paginationHtml += '<button class="btn btn-danger" onclick="changePage(' + i + ')" ' + (currentPage === i ? 'style="background-color: #7a2640"' : '') + '>' + i + '</button>';
        }
    }
    paginationHtml += '<button class="btn btn-danger" onclick="changePage(' + totalPages + ')">Último</button>';
    paginationHtml += '<button class="btn btn-danger" onclick="changePage(' + (currentPage + 1) + ')" ' + (currentPage === totalPages ? 'disabled' : '') + '>&gt;</button>';

    document.querySelector("#pagination").innerHTML = paginationHtml;
}

document.addEventListener('DOMContentLoaded', (event) => {
    showData();
});

function changePage(newPage) {
    if (newPage < 1) {
        currentPage = 1;
    } else if (newPage > totalPages) {
        currentPage = totalPages;
    } else {
        currentPage = newPage;
    }
    showData();
}

function deleteData(index){
    var productList;
    if(localStorage.getItem("productList") == null){
        productList = [];
    }
    else{
        productList = JSON.parse(localStorage.getItem("productList"));
    }

    productList.splice(index, 1);
    localStorage.setItem("productList", JSON.stringify(productList));
    showData();
    calculateTotalSum();
}

function updateData(index){
    document.getElementById("Submit").style.display = "none";
    document.getElementById("Update").style.display = "block";

    document.getElementById("cantidad").addEventListener("input", updateTotal);
    document.getElementById("precio").addEventListener("input", updateTotal);

    var productList;
    if(localStorage.getItem("productList") == null){
        productList = [];
    }
    else{
        productList = JSON.parse(localStorage.getItem("productList"));
    }
    
    document.getElementById("articulo").value = productList[index].articulo;
    document.getElementById("cantidad").value = productList[index].cantidad;
    document.getElementById("precio").value = productList[index].precio;
    document.getElementById("proveedor").value = productList[index].proveedor;
    document.getElementById("categoria").value = productList[index].categoria;
    document.getElementById("duracion").value = productList[index].duracion;
    document.getElementById("total").value = productList[index].total;

    document.querySelector("#Update").onclick = function(){

        if(validateForm() == true){
            productList[index].articulo = document.getElementById("articulo").value;
            productList[index].cantidad = document.getElementById("cantidad").value;
            productList[index].precio = parseFloat(document.getElementById("precio").value.replace(/\./g, '').replace(',', '.'));
            productList[index].proveedor = document.getElementById("proveedor").value;
            productList[index].categoria = document.getElementById("categoria").value;
            productList[index].duracion = document.getElementById("duracion").value;
            productList[index].total = parseInt(document.getElementById("cantidad").value) * productList[index].precio;

            localStorage.setItem("productList", JSON.stringify(productList));

            showData();

            document.getElementById("articulo").value = "";
            document.getElementById("cantidad").value = "0";
            document.getElementById("precio").value = "0";
            document.getElementById("proveedor").value = "";
            document.getElementById("duracion").value = "";
            document.getElementById("total").value = "";

            document.getElementById("dropdownCategoria").innerHTML = "Seleccionar Categoría";

            document.getElementById("Submit").style.display = "block";
            document.getElementById("Update").style.display = "none";
        }
    }
}

function calculateTotalSum() {
    var productList;
    if (localStorage.getItem("productList") == null) {
        productList = [];
    } else {
        productList = JSON.parse(localStorage.getItem("productList"));
    }
    var totalSum = productList.reduce((sum, product) => sum + parseFloat(product.total), 0);
    document.getElementById("totalSum").innerText = totalSum.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
}

function updateTotal(){
    var cantidad = document.getElementById("cantidad").value;
    var precio = parseFloat(document.getElementById("precio").value.replace(/\./g, '').replace(',', '.'));
    document.getElementById("total").value = parseInt(cantidad) * precio;
}

function searchData() {
    var searchInput = document.getElementById("searchInput").value.toLowerCase();
    var productList = JSON.parse(localStorage.getItem("productList")) || [];

    var searchedProducts = productList.filter(function (articulo) {
        return (
            articulo.articulo.toLowerCase().includes(searchInput) ||
            articulo.proveedor.toLowerCase().includes(searchInput)
        );
    });

    if (searchInput === "") {
        showData();
        return;
    }

    totalPages = Math.ceil(searchedProducts.length / itemsPerPage);
    currentPage = 1;

    var startIndex = (currentPage - 1) * itemsPerPage;
    var endIndex = startIndex + itemsPerPage;
    var displayedProducts = searchedProducts.slice(startIndex, endIndex);

    var html = "";
    displayedProducts.forEach(function (element, index) {
        html += "<tr>";
        html += "<td>" + element.articulo + "</td>";
        html += "<td>" + element.cantidad + "</td>";
        html += "<td>" + formatCurrency(element.precio) + "</td>";
        html += "<td>" + element.proveedor + "</td>";
        html += "<td>" + element.categoria + "</td>";
        html += "<td>" + element.duracion + "</td>";
        html += "<td>" + formatCurrency(element.total) + "</td>";
        html +=
            '<td><button onclick="deleteData(' +
            index +
            ')" class="btn btn-danger">Borrar</button><button onclick="updateData(' +
            index +
            ')" class="btn btn-warning m-1">Editar</button></td>';
        html += "</tr>";
    });
    document.querySelector("#crudTable tbody").innerHTML = html;

    let paginationHtml = '<button class="btn btn-danger" onclick="changePage(' + (currentPage - 1) + ')" ' + (currentPage === 1 ? 'disabled' : '') + '>&lt;</button>';
    paginationHtml += '<button class="btn btn-danger" onclick="changePage(1)">Primero</button>';
    if (totalPages > 5) {
        let startPage = currentPage - 2;
        let endPage = currentPage + 2;
        if (startPage < 1) {
            startPage = 1;
            endPage = 5;
        } else if (endPage > totalPages) {
            endPage = totalPages;
            startPage = totalPages - 4;
        }
        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += '<button class="btn btn-danger" onclick="changePage(' + i + ')" ' + (currentPage === i ? 'style="background-color: #7a2640"' : '') + '>' + i + '</button>';
        }
    } else {
        for (let i = 1; i <= totalPages; i++) {
            paginationHtml += '<button class="btn btn-danger" onclick="changePage(' + i + ')" ' + (currentPage === i ? 'style="background-color: #7a2640"' : '') + '>' + i + '</button>';
        }
    }
    paginationHtml += '<button class="btn btn-danger" onclick="changePage(' + totalPages + ')">Último</button>';
    paginationHtml += '<button class="btn btn-danger" onclick="changePage(' + (currentPage + 1) + ')" ' + (currentPage === totalPages ? 'disabled' : '') + '>&gt;</button>';

    document.querySelector("#pagination").innerHTML = paginationHtml;
}

function exportToExcel() {
    var productList = JSON.parse(localStorage.getItem("productList")) || [];

    productList.forEach(function(product) {
    });

    var data = [
        ["Artículo", "Cantidad", "Precio", "Proveedor", "Categoría", "Duración", "", "Total"]
    ];

    productList.forEach(function(product) {
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

    var separacionColumnas = XLSX.utils.aoa_to_sheet(data);

    separacionColumnas["!cols"] = [
        { width: 35 },
        { width: 10 },
        { width: 15 },
        { width: 20 },
        { width: 15 },
        { width: 15 },
        { width: 20 },
        { width: 20 }
    ];

    separacionColumnas["!cols"][7].alignment = { horizontal: "center", vertical: "center" };

    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, separacionColumnas, "DatosTransacciones");

    var currentDate = new Date();
    var day = String(currentDate.getDate()).padStart(2, '0');
    var month = String(currentDate.getMonth() + 1).padStart(2, '0');
    var year = currentDate.getFullYear();
    var dateFormatted = day + '-' + month + '-' + year;

    var fileName = 'DatosTransacciones_' + dateFormatted + '.xlsx';
    XLSX.writeFile(wb, fileName);
    mostrarToast('Éxito', 'La planilla de Excel acaba de ser exportada a la carpeta de Descargas', 'success', 4000);
}

function getFormattedDateJSON() {
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

function exportToJSON() {
    try {
        const productList = JSON.parse(localStorage.getItem("productList")) || [];
        const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(productList))}`;
        const formattedDate = getFormattedDateJSON();
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `Respaldo_${formattedDate}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        document.body.removeChild(downloadAnchorNode);
        mostrarToast('Éxito', 'El respaldo acaba de ser exportado a la carpeta de Descargas', 'success', 4000);
    } catch (error) {
        console.error("Error al exportar datos:", error);
        mostrarToast('Error', 'Hubo un error al exportar los datos. Por favor, intenta de nuevo.', 'danger', 4000);
    }
}

function importFromJSON(event) {
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
            localStorage.setItem("productList", JSON.stringify(jsonData));
            mostrarToast('Éxito', 'Respaldo cargado con éxito', 'success', 4000);
            showData();
        } catch (error) {
            console.error("Error al analizar el archivo JSON:", error);
            mostrarToast('Error', 'El archivo no es un JSON válido. Por favor, selecciona un archivo JSON válido.', 'danger', 4000);
        }
    };
    reader.onerror = function(event) {
        console.error("Error al leer el archivo:", event.target.error);
        mostrarToast('Error', 'Hubo un error al leer el archivo. Por favor, intenta de nuevo.', 'danger', 4000);
    };
    reader.readAsText(file);
}