# When2Meet Project - Claude Development Guidelines

## Project Overview
A meeting scheduling application built with SvelteKit, Prisma, and TypeScript.

## API Development Principles

### 1. Leverage Existing Prisma Zod Types
- **Always use generated Prisma Zod schemas** for validation instead of creating custom ones
- Located at: `$prisma/zod/schemas/index.js` (using the `$prisma` alias)
- Examples:
  - `TimeSelectionCreateInputObjectSchema` for create operations
  - `TimeSelectionUpdateInputObjectSchema` for update operations

### 2. Avoid Schema Duplication
- **Don't create custom API schemas** that duplicate Prisma validation logic
- If transformation is needed (e.g., string → Date), do it inline
- Keep validation simple: basic checks + Prisma schema validation

### 3. Clean API Handler Pattern
```typescript
// ❌ Don't do this - redundant schemas
const CustomApiSchema = z.object({
  field: z.string().transform(...)
});

// ✅ Do this - direct transformation + Prisma validation
const transformedData = {
  field: transformValue(body.field)
};
PrismaSchema.parse(transformedData);
```

### 4. String-to-Date Transformation
- API receives dates as ISO strings
- Transform to Date objects inline when needed
- Validate with Prisma schemas after transformation

### 5. File Structure
- API endpoints: `src/routes/api/`
- API wrapper: `src/lib/api/`
- Use `$lib` and `$prisma` aliases consistently

## Type Safety Guidelines
- Export Prisma types from API wrappers: `export type { Event, User } from '@prisma/client'`
- Create composite types when needed: `EventWithRelations`
- Maintain consistency between client and server validation

## Current Architecture
- **Database**: Prisma with generated Zod schemas
- **API**: SvelteKit endpoints with proper validation
- **Client**: Type-safe API wrapper with error handling
- **Auth**: Better-auth integration