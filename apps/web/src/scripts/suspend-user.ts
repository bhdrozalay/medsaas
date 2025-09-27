import 'dotenv/config'
import { PrismaClient } from '../generated/client'

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: tsx src/scripts/suspend-user.ts <email>')
    process.exit(1)
  }
  const prisma = new PrismaClient()
  try {
    const updated = await prisma.user.update({
      where: { email },
      data: { status: 'SUSPENDED' }
    })
    console.log(`User ${email} suspended. New status: ${updated.status}`)
  } catch (err: any) {
    console.error('Failed to suspend user:', err?.message || err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()