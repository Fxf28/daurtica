// lib/get-dashboard-stats.ts
import { db } from "@/db";
import { classificationHistory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getDashboardStats(userId: string) {
  // Query dasar dengan limit untuk menghindari memory issues
  const baseData = await db.select().from(classificationHistory).where(eq(classificationHistory.userId, userId)).orderBy(desc(classificationHistory.createdAt)).limit(1000); // Limit untuk data yang sangat banyak

  if (baseData.length === 0) {
    return getEmptyStats();
  }

  // Hitung statistik dasar
  const total = baseData.length;

  const byLabel = baseData.reduce<Record<string, number>>((acc, item) => {
    acc[item.topLabel] = (acc[item.topLabel] || 0) + 1;
    return acc;
  }, {});

  const avgConfidence = baseData.reduce<number>((sum, item) => sum + (parseFloat(item.confidence) || 0), 0) / total;

  // Statistik berdasarkan waktu
  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentData = baseData.filter((item) => new Date(item.createdAt) >= last7Days);

  const monthlyData = baseData.filter((item) => new Date(item.createdAt) >= last30Days);

  // Statistik berdasarkan source
  const bySource = baseData.reduce<Record<string, number>>((acc, item) => {
    acc[item.source] = (acc[item.source] || 0) + 1;
    return acc;
  }, {});

  // Top labels dengan detail
  const topLabels = Object.entries(byLabel)
    .map(([label, count]) => ({
      label,
      count,
      percentage: (count / total) * 100,
      avgConfidence: baseData.filter((item) => item.topLabel === label).reduce((sum, item) => sum + parseFloat(item.confidence), 0) / count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Activity trends (7 hari terakhir)
  const dailyActivity = getDailyActivity(baseData, last7Days);

  // Confidence distribution
  const confidenceDistribution = getConfidenceDistribution(baseData);

  // Processing time stats (jika ada data)
  const processingStats = getProcessingStats(baseData);

  return {
    // Basic stats
    total,
    byLabel,
    bySource,
    avgConfidence: parseFloat(avgConfidence.toFixed(3)),

    // Time-based stats
    weeklyCount: recentData.length,
    monthlyCount: monthlyData.length,
    dailyActivity,

    // Detailed stats
    topLabels,
    confidenceDistribution,
    processingStats,

    // Recent activity (max 10 items)
    recent: baseData.slice(0, 10),

    // Performance metrics
    weeklyTrend: calculateTrend(baseData, last7Days, last30Days),
    mostActiveDay: getMostActiveDay(baseData),
  };
}

// Helper functions
function getEmptyStats() {
  return {
    total: 0,
    byLabel: {},
    bySource: {},
    avgConfidence: 0,
    weeklyCount: 0,
    monthlyCount: 0,
    dailyActivity: [],
    topLabels: [],
    confidenceDistribution: [],
    processingStats: null,
    recent: [],
    weeklyTrend: 0,
    mostActiveDay: null,
  };
}

function getDailyActivity(data: (typeof classificationHistory.$inferSelect)[], since: Date) {
  const dailyCounts: Record<string, number> = {};

  data.forEach((item) => {
    const date = new Date(item.createdAt).toISOString().split("T")[0];
    if (new Date(item.createdAt) >= since) {
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    }
  });

  // Isi missing days dengan 0
  const result = [];
  const currentDate = new Date(since);
  const today = new Date();

  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().split("T")[0];
    result.push({
      date: dateStr,
      count: dailyCounts[dateStr] || 0,
      day: currentDate.toLocaleDateString("id-ID", { weekday: "short" }),
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

function getConfidenceDistribution(data: (typeof classificationHistory.$inferSelect)[]) {
  const ranges = [
    { range: "90-100%", min: 0.9, max: 1.0, count: 0 },
    { range: "80-89%", min: 0.8, max: 0.9, count: 0 },
    { range: "70-79%", min: 0.7, max: 0.8, count: 0 },
    { range: "60-69%", min: 0.6, max: 0.7, count: 0 },
    { range: "50-59%", min: 0.5, max: 0.6, count: 0 },
    { range: "<50%", min: 0.0, max: 0.5, count: 0 },
  ];

  data.forEach((item) => {
    const confidence = parseFloat(item.confidence);
    for (const range of ranges) {
      if (confidence >= range.min && confidence < range.max) {
        range.count++;
        break;
      }
    }
  });

  return ranges.map((range) => ({
    ...range,
    percentage: (range.count / data.length) * 100,
  }));
}

function getProcessingStats(data: (typeof classificationHistory.$inferSelect)[]) {
  const itemsWithProcessingTime = data.filter((item) => typeof item.processingTime === "number");

  if (itemsWithProcessingTime.length === 0) return null;

  const times = itemsWithProcessingTime.map((item) => item.processingTime as number);
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

  return {
    avgProcessingTime: Math.round(avgTime),
    minProcessingTime: Math.min(...times),
    maxProcessingTime: Math.max(...times),
    totalWithProcessingTime: itemsWithProcessingTime.length,
  };
}

function calculateTrend(data: (typeof classificationHistory.$inferSelect)[], recentPeriod: Date, previousPeriod: Date) {
  const recentCount = data.filter((item) => new Date(item.createdAt) >= recentPeriod).length;

  const previousCount = data.filter((item) => new Date(item.createdAt) >= previousPeriod && new Date(item.createdAt) < recentPeriod).length;

  if (previousCount === 0) return recentCount > 0 ? 100 : 0;

  return ((recentCount - previousCount) / previousCount) * 100;
}

function getMostActiveDay(data: (typeof classificationHistory.$inferSelect)[]) {
  const dayCounts: Record<string, number> = {};

  data.forEach((item) => {
    const day = new Date(item.createdAt).toLocaleDateString("id-ID", { weekday: "long" });
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });

  if (Object.keys(dayCounts).length === 0) return null;

  return Object.entries(dayCounts).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}
