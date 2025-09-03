// Configuración centralizada de la API
export const API_CONFIG = {
    // Toma la URL base desde la variable de entorno o usa localhost como fallback
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

    return fetch(url, { ...defaultOptions, ...options });
}
