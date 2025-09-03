// Configuración de metadatos del sitio para Open Graph y SEO
export const SITE_CONFIG = {
    name: "TurifyTasks",
    title: "TurifyTasks - Gestión Inteligente de Tareas",
    description:
        "Gestiona tus tareas de manera eficiente con TurifyTasks. Organiza proyectos, colabora en equipo y aumenta tu productividad.",
    url: "https://turify-tasks.vercel.app",
    ogImage: "/og-image.svg",
    author: "Turify Tech",
    keywords: [
        "gestión de tareas",
        "productividad",
        "organizador",
        "todo list",
        "tasks",
        "GTD",
        "proyectos",
        "colaboración",
        "eficiencia",
    ],
    social: {
        twitter: "@TurifyTech", // Si tienes cuenta de Twitter
        github: "https://github.com/Turify-Tech",
    },
};

// Función para generar metadatos específicos de página
export function generatePageMeta(pageData) {
    const fullTitle = pageData.title
        ? `${pageData.title} - ${SITE_CONFIG.name}`
        : SITE_CONFIG.title;

    return {
        title: fullTitle,
        description: pageData.description || SITE_CONFIG.description,
        url: pageData.path
            ? `${SITE_CONFIG.url}${pageData.path}`
            : SITE_CONFIG.url,
        image: SITE_CONFIG.ogImage,
        type: pageData.type || "website",
        siteName: SITE_CONFIG.name,
    };
}
