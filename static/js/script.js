document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    const filterButtons = document.querySelectorAll('.nav-item');
    const categoryButtons = document.querySelectorAll('.category-item');
    const viewButtons = document.querySelectorAll('.view-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const filterDisplay = document.getElementById('current-filter-display');
    
    // State
    let currentFilter = 'all';
    let currentCategory = 'all';
    let currentView = 'list';
    
    // Initialize
    checkEmptyState();
    initThemeFromLocalStorage();
    setupEventListeners();
    
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
            fetchAndRenderTasks();
        });
    });
    
    // Filter by Category
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            currentCategory = this.getAttribute('data-category');
            fetchAndRenderTasks();
        });
    });
    
    // Handle Toggle Task Completion
    function handleToggleTask(e) {
        const taskItem = e.target.closest('.task-item');
        const taskId = taskItem.getAttribute('data-id');
        
        fetch(`/toggle_task/${taskId}`, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    taskItem.classList.toggle('completed');
                    const icon = taskItem.querySelector('.toggle-btn i');
                    if (taskItem.classList.contains('completed')) {
                        icon.className = 'fas fa-check-circle';
                        showNotification('Task completed!', 'success');
                    } else {
                        icon.className = 'far fa-circle';
                        showNotification('Task marked as active', 'info');
                    }
                }
            })
            .catch(error => {
                console.error('Error toggling task:', error);
                showNotification('Error updating task', 'error');
            });
    }
    
    // Delete Task Handler
    function handleDeleteTask(e) {
        const deleteBtn = e.target.closest('.delete-btn');
        const taskId = deleteBtn.getAttribute('data-task-id');
        const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
        
        console.log('Deleting task with ID:', taskId); // Debug log
        
        if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
            taskItem.classList.add('deleting');
            
            fetch(`/delete_task/${taskId}`, { 
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                console.log('Delete response:', data); // Debug log
                if (data.success) {
                    taskItem.remove();
                    checkEmptyState();
                    showNotification('Tarea eliminada correctamente', 'success');
                } else {
                    showNotification('Error al eliminar la tarea', 'error');
                    taskItem.classList.remove('deleting');
                }
            })
            .catch(error => {
                console.error('Error deleting task:', error);
                showNotification('Error al eliminar la tarea', 'error');
                taskItem.classList.remove('deleting');
            });
        }
    }
    
    // Update Task Priority
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('priority-btn')) {
            const priority = e.target.getAttribute('data-priority');
            const taskId = e.target.getAttribute('data-task-id');
            const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
            
            const formData = new FormData();
            formData.append('priority', priority);
            
            fetch(`/update_task_priority/${taskId}`, {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Update UI
                        const priorityIndicator = taskItem.querySelector('.task-priority-indicator');
                        priorityIndicator.className = `task-priority-indicator priority-${priority}`;
                        
                        // Update active button
                        const priorityButtons = e.target.parentElement.querySelectorAll('.priority-btn');
                        priorityButtons.forEach(btn => btn.classList.remove('active'));
                        e.target.classList.add('active');
                        
                        // Update data attribute
                        taskItem.setAttribute('data-priority', priority);
                        
                        showNotification(`Priority updated to ${priority}`, 'success');
                    }
                })
                .catch(error => {
                    console.error('Error updating priority:', error);
                    showNotification('Error updating priority', 'error');
                });
        }
    });
    
    // Update Task Category
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('category-dropdown')) {
            const category = e.target.value;
            const taskId = e.target.getAttribute('data-task-id');
            const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
            
            const formData = new FormData();
            formData.append('category', category);
            
            fetch(`/update_task_category/${taskId}`, {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Update UI
                        const categorySpan = taskItem.querySelector('.task-category');
                        categorySpan.textContent = category;
                        
                        // Update data attribute
                        taskItem.setAttribute('data-category', category);
                        
                        showNotification(`Category updated to ${category}`, 'success');
                    }
                })
                .catch(error => {
                    console.error('Error updating category:', error);
                    showNotification('Error updating category', 'error');
                });
        }
    });
    
    // Add Task Form
    const taskForm = document.getElementById('task-form');
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        
        fetch('/add_task', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (response.ok) {
                    // Clear form
                    this.reset();
                    // Refresh tasks
                    fetchAndRenderTasks();
                    showNotification('Task added successfully', 'success');
                }
            })
            .catch(error => {
                console.error('Error adding task:', error);
                showNotification('Error adding task', 'error');
            });
    });
    
    // Fetch and render tasks based on current filters
    function fetchAndRenderTasks() {
        fetch(`/api/tasks?filter=${currentFilter}&category=${currentCategory}`)
            .then(response => response.json())
            .then(tasks => {
                renderTasks(tasks);
                checkEmptyState();
            })
            .catch(error => console.error('Error fetching tasks:', error));
    }
    
    // Render tasks
    function renderTasks(tasks) {
        taskList.innerHTML = '';
        
        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
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