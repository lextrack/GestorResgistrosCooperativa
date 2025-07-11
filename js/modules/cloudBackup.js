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
        const originalSize = dataString.length;
        
        const shouldCompress = originalSize > 50000;
        
        let finalData = null;
        let compressedData = null;
        let compressedSize = 0;
        
        if (shouldCompress) {
            compressedData = LZString.compress(dataString);
            compressedSize = compressedData.length;
            console.log(`📦 Compresión: ${originalSize} → ${compressedSize} bytes (${Math.round((1 - compressedSize/originalSize) * 100)}% reducción)`);
        } else {
            finalData = cleanedData;
            console.log(`📄 Sin compresión: ${originalSize} bytes`);
        }
        
        const backupDoc = {
            data: finalData,
    
            compressedData: compressedData,
            
            isCompressed: shouldCompress,
            originalSize: originalSize,
            compressedSize: shouldCompress ? compressedSize : originalSize,
            compressionRatio: shouldCompress ? Math.round((1 - compressedSize/originalSize) * 100) : 0,
            
            timestamp: now,
            recordCount: cleanedData.length,
            version: '1.2',
            date: new Date().toISOString(),
            lastUpdate: now,
            checksum: generateSimpleChecksum(cleanedData)
        };

        const docSize = JSON.stringify(backupDoc).length;
        console.log(`📊 Tamaño final del documento: ${Math.round(docSize / 1024)} KB`);
        
        if (docSize > 950000) { 
            throw new Error(`El respaldo es demasiado grande (${Math.round(docSize / 1024)} KB). Máximo permitido: 950 KB.`);
        }

        const docRef = await addDoc(collection(db, 'backups'), backupDoc);
        
        return {
            success: true,
            backupId: docRef.id,
            recordCount: cleanedData.length,
            date: new Date().toLocaleString('es-CL'),
            size: `${Math.round(docSize / 1024)} KB`,
            originalSize: `${Math.round(originalSize / 1024)} KB`,
            compressed: shouldCompress,
            compressionSavings: shouldCompress ? `${Math.round((1 - compressedSize/originalSize) * 100)}%` : 'N/A'
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
            version: data.version || '1.0',
            isCompressed: data.isCompressed || false,
            originalSize: data.originalSize ? `${Math.round(data.originalSize / 1024)} KB` : 'N/A',
            compressedSize: data.compressedSize ? `${Math.round(data.compressedSize / 1024)} KB` : 'N/A',
            compressionRatio: data.compressionRatio || 0
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
            console.log('🗜️ Descomprimiendo datos...');
            const decompressedString = LZString.decompress(backupData.compressedData);
            
            if (!decompressedString) {
                throw new Error('Error al descomprimir los datos del respaldo');
            }
            
            try {
                dataToRestore = JSON.parse(decompressedString);
                console.log(`✅ Datos descomprimidos: ${dataToRestore.length} registros`);
            } catch (parseError) {
                throw new Error('Error al procesar los datos descomprimidos');
            }
            
        } else if (backupData.data && Array.isArray(backupData.data)) {
            dataToRestore = backupData.data;
            console.log(`📄 Datos sin comprimir: ${dataToRestore.length} registros`);
        } else {
            throw new Error('El respaldo no contiene datos válidos');
        }

        if (backupData.checksum) {
            const calculatedChecksum = generateSimpleChecksum(dataToRestore);
            if (calculatedChecksum !== backupData.checksum) {
                console.warn('⚠️ Advertencia: El checksum no coincide, pero continuando...');
            } else {
                console.log('✅ Checksum verificado correctamente');
            }
        }

        await clearAllData();
        await importData(dataToRestore);
        
        return {
            success: true,
            recordCount: backupData.recordCount,
            backupDate: new Date(backupData.timestamp).toLocaleString('es-CL'),
            version: backupData.version || '1.0',
            wasCompressed: backupData.isCompressed || false
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
        const latestQuery = query(
            collection(db, 'backups'),
            orderBy('timestamp', 'desc'),
            limit(1)
        );
        
        const latestSnapshot = await getDocs(latestQuery);
        if (latestSnapshot.empty) {
            console.log('📭 No hay respaldos para limpiar');
            return { deleted: 0, reason: 'No hay respaldos' };
        }
        
        const latestBackup = latestSnapshot.docs[0];
        const latestTimestamp = latestBackup.data().timestamp;
        
        console.log(`🛡️ RESPALDO MÁS RECIENTE PROTEGIDO: ${new Date(latestTimestamp).toLocaleString('es-CL')}`);
        
        const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
        
        const oldBackupsQuery = query(
            collection(db, 'backups'),
            where('timestamp', '<', Math.min(cutoffDate, latestTimestamp)),
            orderBy('timestamp', 'asc'),
            limit(10)
        );
        
        const oldSnapshot = await getDocs(oldBackupsQuery);
    
        const toDelete = oldSnapshot.docs.filter(doc => 
            doc.id !== latestBackup.id && 
            doc.data().timestamp < cutoffDate 
        );
        
        if (toDelete.length === 0) {
            console.log('ℹ️ No hay respaldos antiguos seguros para eliminar');
            return { deleted: 0, reason: 'No hay respaldos antiguos seguros' };
        }
        
        const batch = writeBatch(db);
        toDelete.forEach(doc => {
            console.log(`🗑️ Eliminando: ${new Date(doc.data().timestamp).toLocaleString('es-CL')}`);
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        console.log(`✅ Eliminados ${toDelete.length} respaldos. El más reciente está protegido.`);
        
        return { 
            deleted: toDelete.length,
            latestBackupProtected: new Date(latestTimestamp).toLocaleString('es-CL')
        };
        
    } catch (error) {
        console.error('❌ Error en limpieza segura:', error);
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
        
        const totalOriginalSize = backups.reduce((sum, b) => sum + (b.originalSize || 0), 0);
        const totalCompressedSize = backups.reduce((sum, b) => sum + (b.compressedSize || b.originalSize || 0), 0);
        const compressionSavings = totalOriginalSize > 0 ? Math.round((1 - totalCompressedSize/totalOriginalSize) * 100) : 0;
        
        return {
            totalBackups: backups.length,
            latestBackup: backups[0]?.date || 'Nunca',
            totalRecords: backups.reduce((sum, b) => sum + (b.recordCount || 0), 0),
            averageSize: backups.length > 0 
                ? Math.round(backups.reduce((sum, b) => sum + (b.recordCount || 0), 0) / backups.length)
                : 0,
            oldestBackup: backups[backups.length - 1]?.date || 'Nunca',
            compressedBackups: backups.filter(b => b.isCompressed).length,
            totalSpaceSaved: compressionSavings > 0 ? `${compressionSavings}%` : 'N/A',
            totalOriginalSize: `${Math.round(totalOriginalSize / 1024)} KB`,
            totalCompressedSize: `${Math.round(totalCompressedSize / 1024)} KB`
        };
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return null;
    }
}