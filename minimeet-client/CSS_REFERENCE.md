# MiniMeet UI - CSS Class Reference Guide
**Created:** October 1, 2025 at 20:12 KST
**Quick Reference for Developers**

---

## 🎨 Color Classes

### Text Colors
```css
.text-primary      /* Primary color text */
.text-secondary    /* Secondary/muted text */
.text-success      /* Success green text */
.text-danger       /* Danger red text */
.text-warning      /* Warning amber text */
.text-info         /* Info cyan text */
```

### Background Colors
```css
.bg-primary        /* Primary background */
.bg-secondary      /* Secondary background */
.bg-tertiary       /* Tertiary background */
.bg-elevated       /* Elevated/card background */
```

---

## 🔘 Button Classes

### Primary Buttons
```html
<button class="btn-primary">Primary Action</button>
<button class="btn-success">Success Action</button>
<button class="btn-danger">Danger Action</button>
<button class="btn-outline">Outline Button</button>
```

### Button States
- Hover: Automatic lift effect (-2px)
- Disabled: Automatic opacity (0.5)
- Active: Automatic press effect

---

## 📝 Input Classes

### Text Inputs
```html
<input type="text" class="input" placeholder="Enter text...">
<textarea class="input" placeholder="Enter message..."></textarea>
```

### Input States
- Focus: Automatic glow effect (3px ring)
- Disabled: Automatic styling
- Placeholder: Automatic color

---

## 📦 Card & Container Classes

### Cards
```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
  </div>
  <div class="card-body">
    Card content goes here
  </div>
  <div class="card-footer">
    Footer content
  </div>
</div>
```

### Sections
```html
<div class="section">
  <h3 class="section-title">Section Title</h3>
  <!-- Content -->
</div>
```

---

## 🎭 Loading States

### Skeletons
```html
<!-- Text skeleton -->
<div class="skeleton skeleton-text"></div>
<div class="skeleton skeleton-text large"></div>

<!-- Avatar skeleton -->
<div class="skeleton skeleton-avatar"></div>

<!-- Button skeleton -->
<div class="skeleton skeleton-button"></div>

<!-- Card skeleton -->
<div class="skeleton skeleton-card"></div>
```

---

## 🔔 Toast Notifications

### Toast Container
```html
<div class="toast-container">
  <!-- Success Toast -->
  <div class="toast success">
    <span class="toast-icon">✅</span>
    <div class="toast-content">
      <div class="toast-title">Success!</div>
      <div class="toast-message">Action completed successfully.</div>
    </div>
    <button class="toast-close">×</button>
  </div>
  
  <!-- Error Toast -->
  <div class="toast error">
    <span class="toast-icon">❌</span>
    <div class="toast-content">
      <div class="toast-title">Error!</div>
      <div class="toast-message">Something went wrong.</div>
    </div>
    <button class="toast-close">×</button>
  </div>
  
  <!-- Info Toast -->
  <div class="toast info">
    <span class="toast-icon">ℹ️</span>
    <div class="toast-content">
      <div class="toast-title">Info</div>
      <div class="toast-message">Here's some information.</div>
    </div>
    <button class="toast-close">×</button>
  </div>
  
  <!-- Warning Toast -->
  <div class="toast warning">
    <span class="toast-icon">⚠️</span>
    <div class="toast-content">
      <div class="toast-title">Warning</div>
      <div class="toast-message">Please be careful.</div>
    </div>
    <button class="toast-close">×</button>
  </div>
</div>
```

---

## 🪟 Modal Dialogs

### Basic Modal
```html
<div class="modal-overlay">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">Modal Title</h3>
      <button class="toast-close">×</button>
    </div>
    <div class="modal-body">
      <p>Modal content goes here...</p>
    </div>
    <div class="modal-footer">
      <button class="btn-outline">Cancel</button>
      <button class="btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

---

## 👤 Avatars

### Avatar Sizes
```html
<!-- Small Avatar -->
<div class="avatar avatar-sm">
  <span class="avatar-text">JD</span>
</div>

<!-- Default Avatar -->
<div class="avatar">
  <span class="avatar-text">JD</span>
</div>

<!-- Large Avatar -->
<div class="avatar avatar-lg">
  <span class="avatar-text">JD</span>
</div>

<!-- Online Avatar -->
<div class="avatar avatar-online">
  <span class="avatar-text">JD</span>
</div>
```

---

## 📡 Connection Quality

### Quality Levels
```html
<!-- Excellent -->
<div class="connection-quality excellent">
  <div class="quality-bars">
    <span class="quality-bar"></span>
    <span class="quality-bar"></span>
    <span class="quality-bar"></span>
    <span class="quality-bar"></span>
  </div>
  <span class="quality-text">Excellent</span>
</div>

<!-- Good -->
<div class="connection-quality good">
  <div class="quality-bars">
    <span class="quality-bar"></span>
    <span class="quality-bar"></span>
    <span class="quality-bar"></span>
    <span class="quality-bar"></span>
  </div>
  <span class="quality-text">Good</span>
</div>

<!-- Fair -->
<div class="connection-quality fair">
  <div class="quality-bars">
    <span class="quality-bar"></span>
    <span class="quality-bar"></span>
    <span class="quality-bar"></span>
    <span class="quality-bar"></span>
  </div>
  <span class="quality-text">Fair</span>
</div>

<!-- Poor -->
<div class="connection-quality poor">
  <div class="quality-bars">
    <span class="quality-bar"></span>
    <span class="quality-bar"></span>
    <span class="quality-bar"></span>
    <span class="quality-bar"></span>
  </div>
  <span class="quality-text">Poor</span>
</div>
```

---

## ⌨️ Typing Indicator

```html
<div class="typing-indicator">
  <span>Alice is typing</span>
  <div class="typing-dots">
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
  </div>
</div>
```

---

## 💬 Message Reactions

```html
<div class="message-reactions">
  <!-- Active Reaction -->
  <button class="reaction active">
    <span class="reaction-emoji">👍</span>
    <span class="reaction-count">3</span>
  </button>
  
  <!-- Inactive Reaction -->
  <button class="reaction">
    <span class="reaction-emoji">❤️</span>
    <span class="reaction-count">1</span>
  </button>
  
  <!-- Add Reaction Button -->
  <button class="add-reaction">+</button>
</div>
```

---

## 📹 Video Indicators

### Screen Share
```html
<div class="screen-share-indicator">
  Sharing Screen
</div>
```

### Recording
```html
<div class="recording-indicator">
  Recording
</div>
```

---

## 🎯 Status Display

```html
<!-- Connected -->
<div class="status-display connected">
  <span class="status-indicator"></span>
  <span class="status-text">Connected</span>
</div>

<!-- Disconnected -->
<div class="status-display disconnected">
  <span class="status-indicator"></span>
  <span class="status-text">Disconnected</span>
</div>
```

---

## 📐 Layout Utilities

### Flexbox
```css
.flex              /* display: flex */
.flex-col          /* flex-direction: column */
.items-center      /* align-items: center */
.justify-between   /* justify-content: space-between */
.justify-center    /* justify-content: center */
.gap-2             /* gap: 8px */
.gap-4             /* gap: 16px */
```

### Grid
```css
.grid              /* display: grid */
.grid-cols-1       /* 1 column grid */
.grid-cols-2       /* 2 column grid */
.grid-cols-3       /* 3 column grid */
```

### Spacing
```css
/* Padding */
.p-2               /* padding: 8px */
.p-4               /* padding: 16px */
.p-6               /* padding: 24px */

/* Margin */
.m-2               /* margin: 8px */
.m-4               /* margin: 16px */
.m-6               /* margin: 24px */

/* Margin Top */
.mt-2              /* margin-top: 8px */
.mt-4              /* margin-top: 16px */
.mt-6              /* margin-top: 24px */
```

---

## 🎨 Typography

### Font Sizes
```css
.text-xs           /* 0.75rem (12px) */
.text-sm           /* 0.875rem (14px) */
.text-base         /* 1rem (16px) */
.text-lg           /* 1.125rem (18px) */
.text-xl           /* 1.25rem (20px) */
.text-2xl          /* 1.5rem (24px) */
.text-3xl          /* 1.875rem (30px) */
```

### Font Weights
```css
.font-semibold     /* font-weight: 600 */
.font-bold         /* font-weight: 700 */
```

### Font Families
```css
.font-mono         /* Monospace font */
```

---

## 🎭 Borders & Shadows

### Borders
```css
.border            /* 1px solid border */
.border-t          /* Top border */
.border-b          /* Bottom border */
.border-l          /* Left border */
.border-r          /* Right border */
```

### Border Radius
```css
.rounded-sm        /* 6px radius */
.rounded           /* 10px radius */
.rounded-lg        /* 14px radius */
.rounded-full      /* 9999px radius (circle) */
```

### Shadows
```css
.shadow-sm         /* Small shadow */
.shadow            /* Medium shadow */
.shadow-lg         /* Large shadow */
.shadow-xl         /* Extra large shadow */
```

---

## 🎬 Animation Classes

### Available Animations
```css
/* Automatically applied to elements */
messageSlideIn     /* Messages slide in */
shimmer            /* Loading skeleton shimmer */
toastSlideIn       /* Toast notifications slide in */
modalSlideUp       /* Modals slide up */
fadeIn             /* General fade in */
pulse              /* Status indicator pulse */
typingBounce       /* Typing dots bounce */
blink              /* Recording indicator blink */
```

---

## 📱 Responsive Classes

### Breakpoints
```css
/* Mobile First - Default styles apply to mobile */

/* Tablet and up (768px+) */
.md\:flex
.md\:grid-cols-2

/* Desktop and up (1024px+) */
.lg\:grid-cols-3
```

---

## 🎯 Common Patterns

### Auth Section
```html
<div class="auth-section">
  <h3 class="auth-title">1. Get Authentication Token</h3>
  <div class="auth-controls">
    <input type="text" class="auth-input" placeholder="Enter User ID">
    <button class="auth-button">Get Token</button>
  </div>
  <div class="token-display">
    <strong>Token:</strong> abc123...
  </div>
</div>
```

### Connection Section
```html
<div class="connection-section">
  <h3 class="connection-title">2. Connect & Join Room</h3>
  <div class="connection-controls">
    <button class="connect-button">Connect to Server</button>
    <input type="text" class="connection-input" placeholder="Enter Room ID">
    <button class="join-button">Join Room</button>
    <button class="leave-button">Leave Room</button>
  </div>
</div>
```

### Console Log
```html
<div class="console-log">
  <div class="console-header">
    <h3 class="console-title">Console Logs</h3>
    <button class="clear-button">Clear</button>
  </div>
  <div class="log-container">
    <div class="log-entry">[10:30:45] Connected to server</div>
    <div class="log-entry">[10:30:46] Joined room: room-123</div>
  </div>
</div>
```

### Chat Message
```html
<div class="message">
  <div class="message-header">
    <span class="message-sender">John Doe</span>
    <span class="message-time">10:30 AM</span>
  </div>
  <div class="message-content">
    Hello everyone! How are you doing today?
  </div>
  <div class="message-reactions">
    <button class="reaction active">
      <span class="reaction-emoji">👍</span>
      <span class="reaction-count">3</span>
    </button>
    <button class="add-reaction">+</button>
  </div>
</div>
```

### Video Tile
```html
<div class="video-tile">
  <h4 class="video-label">You</h4>
  <video class="video-element" autoplay muted></video>
  <div class="screen-share-indicator">Sharing Screen</div>
  <div class="recording-indicator">Recording</div>
</div>
```

---

## 💡 Pro Tips

### 1. Combining Classes
```html
<!-- Combine utility classes for custom layouts -->
<div class="flex items-center gap-4 p-4">
  <div class="avatar avatar-online">
    <span class="avatar-text">JD</span>
  </div>
  <div class="flex-col">
    <span class="text-base font-semibold">John Doe</span>
    <span class="text-sm text-secondary">Online</span>
  </div>
</div>
```

### 2. Responsive Design
```html
<!-- Stack on mobile, row on desktop -->
<div class="flex-col md:flex gap-4">
  <div>Column 1</div>
  <div>Column 2</div>
</div>
```

### 3. Custom Hover Effects
```html
<!-- All interactive elements have automatic hover effects -->
<button class="btn-primary">
  Hover me! (automatic lift effect)
</button>
```

---

## 🔍 Quick Search

**Need to find a class?**
- Buttons → Search for "btn-"
- Colors → Search for "text-" or "bg-"
- Spacing → Search for "p-", "m-", "gap-"
- Layout → Search for "flex", "grid"
- Animations → Check "Animation Classes" section
- Components → Check "Common Patterns" section

---

## 📚 Additional Resources

- **Full Documentation:** `ADVANCED_FEATURES.md`
- **Implementation Guide:** `UI_MODERNIZATION_SUMMARY.md`
- **Project Summary:** `FINAL_SUMMARY.md`
- **Source Files:** `src/style/*.css`

---

**Quick Reference Version:** 1.0.0
**Last Updated:** October 1, 2025 at 20:12 KST
**Print this for quick reference during development!**
