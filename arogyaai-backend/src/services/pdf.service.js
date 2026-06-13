import PDFDocument from 'pdfkit'
import {
  PDF_CONFIG,
  addPDFHeader,
  addPDFFooter,
  addSectionTitle,
  addKeyValue,
  addBulletList,
  addInfoBox,
  addTable,
  addDisclaimer,
  setPDFHeaders,
  formatPDFDate,
  formatNumber
} from '../utils/pdfHelpers.js'

/**
 * Generate Doctor Summary PDF
 * Used for: Sharing with healthcare professionals
 */
export function generateDoctorSummaryPDF(doctorSummary, user, res) {
  try {
    const doc = new PDFDocument({
      margin: PDF_CONFIG.margins.top,
      size: 'A4'
    })

    // Set response headers
    setPDFHeaders(
      res,
      `ArogyaAI_Doctor_Summary_${user?.name?.replace(/\s+/g, '_') || 'Patient'}_${Date.now()}.pdf`
    )

    doc.pipe(res)

    // Header
    addPDFHeader(doc)

    // Patient Info Section
    addSectionTitle(doc, 'Patient Information')
    addKeyValue(doc, 'Name', user?.name || 'Not provided', true)
    addKeyValue(doc, 'Report Generated', formatPDFDate(doctorSummary.generatedAt), true)
    addKeyValue(doc, 'Report Type', 'Doctor Summary (30-day)', true)

    doc.moveDown(PDF_CONFIG.spacing.section)

    // Clinical Summary
    addSectionTitle(doc, 'Clinical Summary')
    if (doctorSummary.summary) {
      doc
        .fontSize(PDF_CONFIG.fonts.bodySize)
        .font('Helvetica')
        .fillColor(PDF_CONFIG.colors.text)
        .text(doctorSummary.summary, {
          lineGap: 4,
          align: 'justify'
        })
    }

    doc.moveDown(PDF_CONFIG.spacing.section)

    // Key Findings
    if (doctorSummary.keyFindings?.length > 0) {
      addSectionTitle(doc, 'Key Findings')
      addBulletList(doc, doctorSummary.keyFindings)
    }

    // Recommendations
    if (doctorSummary.recommendations?.length > 0) {
      addSectionTitle(doc, 'Recommendations')
      addBulletList(doc, doctorSummary.recommendations)
    }

    // Disclaimer
    addDisclaimer(doc)

    // Footer
    addPDFFooter(doc)

    doc.end()
  } catch (error) {
    console.error('Error generating doctor summary PDF:', error)
    throw new Error(`Failed to generate PDF: ${error.message}`)
  }
}

/**
 * Generate Weekly Health Report PDF
 * Used for: Personal health tracking
 */
export function generateWeeklyReportPDF(weeklySummary, user, res) {
  try {
    const doc = new PDFDocument({
      margin: PDF_CONFIG.margins.top,
      size: 'A4'
    })

    setPDFHeaders(
      res,
      `ArogyaAI_Weekly_Report_${user?.name?.replace(/\s+/g, '_') || 'User'}_${Date.now()}.pdf`
    )

    doc.pipe(res)

    // Header
    addPDFHeader(doc)

    // Summary Info
    addSectionTitle(doc, 'Weekly Health Summary')
    addKeyValue(doc, 'Name', user?.name || 'Not provided', true)
    addKeyValue(doc, 'Week of', formatPDFDate(new Date()), true)

    doc.moveDown(PDF_CONFIG.spacing.section)

    // Health Metrics
    if (weeklySummary.stats) {
      addSectionTitle(doc, 'Health Metrics')

      const stats = weeklySummary.stats
      const metricsData = [
        ['Metric', 'Your Value', 'Target'],
        [
          'Average Sleep',
          `${formatNumber(stats.avgSleep)} hrs`,
          `${stats.targetSleepHrs} hrs`
        ],
        [
          'Avg Daily Calories',
          `${Math.round(stats.avgCalories)}`,
          `${stats.targetCalories}`
        ],
        [
          'Avg Protein Intake',
          `${formatNumber(stats.avgProtein)}g`,
          `${stats.targetProteinG}g`
        ],
        [
          'Water Intake',
          `${Math.round(stats.totalWater)}ml`,
          `${stats.targetWaterMl * 7}ml (weekly)`
        ],
        [
          'Activity Time',
          `${Math.round(stats.totalActivity)} mins`,
          `${stats.activitySessions} sessions`
        ]
      ]

      addTable(doc, metricsData[0], metricsData.slice(1))
    }

    // Weekly Insights
    if (weeklySummary.insights?.length > 0) {
      addSectionTitle(doc, 'AI-Generated Insights')
      addBulletList(doc, weeklySummary.insights)
    }

    // Disclaimer
    addDisclaimer(doc)

    // Footer
    addPDFFooter(doc)

    doc.end()
  } catch (error) {
    console.error('Error generating weekly report PDF:', error)
    throw new Error(`Failed to generate PDF: ${error.message}`)
  }
}

/**
 * Generate Meal History PDF
 * Used for: Nutrition tracking
 */
export function generateMealHistoryPDF(meals, user, res) {
  try {
    const doc = new PDFDocument({
      margin: PDF_CONFIG.margins.top,
      size: 'A4'
    })

    setPDFHeaders(
      res,
      `ArogyaAI_Meal_History_${user?.name?.replace(/\s+/g, '_') || 'User'}_${Date.now()}.pdf`
    )

    doc.pipe(res)

    // Header
    addPDFHeader(doc)

    // Info
    addSectionTitle(doc, 'Meal History Report')
    addKeyValue(doc, 'Name', user?.name || 'Not provided', true)
    addKeyValue(doc, 'Report Period', 'Last 30 days', true)
    addKeyValue(doc, 'Total Meals Logged', meals?.length || 0, true)

    doc.moveDown(PDF_CONFIG.spacing.section)

    // Summary Stats
    if (meals && meals.length > 0) {
      addSectionTitle(doc, 'Nutrition Summary')

      const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0)
      const totalProtein = meals.reduce((sum, m) => sum + (m.proteinG || 0), 0)
      const avgCalories = Math.round(totalCalories / meals.length)

      addKeyValue(doc, 'Total Calories', `${totalCalories.toLocaleString()}`, true)
      addKeyValue(doc, 'Average per Meal', `${avgCalories}`, true)
      addKeyValue(doc, 'Total Protein', `${formatNumber(totalProtein)}g`, true)

      doc.moveDown(PDF_CONFIG.spacing.section)

      // Recent Meals
      addSectionTitle(doc, 'Recent Meals (Last 10)')

      const recentMeals = meals.slice(-10).reverse()
      const mealData = [
        ['Date', 'Meal', 'Calories', 'Protein (g)'],
        ...recentMeals.map(m => [
          new Date(m.date).toLocaleDateString('en-IN'),
          m.foodName || 'N/A',
          m.calories?.toString() || 'N/A',
          formatNumber(m.proteinG)
        ])
      ]

      addTable(doc, mealData[0], mealData.slice(1))
    }

    // Disclaimer
    addDisclaimer(doc)

    // Footer
    addPDFFooter(doc)

    doc.end()
  } catch (error) {
    console.error('Error generating meal history PDF:', error)
    throw new Error(`Failed to generate PDF: ${error.message}`)
  }
}

/**
 * Generate Comprehensive Health Report (All-in-One)
 * Used for: Complete health overview
 */
export function generateComprehensiveHealthReportPDF(
  summaryData,
  user,
  res
) {
  try {
    const doc = new PDFDocument({
      margin: PDF_CONFIG.margins.top,
      size: 'A4',
      autoFirstPage: false,
      bufferPages: true
    })

    setPDFHeaders(
      res,
      `ArogyaAI_Health_Report_${user?.name?.replace(/\s+/g, '_') || 'User'}_${Date.now()}.pdf`
    )

    doc.pipe(res)

    // PAGE 1: Cover & Summary
    doc.addPage()
    addPDFHeader(doc)

    addSectionTitle(doc, 'Comprehensive Health Report')
    addKeyValue(doc, 'Patient Name', user?.name || 'Not provided', true)
    addKeyValue(doc, 'Report Generated', formatPDFDate(new Date()), true)
    addKeyValue(doc, 'Report Period', 'Last 30 days', true)

    doc.moveDown()

    if (summaryData.doctorSummary?.summary) {
      addSectionTitle(doc, 'Executive Summary')
      doc
        .fontSize(PDF_CONFIG.fonts.bodySize)
        .font('Helvetica')
        .fillColor(PDF_CONFIG.colors.text)
        .text(summaryData.doctorSummary.summary, {
          lineGap: 4,
          align: 'justify'
        })
    }

    // PAGE 2: Health Metrics
    doc.addPage()
    addPDFHeader(doc)

    addSectionTitle(doc, 'Health Metrics')

    if (summaryData.stats) {
      const stats = summaryData.stats
      const metricsData = [
        ['Metric', 'Current', 'Target', 'Status'],
        [
          'Sleep',
          `${formatNumber(stats.avgSleep)} hrs`,
          `${stats.targetSleepHrs} hrs`,
          stats.avgSleep >= stats.targetSleepHrs ? 'OK' : 'Review'
        ],
        [
          'Daily Calories',
          `${Math.round(stats.avgCalories)}`,
          `${stats.targetCalories}`,
          stats.avgCalories <= stats.targetCalories ? 'OK' : 'Monitor'
        ],
        [
          'Protein',
          `${formatNumber(stats.avgProtein)}g`,
          `${stats.targetProteinG}g`,
          stats.avgProtein >= stats.targetProteinG ? 'OK' : 'Review'
        ],
        [
          'Water',
          `${Math.round(stats.totalWater)}ml`,
          `${stats.targetWaterMl * 7}ml`,
          stats.totalWater >= stats.targetWaterMl * 7 ? 'OK' : 'Review'
        ]
      ]

      addTable(doc, metricsData[0], metricsData.slice(1))
    }

    // PAGE 3: Insights & Recommendations
    if (summaryData.insights?.length > 0 || summaryData.recommendations?.length > 0) {
      doc.addPage()
      addPDFHeader(doc)

      if (summaryData.insights?.length > 0) {
        addSectionTitle(doc, 'Health Insights')
        addBulletList(doc, summaryData.insights)
      }

      if (summaryData.recommendations?.length > 0) {
        addSectionTitle(doc, 'Recommendations')
        addBulletList(doc, summaryData.recommendations)
      }
    }

    // Final Page: Disclaimer & Info
    doc.addPage()
    addPDFHeader(doc)

    addSectionTitle(doc, 'Important Information')

    addInfoBox(
      doc,
      'Medical Disclaimer',
      'This report is generated by ArogyaAI for informational purposes only. It does not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before making any health-related decisions.'
    )

    addInfoBox(
      doc,
      'About ArogyaAI',
      'ArogyaAI uses artificial intelligence to analyze your health data and provide personalized insights. Your data is encrypted and protected according to healthcare privacy standards.'
    )

    // Footer on all pages
    const pages = doc.bufferedPageRange()
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i)
      addPDFFooter(doc, i + 1)
    }

    doc.end()
  } catch (error) {
    console.error('Error generating comprehensive report:', error)
    throw new Error(`Failed to generate PDF: ${error.message}`)
  }
}

/**
 * Validate PDF generation inputs
 */
export function validatePDFInputs(data, type = 'doctor-summary') {
  const validationRules = {
    'doctor-summary': {
      required: ['summary', 'generatedAt'],
      optional: ['keyFindings', 'recommendations']
    },
    'weekly-report': {
      required: ['stats', 'insights'],
      optional: []
    },
    'meal-history': {
      required: [],
      optional: ['meals']
    },
    'comprehensive': {
      required: [],
      optional: ['stats', 'insights', 'recommendations']
    }
  }

  const rules = validationRules[type]
  if (!rules) {
    throw new Error(`Unknown PDF type: ${type}`)
  }

  for (const field of rules.required) {
    if (!(field in data)) {
      throw new Error(`Missing required field for ${type}: ${field}`)
    }
  }

  return true
}
