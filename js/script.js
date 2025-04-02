document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    const filterButtons = document.querySelectorAll('.nav-item');
    const categoryButtons = document.querySelectorAll('.category-item');
    const viewButtons = document.querySelectorAll('.view-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const filterDisplay = document.getElementById('current-filter-display');
    const currentDateElement = document.getElementById('current-date');
    const categoriesList = document.getElementById('categories-list');
    const taskForm = document.getElementById('task-form');
    
    // State
    let currentFilter = 'all';
    let currentCategory = 'all';
    let currentView = 'list';
    let tasks = [];
    
    // Initialize
    loadTasks();
    updateCurrentDate();
    checkEmptyState();
    initThemeFromLocalStorage();
    setupEventListeners();
    updateCategoriesList();
    renderTasks();
    
    // Setup all event listeners
    function setupEventListeners() {
        // Setup dropdown toggles
        document.addEventListener('click', function(e) {
            // Close all dropdowns when clicking outside
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
            
            // Toggle dropdown when clicking dropdown button
            if (e.target.closest('.dropdown-btn')) {
                e.preventDefault();
                const dropdown = e.target.closest('.dropdown');
                
                // Close all other dropdowns
                document.querySelectorAll('.dropdown').forEach(d => {
                    if (d !== dropdown) d.classList.remove('active');
                });
                
                // Toggle current dropdown
                dropdown.classList.toggle('active');
                
                // Si el dropdown está activo, posicionarlo correctamente
                if (dropdown.classList.contains('active')) {
                    const dropdownBtn = dropdown.querySelector('.dropdown-btn');
                    const dropdownContent = dropdown.querySelector('.dropdown-content');
                    
                    // Obtener posición del botón
                    const btnRect = dropdownBtn.getBoundingClientRect();
                    
                    // Calcular dimensiones de la ventana
                    const windowHeight = window.innerHeight;
                    const windowWidth = window.innerWidth;
                    
                    // Establecer ancho del menú desplegable
                    const menuWidth = 200; // Ancho aproximado del menú
                    const menuHeight = 250; // Altura aproximada del menú
                    
                    // Calcular posición horizontal óptima
                    let leftPos = btnRect.left;
                    
                    // Verificar si el menú se saldría por la derecha
                    if (leftPos + menuWidth > windowWidth) {
                        // Ajustar para que quede alineado al borde derecho de la ventana con un margen
                        leftPos = windowWidth - menuWidth - 20; // 20px de margen
                    }
                    
                    // Verificar si el menú se saldría por la izquierda
                    if (leftPos < 0) {
                        leftPos = 10; // 10px de margen desde el borde izquierdo
                    }
                    
                    // Posicionar el menú horizontalmente
                    dropdownContent.style.left = leftPos + 'px';
                    
                    // Verificar si hay espacio suficiente debajo
                    const spaceBelow = windowHeight - btnRect.bottom;
                    
                    if (spaceBelow < menuHeight && btnRect.top > menuHeight) {
                        // No hay suficiente espacio abajo, mostrar arriba
                        dropdownContent.style.top = (btnRect.top - menuHeight) + 'px';
                    } else {
                        // Hay suficiente espacio abajo, mostrar abajo
                        dropdownContent.style.top = btnRect.bottom + 'px';
                    }
                }
            }
            
            // Handle delete button click
            if (e.target.closest('.delete-btn')) {
                e.preventDefault();
                e.stopPropagation();
                handleDeleteTask(e);
            }
            
            // Handle toggle task completion
            if (e.target.closest('.toggle-btn')) {
                handleToggleTask(e);
            }
        });
    }
    
    // Theme Toggle
    themeToggle.addEventListener('change', function() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', this.checked ? 'enabled' : 'disabled');
    });
    
    function initThemeFromLocalStorage() {
        const darkMode = localStorage.getItem('darkMode');
        if (darkMode === 'enabled') {
            document.body.classList.add('dark-mode');
            themeToggle.checked = true;
        }
    }
    
    // View Toggle
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            viewButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            currentView = this.getAttribute('data-view');
            if (currentView === 'grid') {
                taskList.classList.add('grid-view');
            } else {
                taskList.classList.remove('grid-view');
            }
        });
    });
    
    // Filter Tasks
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            currentFilter = this.getAttribute('data-filter');
            filterDisplay.textContent = this.querySelector('span').textContent;
            renderTasks();
        });
    });
    
    // Filter by Category
    function setupCategoryListeners() {
        document.querySelectorAll('.category-item').forEach(button => {
            button.addEventListener('click', function() {
                document.querySelectorAll('.category-item').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                currentCategory = this.getAttribute('data-category');
                renderTasks();
            });
        });
    }
    
    // Handle Toggle Task Completion
    function handleToggleTask(e) {
        const taskItem = e.target.closest('.task-item');
        const taskId = parseInt(taskItem.getAttribute('data-id'));
        
        // Find the task in the array
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            // Toggle completion status
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            
            // Update UI
            taskItem.classList.toggle('completed');
            const icon = taskItem.querySelector('.toggle-btn i');
            if (taskItem.classList.contains('completed')) {
                icon.className = 'fas fa-check-circle';
                showNotification('Task completed!', 'success');
            } else {
                icon.className = 'far fa-circle';
                showNotification('Task marked as active', 'info');
            }
            
            // Save to localStorage
            saveTasks();
        }
    }
    
    // Delete Task Handler
    function handleDeleteTask(e) {
        const deleteBtn = e.target.closest('.delete-btn');
        const taskId = parseInt(deleteBtn.getAttribute('data-task-id'));
        const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
        
        if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
            taskItem.classList.add('deleting');
            
            // Remove task from array
            tasks = tasks.filter(task => task.id !== taskId);
            
            // Remove from UI after animation
            setTimeout(() => {
                taskItem.remove();
                checkEmptyState();
                updateCategoriesList();
                showNotification('Tarea eliminada correctamente', 'success');
            }, 300);
            
            // Save to localStorage
            saveTasks();
        }
    }
    
    // Update Task Priority
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('priority-btn')) {
            const priority = e.target.getAttribute('data-priority');
            const taskId = parseInt(e.target.getAttribute('data-task-id'));
            const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
            
            // Find the task in the array
            const taskIndex = tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                // Update priority
                tasks[taskIndex].priority = priority;
                
                // Update UI
                const priorityIndicator = taskItem.querySelector('.task-priority-indicator');
                priorityIndicator.className = `task-priority-indicator priority-${priority}`;
                
                // Update active button
                const priorityButtons = e.target.parentElement.querySelectorAll('.priority-btn');
                priorityButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // Update data attribute
                taskItem.setAttribute('data-priority', priority);
                
                // Save to localStorage
                saveTasks();
                
                showNotification(`Priority updated to ${priority}`, 'success');
            }
        }
    });
    
    // Update Task Category
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('category-dropdown')) {
            const category = e.target.value;
            const taskId = parseInt(e.target.getAttribute('data-task-id'));
            const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
            
            // Find the task in the array
            const taskIndex = tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                // Update category
                tasks[taskIndex].category = category;
                
                // Update UI
                const categorySpan = taskItem.querySelector('.task-category');
                categorySpan.textContent = category;
                
                // Update data attribute
                taskItem.setAttribute('data-category', category);
                
                // Save to localStorage
                saveTasks();
                
                // Update categories list
                updateCategoriesList();
                
                showNotification(`Category updated to ${category}`, 'success');
            }
        }
    });
    
    // Add Task Form
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const taskContent = document.getElementById('task_content').value;
        const priority = document.getElementById('priority').value;
        const category = document.getElementById('category').value;
        
        if (taskContent) {
            // Create new task
            const newTask = {
                id: Date.now(), // Use timestamp as unique ID
                content: taskContent,
                completed: false,
                created_at: formatDate(new Date()),
                priority: priority,
                category: category
            };
            
            // Add to tasks array
            tasks.push(newTask);
            
            // Save to localStorage
            saveTasks();
            
            // Clear form
            this.reset();
            
            // Render tasks
            renderTasks();
            
            // Update categories list
            updateCategoriesList();
            
            showNotification('Task added successfully', 'success');
        }
    });
    
    // Load tasks from localStorage
    function loadTasks() {
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
        } else {
            // Initialize with sample tasks if no tasks exist
            tasks = [
                {
                    id: 1,
                    content: 'Welcome to Task Manager! Add your tasks here.',
                    completed: false,
                    created_at: formatDate(new Date()),
                    priority: 'medium',
                    category: 'General'
                },
                {
                    id: 2,
                    content: 'Try marking a task as complete',
                    completed: false,
                    created_at: formatDate(new Date()),
                    priority: 'high',
                    category: 'Tutorial'
                },
                {
                    id: 3,
                    content: 'Delete a task you no longer need',
                    completed: false,
                    created_at: formatDate(new Date()),
                    priority: 'low',
                    category: 'Tutorial'
                }
            ];
            saveTasks();
        }
    }
    
    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Format date
    function formatDate(date) {
        return date.toISOString().split('T')[0] + ' ' + 
               date.toTimeString().split(' ')[0].substring(0, 5);
    }
    
    // Update current date display
    function updateCurrentDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateElement.textContent = now.toLocaleDateString('en-US', options);
    }
    
    // Update categories list
    function updateCategoriesList() {
        // Get unique categories
        const categories = [...new Set(tasks.map(task => task.category))];
        
        // Clear current categories (except "All Categories")
        const allCategoriesItem = categoriesList.querySelector('[data-category="all"]');
        categoriesList.innerHTML = '';
        categoriesList.appendChild(allCategoriesItem);
        
        // Add categories
        categories.forEach(category => {
            if (category) {
                const li = document.createElement('li');
                li.className = 'category-item';
                li.setAttribute('data-category', category);
                li.textContent = category;
                
                if (category === currentCategory) {
                    li.classList.add('active');
                }
                
                categoriesList.appendChild(li);
            }
        });
        
        // Setup event listeners for new category items
        setupCategoryListeners();
    }
    
    // Render tasks based on current filters
    function renderTasks() {
        taskList.innerHTML = '';
        
        // Filter tasks
        let filteredTasks = [...tasks];
        
        if (currentFilter === 'active') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        }
        
        if (currentCategory !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.category === currentCategory);
        }
        
        // Render filtered tasks
        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
        
        checkEmptyState();
    }
    
    // Create task element
    function createTaskElement(task) {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''} new`;
        taskItem.setAttribute('data-id', task.id);
        taskItem.setAttribute('data-category', task.category || 'General');
        taskItem.setAttribute('data-priority', task.priority || 'medium');
        
        taskItem.innerHTML = `
            <div class="task-priority-indicator priority-${task.priority || 'medium'}"></div>
            <div class="task-content">
                <button class="toggle-btn ${task.completed ? 'checked' : ''}">
                    ${task.completed ? 
                        '<i class="fas fa-check-circle"></i>' : 
                        '<i class="far fa-circle"></i>'}
                </button>
                <div class="task-details">
                    <span class="task-text">${task.content}</span>
                    <div class="task-meta">
                        <span class="task-category">${task.category || 'General'}</span>
                        <span class="task-date">${task.created_at}</span>
                    </div>
                </div>
            </div>
            <div class="task-actions">
                <div class="dropdown">
                    <button class="dropdown-btn"><i class="fas fa-ellipsis-v"></i></button>
                    <div class="dropdown-content">
                        <div class="dropdown-section">
                            <span class="dropdown-label">Priority:</span>
                            <div class="priority-options">
                                <button class="priority-btn ${task.priority === 'low' ? 'active' : ''}" data-priority="low" data-task-id="${task.id}">Low</button>
                                <button class="priority-btn ${task.priority === 'medium' ? 'active' : ''}" data-priority="medium" data-task-id="${task.id}">Medium</button>
                                <button class="priority-btn ${task.priority === 'high' ? 'active' : ''}" data-priority="high" data-task-id="${task.id}">High</button>
                            </div>
                        </div>
                        <div class="dropdown-section">
                            <span class="dropdown-label">Category:</span>
                            <select class="category-dropdown" data-task-id="${task.id}">
                                <option value="General" ${task.category === 'General' ? 'selected' : ''}>General</option>
                                <option value="Work" ${task.category === 'Work' ? 'selected' : ''}>Work</option>
                                <option value="Personal" ${task.category === 'Personal' ? 'selected' : ''}>Personal</option>
                                <option value="Shopping" ${task.category === 'Shopping' ? 'selected' : ''}>Shopping</option>
                                <option value="Health" ${task.category === 'Health' ? 'selected' : ''}>Health</option>
                                <option value="Education" ${task.category === 'Education' ? 'selected' : ''}>Education</option>
                                <option value="Tutorial" ${task.category === 'Tutorial' ? 'selected' : ''}>Tutorial</option>
                            </select>
                        </div>
                        <button class="delete-btn" data-task-id="${task.id}">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove 'new' class after animation
        setTimeout(() => {
            taskItem.classList.remove('new');
        }, 500);
        
        return taskItem;
    }
    
    // Check if task list is empty
    function checkEmptyState() {
        if (taskList.children.length === 0) {
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
        }
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const notificationMessage = notification.querySelector('.notification-message');
        const notificationIcon = notification.querySelector('.notification-icon');
        
        notification.className = 'notification';
        notification.classList.add(type);
        
        notificationMessage.textContent = message;
        
        if (type === 'success') {
            notificationIcon.className = 'notification-icon fas fa-check-circle';
        } else if (type === 'error') {
            notificationIcon.className = 'notification-icon fas fa-exclamation-circle';
        } else {
            notificationIcon.className = 'notification-icon fas fa-info-circle';
        }
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
});