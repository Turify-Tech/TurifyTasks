// authUtils.js - Utilidades de autenticación persistente
import { showToast } from "./ui.js";
import { apiRequest, API_CONFIG } from "../config/api.js";

// Verificar si el usuario está autenticado
export async function checkAuthStatus() {
    try {
        // Cache de autenticación para evitar verificaciones excesivas
        if (window.authCache && window.authCache.timestamp) {
            const cacheAge = Date.now() - window.authCache.timestamp;
            // Usar cache si es menor a 10 segundos
            if (cacheAge < 10000) {
                console.log("[Auth] Usando cache de autenticación");
                return window.authCache.data;
            }
        }

        console.log("[Auth] === INICIO VERIFICACIÓN DE AUTENTICACIÓN ===");
        console.log("[Auth] API URL:", API_CONFIG.BASE_URL);
        console.log("[Auth] Endpoint:", API_CONFIG.ENDPOINTS.AUTH.CHECK);

        const response = await apiRequest(API_CONFIG.ENDPOINTS.AUTH.CHECK);

        console.log("[Auth] Respuesta del servidor:");
        console.log("  - Status:", response.status);
        console.log("  - StatusText:", response.statusText);
        console.log("  - OK:", response.ok);

        if (!response.ok) {
            let errorText = "Unknown error";
            try {
                errorText = await response.text();
            } catch (e) {
                console.warn("[Auth] No se pudo leer el error del servidor");
            }
            console.log("[Auth] Error del servidor:", errorText);
            console.log("[Auth] === FIN VERIFICACIÓN (ERROR) ===");
            const result = { authenticated: false, error: errorText };

            // Guardar en cache solo si no es un error de red
            if (response.status !== 0) {
                window.authCache = {
                    data: result,
                    timestamp: Date.now(),
                };
            }

            return result;
        }

        let data;
        try {
            const responseText = await response.text();
            if (!responseText || responseText.trim() === "") {
                console.warn(
                    "[Auth] Respuesta vacía del servidor, asumiendo no autenticado"
                );
                const result = {
                    authenticated: false,
                    error: "empty_response",
                };
                window.authCache = {
                    data: result,
                    timestamp: Date.now(),
                };
                return result;
            }
            data = JSON.parse(responseText);
        } catch (e) {
            console.error("[Auth] Error parseando respuesta JSON:", e);
            const result = { authenticated: false, error: "invalid_response" };
            return result;
        }
        const result = Object.assign(data, {
            user: data.user
                ? {
                      id: data.user.id,
                      username: data.user.username,
                      email: data.user.email,
                  }
                : null,
        });

        // Guardar resultado en cache
        window.authCache = {
            data: result,
            timestamp: Date.now(),
        };

        console.log("[Auth] === FIN VERIFICACIÓN (EXITOSA) ===");
        return result;
    } catch (error) {
        console.error(
            "[Auth] Error al verificar autenticación:",
            error.message
        );
        console.error("[Auth] Error completo:", error);
        console.log("[Auth] === FIN VERIFICACIÓN (EXCEPCIÓN) ===");
        const result = { authenticated: false, error: error.message };

        // No guardar errores de red en cache
        return result;
    }
}

// Función para redirigir basado en el estado de autenticación
export async function handleAuthRedirect() {
    const authStatus = await checkAuthStatus();
    const currentPath = window.location.pathname;

    console.log("[Auth] Estado de autenticación:", authStatus);
    console.log("[Auth] Ruta actual:", currentPath);

    // Prevenir loops de redirección
    if (window.isRedirecting) {
        console.log("[Auth] Redirección ya en proceso, abortando...");
        return false;
    }

    if (authStatus.authenticated) {
        // Usuario autenticado
        console.log("[Auth] Usuario autenticado:", authStatus.user);

        // Si está en login o register, redirigir al dashboard
        if (
            currentPath === "/login" ||
            currentPath === "/login/" ||
            currentPath === "/register" ||
            currentPath === "/register/" ||
            currentPath === "/" ||
            currentPath === "/index.html"
        ) {
            console.log("[Auth] Redirigiendo a dashboard...");
            window.isRedirecting = true;
            window.location.href = "/dashboard";
            return false; // Indica que se va a redirigir
        }

        // Guardar datos del usuario para uso en la aplicación
        window.currentUser = authStatus.user;

        // Actualizar UI del usuario si estamos en el dashboard
        if (currentPath === "/dashboard" || currentPath === "/dashboard/") {
            updateUserUIIfExists(authStatus.user);
        }

        return true; // Usuario autenticado y en página correcta
    } else {
        // Usuario no autenticado
        console.log("[Auth] Usuario no autenticado");

        // Si está en una página protegida O en la página principal, redirigir al login
        if (
            currentPath !== "/login" &&
            currentPath !== "/login/" &&
            currentPath !== "/register" &&
            currentPath !== "/register/"
        ) {
            console.log("[Auth] Redirigiendo a login...");
            window.isRedirecting = true;
            window.location.href = "/login";
            return false; // Indica que se va a redirigir
        }

        return false; // Usuario no autenticado
    }
}

// Función auxiliar para actualizar UI del usuario sin causar errores
function updateUserUIIfExists(user) {
    try {
        const userEmail = document.getElementById("userEmail");
        const userAvatar = document.getElementById("userAvatar");
        if (userEmail) userEmail.textContent = user.username;
        if (userAvatar)
            userAvatar.textContent = user.username.charAt(0).toUpperCase();
    } catch (error) {
        console.log("[Auth] Error actualizando UI del usuario:", error);
    }
}

// Función para logout
export async function logout() {
    try {
        const response = await apiRequest(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
            method: "POST",
        });

        if (response.ok) {
            showToast("Sesión cerrada correctamente", "success");
        } else {
            showToast("Error al cerrar sesión", "error");
        }
    } catch (error) {
        console.error("Error en logout:", error);
        showToast("Error al cerrar sesión", "error");
    } finally {
        // Siempre limpiar datos locales independientemente del resultado del servidor
        localStorage.removeItem("sessionToken");
        window.currentUser = null;
        // Limpiar cache de autenticación
        window.authCache = null;
        window.lastAuthCheck = 0;
        window.location.href = "/login";
    }
}

// Inicializar verificación de autenticación en cada página
export function initializeAuth() {
    // Solo ejecutar en páginas que no sean dashboard
    const currentPath = window.location.pathname;
    if (currentPath === "/dashboard" || currentPath === "/dashboard/") {
        console.log("[Auth] En dashboard, saltando initializeAuth automático");
        return;
    }

    // Resetear estado de redirección al cargar la página
    window.isRedirecting = false;

    // Verificar autenticación cuando se carga la página (solo si no se ha verificado recientemente)
    document.addEventListener("DOMContentLoaded", async () => {
        console.log("[Auth] Inicializando verificación de autenticación...");

        // Verificar si ya se verificó recientemente (últimos 5 segundos)
        const lastCheck = window.lastAuthCheck || 0;
        const now = Date.now();

        if (now - lastCheck < 5000) {
            console.log("[Auth] Verificación reciente detectada, saltando...");
            return;
        }

        window.lastAuthCheck = now;
        await handleAuthRedirect();
    });
}

// Función específica para verificar autenticación en dashboard sin redirecciones automáticas
export async function checkAuthForDashboard() {
    try {
        console.log("[Auth] Verificando autenticación para dashboard...");
        const authStatus = await checkAuthStatus();

        if (!authStatus.authenticated) {
            console.log("[Auth] No autenticado, redirigiendo a login...");
            window.location.href = "/login";
            return false;
        }

        // Guardar datos del usuario
        window.currentUser = authStatus.user;
        updateUserUIIfExists(authStatus.user);

        console.log(
            "[Auth] Usuario autenticado en dashboard:",
            authStatus.user
        );
        return true;
    } catch (error) {
        console.error("[Auth] Error verificando autenticación:", error);
        window.location.href = "/login";
        return false;
    }
}
