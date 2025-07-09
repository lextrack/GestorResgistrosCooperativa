export const itemsPerPage = 5;

const DB_NAME = 'GestorTransacciones';
const DB_VERSION = 1;
const STORE_NAME = 'productos';

class IndexedDBManager {
    constructor() {
        this.db = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Error al abrir IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    store.createIndex('articulo', 'articulo', { unique: false });
                    store.createIndex('proveedor', 'proveedor', { unique: false });
                    store.createIndex('categoria', 'categoria', { unique: false });
                    store.createIndex('fecha', 'fecha', { unique: false });
                }
            };
        });
    }

    async getAll() {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async add(product) {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            product.timestamp = Date.now();
            
            const request = store.add(product);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async update(id, product) {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            product.id = id;
            
            const request = store.put(product);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async delete(id) {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async search(searchTerm) {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const results = request.result.filter(product => 
                    product.articulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.proveedor.toLowerCase().includes(searchTerm.toLowerCase())
                );
                resolve(results);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async clear() {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async bulkAdd(products) {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            let completed = 0;
            const total = products.length;
            
            if (total === 0) {
                resolve([]);
                return;
            }

            products.forEach((product, index) => {
                product.timestamp = Date.now() + index;
                const request = store.add(product);
                
                request.onsuccess = () => {
                    completed++;
                    if (completed === total) {
                        resolve(products);
                    }
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            });
        });
    }
}

const dbManager = new IndexedDBManager();

export async function getProductList() {
    try {
        const products = await dbManager.getAll();
        return products.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    } catch (error) {
        console.error('Error al obtener productos:', error);
        return [];
    }
}

export async function addProduct(product) {
    try {
        await dbManager.add(product);
        return await getProductList();
    } catch (error) {
        console.error('Error al agregar producto:', error);
        throw error;
    }
}

export async function deleteProduct(index) {
    try {
        const products = await getProductList();
        if (index >= 0 && index < products.length) {
            const productToDelete = products[index];
            await dbManager.delete(productToDelete.id);
        }
        return await getProductList();
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        throw error;
    }
}

export async function updateProduct(index, updatedProduct) {
    try {
        const products = await getProductList();
        if (index >= 0 && index < products.length) {
            const productToUpdate = products[index];
            await dbManager.update(productToUpdate.id, updatedProduct);
        }
        return await getProductList();
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        throw error;
    }
}

export async function calculateTotalSum() {
    try {
        const products = await getProductList();
        return products.reduce((sum, product) => sum + parseFloat(product.total || 0), 0);
    } catch (error) {
        console.error('Error al calcular suma total:', error);
        return 0;
    }
}

export async function searchProducts(searchInput) {
    try {
        return await dbManager.search(searchInput);
    } catch (error) {
        console.error('Error al buscar productos:', error);
        return [];
    }
}

export async function exportAllData() {
    try {
        return await getProductList();
    } catch (error) {
        console.error('Error al exportar datos:', error);
        return [];
    }
}

export async function importData(products) {
    try {
        return await dbManager.bulkAdd(products);
    } catch (error) {
        console.error('Error al importar datos:', error);
        throw error;
    }
}

export async function clearAllData() {
    try {
        await dbManager.clear();
        return true;
    } catch (error) {
        console.error('Error al limpiar datos:', error);
        throw error;
    }
}