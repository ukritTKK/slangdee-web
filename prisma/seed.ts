import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { BASE_ENTRIES } from './base-entries.ts'
import { readFile } from 'node:fs/promises'
import { captureBaselines, seedReviewedEntries } from '../src/lib/editorial.ts'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
})

const prisma = new PrismaClient({ adapter })

function generateAliases(word: string): string[] {
  const normalized = word.trim().toLowerCase()

  const aliases = new Set<string>()

  aliases.add(normalized)

  aliases.add(normalized.replace(/\s+/g, ''))

  const parts = normalized.split(/\s+/)

  if (parts.length === 2) {
    const [a, b] = parts

    if (b.endsWith('s')) {
      aliases.add(`${a} ${b.slice(0, -1)}`)
      aliases.add(`${a}${b}`)
      aliases.add(`${a}${b.slice(0, -1)}`)
    } else {
      aliases.add(`${a} ${b}s`)
      aliases.add(`${a}${b}s`)
    }
  }

  aliases.add(normalized.replace(/\s+/g, '-'))

  aliases.delete(word.toLowerCase())

  return Array.from(aliases)
}

async function main() {
  await captureBaselines(prisma)
  const internetCulture = await prisma.tag.upsert({
    where: { slug: 'internet-culture' },
    update: {},
    create: { name: 'Internet Culture', slug: 'internet-culture' },
  })

  const tech = await prisma.tag.upsert({
    where: { slug: 'tech' },
    update: {},
    create: { name: 'Tech', slug: 'tech' },
  })

  const ai = await prisma.tag.upsert({
    where: { slug: 'ai' },
    update: {},
    create: { name: 'AI', slug: 'ai' },
  })

  const finance = await prisma.tag.upsert({
    where: { slug: 'finance' },
    update: {},
    create: { name: 'Finance', slug: 'finance' },
  })

  const relationships = await prisma.tag.upsert({
    where: { slug: 'relationships' },
    update: {},
    create: { name: 'Relationships', slug: 'relationships' },
  })

  const compliments = await prisma.tag.upsert({
    where: { slug: 'compliments' },
    update: {},
    create: { name: 'Compliments', slug: 'compliments' },
  })

  const emotions = await prisma.tag.upsert({
    where: { slug: 'emotions' },
    update: {},
    create: { name: 'Emotions', slug: 'emotions' },
  })

  const chat = await prisma.tag.upsert({
    where: { slug: 'chat' },
    update: {},
    create: { name: 'Chat', slug: 'chat' },
  })

  const tagIds: Record<string, number> = {
    'internet-culture': internetCulture.id,
    tech: tech.id,
    ai: ai.id,
    finance: finance.id,
    relationships: relationships.id,
    compliments: compliments.id,
    emotions: emotions.id,
    chat: chat.id,
  }


  await prisma.slang.upsert({
    where: { slug: 'rage-bait' },
    update: {},
    create: {
      status: 'PUBLISHED',
      slug: 'rage-bait',
      headword: 'Rage bait',
      originalLanguage: 'en',
      aliases: {
        create: generateAliases('ragebait').map((value) => ({ value })),
      },
      translations: {
        create: [
          {
            locale: 'en',
            word: 'Rage bait',
            ipa: 'ˈreɪdʒ beɪt',
            meaning:
              'Content intentionally designed to provoke anger or outrage to drive engagement.',
            originStatus: 'UNCERTAIN',
            origin:
              'Commonly used on social media platforms to describe posts that exploit emotional reactions.',
          },
          {
            locale: 'th',
            word: 'Rage bait',
            ipa: 'ˈreɪdʒ beɪt',
            meaning:
              'คอนเทนต์ที่ตั้งใจทำให้คนโกรธหรือหัวร้อนเพื่อเรียกยอดเอนเกจ',
            originStatus: 'UNCERTAIN',
            origin:
              'เริ่มใช้แพร่หลายในโซเชียลมีเดีย โดยเฉพาะคอนเทนต์แนวถกเถียง',
          },
        ],
      },
      examples: {
        create: [
          {
            locale: 'en',
            text: 'That post is obvious rage bait — don’t fall for it.',
          },
          {
            locale: 'th',
            text: 'โพสต์นี้ดูเป็น rage bait ชัด ๆ อย่าไปหลงกล',
          },
        ],
      },
      slangTags: {
        create: [{ tagId: internetCulture.id }],
      },
    },
  })

  await prisma.slang.upsert({
    where: { slug: 'parasocial' },
    update: {},
    create: {
      status: 'PUBLISHED',
      slug: 'parasocial',
      headword: 'Parasocial',
      originalLanguage: 'en',
      translations: {
        create: [
          {
            locale: 'en',
            word: 'Parasocial',
            ipa: 'ˌpærəˈsoʊʃəl',
            meaning:
              'Describing a one-sided emotional relationship with a public figure or creator.',
            originStatus: 'UNCERTAIN',
            origin:
              "Derived from the term 'parasocial relationship' in psychology.",
          },
          {
            locale: 'th',
            word: 'Parasocial',
            ipa: 'ˌpærəˈsoʊʃəl',
            meaning: 'ความรู้สึกผูกพันฝ่ายเดียวกับคนดังหรือครีเอเตอร์',
            originStatus: 'UNCERTAIN',
            origin: 'มาจากแนวคิดทางจิตวิทยาเกี่ยวกับ parasocial relationship',
          },
        ],
      },
      examples: {
        create: [
          {
            locale: 'en',
            text: 'Some fans develop parasocial relationships with streamers.',
          },
          {
            locale: 'th',
            text: 'แฟนบางคนมีความสัมพันธ์แบบ parasocial กับยูทูบเบอร์',
          },
        ],
      },
      slangTags: {
        create: [{ tagId: internetCulture.id }],
      },
    },
  })

  await prisma.slang.upsert({
    where: { slug: 'ai-slop' },
    update: {},
    create: {
      status: 'PUBLISHED',
      slug: 'ai-slop',
      headword: 'AI slop',
      originalLanguage: 'en',
      aliases: {
        create: generateAliases('AI slop').map((value) => ({ value })),
      },
      translations: {
        create: [
          {
            locale: 'en',
            word: 'AI slop',
            ipa: 'ˌeɪ ˈaɪ slɑp',
            meaning:
              'Low-quality, mass-produced content generated by AI with little human oversight.',
            originStatus: 'UNCERTAIN',
            origin:
              'Popularized as criticism of excessive AI-generated content online.',
          },
          {
            locale: 'th',
            word: 'AI slop',
            ipa: 'ˌeɪ ˈaɪ slɑp',
            meaning: 'คอนเทนต์คุณภาพต่ำที่สร้างโดย AI แบบจำนวนมาก',
            originStatus: 'UNCERTAIN',
            origin: 'ใช้ในเชิงวิจารณ์คอนเทนต์ AI ที่ขาดความตั้งใจหรือคุณภาพ',
          },
        ],
      },
      examples: {
        create: [
          {
            locale: 'en',
            text: 'My feed is full of AI slop lately.',
          },
          {
            locale: 'th',
            text: 'ฟีดช่วงนี้มีแต่ AI slop เต็มไปหมด',
          },
        ],
      },
      slangTags: {
        create: [{ tagId: ai.id }, { tagId: tech.id }],
      },
    },
  })

  await prisma.slang.upsert({
    where: { slug: '67' },
    update: {},
    create: {
      status: 'PUBLISHED',
      slug: '67',
      headword: '67',
      originalLanguage: 'th',
      translations: {
        create: [
          {
            locale: 'th',
            word: '67',
            meaning:
              "คำสแลงไทยที่ใช้แทนคำว่า 'งง' หรือ 'ไม่เข้าใจ' ในเชิงขำขัน",
            originStatus: 'UNCERTAIN',
            origin: 'มาจากการพิมพ์ผิดหรือการเล่นคำในคอมมูนิตี้ออนไลน์',
          },
          {
            locale: 'en',
            word: '67',
            meaning:
              'Thai internet slang used humorously to express confusion.',
            originStatus: 'UNCERTAIN',
            origin: 'Derived from Thai online communities and meme culture.',
          },
        ],
      },
      examples: {
        create: [
          {
            locale: 'th',
            text: 'อ่านแล้ว 67 มาก ไม่เข้าใจเลย',
          },
          {
            locale: 'en',
            text: 'I’m totally 67 after reading that.',
          },
        ],
      },
      slangTags: {
        create: [{ tagId: internetCulture.id }],
      },
    },
  })

  await prisma.slang.upsert({
    where: { slug: 'crypto-bros' },
    update: {},
    create: {
      status: 'PUBLISHED',
      slug: 'crypto-bros',
      headword: 'Crypto bros',
      originalLanguage: 'en',
      aliases: {
        create: generateAliases('crypto bros').map((value) => ({ value })),
      },
      translations: {
        create: [
          {
            locale: 'en',
            word: 'Crypto bros',
            ipa: 'ˈkrɪptoʊ broʊz',
            meaning:
              'A stereotype of people aggressively promoting cryptocurrency.',
            originStatus: 'UNCERTAIN',
            origin: 'Emerged during crypto booms as a satirical label.',
          },
          {
            locale: 'th',
            word: 'Crypto bros',
            ipa: 'ˈkrɪptoʊ broʊz',
            meaning: 'คำล้อเลียนกลุ่มคนที่คลั่งหรือเชียร์คริปโตมากเกินไป',
            originStatus: 'UNCERTAIN',
            origin: 'ใช้ในเชิงล้อเลียนช่วงกระแสคริปโตบูม',
          },
        ],
      },
      examples: {
        create: [
          {
            locale: 'en',
            text: 'Crypto bros are back on Twitter.',
          },
          {
            locale: 'th',
            text: 'พวก crypto bros เริ่มกลับมาอีกแล้ว',
          },
        ],
      },
      slangTags: {
        create: [{ tagId: finance.id }],
      },
    },
  })

  await prisma.slang.upsert({
    where: { slug: 'vibe-coding' },
    update: {},
    create: {
      status: 'PUBLISHED',
      slug: 'vibe-coding',
      headword: 'Vibe coding',
      originalLanguage: 'en',
      aliases: {
        create: generateAliases('Vibe coding').map((value) => ({ value })),
      },
      translations: {
        create: [
          {
            locale: 'en',
            word: 'Vibe coding',
            ipa: 'vaɪb ˈkoʊdɪŋ',
            meaning:
              'Programming guided by intuition and flow rather than strict planning.',
            originStatus: 'UNCERTAIN',
            origin:
              'Popularized by developers describing relaxed, exploratory coding.',
          },
          {
            locale: 'th',
            word: 'Vibe coding',
            ipa: 'vaɪb ˈkoʊdɪŋ',
            meaning: 'การเขียนโค้ดตามฟีลและอารมณ์ มากกว่าการวางแผนเป๊ะ ๆ',
            originStatus: 'UNCERTAIN',
            origin: 'เริ่มใช้ในหมู่นักพัฒนาเพื่ออธิบายการโค้ดแบบสบาย ๆ',
          },
        ],
      },
      examples: {
        create: [
          {
            locale: 'en',
            text: 'I wasn’t following a spec, just vibe coding all night.',
          },
          {
            locale: 'th',
            text: 'เมื่อคืนนี้นั่ง vibe coding ยาว ๆ เลย',
          },
        ],
      },
      slangTags: {
        create: [{ tagId: tech.id }],
      },
    },
  })

  for (const entry of BASE_ENTRIES) {
    const tagConnections = entry.tags
      .map((tag) => tagIds[tag])
      .filter((tagId): tagId is number => typeof tagId === 'number')
      .map((tagId) => ({ tagId }))

    await prisma.slang.upsert({
      where: { slug: entry.slug },
      update: {},
      create: {
        status: 'PUBLISHED',
        slug: entry.slug,
        headword: entry.headword,
        originalLanguage: 'th',
        romanization: entry.romanization,
        aliases: {
          create: [entry.romanization, entry.headword].map((value) => ({ value })),
        },
        translations: {
          create: [
            {
              locale: 'th',
              word: entry.headword,
              ipa: entry.ipa,
              meaning: entry.thaiMeaning,
              originStatus: 'UNCERTAIN',
              origin: entry.origin,
            },
            {
              locale: 'en',
              word: entry.englishWord,
              ipa: entry.ipa,
              meaning: entry.englishMeaning,
              originStatus: 'UNCERTAIN',
              origin: entry.origin,
            },
          ],
        },
        slangTags: { create: tagConnections },
      },
    })
  }

  await captureBaselines(prisma)
  const reviewedData: unknown = JSON.parse(await readFile('prisma/reviewed-entries.json', 'utf8'))
  const result = await seedReviewedEntries(prisma, reviewedData, new Date('2026-10-04T10:48:09Z'))
  console.log(`Reviewed pilot: ${result.applied} applied, ${result.skipped} unchanged.`)

  console.log(`Seeding completed: ${await prisma.slang.count()} slang entries.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
