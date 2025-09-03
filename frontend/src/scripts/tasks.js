// tasks.js - Gestión de tareas y filtros con nanostores
import { showToast } from "./ui.js";
import { apiRequest, API_CONFIG } from "../config/api.js";
import {
    allTasks,
    currentFilter,
    searchTerm,
    priorityFilter,
    filteredTasks,
    taskCounts,
    taskActions,
    isLoading,
} from "../stores/taskStore.js";

// Función para obtener el filtro actual
export function getCurrentFilter() {
    return currentFilter.get();
}

// Función para establecer el filtro actual
export function setCurrentFilter(filter) {
    taskActions.setFilter(filter);
}

// Función para pre-seleccionar la lista de tareas en el formulario
export async function populateTaskFormListSelector(preselectedListId = null) {
    try {
        const response = await apiRequest(API_CONFIG.ENDPOINTS.TASK_LISTS.BASE);

        if (!response.ok) {
            throw new Error("Error al cargar las listas de tareas");
        }

        const taskLists = await response.json();
        const listSelector = document.getElementById("task-list-selector");

        if (!listSelector) return;

        // Limpiar opciones existentes excepto la primera
        listSelector.innerHTML =
            '<option value="">Sin lista específica</option>';

        // Agregar las listas de tareas
        taskLists.forEach((list) => {
            const option = document.createElement("option");
            option.value = list.id;
            option.textContent = list.name;
            listSelector.appendChild(option);
        });

        // Si se especifica una lista para pre-seleccionar, usarla
        if (preselectedListId) {
            listSelector.value = preselectedListId;
        } else {
            // Pre-seleccionar basado en el filtro actual
            const filter = getCurrentFilter();
            if (
                filter &&
                filter !== "inbox" &&
                filter !== "today" &&
                filter !== "overdue" &&
                filter !== "completed"
            ) {
                // Es un filtro de lista específica
                const listId = filter.replace("list-", "");
                listSelector.value = listId;
            }
        }
    } catch (error) {
        console.error("Error al poblar selector de listas:", error);
        showToast("Error al cargar las listas de tareas", "error");
    }
}

export async function submitTask(taskData) {
    try {
        const isEdit = taskData.id && taskData.id.toString().trim() !== "";
        const method = isEdit ? "PUT" : "POST";
        const endpoint = isEdit
            ? `${API_CONFIG.ENDPOINTS.TASKS.BASE}/${taskData.id}`
            : API_CONFIG.ENDPOINTS.TASKS.BASE;

        console.log("[submitTask] Modo:", isEdit ? "edición" : "creación");
        console.log("[submitTask] Endpoint:", endpoint);
        console.log("[submitTask] Datos originales:", taskData);

        // Limpiar los datos antes de enviar
        const cleanedData = { ...taskData };

        // Convertir list_id vacío a null
        if (cleanedData.list_id === "" || cleanedData.list_id === "0") {
            cleanedData.list_id = null;
        } else if (cleanedData.list_id) {
            cleanedData.list_id = parseInt(cleanedData.list_id);
        }

        // Limpiar campos vacíos
        if (cleanedData.description === "") {
            cleanedData.description = null;
        }

        if (cleanedData.due_date === "") {
            cleanedData.due_date = null;
        }

        console.log("[submitTask] Datos limpiados:", cleanedData);

        const response = await apiRequest(endpoint, {
            method: method,
            body: JSON.stringify(cleanedData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.error ||
                    `Error al ${isEdit ? "actualizar" : "crear"} la tarea`
            );
        }

        const taskResponse = await response.json();
        console.log("[submitTask] Respuesta del servidor:", taskResponse);

        // Extraer la tarea de la respuesta del servidor
        const taskResult = taskResponse.data || taskResponse;

        if (isEdit) {
            // Actualizar tarea existente
            const taskIdNumber = parseInt(taskData.id);
            taskActions.updateTask(taskIdNumber, taskResult);
            showToast("Tarea actualizada exitosamente", "success");
        } else {
            // Agregar nueva tarea
            taskActions.addTask(taskResult);
            showToast("Tarea creada exitosamente", "success");
        }

        return taskResult;
    } catch (error) {
        console.error("Error al enviar tarea:", error);
        showToast(error.message, "error");
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
            console.warn("Invalid date format:", task.due_date);
        }
    }
    return null;
}

export function normalizeDateString(dateStr) {
    if (!dateStr) return null;

    try {
        if (dateStr.includes("T")) {
            return dateStr.split("T")[0];
        }

        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split("T")[0];
        }
    } catch (e) {
        console.warn("Error normalizing date:", dateStr, e);
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
        console.log("[loadTasks] Iniciando carga de tareas...");
        taskActions.setLoading(true);

        const response = await apiRequest(API_CONFIG.ENDPOINTS.TASKS.BASE);

        console.log("[loadTasks] Respuesta del servidor:", response.status);

        if (!response.ok) {
            if (response.status === 401) {
                console.error(
                    "[loadTasks] No autenticado, limpiando cache y redirigiendo..."
                );
                // Limpiar cache de autenticación cuando recibimos 401
                window.authCache = null;
                window.location.href = "/login";
                return;
            }
            throw new Error("Error al cargar las tareas");
        }

        const tasks = await response.json();
        console.log("[loadTasks] Respuesta del servidor (raw):", tasks);

        // Validar que la respuesta sea un array
        let tasksArray = [];
        if (Array.isArray(tasks)) {
            tasksArray = tasks;
        } else if (tasks && Array.isArray(tasks.tasks)) {
            tasksArray = tasks.tasks;
        } else if (tasks && Array.isArray(tasks.data)) {
            tasksArray = tasks.data;
        } else {
            console.warn(
                "[loadTasks] Respuesta no es un array, inicializando como array vacío"
            );
            tasksArray = [];
        }

        taskActions.setTasks(tasksArray);
        console.log("[loadTasks] Tareas cargadas:", tasksArray.length);

        // Forzar renderizado inicial ya que las suscripciones pueden no ejecutarse
        setTimeout(() => renderTasks(), 0);
    } catch (error) {
        console.error("Error al cargar tareas:", error);
        showToast("Error al cargar las tareas", "error");
    } finally {
        taskActions.setLoading(false);
    }
}

export function updateTaskCounts() {
    // Los contadores ahora se calculan automáticamente con los computed stores
    const counts = taskCounts.get();

    // Actualizar los contadores en la UI
    Object.keys(counts).forEach((key) => {
        const element = document.querySelector(
            `[data-filter="${key}"] .sidebar-item-count`
        );
        if (element) {
            element.textContent = counts[key];
        }
    });
}

export function filterTasks(filterType) {
    taskActions.setFilter(filterType);

    // Actualizar UI de navegación
    updateActiveFilter(filterType);

    // Actualizar títulos
    updatePageTitles(filterType);

    // Actualizar contadores
    updateTaskCounts();

    // No es necesario llamar renderTasks() aquí porque
    // las suscripciones se encargarán automáticamente
}

// Función para actualizar el elemento activo del sidebar
function updateActiveFilter(filterType) {
    // Remover clase activa de todos los elementos
    document.querySelectorAll(".sidebar-item").forEach((item) => {
        item.classList.remove("active");
    });

    // Agregar clase activa al elemento seleccionado
    const activeElement = document.querySelector(
        `[data-filter="${filterType}"]`
    );
    if (activeElement) {
        activeElement.classList.add("active");
    }
}

// Función para actualizar los títulos de la página
function updatePageTitles(filterType) {
    const titles = {
        inbox: "Bandeja de entrada",
        today: "Tareas de hoy",
        upcoming: "Próximas tareas",
        important: "Tareas importantes",
        overdue: "Tareas vencidas",
        completed: "Tareas completadas",
    };

    const pageTitle = document.getElementById("pageTitle");
    const sectionTitle = document.getElementById("sectionTitle");

    let title = titles[filterType];

    // Si es un filtro de lista específica, obtener el nombre de la lista
    if (filterType.startsWith("list-")) {
        title = "Lista de Tareas"; // Esto se puede mejorar obteniendo el nombre real de la lista
    }

    if (pageTitle) pageTitle.textContent = title || "Tareas";
    if (sectionTitle) sectionTitle.textContent = title || "Tareas";
}

export function renderTasks() {
    console.log("[renderTasks] === INICIO DE RENDERIZADO ===");

    const taskList = document.getElementById("tasksContainer");
    const loadingState = document.getElementById("loadingState");

    if (!taskList) {
        console.warn("[renderTasks] Elemento tasksContainer no encontrado");
        return;
    }

    // Verificar estado de carga
    const loading = isLoading.get();
    console.log("[renderTasks] Estado de carga:", loading);

    if (loadingState) {
        loadingState.style.display = loading ? "block" : "none";
    }

    // Si está cargando, no renderizar tareas aún
    if (loading) {
        console.log("[renderTasks] Todavía cargando, esperando...");
        return;
    }

    // Obtener tareas filtradas desde el store
    const tasksToRender = filteredTasks.get();
    console.log("[renderTasks] Tareas a renderizar:", tasksToRender.length);

    if (tasksToRender.length === 0) {
        taskList.innerHTML = `
      <div class="no-tasks">
        <p>No hay tareas para mostrar</p>
      </div>
    `;
        return;
    }

    // Ordenar las tareas por fecha de creación (más recientes primero)
    const sortedTasks = [...tasksToRender].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    taskList.innerHTML = sortedTasks
        .map((task) => {
            const taskDate = getTaskDate(task);
            const isOverdue = isTaskOverdue(task);
            const dueDateHtml = getDueDateHtml(task.due_date);

            return `
      <div class="task-card ${task.completed ? "completed" : ""} ${
                isOverdue ? "overdue" : ""
            }" data-task-id="${task.id}">
        <input type="checkbox" class="task-checkbox ${
            task.completed ? "completed" : ""
        }" 
               ${task.completed ? "checked" : ""} 
               onchange="window.toggleTask(${task.id})">
        <div class="task-content">
          <h3 class="task-title ${task.completed ? "completed" : ""}">${
                task.title
            }</h3>
          ${
              task.description
                  ? `<p class="task-desc ${
                        task.completed ? "completed" : ""
                    }">${task.description}</p>`
                  : ""
          }
          <div class="task-meta">
            <span class="priority-badge ${getPriorityClass(
                task.priority
            )}">${getPriorityText(task.priority)}</span>
            ${
                task.list_name
                    ? `<span class="task-list">📋 ${task.list_name}</span>`
                    : ""
            }
            ${dueDateHtml}
          </div>
        </div>
        <div class="task-actions">
          <button class="edit-btn" onclick="window.showTaskForm('edit', ${JSON.stringify(
              task
          ).replace(/"/g, "&quot;")})" title="Editar tarea">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2-2v-7"></path>
              <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="delete-btn" onclick="window.deleteTask(${
              task.id
          })" title="Eliminar tarea">
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
        })
        .join("");

    console.log("[renderTasks] Renderizadas", sortedTasks.length, "tareas");
}

export function getPriorityText(priority) {
    switch (priority) {
        case "alta":
        case "high":
            return "Alta";
        case "media":
        case "medium":
            return "Media";
        case "baja":
        case "low":
            return "Baja";
        default:
            return "Sin prioridad";
    }
}

export function getPriorityClass(priority) {
    switch (priority) {
        case "alta":
        case "high":
            return "priority-alta";
        case "media":
        case "medium":
            return "priority-media";
        case "baja":
        case "low":
            return "priority-baja";
        default:
            return "priority-baja";
    }
}

export async function toggleTask(taskId) {
    try {
        const task = allTasks.get().find((t) => t.id === taskId);
        if (!task) {
            throw new Error("Tarea no encontrada");
        }

        const response = await apiRequest(
            `${API_CONFIG.ENDPOINTS.TASKS.BASE}/${taskId}`,
            {
                method: "PUT",
                body: JSON.stringify({
                    completed: !task.completed,
                }),
            }
        );

        if (!response.ok) {
            throw new Error("Error al actualizar la tarea");
        }

        // Actualizar la tarea usando el store
        taskActions.updateTask(taskId, { completed: !task.completed });

        showToast(
            !task.completed
                ? "Tarea completada"
                : "Tarea marcada como pendiente",
            "success"
        );
    } catch (error) {
        console.error("Error al cambiar estado de tarea:", error);
        showToast(error.message, "error");
    }
}

export async function deleteTask(taskId) {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
        return;
    }

    try {
        const response = await apiRequest(
            `${API_CONFIG.ENDPOINTS.TASKS.BASE}/${taskId}`,
            {
                method: "DELETE",
            }
        );

        if (!response.ok) {
            throw new Error("Error al eliminar la tarea");
        }

        // Remover la tarea usando el store
        taskActions.removeTask(taskId);
        showToast("Tarea eliminada exitosamente", "success");
    } catch (error) {
        console.error("Error al eliminar tarea:", error);
        showToast(error.message, "error");
    }
}

// Funciones para manejar búsqueda y filtros
export function handleSearch(term) {
    taskActions.setSearch(term);
    console.log("[handleSearch] searchTerm:", term);
    // No necesitamos llamar renderTasks() porque las suscripciones se encargan
}

export function handlePriorityFilter() {
    const prioritySelect = document.getElementById("priorityFilter");
    const priority = prioritySelect ? prioritySelect.value : "";
    taskActions.setPriorityFilter(priority);
    console.log("[handlePriorityFilter] priorityFilter:", priority);
    // No necesitamos llamar renderTasks() porque las suscripciones se encargan
}

export function refreshTasks() {
    loadTasks();
    showToast("Tareas actualizadas", "success");
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

    const dueDateOnly = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate()
    );

    const diffTime = dueDateOnly - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let status, urgencyClass, icon, timeText;

    if (diffDays < 0) {
        status = "overdue";
        urgencyClass = "overdue";
        icon = "⚠️";
        timeText = `Vencida hace ${Math.abs(diffDays)} día(s)`;
    } else if (diffDays === 0) {
        status = "today";
        urgencyClass = "urgent";
        icon = "🔥";
        timeText = "Vence hoy";
    } else if (diffDays === 1) {
        status = "tomorrow";
        urgencyClass = "warning";
        icon = "⏰";
        timeText = "Vence mañana";
    } else if (diffDays <= 7) {
        status = "this-week";
        urgencyClass = "warning";
        icon = "📅";
        timeText = `Vence en ${diffDays} días`;
    } else {
        status = "future";
        urgencyClass = "normal";
        icon = "📅";
        timeText = `Vence en ${diffDays} días`;
    }

    return {
        status,
        urgencyClass,
        icon,
        timeText,
        formattedDate: dueDate.toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }),
    };
}

function getDueDateHtml(dueDateStr) {
    const dueDateInfo = getDueDateInfo(dueDateStr);

    if (!dueDateInfo) {
        return "";
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
