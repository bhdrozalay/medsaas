import 'dotenv/config'
import { PrismaClient } from '../generated/client'

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: tsx src/scripts/add-subscription.ts <email>')
    process.exit(1)
  }
  const prisma = new PrismaClient()
  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { profile: true } })
    if (!user) {
      console.error('User not found')
      process.exit(1)
    }
    let profile: any = {}
    try { profile = JSON.parse(user.profile || '{}') } catch { profile = {} }
    profile.subscription = profile.subscription || {
      planId: 'standard',
      planName: 'STANDARD',
      planDisplayName: 'Standard',
      price: 0,
      duration: 'monthly',
      durationText: 'Aylık',
      activatedAt: new Date().toISOString()
    }
    await prisma.user.update({ where: { email }, data: { profile: JSON.stringify(profile) } })
    console.log(`Subscription attached to ${email}`)
  } catch (err: any) {
    console.error('Failed to attach subscription:', err?.message || err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()