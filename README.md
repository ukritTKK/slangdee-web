# Slangdee

Slangdee is a bilingual dictionary of Thai and English slang. It provides localized Thai and
English routes, canonical slang detail pages, IPA pronunciation, original
headwords with romanization, tags, related entries, autocomplete, and full
search.

Milestone 1 includes a source-reviewed pilot of 20 Thai and 20 English entries,
claim-specific citations, example provenance, publication status, and immutable
revision snapshots. Other legacy entries display an awaiting-review warning.

## Local development

Create `.env` from `.env.example`. Then install dependencies and start the
development server:

```bash
npm install
npx prisma migrate deploy
npx prisma generate
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects
to Thai (`/th`); English is available at `/en`.

Useful checks:

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
node --experimental-strip-types scripts/verify-milestone-1.ts
```

## Configuration

Set `DATABASE_URL` for the Prisma LibSQL/SQLite adapter. Set
`NEXT_PUBLIC_SITE_URL` to the deployed origin so canonical URLs, sitemap, and
Open Graph metadata use the production host. The local fallback is
`http://localhost:3000`.

## Project notes

- Database schema and seed data live under `prisma/`.
- Routes and page metadata live under `src/app/`.
- Shared UI components live under `src/components/`.
- The current implementation roadmap is tracked in
  [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md).
- Source policy and pilot review notes live in
  [`docs/BASE_DATA_SOURCES.md`](docs/BASE_DATA_SOURCES.md).
- The reviewed seed is repeatable and preserves subsequent editorial changes.
- Back up an existing database before migrations. Never reset it to import vocabulary.
