// tasks.js - Gestión de tareas y filtros
import { showToast } from './ui.js';

// Estado global para las tareas y filtros
export let allTasks = [];
export let currentFilter = 'inbox';

// Función para obtener el filtro actual
export function getCurrentFilter() {
  return currentFilter;
}

// Función para establecer el filtro actual
export function setCurrentFilter(filter) {
  currentFilter = filter;
}

// Función para pre-seleccionar la lista de tareas en el formulario
export async function populateTaskFormListSelector() {
  try {
    const response = await fetch('http://localhost:3000/api/task-lists', {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Error al cargar las listas de tareas');
    }

    const taskLists = await response.json();
    const listSelector = document.getElementById('task-list-selector');
    
    if (!listSelector) return;

    // Limpiar opciones existentes excepto la primera
    listSelector.innerHTML = '<option value="">Sin lista específica</option>';

    // Agregar las listas de tareas
    taskLists.forEach(list => {
      const option = document.createElement('option');
      option.value = list.id;
      option.textContent = list.name;
      listSelector.appendChild(option);
    });

    // Pre-seleccionar basado en el filtro actual
    const filter = getCurrentFilter();
    if (filter && filter !== 'inbox' && filter !== 'today' && filter !== 'overdue' && filter !== 'completed') {
      // Es un filtro de lista específica
      const listId = filter.replace('list-', '');
      listSelector.value = listId;
    }

  } catch (error) {
    console.error('Error al poblar selector de listas:', error);
    showToast('Error al cargar las listas de tareas', 'error');
  }
}

export async function submitTask(taskData) {
  try {
    const response = await fetch('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear la tarea');
    }

    const newTask = await response.json();
    allTasks.push(newTask);
    renderTasks();
    updateTaskCounts();
    showToast('Tarea creada exitosamente', 'success');
    
    return newTask;
  } catch (error) {
    console.error('Error al enviar tarea:', error);
    showToast(error.message, 'error');
    throw error;
  }
}

export function getTaskDate(task) {
  if (task.due_date) {
    try {
      const date = new Date(task.due_date);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (e) {
      console.warn('Invalid date format:', task.due_date);
    }
  }
  return null;
}

export function normalizeDateString(dateStr) {
  if (!dateStr) return null;
  
  try {
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0];
    }
    
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    console.warn('Error normalizing date:', dateStr, e);
  }
  
  return dateStr;
}

export function isTaskOverdue(task) {
  const taskDate = getTaskDate(task);
  if (!taskDate) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return taskDate < today && !task.completed;
}

export async function loadTasks() {
  try {
    console.log('[loadTasks] Iniciando carga de tareas...');
    console.log('[loadTasks] URL de fetch:', 'http://localhost:3000/api/tasks');
    
    const response = await fetch('http://localhost:3000/api/tasks', {
      credentials: 'include'
    });

    console.log('[loadTasks] Respuesta del servidor:', response.status);
    console.log('[loadTasks] Headers de respuesta:', [...response.headers.entries()]);

    if (!response.ok) {
      if (response.status === 401) {
        console.error('[loadTasks] No autenticado, redirigiendo...');
        window.location.href = '/login';
        return;
      }
      console.error('[loadTasks] Error en respuesta:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('[loadTasks] Contenido del error:', errorText);
      throw new Error('Error al cargar las tareas');
    }

    const tasks = await response.json();
    
    console.log('[loadTasks] Respuesta del servidor (raw):', tasks);
    console.log('[loadTasks] Tipo de respuesta:', typeof tasks);
    
    // Validar que la respuesta sea un array
    if (Array.isArray(tasks)) {
      allTasks = tasks;
    } else if (tasks && Array.isArray(tasks.tasks)) {
      // Si el servidor devuelve { tasks: [...] }
      allTasks = tasks.tasks;
    } else if (tasks && Array.isArray(tasks.data)) {
      // Si el servidor devuelve { data: [...] }
      allTasks = tasks.data;
    } else {
      // Si no es un array, inicializar como array vacío
      console.warn('[loadTasks] Respuesta no es un array, inicializando como array vacío');
      console.warn('[loadTasks] Estructura de respuesta:', Object.keys(tasks || {}));
      allTasks = [];
    }
    
    console.log('[loadTasks] Tareas procesadas:', allTasks.length);
    console.log('[loadTasks] allTasks es array:', Array.isArray(allTasks));
    console.log('[loadTasks] Contenido de allTasks:', allTasks);
    
    renderTasks();
    updateTaskCounts();
    
  } catch (error) {
    console.error('Error al cargar tareas:', error);
    showToast('Error al cargar las tareas', 'error');
  }
}

export function updateTaskCounts() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const counts = {
    inbox: 0,
    today: 0,
    overdue: 0,
    completed: 0
  };

  allTasks.forEach(task => {
    if (task.completed) {
      counts.completed++;
    } else {
      counts.inbox++;
      
      const taskDate = getTaskDate(task);
      if (taskDate) {
        if (taskDate.toDateString() === today.toDateString()) {
          counts.today++;
        } else if (taskDate < today) {
          counts.overdue++;
        }
      }
    }
  });

  // Actualizar los contadores en la UI
  Object.keys(counts).forEach(key => {
    const element = document.querySelector(`[data-filter="${key}"] .count`);
    if (element) {
      element.textContent = counts[key];
    }
  });
}

export function filterTasks(filterType) {
  currentFilter = filterType;
  console.log('[filterTasks] Aplicando filtro:', filterType);
  console.log('[filterTasks] allTasks es array:', Array.isArray(allTasks));
  console.log('[filterTasks] allTasks length:', allTasks ? allTasks.length : 'undefined');
  
  // Validar que allTasks sea un array
  if (!Array.isArray(allTasks)) {
    console.warn('[filterTasks] allTasks no es un array, inicializando como array vacío');
    allTasks = [];
    return [];
  }
  
  let filteredTasks = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (filterType) {
    case 'inbox':
      filteredTasks = allTasks.filter(task => !task.completed);
      break;
    case 'today':
      filteredTasks = allTasks.filter(task => {
        if (task.completed) return false;
        const taskDate = getTaskDate(task);
        return taskDate && taskDate.toDateString() === today.toDateString();
      });
      break;
    case 'overdue':
      filteredTasks = allTasks.filter(task => {
        if (task.completed) return false;
        return isTaskOverdue(task);
      });
      break;
    case 'completed':
      filteredTasks = allTasks.filter(task => task.completed);
      break;
    default:
      // Filtro por lista específica
      if (filterType.startsWith('list-')) {
        const listId = parseInt(filterType.replace('list-', ''));
        filteredTasks = allTasks.filter(task => 
          !task.completed && task.list_id === listId
        );
      } else {
        filteredTasks = allTasks.filter(task => !task.completed);
      }
  }

  console.log('[filterTasks] Tareas filtradas:', filteredTasks.length);
  return filteredTasks;
}

export function renderTasks() {
  console.log('[renderTasks] === INICIO DE RENDERIZADO ===');
  console.log('[renderTasks] Renderizando tareas para filtro:', currentFilter);
  console.log('[renderTasks] allTasks.length:', allTasks.length);
  
  const taskList = document.getElementById('tasksContainer');
  const loadingState = document.getElementById('loadingState');
  
  console.log('[renderTasks] Elemento tasksContainer encontrado:', !!taskList);
  console.log('[renderTasks] Elemento loadingState encontrado:', !!loadingState);
  
  if (!taskList) {
    console.warn('[renderTasks] Elemento tasksContainer no encontrado');
    console.warn('[renderTasks] Elementos disponibles con ID que contienen "task":', 
      Array.from(document.querySelectorAll('[id*="task"]')).map(el => el.id));
    return;
  }

  // Ocultar estado de carga
  if (loadingState) {
    console.log('[renderTasks] Ocultando estado de carga');
    loadingState.style.display = 'none';
  }

  let tasksToRender = filterTasks(currentFilter);
  console.log('[renderTasks] Tareas después del filtro:', tasksToRender.length);

  // Aplicar filtros adicionales (búsqueda y prioridad)
  if (searchTerm) {
    tasksToRender = tasksToRender.filter(task => 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  if (priorityFilter) {
    tasksToRender = tasksToRender.filter(task => task.priority === priorityFilter);
  }

  if (tasksToRender.length === 0) {
    taskList.innerHTML = `
      <div class="no-tasks">
        <p>No hay tareas para mostrar</p>
      </div>
    `;
    return;
  }

  // Ordenar las tareas por fecha de creación (más recientes primero)
  tasksToRender.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  taskList.innerHTML = tasksToRender.map(task => {
    const taskDate = getTaskDate(task);
    const isOverdue = isTaskOverdue(task);
    const dueDateHtml = getDueDateHtml(task.due_date);
    
    return `
      <div class="task-card ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-task-id="${task.id}">
        <input type="checkbox" class="task-checkbox ${task.completed ? 'completed' : ''}" 
               ${task.completed ? 'checked' : ''} 
               onchange="window.toggleTask(${task.id})">
        <div class="task-content">
          <h3 class="task-title ${task.completed ? 'completed' : ''}">${task.title}</h3>
          ${task.description ? `<p class="task-desc ${task.completed ? 'completed' : ''}">${task.description}</p>` : ''}
          <div class="task-meta">
            <span class="priority-badge ${getPriorityClass(task.priority)}">${getPriorityText(task.priority)}</span>
            ${task.list_name ? `<span class="task-list">📋 ${task.list_name}</span>` : ''}
            ${dueDateHtml}
          </div>
        </div>
        <div class="task-actions">
          <button class="edit-btn" onclick="window.showTaskForm('edit', ${JSON.stringify(task).replace(/"/g, '&quot;')})" title="Editar tarea">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2-2v-7"></path>
              <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="delete-btn" onclick="window.deleteTask(${task.id})" title="Eliminar tarea">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="m19,6v14a2,2 0 0 1-2,2H7a2,2 0 0 1-2-2V6m3,0V4a2,2 0 0 1 2-2h4a2,2 0 0 1 2,2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  console.log('[renderTasks] HTML generado, longitud:', taskList.innerHTML.length);
  console.log('[renderTasks] Renderizadas', tasksToRender.length, 'tareas');
}

export function getPriorityText(priority) {
  switch (priority) {
    case 'alta':
    case 'high':
      return 'Alta';
    case 'media':
    case 'medium':
      return 'Media';
    case 'baja':
    case 'low':
      return 'Baja';
    default:
      return 'Sin prioridad';
  }
}

export function getPriorityClass(priority) {
  switch (priority) {
    case 'alta':
    case 'high':
      return 'priority-alta';
    case 'media':
    case 'medium':
      return 'priority-media';
    case 'baja':
    case 'low':
      return 'priority-baja';
    default:
      return 'priority-baja';
  }
}

export async function toggleTask(taskId) {
  try {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error('Tarea no encontrada');
    }

    const response = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        completed: !task.completed
      })
    });

    if (!response.ok) {
      throw new Error('Error al actualizar la tarea');
    }

    // Actualizar la tarea localmente
    task.completed = !task.completed;
    renderTasks();
    updateTaskCounts();
    
    showToast(
      task.completed ? 'Tarea completada' : 'Tarea marcada como pendiente', 
      'success'
    );
    
  } catch (error) {
    console.error('Error al cambiar estado de tarea:', error);
    showToast(error.message, 'error');
  }
}

export async function deleteTask(taskId) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Error al eliminar la tarea');
    }

    // Remover la tarea del array local
    const taskIndex = allTasks.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
      allTasks.splice(taskIndex, 1);
    }

    renderTasks();
    updateTaskCounts();
    showToast('Tarea eliminada exitosamente', 'success');
    
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    showToast(error.message, 'error');
  }
}

// Variables para filtros de búsqueda y prioridad
export let searchTerm = '';
export let priorityFilter = '';

export function handleSearch(term) {
  searchTerm = term;
  console.log('[handleSearch] searchTerm:', searchTerm);
  renderTasks();
}

export function handlePriorityFilter() {
  const prioritySelect = document.getElementById('priorityFilter');
  priorityFilter = prioritySelect ? prioritySelect.value : '';
  console.log('[handlePriorityFilter] priorityFilter:', priorityFilter);
  renderTasks();
}

export function refreshTasks() {
  loadTasks();
  showToast('Tareas actualizadas', 'success');
}

// Funciones utilitarias para fechas límite
function getDueDateInfo(dueDateStr) {
  if (!dueDateStr) {
    return null;
  }

  const dueDate = new Date(dueDateStr);
  if (isNaN(dueDate.getTime())) {
    return null;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  
  const diffTime = dueDateOnly - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let status, urgencyClass, icon, timeText;
  
  if (diffDays < 0) {
    status = 'overdue';
    urgencyClass = 'overdue';
    icon = '⚠️';
    timeText = `Vencida hace ${Math.abs(diffDays)} día(s)`;
  } else if (diffDays === 0) {
    status = 'today';
    urgencyClass = 'urgent';
    icon = '🔥';
    timeText = 'Vence hoy';
  } else if (diffDays === 1) {
    status = 'tomorrow';
    urgencyClass = 'warning';
    icon = '⏰';
    timeText = 'Vence mañana';
  } else if (diffDays <= 7) {
    status = 'this-week';
    urgencyClass = 'warning';
    icon = '📅';
    timeText = `Vence en ${diffDays} días`;
  } else {
    status = 'future';
    urgencyClass = 'normal';
    icon = '📅';
    timeText = `Vence en ${diffDays} días`;
  }

  return {
    status,
    urgencyClass,
    icon,
    timeText,
    formattedDate: dueDate.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  };
}

function getDueDateHtml(dueDateStr) {
  const dueDateInfo = getDueDateInfo(dueDateStr);
  
  if (!dueDateInfo) {
    return '';
  }
  
  return `
    <div class="due-date-container ${dueDateInfo.urgencyClass}">
      <div class="due-date-main">
        <span class="due-date-icon" title="Estado: ${dueDateInfo.status}">
          ${dueDateInfo.icon}
        </span>
        <div class="due-date-text">
          <span class="due-date-label">Fecha límite:</span>
          <span class="due-date-value" title="${dueDateInfo.formattedDate}">
            ${dueDateInfo.formattedDate}
          </span>
        </div>
      </div>
      <div class="time-remaining ${dueDateInfo.urgencyClass}">
        <span class="time-remaining-text">
          ${dueDateInfo.timeText}
        </span>
      </div>
    </div>
  `;
}