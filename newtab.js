const input = document.getElementById('todoInput');
const list = document.getElementById('todoList');
const counter = document.getElementById('counter');
const remainingCount = document.getElementById('remainingCount');

let todos = [];

// Load todos from Chrome storage on startup
chrome.storage.local.get(['todos'], (result) => {
    if (result.todos) {
        todos = result.todos;
        render();
    }
});

// Listen for storage changes from other tabs
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.todos) {
        todos = changes.todos.newValue || [];
        render();
    }
});

// Add todo on Enter
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
        addTodo(input.value.trim());
        input.value = '';
    }
});

// Clear input on Escape
input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        input.value = '';
    }
});

// Event delegation for checkboxes and delete buttons
list.addEventListener('click', (e) => {
    // Handle checkbox clicks
    if (e.target.classList.contains('checkbox')) {
        const todoItem = e.target.closest('.todo-item');
        const id = parseInt(todoItem.dataset.id);
        toggleTodo(id);
    }
    
    // Handle delete button clicks
    if (e.target.classList.contains('delete-btn')) {
        const todoItem = e.target.closest('.todo-item');
        const id = parseInt(todoItem.dataset.id);
        deleteTodo(id);
    }
});

function addTodo(text) {
    const todo = {
        id: Date.now(),
        text: text,
        completed: false
    };
    todos.push(todo);
    saveTodos();
    render();
}

function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        render();
    }
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    render();
}

function saveTodos() {
    chrome.storage.local.set({ todos: todos });
}

function render() {
    if (todos.length === 0) {
        list.innerHTML = '<div class="empty-state">Nothing to panic about... yet</div>';
        counter.style.display = 'none';
        return;
    }

    const remaining = todos.filter(t => !t.completed).length;
    remainingCount.textContent = remaining;
    counter.style.display = 'block';

    list.innerHTML = todos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <div class="checkbox-wrapper">
                <input 
                    type="checkbox" 
                    class="checkbox" 
                    ${todo.completed ? 'checked' : ''}
                >
            </div>
            <div class="todo-text">${escapeHtml(todo.text)}</div>
            <button class="delete-btn">×</button>
        </div>
    `).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initial render
render();