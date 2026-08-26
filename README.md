# when2meet.app

An app that helps you and your team find meeting times.

![thumbnail](/static/thumbnail.png)

## What is this?

> Every time I try to schedule a meeting with my team, it usually turns into several rounds of “Can you do XX o’clock?” followed by “No, I'm dating my girlfriend at that time.” and then we have to keep searching for another time. This wastes a lot of time, so I built this app to help people quickly find a time when everyone is available.

## Running locally

### Prerequisites

- Node.js 20+ (Node.js 22.12+ recommended for the deployment CLI)
- pnpm
- PostgreSQL database

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
pnpm db:migrate
```

6. Start the development server:

```bash
pnpm dev
```

Visit `http://localhost:5173` to see the application running.

## Public MCP server

The production MCP resource is derived from `BETTER_AUTH_URL` and exposed at:

```text
https://your-domain.example/mcp
```

It supports OAuth 2.1 discovery, Client ID Metadata Documents (CIMD), rate-limited Dynamic Client Registration compatibility, refresh tokens through `offline_access`, and the MCP `2026-07-28` stateless POST protocol. The available tools can list and inspect events, rank meeting times, create or update events, and replace the authorized user's availability. Event deletion and changes to other participants are not exposed.

Before deploying:

1. Set `BETTER_AUTH_URL` to the public HTTPS origin (for production, `https://when2meet.app`).
2. Apply `drizzle/0002_mcp_oauth.sql` with `pnpm db:migrate` and verify the OAuth tables exist.
3. Confirm these public discovery URLs respond successfully:
    - `/.well-known/oauth-protected-resource/mcp`
    - `/.well-known/oauth-authorization-server/api/auth`
    - `/api/auth/.well-known/openid-configuration`
4. Confirm an unauthenticated `POST /mcp` returns an OAuth `WWW-Authenticate` challenge.

Important migration note: `drizzle/0001_drop_all_tables.sql` is a historical destructive migration. On an existing database that still contains production `event` and `participant` data, baseline/mark `0001` as already applied before running `0002`; do not execute `0001` against live data. Migration `0002` recreates those tables when absent, but it cannot recover rows previously deleted by `0001`.

### Connect from ChatGPT

In ChatGPT developer mode, create a custom app and enter `https://when2meet.app/mcp` as the MCP endpoint. Choose OAuth, scan the tools, complete the When2Meet sign-in/consent flow, and create the draft app. OpenAI's current setup guide is available in [Developer mode and MCP apps in ChatGPT](https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt).

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and ensure tests pass
4. Run linting: `pnpm lint`
5. Submit a pull request

# Credit

This project is heavily inspired by [when2meet.com](https://when2meet.com). So if

## License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️.
