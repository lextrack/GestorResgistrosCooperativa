export function mostrarToast(titulo, mensaje, tipo = 'info', duracion = 4000) {
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

export function resetForm() {
    document.getElementById("articulo").value = "";
    document.getElementById("cantidad").value = "0";
    document.getElementById("precio").value = "0";
    document.getElementById("proveedor").value = "";
    
    const fechaInput = document.getElementById("fecha");
    if (fechaInput) {
        const today = new Date();
        const formattedDate = today.getFullYear() + '-' + 
                            String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                            String(today.getDate()).padStart(2, '0');
        fechaInput.value = formattedDate;
    }
    
    document.getElementById("categoria").value = "";
    document.getElementById("duracion").value = "";
    document.getElementById("total").value = "";
    document.getElementById("dropdownCategoria").innerHTML = "Seleccionar Categoría";
}

export function toggleFormButtons(showSubmit) {
    document.getElementById("Submit").style.display = showSubmit ? "block" : "none";
    document.getElementById("Update").style.display = showSubmit ? "none" : "block";
}