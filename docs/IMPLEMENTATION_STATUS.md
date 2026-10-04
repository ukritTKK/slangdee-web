# Slangdee implementation status

Snapshot date: 2026-10-04. Reference: the Planning roadmap's Milestone 1.

## Milestone 1 complete

Slangdee is a bilingual dictionary of Thai and English slang. The local database has 82 entries, including 40 source-reviewed entries. The pilot contains 20 Thai and 20 English terms.

| Requirement | Implemented result |
| --- | --- |
| Product scope | Home, search, root metadata, and detail metadata describe Thai and English slang. |
| Evidence | A shared source registry links references to meanings, pronunciation, origins, usage, and sourced examples. |
| Pilot review | Each of the 40 entries has bilingual meanings, IPA, bilingual editorial examples, and a usage reference. |
| Origins | Reviewed claims have origin references. Unknown origins display an explicit unknown message. Legacy claims are marked uncertain. |
| Example provenance | Editorial and sourced examples have separate types and visible labels. The pilot uses original editorial examples, not copied quotations. |
| Publication | New records default to draft. Drafts and archives do not appear in detail pages, metadata, home, tag counts, related words, search, autocomplete, or sitemap. |
| Revisions | Editorial changes and publication changes save immutable full snapshots in the same transaction. Expected revisions detect stale edits. |
| Preservation | All 65 pre-existing entries retain their IDs and canonical slugs. Baselines preserve prior content; old translated-word lookups remain aliases. |
| Repeatable seed | The second and later runs skip the same reviewed data and do not overwrite later editorial changes. |
| Documentation | This status, the handbook, source policy, design decision, and decision log are version-controlled project documents. |

The remaining 42 legacy entries await source review. They remain public for URL compatibility and have visible review warnings. They are not part of the reviewed pilot. Their unverified pronunciation is not presented as IPA.

## Current application

The Next.js 16 application uses Prisma 7 and local SQLite through LibSQL. Visitors can browse both locales, switch locale in the navbar, search original words and aliases, open canonical detail pages, use clickable tags, and select light or dark mode. Word cards retain their original-language headword and romanization. Detail pages show the full language name and verified IPA beside the word.

The daily selection is date-based. Latest entries are ranked by creation time. Trending tags count published entry associations, not measured popularity.

## Verification

The completed checks are:

- `npm test` passes all 10 tests, including database integration tests.
- `npx tsc --noEmit` passes.
- `npm run lint` passes.
- `npm run build` passes.
- `npm run seed` applies 40 pilot reviews, then reports 0 applied and 40 unchanged on repeat runs.
- `node --experimental-strip-types scripts/verify-milestone-1.ts` checks the 65 baselines and all 40 pilot entries.
- Production HTTP checks against an isolated database copy verify bilingual detail rendering, old alias redirects, citations, review labels, autocomplete, sitemap, and private-entry exclusion.
- Browser inspection verifies the English and Thai detail layout.

The build reports an outdated `baseline-browser-mapping` data warning. Node reports a module-type detection warning for TypeScript scripts. Neither check fails.

See [the design decision](MILESTONE_1_DESIGN.md), [source policy](BASE_DATA_SOURCES.md), and [decision log](MILESTONE_1_DECISIONS.tsv).

## Next milestone

Milestone 2 is controlled contribution. Add validated submissions, authenticated editorial review, rate limiting and spam controls, and pending edits separated from published content. No submission endpoint, authenticated admin interface, account system, ingestion process, or production deployment was added in Milestone 1.

Continue reviewing the 42 legacy entries before treating the full starter database as reliable. The old `67` confusion definition is specifically queued for correction rather than counted as verified.
