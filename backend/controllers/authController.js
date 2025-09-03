import { db } from "../db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

// Store de sesiones en memoria (en producción deberías usar Redis)
export const sessionStore = new Map();

// Generar token de sesión
function generateSessionToken() {
    return crypto.randomBytes(32).toString("hex");
}

// Controlador para registrar un nuevo usuario
export const registerUser = async (req, res) => {
    try {
        console.log("Body recibido en registro:", req.body);
        const { username, email, password, first_name, last_name } = req.body;
        if (!username || !email || !password) {
            return res
                .status(400)
                .json({ error: "Faltan campos obligatorios" });
        }

        // Verificar si el email ya existe
        const existingUser = await db.execute({
            sql: "SELECT * FROM users WHERE email = :email OR username = :username",
            args: { email: email, username: username },
        });
        if (existingUser.rows.length > 0) {
            return res
                .status(409)
                .json({ error: "El email o usuario ya está registrado" });
        }

        // Debug: Verificar la estructura de la tabla users
        const tableInfo = await db.execute("PRAGMA table_info(users)");
        console.log("Estructura de la tabla users:", tableInfo.rows);

        // Hashear la contraseña
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Logging de valores antes de insertar
        console.log("Valores para insertar:", {
            username,
            email,
            password_hash: password_hash ? "HASHEADA" : "VACIA",
            first_name: first_name || null,
            last_name: last_name || null,
        });

        // Insertar el nuevo usuario usando parámetros nombrados
        const result = await db.execute({
            sql: `INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES (:username, :email, :password_hash, :first_name, :last_name)`,
            args: {
                username: username,
                email: email,
                password_hash: password_hash,
                first_name: first_name || null,
                last_name: last_name || null,
            },
        });

        console.log("Insert result:", result);

        return res
            .status(201)
            .json({ message: "Usuario registrado exitosamente" });
    } catch (error) {
        console.error("Error en registro:", error);
        console.error("Stack completo:", error.stack);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Controlador para login de usuario
export const loginUser = async (req, res) => {
    try {
        console.log("Body recibido en login:", req.body);
        const { email, password } = req.body;
        if (!email || !password) {
            console.log("Faltan campos obligatorios");
            return res
                .status(400)
                .json({ error: "Faltan campos obligatorios" });
        }

        console.log("Buscando usuario con email:", email);
        const userResult = await db.execute({
            sql: "SELECT * FROM users WHERE email = :email",
            args: { email: email },
        });

        console.log(
            "Resultado de búsqueda:",
            userResult.rows.length,
            "usuarios encontrados"
        );
        if (userResult.rows.length === 0) {
            console.log("Usuario no encontrado para email:", email);
            return res
                .status(401)
                .json({ error: "Correo o contraseña incorrectos" });
        }

        const user = userResult.rows[0];
        console.log("Usuario encontrado:", {
            id: user.id,
            username: user.username,
            email: user.email,
        });

        const match = await bcrypt.compare(password, user.password_hash);
        console.log("Comparación de contraseña:", match);

        if (!match) {
            console.log("Contraseña no coincide para usuario:", user.email);
            return res
                .status(401)
                .json({ error: "Correo o contraseña incorrectos" });
        }

        // Generar token de sesión
        const sessionToken = generateSessionToken();
        const userSession = {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: new Date(),
        };

        // Guardar sesión en el store
        sessionStore.set(sessionToken, userSession);

        console.log("Login exitoso para usuario:", user.email);
        console.log("Token de sesión generado:", sessionToken);

        return res.json({
            message: "Inicio de sesión exitoso",
            user: userSession,
            sessionToken: sessionToken,
        });
    } catch (error) {
        console.error("Error en login:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Controlador para logout de usuario
export const logoutUser = (req, res) => {
    const sessionToken = req.headers.authorization?.replace("Bearer ", "");

    if (sessionToken && sessionStore.has(sessionToken)) {
        sessionStore.delete(sessionToken);
        return res.json({ message: "Sesión cerrada correctamente" });
    }

    return res.json({ message: "Sesión cerrada correctamente" });
};

// Controlador para verificar el estado de autenticación
export const checkAuth = (req, res) => {
    const sessionToken = req.headers.authorization?.replace("Bearer ", "");

    console.log("Verificando token:", sessionToken);
    console.log("Tokens en store:", Array.from(sessionStore.keys()));

    if (sessionToken && sessionStore.has(sessionToken)) {
        const userSession = sessionStore.get(sessionToken);

        // Verificar si la sesión no ha expirado (24 horas)
        const now = new Date();
        const sessionAge = now - userSession.createdAt;
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas

        if (sessionAge > maxAge) {
            sessionStore.delete(sessionToken);
            return res.json({ authenticated: false });
        }

        return res.json({
            authenticated: true,
            user: {
                id: userSession.id,
                username: userSession.username,
                email: userSession.email,
            },
        });
    } else {
        return res.json({
            authenticated: false,
        });
    }
};
