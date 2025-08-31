// Dashboard functionality for TurifyTasks
console.log('Dashboard script loaded');

// Variables globales
let allTasks = [];
let currentFilter = 'inbox';

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded - Dashboard iniciando');
    initializeDashboard();
});

function initializeDashboard() {
    console.log('Inicializando dashboard...');
    
    // Cargar tareas de ejemplo inmediatamente
    loadSampleTasks();
    
    // Verificar autenticación en segundo plano
    setTimeout(() => {
        checkAuthentication();
    }, 500);
}

async function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    console.log('Verificando autenticación. Token:', token ? 'Presente' : 'Ausente');
    
    if (!token) {
        console.log('Sin token - modo demo');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('Autenticación válida - cargando tareas reales');
            await loadTasks();
        } else {
            console.log('Token inválido - continuando en modo demo');
        }
    } catch (error) {
        console.log('Error de conexión - continuando en modo demo');
    }
}

async function loadTasks() {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch('http://localhost:3000/api/tasks', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            allTasks = data.tasks || data || [];
            console.log('Tareas cargadas desde BD:', allTasks.length);
            updateTaskCounts();
            renderTasks();
        } else {
            console.log('Error cargando tareas, manteniendo modo demo');
        }
    } catch (error) {
        console.log('Error de red, manteniendo modo demo');
    }
}

function loadSampleTasks() {
    console.log('Cargando tareas de ejemplo');
    
    allTasks = [
        {
            _id: '1',
            title: 'Revisar documentación del proyecto',
            description: 'Leer la documentación completa de TurifyTasks',
            completed: false,
            priority: 'high',
            dueDate: new Date().toISOString()
        },
        {
            _id: '2',
            title: 'Configurar base de datos',
            description: 'Establecer conexión con Turso SQLite',
            completed: false,
            priority: 'medium',
            dueDate: new Date().toISOString()
        },
        {
            _id: '3',
            title: 'Implementar autenticación',
            description: 'Sistema de login con JWT tokens',
            completed: true,
            priority: 'high',
            dueDate: new Date(Date.now() - 86400000).toISOString()
        }
    ];
    
    console.log('Tareas de ejemplo cargadas:', allTasks.length);
    updateTaskCounts();
    renderTasks();
}

function updateTaskCounts() {
    console.log('Actualizando contadores...');
    const today = new Date().toDateString();
    
    const counts = {
        inbox: allTasks.filter(task => !task.completed).length,
        today: allTasks.filter(task => {
            const taskDate = new Date(task.dueDate || task.createdAt).toDateString();
            return taskDate === today && !task.completed;
        }).length,
        upcoming: allTasks.filter(task => {
            const taskDate = new Date(task.dueDate || task.createdAt);
            return taskDate > new Date() && !task.completed;
        }).length,
        important: allTasks.filter(task => task.priority === 'high' && !task.completed).length,
        completed: allTasks.filter(task => task.completed).length
    };

    console.log('Contadores calculados:', counts);

    // Actualizar elementos si existen
    const elements = {
        inboxCount: document.getElementById('inboxCount'),
        todayCount: document.getElementById('todayCount'),
        upcomingCount: document.getElementById('upcomingCount'),
        importantCount: document.getElementById('importantCount'),
        completedCount: document.getElementById('completedCount')
    };

    Object.keys(counts).forEach(key => {
        const elementKey = key + 'Count';
        if (elements[elementKey]) {
            elements[elementKey].textContent = counts[key];
        }
    });
}

function filterTasks(filterType) {
    console.log('Filtrando tareas:', filterType);
    currentFilter = filterType;
    
    // Actualizar sidebar activo
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.closest('.sidebar-item').classList.add('active');
    }

    // Actualizar títulos
    const titles = {
        inbox: 'Bandeja de entrada',
        today: 'Tareas de hoy',
        upcoming: 'Próximas tareas',
        important: 'Tareas importantes',
        completed: 'Tareas completadas'
    };

    const pageTitle = document.getElementById('pageTitle');
    const sectionTitle = document.getElementById('sectionTitle');
    
    if (pageTitle) pageTitle.textContent = titles[filterType];
    if (sectionTitle) sectionTitle.textContent = titles[filterType];

    renderTasks();
}

function renderTasks() {
    console.log('Renderizando tareas para filtro:', currentFilter);
    
    const container = document.getElementById('tasksContainer');
    if (!container) {
        console.error('Contenedor de tareas no encontrado');
        return;
    }

    const today = new Date().toDateString();
    let filteredTasks = [];

    switch (currentFilter) {
        case 'inbox':
            filteredTasks = allTasks.filter(task => !task.completed);
            break;
        case 'today':
            filteredTasks = allTasks.filter(task => {
                const taskDate = new Date(task.dueDate || task.createdAt).toDateString();
                return taskDate === today && !task.completed;
            });
            break;
        case 'upcoming':
            filteredTasks = allTasks.filter(task => {
                const taskDate = new Date(task.dueDate || task.createdAt);
                return taskDate > new Date() && !task.completed;
            });
            break;
        case 'important':
            filteredTasks = allTasks.filter(task => task.priority === 'high' && !task.completed);
            break;
        case 'completed':
            filteredTasks = allTasks.filter(task => task.completed);
            break;
        default:
            filteredTasks = allTasks;
    }

    console.log('Tareas filtradas:', filteredTasks.length);

    // Actualizar contador
    const completedCount = filteredTasks.filter(task => task.completed).length;
    const totalCount = filteredTasks.length;
    const taskCounter = document.getElementById('taskCounter');
    if (taskCounter) {
        taskCounter.textContent = `${completedCount}/${totalCount}`;
    }

    if (filteredTasks.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay tareas en esta lista</div>';
        return;
    }

    const tasksHtml = filteredTasks.map(task => `
        <div class="task-card ${task.completed ? 'completed' : ''}">
            <div class="task-card-content">
                <button class="task-checkbox ${task.completed ? 'completed' : ''}" 
                        onclick="toggleTask('${task._id || task.id}')">
                    ${task.completed ? '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' : ''}
                </button>
                
                <div class="task-details">
                    <div class="task-header">
                        <h3 class="task-title ${task.completed ? 'completed' : ''}">${escapeHtml(task.title)}</h3>
                    </div>
                    
                    ${task.description ? `<p class="task-description ${task.completed ? 'completed' : ''}">${escapeHtml(task.description)}</p>` : ''}
                    
                    <div class="task-footer">
                        <div class="task-badges">
                            <div class="priority-badge ${task.priority}">
                                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                </svg>
                                ${task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = tasksHtml;
    console.log('Tareas renderizadas exitosamente');
}

async function toggleTask(taskId) {
    console.log('Cambiando estado de tarea:', taskId);
    const task = allTasks.find(t => (t._id || t.id) === taskId);
    if (!task) return;

    task.completed = !task.completed;
    updateTaskCounts();
    renderTasks();

    // Intentar actualizar en el backend si hay token válido
    const token = localStorage.getItem('authToken');
    if (token && !token.startsWith('test-token')) {
        try {
            await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(task)
            });
            console.log('Tarea actualizada en backend');
        } catch (error) {
            console.log('Error actualizando en BD, continuando en modo local');
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function logout() {
    localStorage.removeItem('authToken');
    if (confirm('¿Deseas ir al login?')) {
        window.location.href = '/login';
    } else {
        location.reload();
    }
}

// Hacer las funciones disponibles globalmente
window.filterTasks = filterTasks;
window.toggleTask = toggleTask;
window.logout = logout;

console.log('Dashboard script completamente cargado');



/**
 * Verifica si el usuario está autenticado
 * Redirige al login si no lo está
 */
async function checkAuthentication() {
    console.log('🔍 Iniciando verificación de autenticación...');
    
    try {
        const token = localStorage.getItem('authToken');
        console.log('🔑 Token encontrado:', token ? 'SÍ (longitud: ' + token.length + ')' : 'NO');
        
        if (!token) {
            // Si no hay token, mostrar mensaje y permitir continuar en modo demo
            console.log('❌ No hay token de autenticación');
            showError('No hay sesión activa. Inicia sesión para ver tus tareas.');
            loadSampleTasks(); // Cargar tareas de ejemplo
            return;
        }

        console.log('🌐 Realizando llamada al backend para verificar perfil...');
        const response = await fetch('http://localhost:3000/api/auth/profile', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Respuesta del backend:', response.status, response.statusText);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Autenticación exitosa:', data.user);
            const userEmailElement = document.getElementById('userEmail');
            if (userEmailElement && data.user?.email) {
                userEmailElement.textContent = data.user.email;
            }
            // Si la autenticación es exitosa, cargar las tareas
            console.log('📋 Cargando tareas desde la base de datos...');
            await loadTasks();
        } else if (response.status === 401) {
            // Token expirado o inválido
            console.log('🔒 Token inválido o expirado');
            localStorage.removeItem('authToken');
            showError('Sesión expirada. Por favor, inicia sesión nuevamente.');
            loadSampleTasks(); // Mostrar tareas de ejemplo mientras tanto
        } else {
            console.log('⚠️ Error en autenticación:', response.status);
            showError('Error de autenticación. Mostrando datos de ejemplo.');
            loadSampleTasks();
        }
    } catch (error) {
        console.error('💥 Error verificando autenticación:', error);
        showError('Error de conexión con el servidor. Mostrando datos de ejemplo.');
        loadSampleTasks(); // Mostrar tareas de ejemplo si hay error de red
    }
}

/**
 * Carga las tareas desde el backend
 * Incluye el token de autenticación en el header
 */
async function loadTasks() {
    try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            console.log('No hay token para cargar tareas');
            showError('No hay sesión activa para cargar tareas.');
            loadSampleTasks();
            return;
        }

        console.log('Cargando tareas desde la base de datos...');
        const response = await fetch('http://localhost:3000/api/tasks', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Tareas cargadas exitosamente:', data);
            allTasks = data.tasks || data || [];
            
            // Si no hay tareas, crear algunas de ejemplo
            if (allTasks.length === 0) {
                console.log('No hay tareas en la base de datos');
                showError('No tienes tareas aún. ¡Crea tu primera tarea!');
                allTasks = []; // Array vacío para mostrar estado vacío
            }
            
            updateTaskCounts();
            renderTasks();
        } else if (response.status === 401) {
            // Token expirado o inválido
            console.log('Token expirado, mostrando tareas de ejemplo');
            localStorage.removeItem('authToken');
            showError('Sesión expirada. Mostrando datos de ejemplo.');
            loadSampleTasks();
        } else {
            console.log('Error en respuesta:', response.status);
            showError(`Error al cargar tareas (${response.status}). Mostrando datos de ejemplo.`);
            loadSampleTasks();
        }
    } catch (error) {
        console.error('Error cargando tareas:', error);
        showError('Error de conexión. Mostrando datos de ejemplo.');
        loadSampleTasks();
    }
}

/**
 * Actualiza los contadores de tareas en la barra lateral
 */
function updateTaskCounts() {
    const today = new Date().toDateString();
    
    const counts = {
        inbox: allTasks.filter(task => !task.completed).length,
        today: allTasks.filter(task => {
            const taskDate = new Date(task.dueDate || task.createdAt).toDateString();
            return taskDate === today && !task.completed;
        }).length,
        upcoming: allTasks.filter(task => {
            const taskDate = new Date(task.dueDate || task.createdAt);
            return taskDate > new Date() && !task.completed;
        }).length,
        important: allTasks.filter(task => task.priority === 'high' && !task.completed).length,
        completed: allTasks.filter(task => task.completed).length
    };

    // Actualizar contadores en la UI
    const counters = [
        { id: 'inboxCount', value: counts.inbox },
        { id: 'todayCount', value: counts.today },
        { id: 'upcomingCount', value: counts.upcoming },
        { id: 'importantCount', value: counts.important },
        { id: 'completedCount', value: counts.completed }
    ];

    counters.forEach(counter => {
        const element = document.getElementById(counter.id);
        if (element) {
            element.textContent = counter.value;
        }
    });
}

/**
 * Filtra las tareas por categoría
 * @param {string} filterType - Tipo de filtro: inbox, today, upcoming, important, completed
 */
function filterTasks(filterType) {
    currentFilter = filterType;
    
    // Actualizar sidebar activo
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Encontrar el elemento clickeado y marcarlo como activo
    const clickedElement = event?.target?.closest?.('.sidebar-item');
    if (clickedElement) {
        clickedElement.classList.add('active');
    }

    // Actualizar títulos
    const titles = {
        inbox: 'Bandeja de entrada',
        today: 'Tareas de hoy',
        upcoming: 'Próximas tareas',
        important: 'Tareas importantes',
        completed: 'Tareas completadas'
    };

    const pageTitle = document.getElementById('pageTitle');
    const sectionTitle = document.getElementById('sectionTitle');
    
    if (pageTitle && titles[filterType]) {
        pageTitle.textContent = titles[filterType];
    }
    if (sectionTitle && titles[filterType]) {
        sectionTitle.textContent = titles[filterType];
    }

    renderTasks();
}

/**
 * Renderiza las tareas filtradas en la UI
 */
function renderTasks() {
    const container = document.getElementById('tasksContainer');
    if (!container) return;

    const today = new Date().toDateString();
    let filteredTasks = [];

    // Aplicar filtros según la categoría seleccionada
    switch (currentFilter) {
        case 'inbox':
            filteredTasks = allTasks.filter(task => !task.completed);
            break;
        case 'today':
            filteredTasks = allTasks.filter(task => {
                const taskDate = new Date(task.dueDate || task.createdAt).toDateString();
                return taskDate === today && !task.completed;
            });
            break;
        case 'upcoming':
            filteredTasks = allTasks.filter(task => {
                const taskDate = new Date(task.dueDate || task.createdAt);
                return taskDate > new Date() && !task.completed;
            });
            break;
        case 'important':
            filteredTasks = allTasks.filter(task => task.priority === 'high' && !task.completed);
            break;
        case 'completed':
            filteredTasks = allTasks.filter(task => task.completed);
            break;
        default:
            filteredTasks = allTasks;
    }

    // Mostrar estado vacío si no hay tareas
    if (filteredTasks.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay tareas en esta categoría</div>';
        return;
    }

    // Generar HTML para las tareas
    const tasksHtml = `
        <ul class="tasks-list">
            ${filteredTasks.map(task => `
                <li class="task-item">
                    <div class="task-checkbox ${task.completed ? 'completed' : ''}" 
                         onclick="toggleTask('${task._id || task.id}')"></div>
                    <div class="task-content">
                        <div class="task-title">${escapeHtml(task.title)}</div>
                        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                    </div>
                    ${task.dueDate ? `<div class="task-date">${formatDate(task.dueDate)}</div>` : ''}
                </li>
            `).join('')}
        </ul>
    `;

    container.innerHTML = tasksHtml;
}

/**
 * Alterna el estado de completado de una tarea
 * @param {string} taskId - ID de la tarea a actualizar
 */
async function toggleTask(taskId) {
    try {
        const token = localStorage.getItem('authToken');
        const task = allTasks.find(t => (t._id || t.id) === taskId);
        
        if (!task || !token) return;

        const response = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...task,
                completed: !task.completed
            })
        });

        if (response.ok) {
            // Actualizar la tarea localmente
            task.completed = !task.completed;
            updateTaskCounts();
            renderTasks();
        } else if (response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        } else {
            throw new Error('Error al actualizar la tarea');
        }
    } catch (error) {
        console.error('Error actualizando tarea:', error);
        showError('Error al actualizar la tarea');
    }
}

/**
 * Muestra un mensaje de error temporal
 * @param {string} message - Mensaje a mostrar
 */
function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.innerHTML = `<div class="error-message">${message}</div>`;
        setTimeout(() => {
            errorContainer.innerHTML = '';
        }, 5000);
    }
}

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Formatea una fecha para mostrarla de forma amigable
 * @param {string} dateString - Fecha en formato string
 * @returns {string} Fecha formateada
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Mañana';
    } else {
        return date.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short' 
        });
    }
}

/**
 * Cierra la sesión del usuario
 */
async function logout() {
    try {
        const token = localStorage.getItem('authToken');
        if (token) {
            await fetch('http://localhost:3000/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    } finally {
        // Limpiar token local
        localStorage.removeItem('authToken');
        // Preguntar antes de redirigir
        if (confirm('¿Deseas salir del dashboard?')) {
            window.location.href = '/login';
        } else {
            // Recargar el dashboard en modo demo
            location.reload();
        }
    }
}

/**
 * Carga tareas de ejemplo cuando no hay conexión a la base de datos
 */
function loadSampleTasks() {
    console.log('Cargando tareas de ejemplo (modo demo)');
    allTasks = [
        {
            _id: '1',
            title: 'Revisar documentación del proyecto',
            description: 'Leer la documentación completa de TurifyTasks',
            completed: false,
            priority: 'high',
            dueDate: new Date().toISOString()
        },
        {
            _id: '2',
            title: 'Configurar base de datos',
            description: 'Establecer conexión con Turso SQLite',
            completed: false,
            priority: 'medium',
            dueDate: new Date().toISOString()
        },
        {
            _id: '3',
            title: 'Implementar autenticación',
            description: 'Sistema de login con JWT tokens',
            completed: true,
            priority: 'high',
            dueDate: new Date(Date.now() - 86400000).toISOString() // Ayer
        },
        {
            _id: '4',
            title: 'Diseñar interfaz de usuario',
            description: 'Crear dashboard responsivo y moderno',
            completed: true,
            priority: 'medium',
            dueDate: new Date(Date.now() - 86400000).toISOString() // Ayer
        }
    ];
    
    updateTaskCounts();
    renderTasks();
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Inicialización del dashboard
    console.log('Dashboard inicializado');
});

// Hacer las funciones disponibles globalmente para el HTML
window.filterTasks = filterTasks;
window.toggleTask = toggleTask;
window.logout = logout;
