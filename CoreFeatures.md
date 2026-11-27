# SprintSync — Core Features Specification & Implementation Tracker

This document outlines the **non-negotiable core features** of SprintSync (Linear Clone). Features are prioritized by implementation order and include technical requirements and acceptance criteria.

---

## 📋 Feature Roadmap Summary

| Feature | Scope | Priority | Status |
| :--- | :--- | :--- | :--- |
| **1. Authentication & Session** | HttpOnly cookies, JWT rotation, user profile | **P0** | ✅ Completed |
| **2. Issue Management Core** | Identifiers (`ENG-101`), statuses, priorities, estimates | **P0** | ✅ Completed |
| **3. Dual Views (Board & List)** | Drag-and-drop Kanban + high-density virtualized list | **P0** | ✅ Completed |
| **4. Keyboard Navigation & `Cmd+K`** | Global hotkeys (`C`, `J`, `K`) + command palette | **P0** | ✅ Completed |
| **5. Cycles (Sprints Engine)** | Automated sprint cadence + backlog rollover | **P0** | ✅ Completed |
| **6. Optimistic UI Layer** | Sub-50ms local cache updates with rollback | **P0** | ✅ Completed |
| **7. Projects & Initiatives** | Milestones, health statuses, progress tracking | **P1** | ✅ Completed |
| **8. Tiptap Markdown Editor** | Task checklists, slash commands (`/`), auto-save | **P1** | ✅ Completed |
| **9. Real-Time Collaboration** | WebSocket sync (Socket.io) for live changes | **P1** | 🔲 Planned |

---

## Feature 1: Authentication & Session Management (P0) — ✅ Done
- [x] Dual-token architecture (`15m` Access Token, `7d` Refresh Token)
- [x] HttpOnly, Secure, SameSite cookies (no tokens in JSON)
- [x] SHA-256 hashed refresh token persistence in database
- [x] Bcrypt password hashing (cost factor 12)
- [x] Constant-time dummy hash check during login to prevent timing attacks
- [x] Centralized API client with `credentials: "include"`
- [x] Login and Registration UI conforming to strict design tokens

---

## Feature 2: Issue Management Core (P0) — ✅ Done
The atomic unit of work in SprintSync.

### Requirements:
- **Identifier Generation**: Deterministic key per team (`ENG-1`, `ENG-2`, `DES-1`).
- **Statuses**:
  * `Backlog` (circle dashed)
  * `Todo` (circle empty)
  * `In Progress` (half circle)
  * `In Review` (three-quarter circle)
  * `Done` (filled checkmark circle)
  * `Canceled` (circle with X)
- **Priorities**:
  * `Urgent` (priority signal icon / red)
  * `High` (three bars)
  * `Medium` (two bars)
  * `Low` (one bar)
  * `No Priority` (horizontal dotted / dash)
- **Story Points**: Fibonacci scale (`1`, `2`, `3`, `5`, `8`).
- **Hierarchy & Relations**: Parent issue $\leftrightarrow$ Sub-issues; Relations (`blocks`, `blocked by`, `duplicate`).

### Implementation Checklist:
- [x] Database tables: `teams`, `issues`, `labels`, `issue_labels`, `issue_relations`
- [x] Backend CRUD API: `GET /api/issues`, `GET /api/issues/:id`, `POST /api/issues`, `PATCH /api/issues/:id`, `DELETE /api/issues/:id`, `POST/DELETE /api/issues/:id/relations`
- [x] Atomic team issue counter incrementation (`ENG-101`)
- [x] Issue creation modal / dialog component with shortcut (`C`), Status/Priority/Assignee/Labels pills, Estimate, Due Date, and `Create more`
- [x] Linear design token icons for 6 Statuses and 5 Priorities
- [x] Sub-issues (`parentId` linking + progress) and Relations (`blocks`, `blocked by`, `duplicate`, `related`) UI in Issue Inspector

---

## Feature 3: Dual Views — Kanban Board & High-Density List (P0)
Flexible visualization for different workflows.

### Requirements:
- **Kanban Board**:
  * Column per status (`Backlog`, `Todo`, `In Progress`, `In Review`, `Done`).
  * Smooth drag-and-drop between and within columns using `@dnd-kit`.
  * **Fractional Indexing** (`sort_order`): Moving a card updates **only 1 database row**.
- **High-Density List View**:
  * Compact 28–32px row heights.
  * Virtualized with `@tanstack/react-virtual` to handle 10,000+ items smoothly.
  * Columns: Status icon, Identifier, Title, Assignee avatar, Priority, Estimate badge.
- **View Toggle**: Quick switch between Board and List without reloading data.

### Implementation Checklist:
- [x] Board view layout with droppable columns
- [x] Draggable issue card with keyboard accessibility
- [x] Fractional indexing integration on drop
- [x] Virtualized list component with sorting and grouping headers

---

## Feature 4: Keyboard-First UX & Command Palette (`Cmd+K`) (P0)
Desktop-app responsiveness without relying on mouse input.

### Requirements:
- **`Cmd+K` / `Ctrl+K` Command Palette** (`cmdk`):
  * Search issues by title or identifier (`ENG-12`).
  * Jump to views: *Go to Active Cycle*, *Go to Backlog*, *Go to My Issues*.
  * Execute issue actions: *Change status...*, *Assign to...*, *Set priority...*.
- **Single-Key Shortcuts** (`react-hotkeys-hook`):
  * `C`: Open quick issue creation modal from anywhere.
  * `J` / `↓`: Select next issue in list.
  * `K` / `↑`: Select previous issue in list.
  * `S`: Open quick status picker on selected issue.
  * `P`: Open quick priority picker on selected issue.
  * `A`: Open assignee picker on selected issue.
  * `Backspace`: Cancel / delete selected issue.

### Implementation Checklist:
- [x] Global `CommandMenu` dialog component
- [x] Hotkeys provider listening across workspace routes
- [x] Quick issue creation modal (`C`) with autofocus on title input

---

## Feature 5: Cycles (Sprint Engine) (P0)
Automated, fixed-cadence execution cycles.

### Requirements:
- **Fixed Cadence**: 2-week active cycle intervals (e.g., *Cycle 12: Nov 10 – Nov 24*).
- **Cycle Burndown & Progress**: Real-time progress bar of completed points vs remaining points.
- **Automated Rollover Engine**:
  * When a cycle closes, unfinished issues (`Todo`, `In Progress`) automatically migrate to the next active cycle or return to the backlog.
  * Historical cycle snapshots (velocity metrics).

### Implementation Checklist:
- [x] Database table: `cycles`
- [x] Cycle management API endpoints
- [x] Active cycle dashboard view with scope progress
- [x] Background job / rollover logic for closing cycles

---

## Feature 6: Zero-Latency Optimistic UI Layer (P0)
Sub-50ms perceived latency on all user interactions.

### Requirements:
- Local cache updates immediately upon user action (e.g. dragging card to "Done").
- Network request sent asynchronously in the background.
- Automatic rollback with Sonner toast notification on network failure.

### Implementation Checklist:
- [ ] TanStack Query mutation hooks with `onMutate`, `onError`, `onSettled`
- [ ] Optimistic state updates for status changes, reordering, and issue edits

---

## Feature 7: Projects & Roadmaps (P1)
Organizing cross-cutting initiatives that span multiple cycles.

### Requirements:
- Projects group issues toward a defined outcome.
- Health indicators: `Planned`, `In Progress`, `Paused`, `Completed`, `Canceled`.
- Lead engineer, target date, and automated progress calculation.

### Implementation Checklist:
- [x] Database table: `projects`
- [x] Projects grid view and project detail page
- [x] Progress aggregation based on child issue statuses

---

## Feature 8: Rich-Text Markdown Editor (Tiptap) (P1)
Linear-grade issue descriptions and discussion threads.

### Requirements:
- Headless Tiptap editor with markdown support.
- Clickable task checklists (`- [ ]`).
- Slash commands (`/`) to insert code blocks, dividers, callouts.
- Zero manual saving: debounced auto-save.

### Implementation Checklist:
- [x] Tiptap editor wrapper with custom toolbar & slash commands (`/`)
- [x] JSON document tree persistence in PostgreSQL `jsonb` column
- [x] Auto-save hook with debounce

---

## Feature 9: Real-Time Synchronization (Socket.io) (P1)
Instant multi-user collaboration.

### Requirements:
- WebSocket event broadcast for issue creation, status updates, and deletions.
- Live viewer presence (showing avatars of who is viewing the issue).

### Implementation Checklist:
- [ ] Socket.io server connection attached to Express HTTP server
- [ ] Client WebSocket provider with event listener hooks
- [ ] Optimistic cache invalidation on incoming WebSocket events
