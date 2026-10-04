# Dictionary sources and review policy

Review date: 2026-10-04.

## Reviewed pilot

[reviewed-entries.json](../prisma/reviewed-entries.json) contains 20 Thai and 20 English entries. Each record includes original-language spelling, IPA, two localized meanings, two authored examples, aliases, tags, origin status, and claim-specific references. The database stores those references as structured records.

Thai pronunciation comes from Thai or English Wiktionary. Modern usage references also include Matichon, Thairath, Arsom Siam, the Princess Maha Chakri Sirindhorn Anthropology Centre, and a Nakhon Pathom Rajabhat University language paper. English references primarily use Cambridge Dictionary. Collins supports the AI-programming meaning of vibe coding, with Wiktionary pronunciation.

A source supports only its listed claims. A literal dictionary sense does not establish a modern figurative sense. For example, ขิง needs separate evidence for boasting rather than only the dictionary's ginger sense. Meanings are paraphrases; examples are written for Slangdee and labelled editorial. They are not quotations from the cited pages.

Cambridge sometimes blocked direct page retrieval during research. Its complete lexical entries, including IPA and examples, were available through search results. The checked pages are linked in each record. These references establish documented usage, not a term's first use.

## Corrections and uncertainty

The pilot corrects romanization previously stored as IPA, the vowel length of แซ่บ in standard Thai, and the definition of vibe coding. Unknown origins stay empty and display an explicit unknown label. ปัง and เกรียน have meanings and pronunciation evidence, but the pilot does not assert an origin pathway for either.

A dictionary's etymology is attributed to that dictionary. It does not establish an independently verified first appearance. No origin is inferred solely from the spelling of a loanword.

## Legacy starter data

[base-entries.ts](../prisma/base-entries.ts) and the legacy section of [seed.ts](../prisma/seed.ts) retain the earlier starter content. Broad resource lists from that pass were not per-entry evidence. Do not treat them as proof for every old definition or origin.

The local database has 42 entries outside the reviewed pilot. They await individual review, retain their canonical URLs, and display warnings. Their historical data remains in immutable baseline revisions. The seed's `67` claim that the meme means confusion conflicts with reporting describing no fixed meaning and is queued for review.

## Updating reviewed content

Run migrations and regenerate Prisma before seeding:

```bash
npx prisma migrate deploy
npx prisma generate
npm run seed
```

The reviewed seed is repeatable. A matching content hash skips the entry, even if an editor later changes it. A changed seed refuses to overwrite a later revision. Use the internal editorial operation with an expected revision for deliberate corrections.

A review requires evidence for meaning, pronunciation, and usage, plus origin evidence when an origin is stated. Editorial examples require no quotation source. A sourced example requires a recorded source URL. Record a review actor, note, and date. The transaction saves a complete snapshot with its evidence.

Source catalog metadata is shared. Each revision snapshot preserves its values at review time. The source access date is not a claim of the term's first appearance or popularity.
