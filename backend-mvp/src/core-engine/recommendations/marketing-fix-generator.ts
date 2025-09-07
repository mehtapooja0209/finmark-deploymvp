import { ViolationMatch } from '../marketing-rules/fintech-rule-engine'
import { MarketingRule } from '../marketing-rules/rbi-marketing-loader'
import { geminiAnalyzer, GeminiAnalysisResult } from '../ai/gemini-marketing-analyzer'
import { logger } from '../../utils/logger'
import nlp from 'compromise'

export interface MarketingFix {
  originalText: string
  suggestedText: string
  reason: string
  rbiReference: {
    document: string
    section: string
    url?: string
  }
  priority: 'critical' | 'high' | 'medium' | 'low'
  implementationDifficulty: 'easy' | 'medium' | 'complex'
  marketingImpact: 'minimal' | 'moderate' | 'significant'
}

export interface MarketingRecommendations {
  overallApproach: string
  specificFixes: MarketingFix[]
  additionsRequired: Array<{
    element: string
    suggestedText: string
    placement: 'beginning' | 'end' | 'prominent' | 'footer'
    rbiRequirement: string
  }>
  toneAdjustments: Array<{
    issue: string
    suggestion: string
    example: string
  }>
  alternativeCopyVersions: Array<{
    version: string
    compliantText: string
    marketingStrength: 'high' | 'medium' | 'low'
    riskLevel: 'low' | 'medium' | 'high'
  }>
  complianceChecklist: string[]
}

export class MarketingFixGenerator {
  constructor() {}

  /**
   * Generate comprehensive marketing recommendations
   */
  async generateMarketingRecommendations(
    originalText: string,
    violations: ViolationMatch[],
    missingElements: string[],
    geminiInsights?: GeminiAnalysisResult
  ): Promise<MarketingRecommendations> {
    try {
      logger.info('Generating marketing recommendations', {
        textLength: originalText.length,
        violationsCount: violations.length,
        missingElementsCount: missingElements.length
      })

      // Generate specific fixes for violations
      const specificFixes = await this.generateSpecificFixes(originalText, violations)
      
      // Generate required additions
      const additionsRequired = await this.generateRequiredAdditions(missingElements)
      
      // Generate tone adjustments
      const toneAdjustments = await this.generateToneAdjustments(originalText, violations, geminiInsights)
      
      // Generate alternative copy versions
      const alternativeCopyVersions = await this.generateAlternativeCopyVersions(originalText, violations)
      
      // Create compliance checklist
      const complianceChecklist = this.generateComplianceChecklist(violations, missingElements)
      
      // Generate overall approach recommendation
      const overallApproach = this.generateOverallApproach(violations, geminiInsights)

      const recommendations: MarketingRecommendations = {
        overallApproach,
        specificFixes,
        additionsRequired,
        toneAdjustments,
        alternativeCopyVersions,
        complianceChecklist
      }

      logger.info('Marketing recommendations generated successfully', {
        fixesCount: specificFixes.length,
        additionsCount: additionsRequired.length,
        alternativeVersions: alternativeCopyVersions.length
      })

      return recommendations

    } catch (error: any) {
      logger.error('Failed to generate marketing recommendations', {
        error: error.message,
        violationsCount: violations.length
      })

      return this.getFallbackRecommendations(originalText, violations)
    }
  }

  /**
   * Generate specific fixes for each violation
   */
  private async generateSpecificFixes(
    text: string,
    violations: ViolationMatch[]
  ): Promise<MarketingFix[]> {
    const fixes: MarketingFix[] = []

    for (const violation of violations) {
      const fix = await this.createSpecificFix(text, violation)
      if (fix) {
        fixes.push(fix)
      }
    }

    // Sort by priority
    return fixes.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * Create specific fix for a violation
   */
  private async createSpecificFix(
    text: string,
    violation: ViolationMatch
  ): Promise<MarketingFix | null> {
    const rule = violation.rule
    const originalText = violation.matchedText

    // Generate compliant alternative based on violation type
    let suggestedText = ''
    let reason = ''
    let implementationDifficulty: 'easy' | 'medium' | 'complex' = 'easy'
    let marketingImpact: 'minimal' | 'moderate' | 'significant' = 'minimal'

    switch (violation.violationType) {
      case 'keyword_violation':
        const fix = this.fixKeywordViolation(originalText, rule)
        suggestedText = fix.text
        reason = fix.reason
        implementationDifficulty = fix.difficulty
        marketingImpact = fix.impact
        break

      case 'prohibited_claim':
        const claimFix = this.fixProhibitedClaim(originalText, rule)
        suggestedText = claimFix.text
        reason = claimFix.reason
        implementationDifficulty = claimFix.difficulty
        marketingImpact = claimFix.impact
        break

      case 'missing_required_element':
        const elementFix = this.fixMissingElement(originalText, rule)
        suggestedText = elementFix.text
        reason = elementFix.reason
        implementationDifficulty = elementFix.difficulty
        marketingImpact = elementFix.impact
        break

      default:
        return null
    }

    return {
      originalText,
      suggestedText,
      reason,
      rbiReference: {
        document: rule.citation.document,
        section: rule.citation.section,
        url: rule.citation.url
      },
      priority: violation.severity,
      implementationDifficulty,
      marketingImpact
    }
  }

  /**
   * Fix keyword violations
   */
  private fixKeywordViolation(
    originalText: string,
    rule: MarketingRule
  ): { text: string; reason: string; difficulty: 'easy' | 'medium' | 'complex'; impact: 'minimal' | 'moderate' | 'significant' } {
    const lowerText = originalText.toLowerCase()

    // Common violation fixes
    if (lowerText.includes('guaranteed')) {
      return {
        text: originalText.replace(/guaranteed?/gi, 'subject to eligibility'),
        reason: 'RBI prohibits guarantee claims in financial services marketing',
        difficulty: 'easy',
        impact: 'moderate'
      }
    }

    if (lowerText.includes('instant') && lowerText.includes('approval')) {
      return {
        text: originalText.replace(/instant approval/gi, 'quick processing subject to verification'),
        reason: 'Cannot promise instant approval as due diligence is required',
        difficulty: 'easy',
        impact: 'moderate'
      }
    }

    if (lowerText.includes('risk-free') || lowerText.includes('no risk')) {
      return {
        text: originalText.replace(/(risk-free|no risk)/gi, 'regulated financial service'),
        reason: 'All financial services carry inherent risks that must be disclosed',
        difficulty: 'easy',
        impact: 'significant'
      }
    }

    if (lowerText.includes('100%') && (lowerText.includes('safe') || lowerText.includes('secure'))) {
      return {
        text: originalText.replace(/100% (safe|secure)/gi, 'secure with industry-standard protection'),
        reason: 'Cannot make absolute security claims in digital financial services',
        difficulty: 'easy',
        impact: 'minimal'
      }
    }

    if (lowerText.includes('lowest') && lowerText.includes('rate')) {
      return {
        text: originalText.replace(/lowest rate/gi, 'competitive rates starting from'),
        reason: 'Cannot claim to have the lowest rates without substantiation',
        difficulty: 'easy',
        impact: 'moderate'
      }
    }

    // Generic fix
    return {
      text: originalText + ' (subject to terms and conditions)',
      reason: `Contains prohibited language according to ${rule.title}`,
      difficulty: 'easy',
      impact: 'minimal'
    }
  }

  /**
   * Fix prohibited claims
   */
  private fixProhibitedClaim(
    originalText: string,
    rule: MarketingRule
  ): { text: string; reason: string; difficulty: 'easy' | 'medium' | 'complex'; impact: 'minimal' | 'moderate' | 'significant' } {
    // More sophisticated claim fixing based on context
    const doc = nlp(originalText)
    
    if (doc.has('guaranteed approval')) {
      return {
        text: originalText.replace(/guaranteed approval/gi, 'streamlined approval process subject to eligibility'),
        reason: 'RBI prohibits guaranteed approval claims as lending decisions must be based on proper assessment',
        difficulty: 'medium',
        impact: 'significant'
      }
    }

    if (doc.has('no documentation')) {
      return {
        text: originalText.replace(/no documentation/gi, 'minimal documentation required'),
        reason: 'Due diligence and documentation are mandatory for financial services',
        difficulty: 'easy',
        impact: 'moderate'
      }
    }

    return {
      text: `${originalText} *Subject to eligibility criteria and regulatory compliance`,
      reason: `Claim requires qualification according to ${rule.title}`,
      difficulty: 'easy',
      impact: 'minimal'
    }
  }

  /**
   * Fix missing elements
   */
  private fixMissingElement(
    originalText: string,
    rule: MarketingRule
  ): { text: string; reason: string; difficulty: 'easy' | 'medium' | 'complex'; impact: 'minimal' | 'moderate' | 'significant' } {
    return {
      text: `${originalText}\n\n[Missing required disclosure: Please add ${rule.required_marketing_elements.join(', ')}]`,
      reason: `Required disclosure missing according to ${rule.title}`,
      difficulty: 'medium',
      impact: 'minimal'
    }
  }

  /**
   * Generate required additions
   */
  private async generateRequiredAdditions(
    missingElements: string[]
  ): Promise<MarketingRecommendations['additionsRequired']> {
    const additions: MarketingRecommendations['additionsRequired'] = []

    for (const element of missingElements) {
      const addition = this.createRequiredAddition(element)
      if (addition) {
        additions.push(addition)
      }
    }

    return additions
  }

  /**
   * Create required addition for missing element
   */
  private createRequiredAddition(element: string): MarketingRecommendations['additionsRequired'][0] | null {
    const lowerElement = element.toLowerCase()

    if (lowerElement.includes('apr') || lowerElement.includes('annual percentage rate')) {
      return {
        element: 'Annual Percentage Rate (APR)',
        suggestedText: 'Interest Rate: Starting from X% APR (subject to eligibility and credit assessment)',
        placement: 'prominent',
        rbiRequirement: 'Digital Lending Guidelines - Mandatory APR disclosure'
      }
    }

    if (lowerElement.includes('processing fee')) {
      return {
        element: 'Processing Fee',
        suggestedText: 'Processing Fee: Up to X% of loan amount or ₹X, whichever is lower',
        placement: 'prominent',
        rbiRequirement: 'Fee transparency requirements'
      }
    }

    if (lowerElement.includes('terms and conditions')) {
      return {
        element: 'Terms and Conditions',
        suggestedText: 'Terms & Conditions Apply. For detailed terms, visit [website link]',
        placement: 'end',
        rbiRequirement: 'Mandatory terms accessibility'
      }
    }

    if (lowerElement.includes('grievance') || lowerElement.includes('complaint')) {
      return {
        element: 'Grievance Redressal',
        suggestedText: 'For complaints/grievances, contact: [email] or [phone]. RBI Complaint Portal: cms.rbi.org.in',
        placement: 'footer',
        rbiRequirement: 'Customer Protection - Grievance redressal disclosure'
      }
    }

    if (lowerElement.includes('penalty') || lowerElement.includes('late')) {
      return {
        element: 'Penalty Charges',
        suggestedText: 'Late payment charges: X% per month on overdue amount',
        placement: 'prominent',
        rbiRequirement: 'Penalty disclosure requirements'
      }
    }

    // Generic addition
    return {
      element: element,
      suggestedText: `Please include: ${element}`,
      placement: 'end',
      rbiRequirement: 'RBI compliance requirement'
    }
  }

  /**
   * Generate tone adjustments
   */
  private async generateToneAdjustments(
    text: string,
    violations: ViolationMatch[],
    geminiInsights?: GeminiAnalysisResult
  ): Promise<MarketingRecommendations['toneAdjustments']> {
    const adjustments: MarketingRecommendations['toneAdjustments'] = []

    // Analyze current tone
    const doc = nlp(text)
    const sentences = doc.sentences().out('array')

    // Check for overly aggressive marketing language
    if (doc.has('#Superlative') || text.includes('!')) {
      adjustments.push({
        issue: 'Overly aggressive or superlative language',
        suggestion: 'Use balanced, informative tone appropriate for financial services',
        example: 'Instead of "Best loan ever!" use "Competitive loan options available"'
      })
    }

    // Check for urgency tactics
    if (text.toLowerCase().includes('limited time') || text.toLowerCase().includes('act now')) {
      adjustments.push({
        issue: 'High-pressure urgency tactics',
        suggestion: 'Replace urgency with information and transparency',
        example: 'Instead of "Limited time offer!" use "Current rates and terms available"'
      })
    }

    // Use Gemini insights if available
    if (geminiInsights?.marketingToneAssessment) {
      if (geminiInsights.marketingToneAssessment.appropriateness !== 'appropriate') {
        adjustments.push({
          issue: 'Marketing tone concerns identified by AI analysis',
          suggestion: geminiInsights.marketingToneAssessment.suggestions.join('; '),
          example: 'See AI-generated specific recommendations'
        })
      }
    }

    // Check for financial service appropriateness
    if (doc.has('(easy|quick|fast|instant) (money|cash)')) {
      adjustments.push({
        issue: 'Language suggesting easy money or quick cash',
        suggestion: 'Emphasize responsible lending and proper financial planning',
        example: 'Focus on "financial solutions" rather than "quick cash"'
      })
    }

    return adjustments
  }

  /**
   * Generate alternative copy versions
   */
  private async generateAlternativeCopyVersions(
    originalText: string,
    violations: ViolationMatch[]
  ): Promise<MarketingRecommendations['alternativeCopyVersions']> {
    const versions: MarketingRecommendations['alternativeCopyVersions'] = []

    try {
      // Conservative compliant version
      let conservativeVersion = originalText
      for (const violation of violations) {
        conservativeVersion = conservativeVersion.replace(
          violation.matchedText,
          this.getConservativeReplacement(violation.matchedText)
        )
      }
      
      versions.push({
        version: 'Conservative Compliant',
        compliantText: conservativeVersion + '\n\n*Terms and conditions apply. Subject to eligibility criteria.',
        marketingStrength: 'low',
        riskLevel: 'low'
      })

      // Balanced version
      let balancedVersion = originalText
      for (const violation of violations) {
        balancedVersion = balancedVersion.replace(
          violation.matchedText,
          this.getBalancedReplacement(violation.matchedText)
        )
      }

      versions.push({
        version: 'Balanced Marketing',
        compliantText: balancedVersion + '\n\nSubject to eligibility. T&C apply.',
        marketingStrength: 'medium',
        riskLevel: 'low'
      })

      // Use Gemini for enhanced version if available
      const geminiRecommendations = await geminiAnalyzer.generateMarketingRecommendations(
        originalText,
        violations,
        []
      )

      if (geminiRecommendations.improvedCopy && geminiRecommendations.improvedCopy !== originalText) {
        versions.push({
          version: 'AI-Enhanced Compliant',
          compliantText: geminiRecommendations.improvedCopy,
          marketingStrength: 'high',
          riskLevel: 'low'
        })
      }

    } catch (error: any) {
      logger.error('Error generating alternative versions', { error: error.message })
    }

    return versions
  }

  /**
   * Generate compliance checklist
   */
  private generateComplianceChecklist(
    violations: ViolationMatch[],
    missingElements: string[]
  ): string[] {
    const checklist: string[] = []

    // Basic compliance items
    checklist.push('✓ Remove all guarantee/assured/100% claims')
    checklist.push('✓ Add "Terms and Conditions Apply" disclaimer')
    checklist.push('✓ Include grievance redressal contact information')
    checklist.push('✓ Display APR prominently for interest rate advertisements')
    checklist.push('✓ Avoid high-pressure or urgency-based marketing language')
    
    // Violation-specific items
    const violationCategories = new Set(violations.map(v => v.rule.category))
    
    if (violationCategories.has('mandatory_marketing_disclosure')) {
      checklist.push('✓ Ensure all mandatory disclosures are prominent and clear')
    }
    
    if (violationCategories.has('interest_rate_marketing')) {
      checklist.push('✓ Show all-inclusive APR, not just base rates')
    }
    
    if (violationCategories.has('payment_security_marketing')) {
      checklist.push('✓ Qualify security claims with appropriate disclaimers')
    }

    // Missing elements
    if (missingElements.length > 0) {
      checklist.push(`✓ Add missing required elements: ${missingElements.slice(0, 3).join(', ')}`)
    }

    // General best practices
    checklist.push('✓ Ensure customer can easily access detailed terms')
    checklist.push('✓ Use clear, jargon-free language')
    checklist.push('✓ Maintain professional, trustworthy tone')
    checklist.push('✓ Include RBI complaint portal reference if applicable')

    return checklist
  }

  /**
   * Generate overall approach recommendation
   */
  private generateOverallApproach(
    violations: ViolationMatch[],
    geminiInsights?: GeminiAnalysisResult
  ): string {
    const severeCriticalCount = violations.filter(v => v.severity === 'critical').length
    const highCount = violations.filter(v => v.severity === 'high').length

    if (severeCriticalCount > 0) {
      return 'IMMEDIATE ACTION REQUIRED: Critical RBI violations detected. Recommend complete content review and legal consultation before publication. Focus on transparency, proper disclosures, and removal of prohibited claims.'
    }

    if (highCount > 2) {
      return 'SIGNIFICANT REVISION NEEDED: Multiple high-priority violations require systematic content review. Recommend adopting a more conservative, disclosure-focused approach while maintaining marketing effectiveness through value proposition rather than claims.'
    }

    if (violations.length > 0) {
      return 'MODERATE IMPROVEMENTS NEEDED: Address identified violations while maintaining marketing appeal. Focus on balanced messaging that combines marketing effectiveness with regulatory compliance through proper disclaimers and transparent communication.'
    }

    return 'MINOR ENHANCEMENTS: Content is largely compliant. Consider adding proactive disclosures and refining language to meet best practices for RBI-compliant marketing communications.'
  }

  /**
   * Get conservative replacement text
   */
  private getConservativeReplacement(text: string): string {
    const lower = text.toLowerCase()
    
    if (lower.includes('guaranteed')) return 'subject to eligibility'
    if (lower.includes('instant')) return 'quick processing'
    if (lower.includes('risk-free')) return 'regulated service'
    if (lower.includes('100%')) return 'high-level'
    if (lower.includes('best') || lower.includes('lowest')) return 'competitive'
    
    return 'available service'
  }

  /**
   * Get balanced replacement text  
   */
  private getBalancedReplacement(text: string): string {
    const lower = text.toLowerCase()
    
    if (lower.includes('guaranteed')) return 'streamlined process'
    if (lower.includes('instant')) return 'fast processing'
    if (lower.includes('risk-free')) return 'secure and regulated'
    if (lower.includes('100%')) return 'highly'
    if (lower.includes('best') || lower.includes('lowest')) return 'highly competitive'
    
    return 'quality service'
  }

  /**
   * Get fallback recommendations
   */
  private getFallbackRecommendations(
    text: string,
    violations: ViolationMatch[]
  ): MarketingRecommendations {
    return {
      overallApproach: 'Manual review required - automated recommendation generation failed',
      specificFixes: [],
      additionsRequired: [
        {
          element: 'Terms and Conditions',
          suggestedText: 'Terms & Conditions Apply',
          placement: 'end',
          rbiRequirement: 'General compliance requirement'
        }
      ],
      toneAdjustments: [
        {
          issue: 'Automated analysis unavailable',
          suggestion: 'Manual tone review recommended',
          example: 'Consult RBI guidelines directly'
        }
      ],
      alternativeCopyVersions: [],
      complianceChecklist: [
        '✓ Manual compliance review required',
        '✓ Consult RBI guidelines',
        '✓ Consider legal review'
      ]
    }
  }
}

// Export singleton instance
export const marketingFixGenerator = new MarketingFixGenerator()