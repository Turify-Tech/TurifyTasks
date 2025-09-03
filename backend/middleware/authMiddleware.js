// Import para acceder al sessionStore
import { sessionStore } from "../controllers/authController.js";

// Middleware para proteger rutas que requieren autenticación
export const isAuthenticated = (req, res, next) => {
    const sessionToken = req.headers.authorization?.replace("Bearer ", "");

    if (sessionToken && sessionStore.has(sessionToken)) {
        const userSession = sessionStore.get(sessionToken);

        // Verificar si la sesión no ha expirado (24 horas)
        const now = new Date();
        const sessionAge = now - userSession.createdAt;
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas

        if (sessionAge > maxAge) {
            sessionStore.delete(sessionToken);
            return res.status(401).json({ error: "Sesión expirada" });
        }

        // Establecer req.user para que esté disponible en los controladores
        req.user = {
            id: userSession.id,
            username: userSession.username,
            email: userSession.email,
        };
        return next();
    }
    return res.status(401).json({ error: "No autenticado" });
};
