// Dashboard functionality for TurifyTasks
console.log('Dashboard script loaded');

// Variables globales
let allTasks = [];
let currentFilter = 'inbox';

// Inicializar dashboard cuando el DOM esté listo
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
