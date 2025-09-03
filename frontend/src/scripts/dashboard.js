// dashboard.js - Inicialización y orquestación de dashboard
console.log("[dashboard.js] cargado");
import { checkAuthForDashboard } from "./authUtils.js";
import { updateUserUI, logout } from "./auth.js";
import {
    loadTasks,
    updateTaskCounts,
    filterTasks,
    renderTasks,
    handleSearch,
    handlePriorityFilter,
    refreshTasks,
    toggleTask,
    deleteTask,
    submitTask,
    populateTaskFormListSelector,
} from "./tasks.js";
import { showToast } from "./ui.js";
import {
    filteredTasks,
    taskCounts,
    currentFilter,
    isLoading,
} from "../stores/taskStore.js";

// Solo necesario para el modal de tareas (mantenemos solo lo esencial)
window.showToast = showToast;
window.submitTask = submitTask;

// Función para mostrar el formulario de tareas
window.showTaskForm = async function (mode = "create", task = null) {
    const modal = document.getElementById("taskForm");
    if (!modal) return;

    const form = document.getElementById("taskFormElement");
    const title = modal.querySelector(".task-form-title");

    if (mode === "create") {
        if (title) title.textContent = "Nueva Tarea";
        if (form) form.reset();
        document.getElementById("taskId").value = "";
    } else if (mode === "edit" && task) {
        if (title) title.textContent = "Editar Tarea";
        // Llenar formulario con datos de la tarea
        document.getElementById("taskTitle").value = task.title || "";
        document.getElementById("taskDescription").value =
            task.description || "";
        document.getElementById("taskPriority").value =
            task.priority || "medium";
        document.getElementById("taskDueDate").value = task.due_date
            ? task.due_date.split("T")[0]
            : "";
        document.getElementById("taskId").value = task.id || "";
    }

    // Poblar selector de listas de tareas
    if (mode === "edit" && task && task.list_id) {
        // Si estamos editando y la tarea tiene una lista, pre-seleccionarla
        await populateTaskFormListSelector(task.list_id);
    } else {
        // Para crear nueva tarea, usar la lógica normal
        await populateTaskFormListSelector();
    }

    // Si estamos editando, establecer la lista correcta después de poblar el selector
    if (mode === "edit" && task && task.list_id) {
        const listSelector = document.getElementById("task-list-selector");
        if (listSelector) {
            listSelector.value = task.list_id;
        }
    }

    // Mostrar modal
    modal.style.display = "flex";
};

// Función para cerrar el formulario de tareas
window.closeTaskForm = function () {
    const modal = document.getElementById("taskForm");
    if (modal) {
        modal.style.display = "none";
    }
};

// Inicialización
window.addEventListener("DOMContentLoaded", async () => {
    console.log("[dashboard.js] DOM cargado, iniciando...");

    // Suscribirse a los stores ANTES de cargar datos
    setupStoreSubscriptions();

    // Verificar autenticación específicamente para dashboard
    const isAuthenticated = await checkAuthForDashboard();
    if (isAuthenticated) {
        // Solo cargar tareas si la autenticación fue exitosa
        console.log("[dashboard.js] Autenticación exitosa, cargando tareas...");
        loadTasks();
    }

    // Renderizado inicial por si las suscripciones no se ejecutan inmediatamente
    setTimeout(() => {
        console.log("[dashboard.js] Renderizado inicial forzado");
        renderTasks();
        updateTaskCounts();
    }, 100);

    // Event Listeners para filtros de sidebar
    document.querySelectorAll("[data-filter]").forEach((button) => {
        button.addEventListener("click", () => {
            const filterType = button.getAttribute("data-filter");
            filterTasks(filterType);
        });
    });

    // Event Listeners para búsqueda y filtros
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keyup", (e) => {
            handleSearch(e.target.value);
        });
    }

    const priorityFilter = document.getElementById("priorityFilter");
    if (priorityFilter) {
        priorityFilter.addEventListener("change", handlePriorityFilter);
    }

    // Event Listeners para botones de acción
    const newTaskBtn = document.getElementById("newTaskBtn");
    if (newTaskBtn) {
        newTaskBtn.addEventListener("click", () => {
            if (window.showTaskForm) {
                window.showTaskForm("create");
            }
        });
    }

    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", refreshTasks);
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }

    // Delegación para botones de eliminar tarea
    document.body.addEventListener("click", function (e) {
        const btn = e.target.closest(".js-delete-task");
        if (btn) {
            const taskId = btn.getAttribute("data-task-id");
            console.log(
                "[dashboard.js] Click en botón eliminar:",
                btn,
                "taskId:",
                taskId
            );
            if (taskId) {
                deleteTask(Number(taskId));
            }
        }
    });

    // Delegación para botones de toggle tarea
    document.body.addEventListener("click", function (e) {
        const checkbox = e.target.closest(".js-toggle-task");
        if (checkbox) {
            const taskId = checkbox.getAttribute("data-task-id");
            if (taskId) {
                toggleTask(taskId);
            }
        }
    });

    // Delegación para botones de editar tarea
    document.body.addEventListener("click", function (e) {
        const editBtn = e.target.closest(".js-edit-task");
        if (editBtn && window.showTaskForm) {
            try {
                const taskData = editBtn.getAttribute("data-task");
                const task = JSON.parse(
                    taskData.replace(/&quot;/g, '"').replace(/&#39;/g, "'")
                );
                window.showTaskForm("edit", task);
            } catch (error) {
                console.error("Error parsing task data:", error);
            }
        }
    });
});

// Exponer funciones necesarias globalmente
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;

// Configurar suscripciones a los stores
function setupStoreSubscriptions() {
    // Suscribirse a cambios en las tareas filtradas
    filteredTasks.subscribe((tasks) => {
        console.log(
            "[dashboard.js] Tareas filtradas actualizadas:",
            tasks.length
        );
        // Usar setTimeout para evitar problemas de timing
        setTimeout(() => renderTasks(), 0);
    });

    // Suscribirse a cambios en los contadores
    taskCounts.subscribe((counts) => {
        console.log("[dashboard.js] Contadores actualizados:", counts);
        updateTaskCounts();
    });

    // Suscribirse a cambios en el estado de carga
    isLoading.subscribe((loading) => {
        console.log("[dashboard.js] Estado de carga:", loading);
        // Cuando termine de cargar, forzar renderizado
        if (!loading) {
            setTimeout(() => renderTasks(), 0);
        }
    });
}
