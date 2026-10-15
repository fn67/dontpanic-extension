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

// Use Chrome's own browser color (if the user picked one) as the title accent
function applyThemeAccent() {
    if (!chrome.theme || !chrome.theme.getCurrent) return;
    chrome.theme.getCurrent((theme) => {
        const colors = theme && theme.colors;
        const rgb = colors && (colors.frame || colors.toolbar || colors.ntp_background);
        if (rgb && rgb.length >= 3) {
            document.documentElement.style.setProperty('--dp-title-color', `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
        } else {
            document.documentElement.style.removeProperty('--dp-title-color');
        }
    });
}

applyThemeAccent();

if (chrome.theme && chrome.theme.onUpdated) {
    chrome.theme.onUpdated.addListener(applyThemeAccent);
}

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

    // Handle copy button clicks
    if (e.target.classList.contains('copy-btn')) {
        const todoItem = e.target.closest('.todo-item');
        const id = parseInt(todoItem.dataset.id);
        copyTodoText(id, e.target);
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

function copyTodoText(id, btn) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    navigator.clipboard.writeText(todo.text).then(() => {
        const original = btn.textContent;
        btn.textContent = '✓';
        setTimeout(() => {
            btn.textContent = original;
        }, 1000);
    });
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
            <button class="copy-btn" title="Copy">⧉</button>
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