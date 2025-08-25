# when2meet.app

An app that helps you and your team find meeting times.

![example-usage](/src/lib/assets/example-usage.gif)

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
git clone https://github.com/Nat1anWasTaken/when2meet.git
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
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:5173

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

DATABASE_URL="postgres://user:password@host:port/db-name"

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

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and ensure tests pass
4. Run linting: `pnpm lint`
5. Submit a pull request

## License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️.
