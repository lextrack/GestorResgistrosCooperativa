import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    orderBy, 
    query, 
    limit,
    doc,
    getDoc
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyCGLxyVEYI2k_-hyzBGysH4OG3T_pfT8pM",
    authDomain: "registroscooperativa.firebaseapp.com",
    projectId: "registroscooperativa",
    storageBucket: "registroscooperativa.firebasestorage.app",
    messagingSenderId: "1015443831570",
    appId: "1:1015443831570:web:1173f92dca7a2b943351cb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


export async function createCloudBackup() {
    try {
        const { exportAllData } = await import('./dataManager.js');
        const localData = await exportAllData();
        
        if (localData.length === 0) {
            throw new Error('No hay datos para respaldar');
        }

        const cleanedData = localData.map(product => {
            const { id, timestamp, ...cleanProduct } = product;
            return cleanProduct;
        });

        const backupDoc = {
            data: cleanedData,
            timestamp: Date.now(),
            date: new Date().toISOString(),
            recordCount: cleanedData.length,
            version: '1.0'
        };

        const docRef = await addDoc(collection(db, 'backups'), backupDoc);
        
        return {
            success: true,
            backupId: docRef.id,
            recordCount: cleanedData.length,
            date: new Date().toLocaleString('es-CL')
        };

    } catch (error) {
        console.error('Error al crear respaldo:', error);
        throw new Error(`Error al crear respaldo: ${error.message}`);
    }
}

export async function getLastCloudBackup() {
    try {
        const q = query(
            collection(db, 'backups'), 
            orderBy('timestamp', 'desc'), 
            limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        const data = doc.data();
        
        return {
            id: doc.id,
            date: new Date(data.timestamp).toLocaleString('es-CL'),
            recordCount: data.recordCount,
            timestamp: data.timestamp,
            version: data.version || '1.0'
        };
        
    } catch (error) {
        console.error('Error al obtener último respaldo:', error);
        throw new Error(`Error al obtener respaldo: ${error.message}`);
    }
}


export async function restoreCloudBackup(backupId) {
    try {
        const { importData, clearAllData } = await import('./dataManager.js');
        
        const docRef = doc(db, 'backups', backupId);
        const docSnapshot = await getDoc(docRef);
        
        if (!docSnapshot.exists()) {
            throw new Error('Respaldo no encontrado');
        }
        
        const backupData = docSnapshot.data();
        
        if (!backupData.data || !Array.isArray(backupData.data)) {
            throw new Error('El respaldo no contiene datos válidos');
        }

        await clearAllData();
        await importData(backupData.data);
        
        return {
            success: true,
            recordCount: backupData.recordCount,
            backupDate: new Date(backupData.timestamp).toLocaleString('es-CL'),
            version: backupData.version || '1.0'
        };
        
    } catch (error) {
        console.error('Error al restaurar respaldo:', error);
        throw new Error(`Error al restaurar respaldo: ${error.message}`);
    }
}

export async function checkCloudConnection() {
    try {
        const q = query(collection(db, 'backups'), limit(1));
        await getDocs(q);
        return true;
    } catch (error) {
        alert.error('Error de conexión a la nube:', error);
        return false;
    }
}

export async function getBackupStats() {
    try {
        const lastBackup = await getLastCloudBackup();
        
        if (!lastBackup) {
            return {
                hasBackup: false,
                message: 'No hay respaldos en la nube'
            };
        }

        const now = Date.now();
        const backupAge = now - lastBackup.timestamp;
        const daysOld = Math.floor(backupAge / (1000 * 60 * 60 * 24));
        
        return {
            hasBackup: true,
            recordCount: lastBackup.recordCount,
            date: lastBackup.date,
            daysOld: daysOld,
            isRecent: daysOld <= 7
        };
        
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return {
            hasBackup: false,
            message: 'Error al verificar respaldos'
        };
    }
}