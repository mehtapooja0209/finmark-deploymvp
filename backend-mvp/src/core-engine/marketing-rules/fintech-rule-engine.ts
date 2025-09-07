import { MarketingRule, marketingLoader } from './rbi-marketing-loader'
import { logger } from '../../utils/logger'
import { performanceLogger } from '../../utils/logger'

export interface ViolationMatch {
  rule: MarketingRule
  violationType: 'keyword_violation' | 'missing_required_element' | 'prohibited_claim'
  matchedText: string
  startIndex: number
  endIndex: number
  context: string // Surrounding text for context
  confidence: number // 0-1 confidence score
  severity: 'critical' | 'high' | 'medium' | 'low'
  scoringImpact: number // Points deducted from total score
}

export interface ComplianceAnalysis {
  overallScore: number // 0-100
  complianceLevel: 'compliant' | 'needs_review' | 'non_compliant'
  violations: ViolationMatch[]
  missingElements: string[]
  requiredDisclaimers: string[]
  appliedRules: MarketingRule[]
  analysisMetadata: {
    textLength: number
    rulesEvaluated: number
    processingTimeMs: number
    riskLevel: 'low' | 'medium' | 'high'
  }
}

export class FinTechRuleEngine {
  private readonly CONTEXT_WINDOW = 50 // Characters around violation for context
  private readonly HIGH_CONFIDENCE_THRESHOLD = 0.8
  private readonly MEDIUM_CONFIDENCE_THRESHOLD = 0.6

  constructor() {}

  /**
   * Analyze marketing text for RBI compliance violations
   */
  async analyzeMarketingCompliance(
    text: string,
    marketingContext?: string
  ): Promise<ComplianceAnalysis> {
    const startTime = Date.now()
    
    try {
      logger.info('Starting marketing compliance analysis', {
        textLength: text.length,
        hasContext: !!marketingContext
      })

      // Get applicable rules
      const applicableRules = await this.getApplicableRules(text, marketingContext)
      
      // Detect violations
      const violations = await this.detectViolations(text, applicableRules)
      
      // Find missing required elements
      const missingElements = await this.findMissingElements(text, applicableRules)
      
      // Check for required disclaimers
      const requiredDisclaimers = await this.checkRequiredDisclaimers(text)
      
      // Calculate compliance score
      const overallScore = this.calculateComplianceScore(violations, missingElements)
      
      const processingTime = Date.now() - startTime
      
      const analysis: ComplianceAnalysis = {
        overallScore,
        complianceLevel: this.getComplianceLevel(overallScore),
        violations,
        missingElements,
        requiredDisclaimers,
        appliedRules: applicableRules,
        analysisMetadata: {
          textLength: text.length,
          rulesEvaluated: applicableRules.length,
          processingTimeMs: processingTime,
          riskLevel: this.getRiskLevel(violations)
        }
      }

      logger.info('Marketing compliance analysis completed', {
        score: overallScore,
        violationsCount: violations.length,
        missingElementsCount: missingElements.length,
        processingTime
      })

      return analysis

    } catch (error: any) {
      logger.error('Marketing compliance analysis failed', {
        error: error.message,
        textLength: text.length
      })
      throw new Error(`Analysis failed: ${error.message}`)
    }
  }

  /**
   * Get rules applicable to the text and marketing context
   */
  private async getApplicableRules(text: string, context?: string): Promise<MarketingRule[]> {
    const allRules = await marketingLoader.getCachedRules()
    
    if (!context) {
      // If no specific context, apply all rules
      return allRules
    }
    
    // Get context-specific rules
    const contextRules = marketingLoader.getRulesByMarketingContext(context)
    
    // Also include rules whose keywords appear in the text
    const textWords = this.extractKeywords(text)
    const keywordRules = marketingLoader.getRulesByKeywords(textWords)
    
    // Combine and deduplicate
    const applicableRules = new Set([...contextRules, ...keywordRules])
    
    return Array.from(applicableRules)
  }

  /**
   * Detect violations in marketing text
   */
  private async detectViolations(text: string, rules: MarketingRule[]): Promise<ViolationMatch[]> {
    const violations: ViolationMatch[] = []
    const normalizedText = text.toLowerCase()

    for (const rule of rules) {
      // Check for violation keywords
      for (const keyword of rule.violation_keywords) {
        const matches = this.findTextMatches(normalizedText, keyword.toLowerCase())
        for (const match of matches) {
          violations.push({
            rule,
            violationType: 'keyword_violation',
            matchedText: text.substring(match.start, match.end),
            startIndex: match.start,
            endIndex: match.end,
            context: this.getContext(text, match.start, match.end),
            confidence: this.calculateConfidence(keyword, match.matchedText),
            severity: rule.severity,
            scoringImpact: this.getScoringImpact(rule.severity)
          })
        }
      }

      // Check for prohibited claims
      for (const claim of rule.prohibited_marketing_claims) {
        const matches = this.findTextMatches(normalizedText, claim.toLowerCase())
        for (const match of matches) {
          violations.push({
            rule,
            violationType: 'prohibited_claim',
            matchedText: text.substring(match.start, match.end),
            startIndex: match.start,
            endIndex: match.end,
            context: this.getContext(text, match.start, match.end),
            confidence: this.calculateConfidence(claim, match.matchedText),
            severity: rule.severity,
            scoringImpact: this.getScoringImpact(rule.severity) * 1.5 // Higher impact for prohibited claims
          })
        }
      }
    }

    // Sort violations by severity and confidence
    return violations.sort((a, b) => {
      if (a.severity !== b.severity) {
        return this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity)
      }
      return b.confidence - a.confidence
    })
  }

  /**
   * Find missing required elements
   */
  private async findMissingElements(text: string, rules: MarketingRule[]): Promise<string[]> {
    const missingElements: string[] = []
    const normalizedText = text.toLowerCase()

    for (const rule of rules) {
      for (const requiredElement of rule.required_marketing_elements) {
        const isPresent = this.checkElementPresence(normalizedText, requiredElement)
        if (!isPresent) {
          missingElements.push(`${requiredElement} (Required by: ${rule.title})`)
        }
      }
    }

    return [...new Set(missingElements)] // Remove duplicates
  }

  /**
   * Check for required disclaimers
   */
  private async checkRequiredDisclaimers(text: string): Promise<string[]> {
    const requiredDisclaimers = marketingLoader.getRequiredDisclaimers()
    const missingDisclaimers: string[] = []
    const normalizedText = text.toLowerCase()

    for (const disclaimer of requiredDisclaimers) {
      const isPresent = this.checkElementPresence(normalizedText, disclaimer)
      if (!isPresent) {
        missingDisclaimers.push(disclaimer)
      }
    }

    return missingDisclaimers
  }

  /**
   * Calculate overall compliance score (0-100)
   */
  private calculateComplianceScore(violations: ViolationMatch[], missingElements: string[]): number {
    const methodology = marketingLoader.getScoringMethodology()
    if (!methodology) {
      throw new Error('Scoring methodology not available')
    }

    let score = methodology.total_possible_score

    // Deduct points for violations
    for (const violation of violations) {
      score += violation.scoringImpact // scoringImpact is negative
    }

    // Deduct points for missing elements
    score += missingElements.length * methodology.missing_required_elements

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  /**
   * Get compliance level based on score
   */
  private getComplianceLevel(score: number): 'compliant' | 'needs_review' | 'non_compliant' {
    if (score >= 80) return 'compliant'
    if (score >= 50) return 'needs_review'
    return 'non_compliant'
  }

  /**
   * Get risk level based on violations
   */
  private getRiskLevel(violations: ViolationMatch[]): 'low' | 'medium' | 'high' {
    const criticalViolations = violations.filter(v => v.severity === 'critical').length
    const highViolations = violations.filter(v => v.severity === 'high').length

    if (criticalViolations > 0 || highViolations > 2) return 'high'
    if (highViolations > 0 || violations.length > 3) return 'medium'
    return 'low'
  }

  /**
   * Find all matches of a pattern in text
   */
  private findTextMatches(text: string, pattern: string): Array<{start: number, end: number, matchedText: string}> {
    const matches: Array<{start: number, end: number, matchedText: string}> = []
    
    // Simple substring search (can be enhanced with regex for more complex patterns)
    let startIndex = 0
    while (true) {
      const index = text.indexOf(pattern, startIndex)
      if (index === -1) break
      
      matches.push({
        start: index,
        end: index + pattern.length,
        matchedText: text.substring(index, index + pattern.length)
      })
      
      startIndex = index + 1
    }
    
    return matches
  }

  /**
   * Get context around a violation
   */
  private getContext(text: string, startIndex: number, endIndex: number): string {
    const contextStart = Math.max(0, startIndex - this.CONTEXT_WINDOW)
    const contextEnd = Math.min(text.length, endIndex + this.CONTEXT_WINDOW)
    
    return text.substring(contextStart, contextEnd).trim()
  }

  /**
   * Calculate confidence score for a match
   */
  private calculateConfidence(keyword: string, matchedText: string): number {
    // Exact match gets highest confidence
    if (keyword.toLowerCase() === matchedText.toLowerCase()) {
      return 1.0
    }
    
    // Partial matches get lower confidence based on similarity
    const similarity = this.calculateStringSimilarity(keyword.toLowerCase(), matchedText.toLowerCase())
    return Math.max(0.5, similarity) // Minimum 0.5 confidence for any match
  }

  /**
   * Calculate string similarity (simple Levenshtein-based)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  /**
   * Check if required element is present in text
   */
  private checkElementPresence(text: string, element: string): boolean {
    // Enhanced logic to check for variations of required elements
    const elementLower = element.toLowerCase()
    
    // Direct substring match
    if (text.includes(elementLower)) return true
    
    // Check for common variations
    const variations = this.getElementVariations(elementLower)
    return variations.some(variation => text.includes(variation))
  }

  /**
   * Get common variations of required elements
   */
  private getElementVariations(element: string): string[] {
    const variations: string[] = [element]
    
    // Add common variations for specific elements
    if (element.includes('apr')) {
      variations.push('annual percentage rate', 'effective interest rate', 'yearly interest rate')
    }
    if (element.includes('processing fee')) {
      variations.push('service charge', 'handling fee', 'administrative fee')
    }
    if (element.includes('terms and conditions')) {
      variations.push('t&c', 'terms & conditions', 'tnc', 'terms of service')
    }
    if (element.includes('grievance')) {
      variations.push('complaint', 'customer service', 'support', 'help')
    }
    
    return variations
  }

  /**
   * Get scoring impact based on severity
   */
  private getScoringImpact(severity: MarketingRule['severity']): number {
    const methodology = marketingLoader.getScoringMethodology()
    if (!methodology) return -10
    
    switch (severity) {
      case 'critical': return methodology.critical_violations
      case 'high': return methodology.high_violations
      case 'medium': return methodology.medium_violations
      case 'low': return -3
      default: return -5
    }
  }

  /**
   * Get severity weight for sorting
   */
  private getSeverityWeight(severity: MarketingRule['severity']): number {
    switch (severity) {
      case 'critical': return 4
      case 'high': return 3
      case 'medium': return 2
      case 'low': return 1
      default: return 0
    }
  }

  /**
   * Extract keywords from text for rule matching
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - can be enhanced with NLP
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word))
      .slice(0, 50) // Limit to first 50 keywords for performance
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
    ])
    return stopWords.has(word)
  }
}

// Export singleton instance
export const ruleEngine = new FinTechRuleEngine()