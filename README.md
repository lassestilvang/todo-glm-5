# Daily Task Planner

A modern, professional daily task planner built with Next.js 16, featuring comprehensive task management capabilities including lists, tasks with rich properties, multiple views, and fuzzy search functionality.

## Features

### Task Management
- ✅ Create, edit, and delete tasks
- ✅ Rich task properties (due date, time, priority, estimated duration)
- ✅ Subtasks support
- ✅ Task labels/tags with color coding
- ✅ Task reminders
- ✅ File attachments
- ✅ Recurring tasks (daily, weekly, monthly, yearly, custom)
- ✅ Task history tracking

### List Management
- ✅ Create custom lists with colors and emoji icons
- ✅ Drag-and-drop list reordering
- ✅ Task count and completion tracking per list

### Multiple Views
- 📅 **Today** - Tasks due today
- 📆 **Week** - Tasks for the next 7 days
- 📋 **Upcoming** - All future tasks
- 📝 **All** - All tasks in one view
- 📁 **List View** - Tasks organized by list

### Search
- 🔍 Fuzzy search across tasks
- 🔍 Search by task name, description, and labels
- 🔍 Keyboard shortcut (Cmd/Ctrl + K) for quick search

### User Experience
- 🌙 Dark/Light mode with system preference detection
- 📱 Responsive design for mobile and desktop
- ⌨️ Keyboard shortcuts for power users
- ✨ Smooth animations with reduced motion support

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Bun](https://bun.sh/) | Runtime and package manager |
| [Next.js 16](https://nextjs.org/) | React framework with App Router |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript with strict mode |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS framework |
| [shadcn/ui](https://ui.shadcn.com/) | Component library |
| [Framer Motion](https://www.framer.com/motion/) | Animation library |
| [SQLite](https://www.sqlite.org/) | Local database via better-sqlite3 |
| [Zustand](https://zustand-demo.pmnd.rs/) | State management |
| [Fuse.js](https://fusejs.io/) | Fuzzy search library |
| [date-fns](https://date-fns.org/) | Date utility library |
| [React Hook Form](https://react-hook-form.com/) | Form handling |
| [Zod](https://zod.dev/) | Schema validation |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- Node.js >= 20 (for compatibility)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd todo-glm-5
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Initialize the database:
   ```bash
   bun run db:migrate
   ```

4. (Optional) Seed the database with sample data:
   ```bash
   bun run db:seed
   ```

5. Start the development server:
   ```bash
   bun run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun test` | Run all tests |
| `bun test:watch` | Run tests in watch mode |
| `bun test:coverage` | Run tests with coverage report |
| `bun run db:migrate` | Run database migrations |
| `bun run db:seed` | Seed database with sample data |

## Project Structure

```
todo-glm-5/
├── data/                    # SQLite database files
│   └── tasks.db
├── public/                  # Static assets
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (main)/          # Main app routes
│   │   │   ├── today/       # Today view
│   │   │   ├── week/        # Week view
│   │   │   ├── upcoming/    # Upcoming view
│   │   │   ├── all/         # All tasks view
│   │   │   ├── list/[id]/   # List detail view
│   │   │   └── search/      # Search results
│   │   ├── api/             # API routes
│   │   │   ├── tasks/       # Task CRUD operations
│   │   │   ├── lists/       # List CRUD operations
│   │   │   ├── labels/      # Label CRUD operations
│   │   │   ├── subtasks/    # Subtask operations
│   │   │   ├── search/      # Search endpoint
│   │   │   └── views/       # View-specific endpoints
│   │   ├── layout.tsx       # Root layout
│   │   └── globals.css      # Global styles
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── common/          # Shared components
│   │   ├── layout/          # Layout components
│   │   ├── tasks/           # Task-related components
│   │   ├── lists/           # List-related components
│   │   └── labels/          # Label-related components
│   ├── hooks/               # Custom React hooks
│   ├── lib/
│   │   ├── db/              # Database connection and schema
│   │   ├── services/        # Business logic layer
│   │   └── utils/           # Utility functions
│   └── types/               # TypeScript definitions
├── bunfig.toml              # Bun configuration
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind configuration
└── tsconfig.json            # TypeScript configuration
```

## API Documentation

### Lists API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lists` | Get all lists with task counts |
| POST | `/api/lists` | Create new list |
| GET | `/api/lists/[id]` | Get single list |
| PUT | `/api/lists/[id]` | Update list |
| DELETE | `/api/lists/[id]` | Delete list |
| POST | `/api/lists/reorder` | Reorder lists |

### Tasks API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get tasks with filtering |
| POST | `/api/tasks` | Create new task |
| GET | `/api/tasks/[id]` | Get single task |
| PUT | `/api/tasks/[id]` | Update task |
| DELETE | `/api/tasks/[id]` | Delete task |
| POST | `/api/tasks/[id]/complete` | Toggle task completion |
| POST | `/api/tasks/[id]/move` | Move task to another list |

### Labels API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/labels` | Get all labels |
| POST | `/api/labels` | Create label |
| PUT | `/api/labels/[id]` | Update label |
| DELETE | `/api/labels/[id]` | Delete label |

### Search API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search?q=query` | Fuzzy search tasks |

### Views API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/views/today` | Get today's tasks |
| GET | `/api/views/week` | Get tasks for next 7 days |
| GET | `/api/views/upcoming` | Get all future tasks |
| GET | `/api/views/overdue` | Get overdue tasks |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open search dialog |
| `Cmd/Ctrl + N` | Create new task |
| `Escape` | Close dialogs/modals |
| `Enter` | Save/confirm in forms |

## Database Schema

The application uses SQLite with the following main tables:

- **lists** - Task lists with colors and icons
- **tasks** - Tasks with all properties
- **subtasks** - Subtasks for tasks
- **labels** - Tags for categorizing tasks
- **task_labels** - Many-to-many relationship between tasks and labels
- **reminders** - Task reminders
- **attachments** - File attachments
- **task_history** - Task change history

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for detailed schema definitions.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PRs

## License

This project is private and proprietary. All rights reserved.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Lucide](https://lucide.dev/) for the icon set
- [Vercel](https://vercel.com/) for Next.js and deployment platform
