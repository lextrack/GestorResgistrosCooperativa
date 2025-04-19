export const itemsPerPage = 5;

export function getProductList() {
    return JSON.parse(localStorage.getItem("productList")) || [];
}

export function saveProductList(productList) {
    localStorage.setItem("productList", JSON.stringify(productList));
}

export function addProduct(product) {
    const productList = getProductList();
    productList.push(product);
    saveProductList(productList);
    return productList;
}

export function deleteProduct(index) {
    const productList = getProductList();
    productList.splice(index, 1);
    saveProductList(productList);
    return productList;
}

export function updateProduct(index, updatedProduct) {
    const productList = getProductList();
    productList[index] = updatedProduct;
    saveProductList(productList);
    return productList;
}

export function calculateTotalSum() {
    const productList = getProductList();
    return productList.reduce((sum, product) => sum + parseFloat(product.total), 0);
}

export function searchProducts(searchInput) {
    const productList = getProductList();
    return productList.filter(product => 
        product.articulo.toLowerCase().includes(searchInput) ||
        product.proveedor.toLowerCase().includes(searchInput)
    );
}