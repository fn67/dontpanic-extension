# CLAUDE.md - Project Context for AI Coding

## Project Identity

**Name**: DON'TPANIC  
**Type**: Chrome Extension (New Tab Override)  
**Philosophy**: Minimal, native-feeling todo list inspired by *The Hitchhiker's Guide to the Galaxy*

> *Anything that happens, happens.*  
> *Anything that, in happening, causes something else to happen, causes something else to happen.*  
> *Anything that, in happening, causes itself to happen again, happens again.*  
> *It doesn't necessarily do it in chronological order, though.*  
> — Douglas Adams, *Mostly Harmless*

---

## Core Philosophy

### The ONE Design Principle
**"It should feel native."**

That's it. Everything else flows from this:
- Blends seamlessly with Chrome's aesthetic
- Uses Chrome's design patterns (pill shapes, subtle shadows)
- Adapts to user's theme (future enhancement)
- Feels like Chrome built it, not a third-party extension

### The Anti-Principles (What We're NOT)
- ❌ Not a productivity maximizer with gamification
- ❌ Not feature-rich with categories, priorities, due dates (yet)
- ❌ Not aggressive or urgent in design
- ❌ Not complex or overwhelming
- ❌ **We don't panic. We just... do things.**

---

## Why "DON'TPANIC"?

Inspired by *The Hitchhiker's Guide to the Galaxy*, where "DON'T PANIC" is written in large, friendly letters on the cover of the Guide. This todo list embodies that spirit:

- **Calm over urgency** - No red colors, no stress
- **One thing at a time** - Simple list, no overwhelm  
- **Mostly harmless** - Todos aren't life-or-death
- **Don't forget your towel** - Remember the important stuff

### Hitchhiker's References in UI
- Placeholder: **"What's mostly harmless?"** (Earth's entry in the Guide)
- Empty state: **"Nothing to panic about... yet"**
- Title: **DONTPANIC** (no space, all caps, bold - intentional)

---

## Design Decisions (The "Why")

### Visual Design

**Title: DONTPANIC**
- All caps, no space between words
- Font weight: 800 (extra bold)
- Letter spacing: -3px (super tight, compact)
- Subtle text stroke for definition
- **Why**: Needs presence and impact, like the original book cover

**Input Field**
- White background (stands out against dark card)
- Pill shape (border-radius: 999px)
- Placeholder: "What's mostly harmless?"
- Dark text inside for contrast
- **Why**: Matches Chrome's search bar aesthetic - familiar and native

**Todo Items**
- Also pill-shaped (999px border-radius)
- Tight spacing (margin-bottom: 2px)
- Hover reveals delete button
- Strikethrough + 50% opacity when completed
- **Why**: Pill shapes = modern, Chrome-native feel. Tight spacing = more compact, scannable list.

**Card Container**
- Slightly transparent background: `rgba(55, 59, 62, 0.7)`
- Subtle rounded corners (10px)
- Backdrop blur effect
- Soft shadow (reduced from initial)
- **Why**: Feels like it's floating above the background, not a heavy box

**Typography**
- Font: Inter (Google Fonts)
- Clean, modern, readable
- **Why**: Inter is geometric, neutral, works at all sizes

**Color Palette**
- Background: `#3c4043` (Chrome's dark theme)
- Card: Semi-transparent dark with blur
- Input: White with dark text
- Accent: `#8ab4f8` (Chrome blue for checkboxes)
- **Why**: Matches Chrome's native dark mode colors

### Interaction Design

**Adding Todos**
- Type → Press Enter → Added
- Input clears automatically
- Focus stays in input (ready for next)
- Smooth fade-in animation
- **Why**: Fastest possible flow, no mouse needed

**Completing Todos**
- Click checkbox → Strikethrough + fade
- Item stays in place (doesn't move or disappear)
- Reversible (click again to uncheck)
- **Why**: Non-destructive, visible progress, honest feedback

**Deleting Todos**
- Hover item → × button appears
- Click × → Smooth fade-out
- Gone forever (no undo... yet)
- **Why**: Intentional action required, not accidental

**Keyboard Shortcuts**
- **Enter**: Add todo (when input focused)
- **Escape**: Clear input field
- **That's it.** No complex shortcuts.
- **Why**: Minimal learning curve, natural behavior

---

## Technical Decisions (The "How")

### Tech Stack
- **Vanilla JavaScript** - No frameworks
- **Chrome Extension Manifest V3** - Latest standard
- **Chrome Storage API** - Local persistence
- **No build tools** - Direct file editing
- **Why**: Simplicity, performance, no overhead

### Architecture Patterns

**State Management**
```javascript
// Single source of truth
let todos = [];

// Every mutation → save immediately
function saveTodos() {
    chrome.storage.local.set({ todos: todos });
}

// Listen for changes across tabs
chrome.storage.onChanged.addListener((changes) => {
    todos = changes.todos.newValue;
    render();
});
```
**Why**: Simple, works perfectly for this scale. No Redux needed.

**Event Handling**
```javascript
// Event delegation - single listener on parent
list.addEventListener('click', (e) => {
    if (e.target.classList.contains('checkbox')) {
        // handle checkbox
    }
    if (e.target.classList.contains('delete-btn')) {
        // handle delete
    }
});
```
**Why**: 
- CSP compliant (no inline handlers)
- Performance (one listener vs hundreds)
- Clean code

**Rendering**
```javascript
function render() {
    // Build HTML string, inject once
    list.innerHTML = todos.map(todo => `...`).join('');
}
```
**Why**: 
- Simple, fast for this size
- No virtual DOM needed
- XSS safe (we escape HTML)

**Security**
```javascript
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```
**Why**: Prevents XSS attacks from user input

---

## Code Style Guide

### JavaScript Style
```javascript
// ✅ DO THIS
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

// ❌ NOT THIS
const addTodo = (text) => {
    todos.push({id: Date.now(), text, completed: false})
    saveTodos()
    render()
}
```

**Rules:**
- Function declarations (not arrows) for top-level
- 4 spaces indentation
- Single quotes for strings
- Semicolons required
- Descriptive names
- Comments only when logic is non-obvious

### CSS Style
```css
/* ✅ DO THIS */
.todo-input {
    border-radius: 999px;  /* Pill shape */
    padding: 11px 18px;
    transition: all 0.2s ease;
}

/* ❌ NOT THIS */
.todo-input{border-radius:50rem;padding:11px 18px}
```

**Rules:**
- One property per line
- Spaces around colons
- Comments for non-obvious values
- Logical grouping of properties
- Use `999px` for pill shapes (not `50rem` or `50%`)

### HTML Style
```html
<!-- ✅ DO THIS -->
<div class="todo-item" data-id="123">
    <input type="checkbox" class="checkbox">
    <div class="todo-text">Buy milk</div>
    <button class="delete-btn">×</button>
</div>

<!-- ❌ NOT THIS -->
<div class="todo-item" data-id="123" onclick="toggle(123)">
    <input type="checkbox" onchange="toggleTodo(123)">
    <span style="flex: 1">Buy milk</span>
    <button onclick="deleteTodo(123)">×</button>
</div>
```

**Rules:**
- Semantic class names
- No inline styles
- No inline event handlers (CSP violation)
- Use data attributes for IDs
- Self-closing tags where appropriate

---

## Data Structure

```javascript
// The entire app state
todos = [
    {
        id: 1234567890,      // timestamp (unique)
        text: "Buy milk",    // user input (string)
        completed: false     // boolean
    }
]
```

**That's it.** No nested objects, no complex relationships, no normalization needed.

---

## Critical Rules (NEVER BREAK THESE)

### Security
1. **NEVER use innerHTML with user input directly**
   - Always use `escapeHtml()` function
   - Use `textContent` for plain text
   
2. **NEVER use inline event handlers**
   - No `onclick`, `onchange`, etc. in HTML
   - Chrome's CSP will block it
   - Use event delegation instead

3. **NEVER use eval or unsafe-eval**
   - Not needed, dangerous
   - Chrome will block it

### Performance
1. **NEVER add individual event listeners to each todo item**
   - Use event delegation on parent
   - Single listener handles all clicks

2. **NEVER update DOM incrementally**
   - Build full HTML string
   - Inject once with `innerHTML`
   - Fast for lists under 1000 items

### Design
1. **NEVER add aggressive colors**
   - No reds (except delete hover)
   - No bright greens or urgent oranges
   - Keep muted, calm palette

2. **NEVER add complex features without discussion**
   - Categories? No.
   - Priorities? No.
   - Subtasks? No.
   - Due dates? Maybe later.
   - **Stay minimal.**

---

## Common Tasks (For Future Vibecoding)

### Adding a New Feature

**Process:**
1. Ask: "Does this maintain minimal philosophy?"
2. Update data structure if needed (in `newtab.js`)
3. Add logic functions
4. Update `render()` to display it
5. Add styles to `styles.css`
6. Test persistence across tabs
7. Test browser restart

**Example: Adding Due Dates**
```javascript
// 1. Update data structure
{
    id: timestamp,
    text: string,
    completed: boolean,
    dueDate: timestamp  // NEW
}

// 2. Add logic
function setDueDate(id, date) { ... }

// 3. Update render
<div class="due-date">${formatDate(todo.dueDate)}</div>

// 4. Add styles
.due-date { color: #9aa0a6; font-size: 12px; }
```

### Debugging Storage Issues

```javascript
// In DevTools console:

// Check current todos
chrome.storage.local.get(['todos'], console.log)

// Clear all todos
chrome.storage.local.clear()

// Manually set todos
chrome.storage.local.set({ 
    todos: [{id: 1, text: "Test", completed: false}] 
})
```

### Testing Checklist
- [ ] Works in fresh new tab
- [ ] Persists after browser restart
- [ ] Syncs across multiple tabs
- [ ] No console errors
- [ ] No CSP violations
- [ ] Input escapes HTML properly
- [ ] Delete button only shows on hover
- [ ] Counter updates correctly
- [ ] Empty state shows when no todos

---

## Future Roadmap (Approved Enhancements)

### Phase 1: Theme Integration
- Detect Chrome theme colors via `chrome.theme.getCurrent()`
- Adapt UI colors to match user's theme
- Fallback to current design if no theme
- **Why**: Makes it feel even more native

### Phase 2: Import/Export
- Export todos as JSON file
- Import from JSON
- Backup/restore functionality
- **Why**: Data portability, peace of mind

### Phase 3: Optional Features (Maybe)
- Due dates (optional, toggleable)
- Support for links in todo text
- Dark/light mode manual toggle
- Keyboard navigation (arrow keys through list)
- **Why**: User requested, but must stay minimal

### Absolutely NOT Adding
- ❌ Categories/tags (too complex)
- ❌ Priorities (stressful)
- ❌ Notifications (annoying)
- ❌ Gamification (wrong vibe)
- ❌ Social features (what?)
- ❌ AI suggestions (overkill)

---

## File Structure Reference

```
dontpanic-extension/
├── manifest.json       # Extension config (Manifest V3)
│                       # Overrides new tab, requests storage permission
│
├── newtab.html        # UI structure
│                       # Container → Title → Input → List → Counter
│
├── styles.css         # All styling
│                       # Inter font, pill shapes, muted colors
│
├── newtab.js          # All logic
│                       # Event handling, CRUD, storage, render
│
├── icon.png           # Extension icon (optional, 128x128)
│
├── README.md          # User-facing documentation
├── ARCHITECTURE.md    # Technical deep-dive
└── CLAUDE.md          # This file (AI context)
```

---

## Communication with Claude

### When Asking for Changes

**Good prompts:**
- "Add a feature that [specific behavior]"
- "The [element] should look more [specific quality]"
- "I'm getting [error], help me debug"
- "Refactor [function] to be more [quality]"

**Bad prompts:**
- "Make it better" (too vague)
- "Add everything from Todoist" (against philosophy)
- "Use React" (no frameworks!)

### When Debugging

Always provide:
1. What you expected
2. What actually happened
3. Console errors (if any)
4. Which file you're working on

### When Adding Features

Always discuss first:
1. Does it fit the minimal philosophy?
2. Does it maintain native feel?
3. Is it worth the complexity?

---

## Project History (Context)

**Created**: October 2025  
**Initial Conversation**: Extensive design discussion with Claude  
**Key Decisions**:
- Name: DON'TPANIC (inspired by Hitchhiker's Guide)
- Pill shapes instead of rectangles (more modern/native)
- Title: Super bold, tight spacing (impact)
- Input: White (like Chrome search bar)
- Tight list spacing (compact, scannable)
- No complex features (stay minimal)

**Design Iterations**:
1. Started with standard rounded corners → Changed to pills
2. Title was smaller → Made it 32px, bold 800
3. Card was heavier → Made it more transparent
4. Shadow was harsh → Reduced and softened
5. Input was dark → Changed to white (Chrome-native)

---

## Known Issues / Technical Debt

**Current:**
- None! Code is clean and working.

**Future Considerations:**
- Theme detection not yet implemented
- No undo functionality (by design, but maybe add?)
- No keyboard navigation through list (future enhancement)
- Storage is local only (not synced across devices)

---

## Questions? Check These First

**"Why vanilla JS, no frameworks?"**  
Minimal complexity, instant load, no dependencies. Frameworks are overkill for 150 lines of code.

**"Why no build tools?"**  
Don't need them. Files are small, no transpiling needed, Chrome loads them directly.

**"Why chrome.storage.local instead of sync?"**  
Personal use, single device. Sync can be added later if needed (just change `local` to `sync`).

**"Why no tests?"**  
Manual testing is sufficient for this scale. Adding Jest would triple the project size for marginal benefit.

**"Why Inter font?"**  
Clean, modern, geometric. Works well at all sizes. Good fallback to system fonts.

**"Can I add [feature]?"**  
Ask first. Does it maintain minimal philosophy? Does it add significant value? What's the complexity cost?

---

## Remember

- **DON'T PANIC** when coding
- **ONE THING AT A TIME** when adding features
- **MOSTLY HARMLESS** approach to changes
- **IT SHOULD FEEL NATIVE** above all else

---

## Contact & Resources

- **Repo**: https://github.com/fn67/dontpanic-extension
- **Issues**: https://github.com/fn67/dontpanic-extension/issues
- **License**: MIT
- **Inspiration**: *The Hitchhiker's Guide to the Galaxy* by Douglas Adams

---

*This file was created through extensive conversation with Claude. It captures not just the code, but the philosophy, decisions, and reasoning behind every choice. When you vibe code with Claude in the future, reference this file so the AI understands the full context of what we built and why.*

**Now go forth and don't panic.** 🚀