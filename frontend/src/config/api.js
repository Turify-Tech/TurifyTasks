// Configuración centralizada de la API
export const API_CONFIG = {
    // Usar localhost en desarrollo y Vercel en producción
    BASE_URL: "https://turify-tasks-backend.vercel.app",

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
    const defaultOptions = {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    };

    console.log("[API Request] URL:", url);
    console.log("[API Request] Options:", { ...defaultOptions, ...options });

    return fetch(url, { ...defaultOptions, ...options });
}
