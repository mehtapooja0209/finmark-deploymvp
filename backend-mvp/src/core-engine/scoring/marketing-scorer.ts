import { ViolationMatch, ComplianceAnalysis } from '../marketing-rules/fintech-rule-engine'
import { MarketingRule } from '../marketing-rules/rbi-marketing-loader'
import { logger } from '../../utils/logger'

export interface ScoreBreakdown {
  totalScore: number
  baseScore: number
  deductions: {
    criticalViolations: number
    highViolations: number
    mediumViolations: number
    lowViolations: number
    missingElements: number
    prohibitedClaims: number
  }
  categoryScores: {
    [category: string]: {
      score: number
      maxPossible: number
      violations: number
      weight: number
    }
  }
  complianceLevel: 'compliant' | 'needs_review' | 'non_compliant'
  colorCode: 'green' | 'yellow' | 'red'
  riskIndicators: {
    level: 'low' | 'medium' | 'high' | 'critical'
    factors: string[]
    immediateActions: string[]
  }
}

export interface ComplianceReport {
  score: ScoreBreakdown
  violations: ViolationMatch[]
  missingElements: string[]
  recommendations: string[]
  citationsRequired: Array<{
    rule: MarketingRule
    violation: string
    citation: string
    url?: string
  }>
  complianceSummary: {
    keyFindings: string[]
    riskAssessment: string
    nextSteps: string[]
  }
}

export class MarketingComplianceScorer {
  private readonly BASE_SCORE = 100
  private readonly CATEGORY_WEIGHTS = {
    'digital_lending_marketing': 30,
    'payment_systems_marketing': 20,
    'payment_aggregator_marketing': 15,
    'nbfc_marketing': 15,
    'fair_practices_marketing': 10,
    'customer_protection_marketing': 10
  }

  constructor() {}

  /**
   * Generate comprehensive compliance report with scoring
   */
  async generateComplianceReport(analysis: ComplianceAnalysis): Promise<ComplianceReport> {
    try {
      logger.info('Generating compliance report', {
        overallScore: analysis.overallScore,
        violationsCount: analysis.violations.length
      })

      const scoreBreakdown = await this.calculateDetailedScore(
        analysis.violations,
        analysis.missingElements,
        analysis.appliedRules
      )

      const citationsRequired = this.generateCitations(analysis.violations)
      const recommendations = await this.generateRecommendations(analysis)
      const complianceSummary = this.generateComplianceSummary(analysis, scoreBreakdown)

      const report: ComplianceReport = {
        score: scoreBreakdown,
        violations: analysis.violations,
        missingElements: analysis.missingElements,
        recommendations,
        citationsRequired,
        complianceSummary
      }

      logger.info('Compliance report generated successfully', {
        finalScore: scoreBreakdown.totalScore,
        complianceLevel: scoreBreakdown.complianceLevel,
        citationsCount: citationsRequired.length
      })

      return report

    } catch (error: any) {
      logger.error('Failed to generate compliance report', {
        error: error.message,
        violationsCount: analysis.violations.length
      })
      throw new Error(`Report generation failed: ${error.message}`)
    }
  }

  /**
   * Calculate detailed score breakdown
   */
  private async calculateDetailedScore(
    violations: ViolationMatch[],
    missingElements: string[],
    appliedRules: MarketingRule[]
  ): Promise<ScoreBreakdown> {
    let totalScore = this.BASE_SCORE

    // Calculate deductions by severity
    const deductions = {
      criticalViolations: 0,
      highViolations: 0,
      mediumViolations: 0,
      lowViolations: 0,
      missingElements: 0,
      prohibitedClaims: 0
    }

    // Process violations
    for (const violation of violations) {
      const deduction = Math.abs(violation.scoringImpact)
      
      switch (violation.severity) {
        case 'critical':
          deductions.criticalViolations += deduction
          break
        case 'high':
          deductions.highViolations += deduction
          break
        case 'medium':
          deductions.mediumViolations += deduction
          break
        case 'low':
          deductions.lowViolations += deduction
          break
      }

      if (violation.violationType === 'prohibited_claim') {
        deductions.prohibitedClaims += deduction * 0.5 // Additional penalty for prohibited claims
      }

      totalScore += violation.scoringImpact // scoringImpact is negative
    }

    // Deduct for missing elements
    deductions.missingElements = missingElements.length * 5
    totalScore -= deductions.missingElements

    // Calculate category scores
    const categoryScores = this.calculateCategoryScores(violations, appliedRules)

    // Determine compliance level and color
    const complianceLevel = this.getComplianceLevel(totalScore)
    const colorCode = this.getColorCode(totalScore)
    
    // Assess risk indicators
    const riskIndicators = this.assessRiskIndicators(violations, missingElements)

    return {
      totalScore: Math.max(0, Math.min(100, Math.round(totalScore))),
      baseScore: this.BASE_SCORE,
      deductions,
      categoryScores,
      complianceLevel,
      colorCode,
      riskIndicators
    }
  }

  /**
   * Calculate scores by category
   */
  private calculateCategoryScores(
    violations: ViolationMatch[],
    appliedRules: MarketingRule[]
  ): { [category: string]: { score: number; maxPossible: number; violations: number; weight: number } } {
    const categoryScores: any = {}

    // Group violations by category
    const violationsByCategory: { [key: string]: ViolationMatch[] } = {}
    
    for (const violation of violations) {
      const category = violation.rule.category
      if (!violationsByCategory[category]) {
        violationsByCategory[category] = []
      }
      violationsByCategory[category].push(violation)
    }

    // Calculate score for each category
    Object.entries(this.CATEGORY_WEIGHTS).forEach(([category, weight]) => {
      const categoryViolations = violationsByCategory[category] || []
      const maxPossible = weight
      let categoryScore = maxPossible

      // Deduct points for violations in this category
      for (const violation of categoryViolations) {
        categoryScore += (violation.scoringImpact * (weight / 100)) // Scale by category weight
      }

      categoryScores[category] = {
        score: Math.max(0, Math.round(categoryScore)),
        maxPossible,
        violations: categoryViolations.length,
        weight
      }
    })

    return categoryScores
  }

  /**
   * Generate citations for violations
   */
  private generateCitations(violations: ViolationMatch[]): Array<{
    rule: MarketingRule
    violation: string
    citation: string
    url?: string
  }> {
    const citations: Array<{
      rule: MarketingRule
      violation: string
      citation: string
      url?: string
    }> = []

    // Group violations by rule to avoid duplicate citations
    const violationsByRule = new Map<string, ViolationMatch[]>()
    
    for (const violation of violations) {
      const ruleId = violation.rule.rule_id
      if (!violationsByRule.has(ruleId)) {
        violationsByRule.set(ruleId, [])
      }
      violationsByRule.get(ruleId)!.push(violation)
    }

    // Generate citations for each rule with violations
    violationsByRule.forEach((ruleViolations, ruleId) => {
      const rule = ruleViolations[0].rule
      const violationTexts = ruleViolations.map(v => `"${v.matchedText}"`).join(', ')
      
      const citationText = `${rule.citation.document} - ${rule.citation.title} (${rule.citation.date}) - Section: ${rule.citation.section}`
      
      citations.push({
        rule,
        violation: violationTexts,
        citation: citationText,
        url: rule.citation.url
      })
    })

    return citations
  }

  /**
   * Generate actionable recommendations
   */
  private async generateRecommendations(analysis: ComplianceAnalysis): Promise<string[]> {
    const recommendations: string[] = []

    // Recommendations based on violations
    const violationsByType = new Map<string, ViolationMatch[]>()
    
    for (const violation of analysis.violations) {
      const key = `${violation.rule.category}_${violation.severity}`
      if (!violationsByType.has(key)) {
        violationsByType.set(key, [])
      }
      violationsByType.get(key)!.push(violation)
    }

    // Generate category-specific recommendations
    violationsByType.forEach((violations, key) => {
      const [category, severity] = key.split('_')
      
      switch (category) {
        case 'mandatory_marketing_disclosure':
          recommendations.push(`URGENT: Add mandatory disclosures including APR, fees, and terms clearly in your marketing materials`)
          break
        case 'interest_rate_marketing':
          recommendations.push(`Display complete APR instead of teaser rates in all interest rate advertisements`)
          break
        case 'payment_security_marketing':
          recommendations.push(`Remove absolute security claims and add appropriate disclaimers about digital payment risks`)
          break
        case 'aggregator_authorization_marketing':
          recommendations.push(`Verify and correctly display your RBI authorization status - avoid false approval claims`)
          break
        case 'microfinance_marketing':
          recommendations.push(`Emphasize responsible lending and add over-borrowing warnings to microfinance marketing`)
          break
      }
    })

    // Recommendations for missing elements
    if (analysis.missingElements.length > 0) {
      recommendations.push(`Add missing required elements: ${analysis.missingElements.slice(0, 3).join(', ')}${analysis.missingElements.length > 3 ? '...' : ''}`)
    }

    // Risk-based recommendations
    const riskLevel = this.getRiskLevel(analysis.violations)
    switch (riskLevel) {
      case 'critical':
        recommendations.unshift(`IMMEDIATE ACTION REQUIRED: Critical RBI violations detected that could result in penalties up to ₹1 crore`)
        break
      case 'high':
        recommendations.unshift(`HIGH PRIORITY: Multiple serious violations require immediate attention before publishing`)
        break
      case 'medium':
        recommendations.push(`Review and address moderate-risk violations to improve compliance`)
        break
    }

    return [...new Set(recommendations)] // Remove duplicates
  }

  /**
   * Generate compliance summary
   */
  private generateComplianceSummary(
    analysis: ComplianceAnalysis,
    scoreBreakdown: ScoreBreakdown
  ): { keyFindings: string[]; riskAssessment: string; nextSteps: string[] } {
    const keyFindings: string[] = []
    const nextSteps: string[] = []

    // Key findings
    keyFindings.push(`Overall compliance score: ${scoreBreakdown.totalScore}/100`)
    
    if (analysis.violations.length > 0) {
      const criticalCount = analysis.violations.filter(v => v.severity === 'critical').length
      const highCount = analysis.violations.filter(v => v.severity === 'high').length
      
      if (criticalCount > 0) {
        keyFindings.push(`${criticalCount} critical RBI violations detected`)
      }
      if (highCount > 0) {
        keyFindings.push(`${highCount} high-priority violations found`)
      }
    }

    if (analysis.missingElements.length > 0) {
      keyFindings.push(`${analysis.missingElements.length} required disclosures missing`)
    }

    // Risk assessment
    let riskAssessment = 'Low compliance risk'
    if (scoreBreakdown.totalScore < 50) {
      riskAssessment = 'CRITICAL: High penalty risk - immediate remediation required'
    } else if (scoreBreakdown.totalScore < 80) {
      riskAssessment = 'MODERATE: Review needed before publication'
    }

    // Next steps
    if (scoreBreakdown.totalScore < 80) {
      nextSteps.push('Address all critical and high-priority violations')
      nextSteps.push('Add missing required disclosures')
      nextSteps.push('Review marketing claims for RBI compliance')
      nextSteps.push('Consider legal review before publication')
    } else {
      nextSteps.push('Minor improvements recommended')
      nextSteps.push('Regular compliance monitoring advised')
    }

    return {
      keyFindings,
      riskAssessment,
      nextSteps
    }
  }

  /**
   * Get compliance level from score
   */
  private getComplianceLevel(score: number): 'compliant' | 'needs_review' | 'non_compliant' {
    if (score >= 80) return 'compliant'
    if (score >= 50) return 'needs_review'
    return 'non_compliant'
  }

  /**
   * Get color code from score
   */
  private getColorCode(score: number): 'green' | 'yellow' | 'red' {
    if (score >= 80) return 'green'
    if (score >= 50) return 'yellow'
    return 'red'
  }

  /**
   * Assess risk indicators
   */
  private assessRiskIndicators(
    violations: ViolationMatch[],
    missingElements: string[]
  ): { level: 'low' | 'medium' | 'high' | 'critical'; factors: string[]; immediateActions: string[] } {
    const factors: string[] = []
    const immediateActions: string[] = []

    const criticalCount = violations.filter(v => v.severity === 'critical').length
    const highCount = violations.filter(v => v.severity === 'high').length

    let level: 'low' | 'medium' | 'high' | 'critical' = 'low'

    if (criticalCount > 0) {
      level = 'critical'
      factors.push(`${criticalCount} critical RBI violations`)
      immediateActions.push('Stop marketing campaign immediately')
      immediateActions.push('Legal review required')
      immediateActions.push('Remediate critical violations before proceeding')
    } else if (highCount > 2 || missingElements.length > 5) {
      level = 'high'
      factors.push(`${highCount} high-priority violations`)
      if (missingElements.length > 5) {
        factors.push(`${missingElements.length} missing disclosures`)
      }
      immediateActions.push('Review before publication')
      immediateActions.push('Address high-priority issues')
    } else if (highCount > 0 || violations.length > 3) {
      level = 'medium'
      factors.push('Multiple compliance issues detected')
      immediateActions.push('Review and improve before publication')
    }

    return { level, factors, immediateActions }
  }

  /**
   * Get risk level from violations
   */
  private getRiskLevel(violations: ViolationMatch[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalCount = violations.filter(v => v.severity === 'critical').length
    const highCount = violations.filter(v => v.severity === 'high').length

    if (criticalCount > 0) return 'critical'
    if (highCount > 2) return 'high'
    if (highCount > 0 || violations.length > 3) return 'medium'
    return 'low'
  }
}

// Export singleton instance
export const complianceScorer = new MarketingComplianceScorer()