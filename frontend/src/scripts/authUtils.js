// authUtils.js - Utilidades de autenticación persistente
import { showToast } from "./ui.js";
import { apiRequest, API_CONFIG } from "../config/api.js";

// Verificar si el usuario está autenticado
export async function checkAuthStatus() {
    try {
        console.log("[Auth] === INICIO VERIFICACIÓN DE AUTENTICACIÓN ===");
        console.log("[Auth] API URL:", API_CONFIG.BASE_URL);
        console.log("[Auth] Endpoint:", API_CONFIG.ENDPOINTS.AUTH.CHECK);

        const response = await apiRequest(API_CONFIG.ENDPOINTS.AUTH.CHECK);

        console.log("[Auth] Respuesta del servidor:");
        console.log("  - Status:", response.status);
        console.log("  - StatusText:", response.statusText);
        console.log("  - OK:", response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.log("[Auth] Error del servidor:", errorText);
            console.log("[Auth] === FIN VERIFICACIÓN (ERROR) ===");
            return { authenticated: false, error: errorText };
        }

        const data = await response.json();
        console.log("[Auth] Datos de autenticación:", {
            authenticated: data.authenticated,
            user: data.user
                ? {
                      id: data.user.id,
                      username: data.user.username,
                      email: data.user.email,
                  }
                : null,
        });
        console.log("[Auth] === FIN VERIFICACIÓN (EXITOSA) ===");
        return data;
    } catch (error) {
        console.error(
            "[Auth] Error al verificar autenticación:",
            error.message
        );
        console.error("[Auth] Error completo:", error);
        console.log("[Auth] === FIN VERIFICACIÓN (EXCEPCIÓN) ===");
        return { authenticated: false, error: error.message };
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
            // Limpiar datos del usuario
            window.currentUser = null;
            // Redirigir al login
            window.location.href = "/login";
        } else {
            throw new Error("Error al cerrar sesión");
        }
    } catch (error) {
        console.error("Error en logout:", error);
        showToast("Error al cerrar sesión", "error");
    }
}

// Inicializar verificación de autenticación en cada página
export function initializeAuth() {
    // Resetear estado de redirección al cargar la página
    window.isRedirecting = false;

    // Verificar autenticación cuando se carga la página
    document.addEventListener("DOMContentLoaded", async () => {
        console.log("[Auth] Inicializando verificación de autenticación...");
        await handleAuthRedirect();
    });
}
