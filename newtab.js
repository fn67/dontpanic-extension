const container = document.querySelector('.container');
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

// Listen for storage changes from other tabs.
// This also fires for our own writes (saveTodos), which would otherwise
// trigger a redundant full re-render right after every local change -
// replaying every item's fadeIn animation and causing a visible stutter
// (most noticeable right after a drag-drop). Skip it when the incoming
// value already matches what we have in memory.
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.todos) {
        const newValue = changes.todos.newValue || [];
        if (JSON.stringify(newValue) === JSON.stringify(todos)) return;
        todos = newValue;
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

// Drag-and-drop reordering via the drag handle.
// Pointer Events (not native HTML5 drag-and-drop) are used so the dragged
// item tracks the cursor at 1:1, every frame, with zero latency: native DnD
// instead hands the cursor a separate browser-rendered "ghost" image that
// visibly lags behind the real element. The dragged item is pulled out of
// flow (position: fixed) and follows the pointer directly, while a
// same-height placeholder holds its slot in the list so the other items can
// smoothly (FLIP-animated) slide around it as it passes over them.
//
// .container uses backdrop-filter, which makes it the containing block for
// any position: fixed descendant (same effect as transform/filter) — so the
// dragged item's top/left must be measured relative to the container, not
// the viewport, or it visually jumps away from the cursor.
let drag = null;

list.addEventListener('pointerdown', (e) => {
    if (!e.target.classList.contains('drag-handle')) return;
    const todoItem = e.target.closest('.todo-item');
    if (!todoItem) return;

    e.preventDefault();

    const rect = todoItem.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const baseTop = rect.top - containerRect.top;
    const baseLeft = rect.left - containerRect.left;

    const placeholder = document.createElement('div');
    placeholder.className = 'todo-placeholder';
    placeholder.style.height = `${rect.height}px`;
    todoItem.after(placeholder);

    todoItem.classList.add('dragging');
    todoItem.style.top = `${baseTop}px`;
    todoItem.style.left = `${baseLeft}px`;
    todoItem.style.width = `${rect.width}px`;

    drag = {
        el: todoItem,
        placeholder: placeholder,
        pointerId: e.pointerId,
        startY: e.clientY,
        baseTop: baseTop
    };

    todoItem.setPointerCapture(e.pointerId);
});

list.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;

    drag.el.style.top = `${drag.baseTop + (e.clientY - drag.startY)}px`;

    const dragRect = drag.el.getBoundingClientRect();
    const dragCenter = dragRect.top + dragRect.height / 2;

    const items = Array.from(list.querySelectorAll('.todo-item:not(.dragging)'));
    let target = null;
    for (const item of items) {
        const r = item.getBoundingClientRect();
        if (dragCenter < r.top + r.height / 2) {
            target = item;
            break;
        }
    }

    const current = target || null;
    const alreadyThere = current ? current === drag.placeholder.nextElementSibling
                                  : drag.placeholder === list.lastElementChild;
    if (alreadyThere) return;

    animateReorder(() => {
        if (current) {
            list.insertBefore(drag.placeholder, current);
        } else {
            list.appendChild(drag.placeholder);
        }
    });
});

function endDrag() {
    if (!drag) return;
    const { el, placeholder, pointerId } = drag;

    try {
        el.releasePointerCapture(pointerId);
    } catch (err) {
        // pointer capture may already be released (e.g. pointercancel)
    }

    // Force an instant, untransitioned snap into the final slot - a stale
    // inline transition left behind from an earlier FLIP animation on this
    // same element (see animateReorder) would otherwise override the
    // .dragging class's `transition: none` (inline beats class specificity)
    // and animate the scale/position settle, reading as a lag on drop.
    el.style.transition = 'none';
    el.style.transform = '';

    // .todo-item has a fadeIn entrance animation. replaceWith() detaches and
    // reinserts this node, which makes the browser regenerate its box and
    // replay that animation - the item visibly fades/slides in again right
    // after being dropped. Suppress it for this one move.
    el.style.animation = 'none';

    placeholder.replaceWith(el);
    el.classList.remove('dragging');
    el.style.top = '';
    el.style.left = '';
    el.style.width = '';

    requestAnimationFrame(() => {
        el.style.transition = '';
        el.style.animation = '';
    });

    const newOrder = Array.from(list.querySelectorAll('.todo-item')).map((item) => parseInt(item.dataset.id));
    todos.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
    saveTodos();

    drag = null;
}

list.addEventListener('pointerup', (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    endDrag();
});

list.addEventListener('pointercancel', (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    endDrag();
});

// FLIP animation: measure item positions, apply the DOM mutation, then
// smoothly transition each item from its old position to its new one.
function animateReorder(mutate) {
    const items = Array.from(list.querySelectorAll('.todo-item:not(.dragging)'));
    const firstRects = new Map(items.map((el) => [el, el.getBoundingClientRect()]));

    mutate();

    items.forEach((el) => {
        const first = firstRects.get(el);
        const last = el.getBoundingClientRect();
        const deltaY = first.top - last.top;
        if (deltaY) {
            el.style.transition = 'none';
            el.style.transform = `translateY(${deltaY}px)`;
            requestAnimationFrame(() => {
                el.style.transition = 'transform 0.2s ease';
                el.style.transform = '';
                el.addEventListener('transitionend', function cleanup() {
                    el.style.transition = '';
                    el.removeEventListener('transitionend', cleanup);
                }, { once: true });
            });
        }
    });
}

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
            <span class="drag-handle">⠿</span>
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