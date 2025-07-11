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
    getDoc,
    where,
    writeBatch
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

function generateSimpleChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; 
    }
    return Math.abs(hash).toString(16);
}

export async function createCloudBackup() {
    try {
        const { exportAllData } = await import('./dataManager.js');
        const localData = await exportAllData();
        
        if (localData.length === 0) {
            throw new Error('No hay datos para respaldar');
        }

        if (localData.length > 10000) {
            throw new Error('Demasiados registros. Máximo permitido: 10,000');
        }

        const cleanedData = localData.map(product => {
            const { id, timestamp, ...cleanProduct } = product;
            return cleanProduct;
        });

        const now = Date.now();
        const dataString = JSON.stringify(cleanedData);
        
        const shouldCompress = dataString.length > 50000;
        
        const backupDoc = {
            data: shouldCompress ? null : cleanedData,
            compressedData: shouldCompress ? dataString : null,
            isCompressed: shouldCompress,
            timestamp: now,
            recordCount: cleanedData.length,
            version: '1.1',
            date: new Date().toISOString(),
            lastUpdate: now,
            checksum: generateSimpleChecksum(cleanedData)
        };

        const docSize = JSON.stringify(backupDoc).length;
        if (docSize > 950000) { 
            throw new Error('El respaldo es demasiado grande. Borra algunos registros y vuelve a intentar.');
        }

        const docRef = await addDoc(collection(db, 'backups'), backupDoc);
        
        return {
            success: true,
            backupId: docRef.id,
            recordCount: cleanedData.length,
            date: new Date().toLocaleString('es-CL'),
            size: `${Math.round(docSize / 1024)} KB`
        };

    } catch (error) {
        console.error('Error al crear respaldo:', error);
        
        if (error.code === 'permission-denied') {
            if (error.message.includes('size')) {
                throw new Error('El respaldo es demasiado grande (máximo 1MB)');
            } else if (error.message.includes('recordCount')) {
                throw new Error('Demasiados registros (máximo 10,000)');
            } else {
                throw new Error('Operación denegada. Verifica que no estés haciendo respaldos muy frecuentes.');
            }
        }
        
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
        
        let dataToRestore;
        if (backupData.isCompressed && backupData.compressedData) {
            dataToRestore = JSON.parse(backupData.compressedData);
        } else if (backupData.data && Array.isArray(backupData.data)) {
            dataToRestore = backupData.data;
        } else {
            throw new Error('El respaldo no contiene datos válidos');
        }

        await clearAllData();
        await importData(dataToRestore);
        
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
        console.error('Error de conexión a la nube:', error);
        return false;
    }
}

export async function cleanupOldBackups(daysToKeep = 90) {
    try {
        const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
        
        const q = query(
            collection(db, 'backups'),
            where('timestamp', '<', cutoffDate),
            orderBy('timestamp', 'asc'),
            limit(10)
        );
        
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        if (snapshot.docs.length > 0) {
            await batch.commit();
            console.log(`Eliminados ${snapshot.docs.length} respaldos antiguos`);
        }
        
        return { deleted: snapshot.docs.length };
    } catch (error) {
        console.error('Error al limpiar respaldos:', error);
        throw error;
    }
}

export async function getBackupStats() {
    try {
        const q = query(
            collection(db, 'backups'),
            orderBy('timestamp', 'desc'),
            limit(50)
        );
        
        const snapshot = await getDocs(q);
        const backups = snapshot.docs.map(doc => doc.data());
        
        return {
            totalBackups: backups.length,
            latestBackup: backups[0]?.date || 'Nunca',
            totalRecords: backups.reduce((sum, b) => sum + (b.recordCount || 0), 0),
            averageSize: backups.length > 0 
                ? Math.round(backups.reduce((sum, b) => sum + (b.recordCount || 0), 0) / backups.length)
                : 0,
            oldestBackup: backups[backups.length - 1]?.date || 'Nunca'
        };
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return null;
    }
}