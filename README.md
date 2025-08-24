# when2meet.app

A modern, fast scheduling application similar to When2Meet, built with SvelteKit and designed to help you find meeting times that work for everyone.

## What is this?

To be written...

## Running locally

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL database (or Neon account)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd when2meet
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:

```env
DATABASE_URL="your-postgresql-connection-string"
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:5173"
```

5. Run database migrations:

```bash
pnpm db:push
```

6. Start the development server:

```bash
pnpm dev
```

Visit `http://localhost:5173` to see the application running.

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Create production build
- `pnpm preview` - Preview production build
- `pnpm check` - Run Svelte type checking
- `pnpm check:watch` - Run type checking in watch mode
- `pnpm format` - Format code with Prettier
- `pnpm lint` - Run linting (Prettier + ESLint)

### Database Commands

- `pnpm db:push` - Push schema changes to database
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio for database management

### Project Structure

```
src/
├── lib/
│   ├── components/          # Reusable Svelte components
│   │   ├── ui/             # shadcn-svelte components
│   │   ├── time-selector.svelte # Interactive time selection grid
│   │   └── ...
│   ├── server/
│   │   └── db/
│   │       ├── schema.ts   # Main database schema
│   │       └── auth-schema.ts # Authentication schema
│   └── utils.ts           # Utility functions
├── routes/
│   ├── +page.svelte       # Landing page
│   ├── [eventId]/         # Event participation page
│   ├── events/            # User's events dashboard
│   └── ...
└── app.html               # App shell
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and ensure tests pass
4. Run linting: `pnpm lint`
5. Submit a pull request

## License

[MIT License](LICENSE)

---

Built with ❤️ using modern web technologies to make scheduling meetings simple and fast.
