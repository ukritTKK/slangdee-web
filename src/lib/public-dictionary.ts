import { prisma } from '@/lib/prisma'
import { createDictionary } from '@/lib/dictionary'

export const dictionary = createDictionary(prisma)
