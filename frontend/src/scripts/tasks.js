// Crear o editar tarea
export async function submitTask(taskData) {
  if (!taskData.title || !taskData.title.trim()) throw new Error('El título es obligatorio');
  const isEdit = !!taskData.id;
  const url = isEdit
    ? `http://localhost:3000/api/tasks/${taskData.id}`
    : 'http://localhost:3000/api/tasks';
  const method = isEdit ? 'PUT' : 'POST';
  try {
    const response = await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (response.ok) {
      await loadTasks();
      showToast(isEdit ? 'Tarea actualizada' : 'Tarea creada', 'success');
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al guardar tarea');
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
// tasks.js - Lógica de tareas y helpers
import { showToast, escapeHtml } from './ui.js';

export let allTasks = [];
export let currentFilter = 'inbox';

export function getTaskDate(task) {
  const dateStr = task.dueDate || task.due_date || task.createdAt || task.created_at;
  return dateStr ? new Date(dateStr) : new Date();
}

export async function loadTasks() {
  const loadingState = document.getElementById('loadingState');
  if (loadingState) loadingState.style.display = 'block';
  try {
    const response = await fetch('http://localhost:3000/api/tasks', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.ok) {
      const data = await response.json();
      allTasks = data.data || [];
      updateTaskCounts();
      renderTasks();
    } else {
      showToast('Error al cargar tareas', 'error');
    }
  } catch (error) {
    console.error('Error cargando tareas:', error);
    showToast('Error de conexión', 'error');
  } finally {
    if (loadingState) loadingState.style.display = 'none';
  }
}

export function updateTaskCounts() {
  const today = new Date().toDateString();
  const counts = {
    inbox: allTasks.filter(task => !task.completed).length,
    today: allTasks.filter(task => {
      const taskDate = getTaskDate(task).toDateString();
      return taskDate === today && !task.completed;
    }).length,
    upcoming: allTasks.filter(task => {
      const taskDate = getTaskDate(task);
      return taskDate > new Date() && !task.completed;
    }).length,
    important: allTasks.filter(task => (task.priority === 'high' || task.priority === 'alta') && !task.completed).length,
    completed: allTasks.filter(task => task.completed).length
  };
  document.getElementById('inboxCount').textContent = counts.inbox;
  document.getElementById('todayCount').textContent = counts.today;
  document.getElementById('upcomingCount').textContent = counts.upcoming;
  document.getElementById('importantCount').textContent = counts.important;
  document.getElementById('completedCount').textContent = counts.completed;
}

export function filterTasks(filterType) {
  currentFilter = filterType;
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  const activeItem = document.querySelector(`[onclick="filterTasks('${filterType}')"]`);
  if (activeItem) activeItem.classList.add('active');
  const titles = {
    inbox: 'Bandeja de entrada',
    today: 'Tareas de hoy',
    upcoming: 'Próximas tareas',
    important: 'Tareas importantes',
    completed: 'Tareas completadas'
  };
  document.getElementById('pageTitle').textContent = titles[filterType];
  document.getElementById('sectionTitle').textContent = titles[filterType];
  renderTasks();
}

export function renderTasks() {
  const container = document.getElementById('tasksContainer');
  if (!container) return;
  const today = new Date().toDateString();
  let filteredTasks = [];
  switch (currentFilter) {
    case 'inbox':
      filteredTasks = allTasks.filter(task => !task.completed);
      break;
    case 'today':
      filteredTasks = allTasks.filter(task => {
        const taskDate = getTaskDate(task).toDateString();
        return taskDate === today && !task.completed;
      });
      break;
    case 'upcoming':
      filteredTasks = allTasks.filter(task => {
        const taskDate = getTaskDate(task);
        return taskDate > new Date() && !task.completed;
      });
      break;
    case 'important':
      filteredTasks = allTasks.filter(task => (task.priority === 'high' || task.priority === 'alta') && !task.completed);
      break;
    case 'completed':
      filteredTasks = allTasks.filter(task => task.completed);
      break;
    default:
      filteredTasks = allTasks;
  }
  const taskCounter = document.getElementById('taskCounter');
  const completedCount = filteredTasks.filter(task => task.completed).length;
  if (taskCounter) {
    taskCounter.textContent = `${completedCount}/${filteredTasks.length}`;
  }
  if (filteredTasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <p>No hay tareas en esta lista</p>
      </div>
    `;
    return;
  }
  container.innerHTML = filteredTasks.map(task => {
    const taskId = task._id || task.id;
    const isCompleted = task.completed ? 'completed' : '';
    const checkIcon = task.completed ? '✓' : '';
    const priorityText = getPriorityText(task.priority);
    const priorityClass = getPriorityClass(task.priority);
    return `
      <div class="task-card ${isCompleted}">
        <button class="task-checkbox" onclick="toggleTask('${taskId}')">
          ${checkIcon}
        </button>
        <div class="task-content">
          <h3 class="task-title${task.completed ? ' completed' : ''}">${escapeHtml(task.title)}</h3>
          ${task.description ? `<p class="task-desc${task.completed ? ' completed' : ''}">${escapeHtml(task.description)}</p>` : ''}
          <div class="task-meta">
            <span class="priority-badge ${priorityClass}">${priorityText}</span>
          </div>
        </div>
        <div class="task-actions">
          <button class="edit-btn" onclick="window.showTaskForm && window.showTaskForm('edit', JSON.parse('${JSON.stringify(task).replace(/\"/g, '&quot;').replace(/'/g, '&#39;')}'))">✏️</button>
          <button class="delete-btn js-delete-task" data-task-id="${taskId}">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

export function getPriorityText(priority) {
  switch (priority) {
    case 'high':
    case 'alta': return '🔴 Alta';
    case 'medium':
    case 'media': return '🟡 Media';
    default: return '🟢 Baja';
  }
}

export function getPriorityClass(priority) {
  switch (priority) {
    case 'high':
    case 'alta': return 'priority-high';
    case 'medium':
    case 'media': return 'priority-medium';
    default: return 'priority-low';
  }
}

export async function toggleTask(taskId) {
  const task = allTasks.find(t => String(t._id || t.id) === String(taskId));
  if (!task) return;
  const newState = !task.completed;
  task.completed = newState;
  updateTaskCounts();
  renderTasks();
  try {
    const response = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: newState })
    });
    if (response.ok) {
      showToast(newState ? 'Tarea completada' : 'Tarea pendiente', 'success');
    } else {
      throw new Error(`Error: ${response.status}`);
    }
  } catch (error) {
    console.error('Backend error:', error);
    task.completed = !newState;
    updateTaskCounts();
    renderTasks();
    showToast('Error al actualizar', 'error');
  }
}

export async function deleteTask(taskId) {
  console.log('[deleteTask] llamado con taskId:', taskId, typeof taskId);
  if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return;
  try {
    const response = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('[deleteTask] response status:', response.status);
    let result;
    try {
      result = await response.json();
      console.log('[deleteTask] response json:', result);
    } catch (e) {
      console.log('[deleteTask] no se pudo parsear JSON:', e);
    }
    if (response.ok) {
      // Forzar recarga desde backend para evitar inconsistencias
      await loadTasks();
      showToast('Tarea eliminada', 'success');
    } else {
      showToast(result?.error || 'Error al eliminar tarea', 'error');
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    showToast('Error de conexión', 'error');
  }
}

export function handleSearch(searchTerm) {
  renderTasks();
}

export function handlePriorityFilter() {
  renderTasks();
}

export function refreshTasks() {
  loadTasks();
  showToast('Tareas actualizadas', 'success');
}
