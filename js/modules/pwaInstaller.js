let deferredPrompt;

export function initializePWA() {
    registerServiceWorker();
    setupInstallPrompt();
    handleAppUpdates();
}

async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const basePath = '/GestorResgistrosCooperativa';
            
            console.log('PWA: Registrando SW en:', `${basePath}/sw.js`);
            
            const registration = await navigator.serviceWorker.register(`${basePath}/sw.js`, {
                scope: `${basePath}/`
            });
            
            console.log('PWA: Service Worker registrado exitosamente:', registration.scope);

            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateNotification();
                    }
                });
            });
            
            return registration;
        } catch (error) {
            console.error('PWA: Error al registrar Service Worker:', error);
        }
    } else {
        console.log('PWA: Service Workers no son soportados en este navegador');
    }
}

function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA: beforeinstallprompt event fired');
        e.preventDefault();
        deferredPrompt = e;
    });

    window.addEventListener('appinstalled', (e) => {
        console.log('PWA: App instalada exitosamente');
        showInstalledToast();
        deferredPrompt = null;
    });
}

function isAppInstalled() {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        return true;
    }
    
    if (window.navigator.standalone === true) {
        return true;
    }
    
    return false;
}

function showInstalledToast() {
    if (window.mostrarToast) {
        window.mostrarToast(
            'App Instalada', 
            'La aplicación se instaló correctamente en tu dispositivo', 
            'success', 
            5000
        );
    } else {
        console.log('PWA: App instalada correctamente');
    }
}

function showUpdateNotification() {
    if (window.mostrarToast) {
        window.mostrarToast(
            'Actualización Disponible', 
            'Hay una nueva versión disponible. Recarga la página para actualizar.', 
            'info', 
            8000
        );
    }
    
    createUpdateButton();
}

function createUpdateButton() {
    if (!document.getElementById('pwa-update-btn')) {
        const updateButton = document.createElement('button');
        updateButton.id = 'pwa-update-btn';
        updateButton.className = 'btn btn-info btn-sm position-fixed';
        updateButton.style.cssText = `
            bottom: 20px;
            left: 20px;
            z-index: 1050;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border-radius: 25px;
            padding: 8px 16px;
            font-size: 12px;
            font-weight: bold;
        `;
        updateButton.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Actualizar';
        updateButton.addEventListener('click', () => {
            window.location.reload();
        });
        
        document.body.appendChild(updateButton);
        
        setTimeout(() => {
            updateButton.remove();
        }, 10000);
    }
}

function handleAppUpdates() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'BACKGROUND_SYNC') {
                console.log('PWA: Background sync completed');
                if (window.mostrarToast) {
                    window.mostrarToast(
                        'Sincronización', 
                        'Datos sincronizados correctamente', 
                        'success', 
                        3000
                    );
                }
            }
        });
    }
}

export function checkInstallPromotion() {
    return;
}

export function setupPWAFeatures() {
    addPWAMetaTags();
    addPWAStyles();
    setInterval(() => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
        }
    }, 60000);
}

function addPWAMetaTags() {
    const head = document.head;
    
    const metaTags = [
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'Gestor' },
        { name: 'msapplication-TileColor', content: '#198754' },
        { name: 'msapplication-config', content: '/browserconfig.xml' }
    ];
    
    metaTags.forEach(({ name, content }) => {
        if (!document.querySelector(`meta[name="${name}"]`)) {
            const meta = document.createElement('meta');
            meta.name = name;
            meta.content = content;
            head.appendChild(meta);
        }
    });
    
    const appleTouchIcon = document.createElement('link');
    appleTouchIcon.rel = 'apple-touch-icon';
    appleTouchIcon.href = '/GestorResgistrosCooperativa/img/icon-192x192.png';
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
        head.appendChild(appleTouchIcon);
    }
}

function addPWAStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @media (display-mode: standalone) {
            body {
                padding-top: env(safe-area-inset-top);
                padding-left: env(safe-area-inset-left);
                padding-right: env(safe-area-inset-right);
                padding-bottom: env(safe-area-inset-bottom);
            }
            
            .container {
                margin-top: 10px;
            }
        }
        
        @supports (-webkit-touch-callout: none) {
            .container {
                min-height: 100vh;
                min-height: -webkit-fill-available;
            }
        }
    `;
    
    if (!document.querySelector('style[data-pwa-styles]')) {
        style.setAttribute('data-pwa-styles', 'true');
        document.head.appendChild(style);
    }
}