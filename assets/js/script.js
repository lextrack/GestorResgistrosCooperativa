var itemsPerPage = 5;
var currentPage = 1;
var totalPages = 5;

function validateForm(){
    var articulo = document.getElementById("articulo").value;
    var cantidad = document.getElementById("cantidad").value;
    var precio = document.getElementById("precio").value;
    var proveedor = document.getElementById("proveedor").value;
    var fecha = document.getElementById("fecha").value;

    if(articulo == ""){
        alert("Debes indicar al menos el nombre del artículo");
        return false;
    }
    return true;
}

function showData(){
    var productList;
    if(localStorage.getItem("productList") == null) {
        productList = [];
    } else {
        productList = JSON.parse(localStorage.getItem("productList"));
    }
    totalPages = Math.ceil(productList.length / itemsPerPage);

    var startIndex = (currentPage - 1) * itemsPerPage;
    var endIndex = startIndex + itemsPerPage;
    var displayedProducts = productList.slice(startIndex, endIndex);

    var html = "";
    displayedProducts.forEach(function (element, index){
        html += "<tr>";
        html += "<td>" + element.articulo + "</td>";
        html += "<td>" + element.cantidad + "</td>";
        html += "<td>" + element.precio + "</td>";
        html += "<td>" + element.total + "</td>";
        html += "<td>" + element.proveedor + "</td>";
        html += "<td>" + element.fecha + "</td>";
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

document.onload = showData();

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

function AddData(){
    if(validateForm() == true){
        var articulo = document.getElementById("articulo").value;
        var cantidad = document.getElementById("cantidad").value;
        var precio = document.getElementById("precio").value;
        var proveedor = document.getElementById("proveedor").value;
        var fecha = document.getElementById("fecha").value;
        var total = parseInt(cantidad) * parseInt(precio);

        var productList;
        if(localStorage.getItem("productList") == null){
            productList = [];
        }
        else{
            productList = JSON.parse(localStorage.getItem("productList"));
        }
    
        productList.push({
            articulo : articulo,
            cantidad: cantidad,
            precio : precio,
            proveedor : proveedor,
            fecha : fecha,
            total: total,
        });

        localStorage.setItem("productList", JSON.stringify(productList));
        showData();
        document.getElementById("articulo").value = "";
        document.getElementById("cantidad").value = "";
        document.getElementById("precio").value = "";
        document.getElementById("total").value = "";
        document.getElementById("proveedor").value = "";
        document.getElementById("fecha").value = "";
    }
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
    document.getElementById("total").value = productList[index].total;
    document.getElementById("proveedor").value = productList[index].proveedor;
    document.getElementById("fecha").value = productList[index].fecha;

    document.querySelector("#Update").onclick = function(){

        if(validateForm() == true){
            productList[index].articulo = document.getElementById("articulo").value;
            productList[index].cantidad = document.getElementById("cantidad").value;
            productList[index].precio = document.getElementById("precio").value;
            productList[index].total = parseInt(document.getElementById("cantidad").value) * parseInt(document.getElementById("precio").value);
            productList[index].proveedor = document.getElementById("proveedor").value;
            productList[index].fecha = document.getElementById("fecha").value;

            localStorage.setItem("productList", JSON.stringify(productList));

            showData();

            document.getElementById("articulo").value = "";
            document.getElementById("cantidad").value = "";
            document.getElementById("precio").value = "";
            document.getElementById("total").value = "";
            document.getElementById("proveedor").value = "";
            document.getElementById("fecha").value = "";

            document.getElementById("Submit").style.display = "block";
            document.getElementById("Update").style.display = "none";
        }
    }
}

function updateTotal(){
    var cantidad = document.getElementById("cantidad").value;
    var precio = document.getElementById("precio").value;
    document.getElementById("total").value = parseInt(cantidad) * parseInt(precio);
}

function searchData(){
    var searchInput = document.getElementById("searchInput").value;
    var productList = JSON.parse(localStorage.getItem("productList"));
    var searchedProducts = productList.filter(function(articulo) {
      return (
        articulo.articulo.toLowerCase().includes(searchInput.toLowerCase()) ||
        articulo.cantidad.toLowerCase().includes(searchInput.toLowerCase()) ||
        articulo.precio.toLowerCase().includes(searchInput.toLowerCase()) ||
        articulo.proveedor.toLowerCase().includes(searchInput.toLowerCase()) ||
        articulo.fecha.toLowerCase().includes(searchInput.toLowerCase())
      );
    });
    var html = "";
    searchedProducts.forEach(function(element, index){
      html += "<tr>";
      html += "<td>" + element.articulo + "</td>";
      html += "<td>" + element.cantidad + "</td>";
      html += "<td>" + element.precio + "</td>";
      html += "<td>" + element.total + "</td>";
      html += "<td>" + element.proveedor + "</td>";
      html += "<td>" + element.fecha + "</td>";
      html +=
        '<td><button onclick="deleteData(' +
        index +
        ')" class="btn btn-danger">Borrar</button><button onclick="updateData(' +
        index +
        ')" class="btn btn-warning m-1">Editar</button></td>';
      html += "</tr>";
    });
    document.querySelector("#crudTable tbody").innerHTML = html;
}

function exportToExcel() {
    var productList = JSON.parse(localStorage.getItem("productList")) || [];

    var worksheet = XLSX.utils.json_to_sheet(productList);
    var workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DatosTransacciones');

    // Obtener la fecha actual
    var currentDate = new Date();
    var dateFormatted = currentDate.toISOString().slice(0,10); // Formato YYYY-MM-DD

    // Nombre del archivo con la fecha actual
    var fileName = 'DatosTransacciones_' + dateFormatted + '.xlsx';

    XLSX.writeFile(workbook, fileName);
}

function importFromJSON(event) {
    var file = event.target.files[0];
    var reader = new FileReader();
    reader.onload = function(event) {
        var jsonData = JSON.parse(event.target.result);
        localStorage.setItem("productList", JSON.stringify(jsonData));
        showData();
    };
    reader.readAsText(file);
}

function exportToJSON() {
    var productList = JSON.parse(localStorage.getItem("productList")) || [];
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(productList));

    // Obtener la fecha y hora actual en formato YYYY-MM-DD_HH-MM-SS
    var currentDate = new Date();
    var day = String(currentDate.getDate()).padStart(2, '0');
    var month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Los meses comienzan en 0
    var year = currentDate.getFullYear();
    var hours = String(currentDate.getHours()).padStart(2, '0');
    var minutes = String(currentDate.getMinutes()).padStart(2, '0');
    var seconds = String(currentDate.getSeconds()).padStart(2, '0');
    var formattedDate = year + '-' + month + '-' + day + '_' + hours + '-' + minutes + '-' + seconds;

    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "Respaldo_" + formattedDate + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

