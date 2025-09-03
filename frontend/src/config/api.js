// Configuración centralizada de la API
export const API_CONFIG = {
    // Usar localhost en desarrollo
    BASE_URL: "http://localhost:3000",

    // Endpoints de la API
    ENDPOINTS: {
        AUTH: {
            LOGIN: "/api/auth/login",
            REGISTER: "/api/auth/register",
            LOGOUT: "/api/auth/logout",
            CHECK: "/api/auth/check",
            PROFILE: "/api/auth/profile",
        },
        TASKS: {
            BASE: "/api/tasks",
        },
        TASK_LISTS: {
            BASE: "/api/task-lists",
        },
    },
};

// Log de configuración para debugging
console.log("[API Config] BASE_URL:", API_CONFIG.BASE_URL);
console.log("[API Config] VITE_API_URL env:", import.meta.env.VITE_API_URL);
console.log(
    "[API Config] Current domain:",
    typeof window !== "undefined" ? window.location.origin : "SSR"
);

// Función helper para construir URLs completas
export function buildApiUrl(endpoint) {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
}

// Función helper para hacer fetch con la configuración base
export async function apiRequest(endpoint, options = {}) {
    const url = buildApiUrl(endpoint);

    // Obtener token de sesión del localStorage
    const sessionToken = localStorage.getItem("sessionToken");

    const defaultOptions = {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(sessionToken && { Authorization: `Bearer ${sessionToken}` }),
            ...options.headers,
        },
    };

    console.log("[API Request] URL:", url);
    console.log("[API Request] Token usado:", sessionToken ? "SÍ" : "NO");
    console.log("[API Request] Options:", { ...defaultOptions, ...options });

    // Implementar timeout de 10 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(url, {
            ...defaultOptions,
            ...options,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Verificar que la respuesta tenga contenido
        const contentLength = response.headers.get("content-length");
        if (contentLength === "0" || contentLength === null) {
            console.warn("[API Request] Respuesta vacía del servidor");
            // Crear una respuesta por defecto para el endpoint de check
            if (endpoint === "/api/auth/check") {
                return new Response(
                    JSON.stringify({
                        authenticated: false,
                        reason: "empty_response",
                    }),
                    {
                        status: 200,
                        headers: { "Content-Type": "application/json" },
                    }
                );
            }
        }

        return response;
    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === "AbortError") {
            console.error("[API Request] Timeout en la petición");
            // Para el endpoint de check, devolver respuesta por defecto en caso de timeout
            if (endpoint === "/api/auth/check") {
                return new Response(
                    JSON.stringify({ authenticated: false, reason: "timeout" }),
                    {
                        status: 200,
                        headers: { "Content-Type": "application/json" },
                    }
                );
            }
        }

        throw error;
    }
}
