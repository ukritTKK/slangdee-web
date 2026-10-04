# Milestone 1: reviewed dictionary content

Decision date: 2026-10-04. Scope: the Planning roadmap's first milestone, not submissions, accounts, or ingestion.

## Design decision

Two candidates were compared: normalized current content with immutable revision snapshots, and a published-revision pointer with JSON as the content store. The normalized design preserves the existing IDs, URLs, search queries, and relational constraints. The pointer design would require new search projections and a wider migration before it could preserve current behavior.

The selected design keeps current content in the existing tables. A shared source registry links evidence to the particular translation claim it supports. Entry references support usage; sourced examples link directly to a source. Each editorial write records a complete revision snapshot in the same transaction. This atomic snapshot boundary was retained from the second candidate.

The comparison covered canonical URL preservation, evidence integrity, concurrent edits, repeatable seeds, and migration size. A cross-review favored normalized content on all five criteria for this milestone.

## Contracts

- `createDictionary(client)` owns public queries. Every query limits entries to `PUBLISHED`, including relation counts, metadata, related words, autocomplete, and sitemap. Exact canonical slugs take priority over ambiguous aliases.
- `parseReviewedEntries(input)` validates external seed data. Each reviewed entry needs two meanings, two examples, IPA, and meaning, pronunciation, and usage evidence. Known origin claims need their own references; unknown origins have no invented explanation.
- `publishReviewedEntry(client, entry, options)` writes current content, evidence, review metadata, and an immutable snapshot atomically. The expected revision detects concurrent edits.
- `setPublicationStatus(client, id, status, options)` changes visibility and saves a snapshot atomically. New publication requires completed review.
- `captureBaselines(client)` preserves the pre-review content. `seedReviewedEntries` skips an already-applied content hash and never overwrites a later revision.

## Migration and editorial policy

The additive migration retains all existing IDs and slugs. Existing public content stays public but is labelled as awaiting source review. New records default to draft. Legacy origins are marked uncertain; unreviewed pronunciation is not presented as verified IPA. The backup and baseline manifest in `.audit` allow preservation checks without resetting the database. Replaced headwords, romanizations, and translated words remain aliases, so old lookup URLs still resolve.

The pilot reviews 20 Thai and 20 English entries. Definitions are paraphrases and examples are newly authored, labelled editorial rather than passed off as quotations. References support only their recorded claims. Dictionary evidence does not prove a slang term's first use or popularity.

Milestone 2 must separate pending edits from live published content before community contribution is enabled. This milestone supplies the content and revision foundation, not an authenticated editorial interface.

Source titles, publishers, kinds, and access dates are shared catalog metadata. An editorial review updates the catalog and captures its values in that entry's immutable snapshot. Other current entries using that source see the corrected catalog metadata. The snapshot preserves the metadata as it was at each revision. Source evidence links and notes remain entry-specific.

Future SQLite migrations must preserve the immutable-revision triggers, locale-validation triggers, and example-provenance check. They are explicit SQL constraints rather than Prisma-generated application validation.

The seed replaces examples and tag membership for reviewed entries. Their prior versions remain in the baseline snapshot. The one-time `scripts/repair-legacy-lookups.ts` repaired translated-word aliases missed in the first local import. Its retained implementation changes only aliases and the revision snapshot. It preserves later content corrections and publication status, and makes no changes on a repeat run.

The LibSQL 0.8 local client's transaction close does not close its native database handle. Windows can therefore keep a temporary test database locked after Prisma disconnects. Garbage collection was not a reliable cleanup boundary. The test runner creates its own temporary directory, runs the database tests in a child process, and removes that directory after the process exits. This does not change application behavior.

## Verification

Run migration and seeding against the local database, then compare all pre-existing IDs and slugs with the baseline manifest. Integration tests use a separate database to exercise evidence validation, atomic revisions, repeatable seed application, canonical lookup, and unpublished-entry exclusion. Check actual rendered detail pages and autocomplete, then run typecheck, lint, tests, and production build.
