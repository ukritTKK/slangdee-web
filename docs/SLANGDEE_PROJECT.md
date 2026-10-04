# Slangdee project handbook

Updated: 2026-10-04.

Slangdee is a bilingual dictionary of Thai and English slang. It explains meanings and usage in either locale while keeping each word's original spelling. The project began as a Thai slang directory; its current content scope includes English slang too.

## Visitor experience

Visitors can browse entries, use date-based Word of the Day, search spellings and romanizations, filter by tags, and open related words. The navbar changes the explanation language without changing the entry. In-page translation tabs are unnecessary because the locale switcher already handles that choice.

Cards show original spelling, a short language code, and romanization when available. Detail pages show the full language name, reviewed IPA beside the word, meanings, qualified origins, labelled examples, and claim-specific references. Whole cards navigate to the detail page; their tags remain separate links. The navbar has light and dark theme settings.

Entries awaiting source review have visible warnings. The current pilot covers 20 Thai and 20 English terms, not all 82 entries in the local database.

## Architecture

| Responsibility | Location |
| --- | --- |
| Localized routes and metadata | `src/app` |
| Shared UI and theme settings | `src/components` |
| Public content query policy | `src/lib/dictionary.ts` |
| Application query singleton | `src/lib/public-dictionary.ts` |
| Editorial validation | `src/lib/editorial-types.ts` |
| Transactional reviews and snapshots | `src/lib/editorial.ts` |
| Schema and additive migrations | `prisma/schema.prisma` and `prisma/migrations` |
| Reviewed pilot data | `prisma/reviewed-entries.json` |
| Repeatable starter import | `prisma/seed.ts` |
| Verification | `tests` and `scripts/verify-milestone-1.ts` |

The application uses Next.js 16, React 19, TypeScript, Tailwind 4, Radix primitives, Prisma 7, and a local SQLite database through LibSQL.

## Content rules

New entries default to draft. Only published entries appear in public queries, including metadata and sitemap. Existing public entries retained their visibility during migration but are not automatically considered reviewed.

Sources link to the particular claims they support. Unknown origins are explicitly unknown. Editorial examples must not be presented as sourced quotations. An editorial review records the actor, review date, note, and revision number, then saves current content and its immutable snapshot in one transaction. Concurrent edits use expected revision numbers.

Canonical slugs and entry IDs remain stable. Previous headwords, romanizations, and translated display words remain lookup aliases when reviewed content replaces them. Baseline revisions preserve the earlier data. The seed does not reset the database or overwrite later editorial revisions.

## Roadmap

Milestone 1 is complete. It establishes the reviewed bilingual pilot, sources, example provenance, publication statuses, revisions, and documentation. See [implementation status](IMPLEMENTATION_STATUS.md) and [the design decision](MILESTONE_1_DESIGN.md).

Milestone 2 adds controlled contribution. It needs validated submissions, spam controls, authenticated reviewers, and pending revisions that do not change the live entry before approval.

Production database and deployment planning follow the controlled workflow. Usage analytics can later replace tag association counts as the basis for trending. Automated research and ingestion require an editorial workflow first.

## Limits

There is no submission form, moderation queue, authentication, admin CMS, production database deployment, analytics pipeline, or AI ingestion implementation yet. The 42 legacy entries outside the reviewed pilot still require individual source review. Local SQLite is the current development configuration, not a production scalability decision.
