let deferredPrompt;
let installButton;

export function initializePWA() {
    registerServiceWorker();
    setupInstallPrompt();
    createInstallButton();
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

        showInstallButton();
    });

    window.addEventListener('appinstalled', (e) => {
        console.log('PWA: App instalada exitosamente');
        hideInstallButton();
        showInstalledToast();

        deferredPrompt = null;
    });
}

function createInstallButton() {
    if (!document.getElementById('pwa-install-btn')) {
        installButton = document.createElement('button');
        installButton.id = 'pwa-install-btn';
        installButton.className = 'btn btn-success btn-sm position-fixed';
        installButton.style.cssText = `
            bottom: 20px;
            right: 20px;
            z-index: 1050;
            display: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border-radius: 25px;
            padding: 8px 16px;
            font-size: 12px;
            font-weight: bold;
        `;
        installButton.innerHTML = '<i class="bi bi-download"></i> Instalar App';
        installButton.addEventListener('click', installApp);
        
        document.body.appendChild(installButton);
    }
}

function showInstallButton() {
    if (installButton) {
        installButton.style.display = 'block';
    }
}

function hideInstallButton() {
    if (installButton) {
        installButton.style.display = 'none';
    }
}

async function installApp() {
    if (!deferredPrompt) {
        console.log('PWA: No hay prompt de instalación disponible');
        return;
    }

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        console.log('PWA: Usuario aceptó la instalación');
    } else {
        console.log('PWA: Usuario rechazó la instalación');
    }
    deferredPrompt = null;
    hideInstallButton();
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
    if (isAppInstalled()) {
        console.log('PWA: App ya está instalada');
        return;
    }
    
    const checkUsage = async () => {
        try {
            const { getProductList } = await import('./dataManager.js');
            const products = await getProductList();
            
            if (products.length > 5 && !isAppInstalled()) {
                setTimeout(() => {
                    if (window.mostrarToast && !document.getElementById('pwa-install-btn')?.style.display === 'block') {
                        window.mostrarToast(
                            'Instalar App', 
                            '¿Sabías que puedes instalar esta app en tu dispositivo para un acceso más rápido?', 
                            'info', 
                            6000
                        );
                    }
                }, 5000);
            }
        } catch (error) {
            console.log('PWA: No se pudo verificar el uso de la app');
        }
    };
    
    checkUsage();
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
        /* PWA specific styles */
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
        
        /* Hide address bar on iOS */
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