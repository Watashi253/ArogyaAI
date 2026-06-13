import { prisma } from '../config/db.js'

export async function fetchUserProfile(userId) {
  return prisma.userProfile.findUnique({
    where: { userId }
  })
}

export async function fetchUser(userId) {
  return prisma.user.findUnique({
    where: { id: userId }
  })
}

export async function fetchWeeklyData(userId) {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [sleepLogs, meals, waterLogs, activities, profile] = await Promise.all([
    prisma.sleepLog.findMany({
      where: { userId, date: { gte: sevenDaysAgo } }
    }),
    prisma.mealLog.findMany({
      where: { userId, date: { gte: sevenDaysAgo } }
    }),
    prisma.waterLog.findMany({
      where: { userId, date: { gte: sevenDaysAgo } }
    }),
    prisma.activityLog.findMany({
      where: { userId, date: { gte: sevenDaysAgo } }
    }),
    prisma.userProfile.findUnique({
      where: { userId }
    })
  ])

  return { sleepLogs, meals, waterLogs, activities, profile }
}

export async function fetchMonthlyData(userId) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [profile, user, meals, sleepLogs, activities, medicines, labValues] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId }
    }),
    prisma.user.findUnique({
      where: { id: userId }
    }),
    prisma.mealLog.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } }
    }),
    prisma.sleepLog.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } }
    }),
    prisma.activityLog.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } }
    }),
    prisma.medicine.findMany({
      where: {
        userId,
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } }
        ]
      }
    }),
    prisma.labValue.findMany({
      where: { userId },
      orderBy: { testDate: 'desc' },
      take: 20
    })
  ])

  return { profile, user, meals, sleepLogs, activities, medicines, labValues }
}

export async function saveMealLog(userId, mealData) {
  return prisma.mealLog.create({
    data: {
      userId,
      date: new Date(),
      ...mealData
    }
  })
}