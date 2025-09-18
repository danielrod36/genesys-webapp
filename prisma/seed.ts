/*
  Seed script for Genesys RPG Manager.
  Run with: npx ts-node prisma/seed.ts
*/
import { PrismaClient, UserRole, Characteristic } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const ownerId = process.env.DEFAULT_OWNER_ID || '00000000-0000-0000-0000-000000000000'
  // Create or update owner user
  await prisma.user.upsert({
    where: { id: ownerId },
    update: {},
    create: {
      id: ownerId,
      email: 'owner@example.com',
      name: 'Owner',
      role: UserRole.OWNER,
    },
  })

  // Seed a few skills
  const skills = [
    { name: 'Athletics', characteristic: Characteristic.BRAWN },
    { name: 'Charm', characteristic: Characteristic.PRESENCE },
    { name: 'Computers', characteristic: Characteristic.INTELLECT },
    { name: 'Perception', characteristic: Characteristic.CUNNING },
  ]
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: {
        name: skill.name,
        characteristic: skill.characteristic,
        isCareerDefault: false,
      },
    })
  }
  console.log('Seed data has been loaded.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
  .finally(async () => {
    await prisma.$disconnect()
  })