# SprintSync Scalable Folder Architecture

This document defines the complete architectural blueprint for **SprintSync**.
As the project grows, refer to this structure when adding new modules, features, and components.

---

```text
frontend/src/
├── app/                                # Next.js App Router (Routing & Layouts only)
│   ├── (auth)/                         # Route Group: Isolated layout for Authentication
│   │   ├── login/
│   │   │   └── page.tsx                # /login
│   │   ├── register/
│   │   │   └── page.tsx                # /register
│   │   └── layout.tsx                  # Centered, distraction-free auth shell (Navbar + Footer)
│   │
│   ├── (workspace)/                    # Route Group: Core Linear App Shell
│   │   ├── [teamKey]/                  # Dynamic team route (e.g., /ENG, /DES)
│   │   │   ├── all/
│   │   │   │   └── page.tsx            # All Issues view (Kanban / List)
│   │   │   ├── active-cycle/
│   │   │   │   └── page.tsx            # Current Sprint / Cycle view
│   │   │   ├── backlog/
│   │   │   │   └── page.tsx            # Backlog view
│   │   │   ├── cycles/
│   │   │   │   └── page.tsx            # All Sprints listing
│   │   │   └── projects/
│   │   │       ├── page.tsx            # Projects roadmap / grid
│   │   │       └── [projectId]/
│   │   │           └── page.tsx        # Project detail view
│   │   ├── my-issues/
│   │   │   └── page.tsx                # Issues assigned to current user
│   │   ├── settings/
│   │   │   └── page.tsx                # Workspace & Team settings
│   │   └── layout.tsx                  # Main app shell: Sidebar + Header + Command Palette
│   │
│   ├── layout.tsx                      # Root layout (Fonts, Meta, HTML tags)
│   ├── providers.tsx                   # TanStack Query, Sonner Toaster, Theme providers
│   ├── globals.css                     # Linear dark design tokens & Tailwind styles
│   └── page.tsx                        # Root redirect (to /login or /[teamKey]/all)
│
├── components/                         # Global, reusable UI primitives
│   ├── ui/                             # Base atomic components (buttons, dialogs, inputs)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── tooltip.tsx
│   │   ├── avatar.tsx
│   │   └── badge.tsx
│   └── layout/                         # Reusable layout components
│       ├── navbar.tsx                  # Public / auth navigation bar
│       ├── footer.tsx                  # Reusable footer
│       ├── sidebar.tsx                 # Linear collapsible sidebar
│       ├── header.tsx                  # Breadcrumbs, search bar, view switches
│       └── workspace-switcher.tsx      # Organization / team dropdown
│
├── features/                           # Feature-Driven Business Logic & Components
│   ├── auth/                           # Authentication feature
│   │   ├── components/
│   │   │   ├── login-form.tsx
│   │   │   └── register-form.tsx
│   │   ├── api/auth-api.ts             # Calls to /api/auth/*
│   │   └── hooks/use-auth.ts           # Login/register mutation hooks
│   │
│   ├── issues/                         # Core Linear Issue Tracker
│   │   ├── components/
│   │   │   ├── board/                  # Kanban board view
│   │   │   │   ├── board-column.tsx
│   │   │   │   ├── issue-card.tsx
│   │   │   │   └── issue-drag-overlay.tsx
│   │   │   ├── list/                   # High-density list view
│   │   │   │   ├── issue-list.tsx
│   │   │   │   └── issue-list-row.tsx
│   │   │   ├── issue-detail-modal.tsx  # Full issue drawer / modal
│   │   │   ├── issue-status-icon.tsx   # Todo, In Progress, Done status circles
│   │   │   ├── issue-priority-icon.tsx # Urgent, High, Med, Low priority bars
│   │   │   └── create-issue-modal.tsx  # Quick create modal ('C' shortcut)
│   │   ├── api/issues-api.ts           # CRUD endpoints for issues
│   │   └── hooks/use-issues.ts         # Optimistic TanStack Query hooks
│   │
│   ├── cycles/                         # Sprints (Cycles)
│   │   ├── components/
│   │   │   ├── cycle-progress-bar.tsx  # Linear sprint progress indicator
│   │   │   └── cycle-card.tsx
│   │   └── api/cycles-api.ts
│   │
│   ├── projects/                       # Projects & Roadmaps
│   │   ├── components/
│   │   │   ├── project-card.tsx
│   │   │   └── project-status-badge.tsx
│   │   └── api/projects-api.ts
│   │
│   ├── editor/                         # Tiptap Rich Markdown Editor
│   │   ├── editor.tsx                  # Headless Tiptap component
│   │   ├── editor-toolbar.tsx
│   │   └── extensions/                 # Custom slash commands & mentions
│   │
│   └── command-menu/                   # The 'Cmd+K' Command Palette
│       ├── command-menu.tsx            # cmdk dialog container
│       ├── command-actions.ts          # Action registry (create, navigate, assign)
│       └── hooks/use-command-menu.ts
│
├── hooks/                              # Cross-cutting global hooks
│   ├── use-keyboard-shortcuts.ts       # Global keybindings ('C', 'Cmd+K', 'J', 'K')
│   ├── use-debounce.ts
│   └── use-media-query.ts
│
├── store/                              # Global Client State (Zustand)
│   ├── use-auth-store.ts               # Authenticated user session
│   ├── use-ui-store.ts                 # Sidebar collapse state, active view (board/list)
│   └── use-modal-store.ts              # Controls quick-create modal & command menu
│
├── lib/                                # Core utilities & singletons
│   ├── endpoints.ts                    # Centralized API URLs
│   ├── api-client.ts                   # Fetch wrapper with credentials: "include"
│   ├── query-client.ts                 # React Query client with default cache rules
│   └── utils.ts                        # cn() helper (clsx + tailwind-merge)
│
└── types/                              # TypeScript definitions shared across frontend
    ├── auth.types.ts
    ├── issue.types.ts
    ├── team.types.ts
    └── cycle.types.ts
```
