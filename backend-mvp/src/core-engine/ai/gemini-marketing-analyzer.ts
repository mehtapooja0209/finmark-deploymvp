import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from '../../utils/logger'
import { MarketingRule } from '../marketing-rules/rbi-marketing-loader'
import { ViolationMatch } from '../marketing-rules/fintech-rule-engine'

export interface GeminiAnalysisResult {
  complianceScore: number
  overallStatus: 'compliant' | 'needs_review' | 'non_compliant'
  aiViolations: Array<{
    text: string
    ruleCategory: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    explanation: string
    suggestedFix: string
    confidenceScore: number
  }>
  contextualInsights: string[]
  marketingToneAssessment: {
    tone: string
    appropriateness: 'appropriate' | 'concerning' | 'inappropriate'
    suggestions: string[]
  }
  processingTimeMs: number
}

export class GeminiMarketingAnalyzer {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY environment variable is required')
    }

    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' })
  }

  /**
   * Analyze marketing content using Google Gemini AI
   */
  async analyzeMarketingContent(
    text: string,
    applicableRules: MarketingRule[],
    ruleBasedViolations: ViolationMatch[]
  ): Promise<GeminiAnalysisResult> {
    const startTime = Date.now()

    try {
      logger.info('Starting Gemini AI marketing analysis', {
        textLength: text.length,
        rulesCount: applicableRules.length,
        ruleBasedViolations: ruleBasedViolations.length
      })

      const prompt = this.buildAnalysisPrompt(text, applicableRules, ruleBasedViolations)
      
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const analysisText = response.text()

      const analysis = this.parseGeminiResponse(analysisText)
      analysis.processingTimeMs = Date.now() - startTime

      logger.info('Gemini AI analysis completed', {
        score: analysis.complianceScore,
        aiViolationsFound: analysis.aiViolations.length,
        processingTime: analysis.processingTimeMs
      })

      return analysis

    } catch (error: any) {
      const processingTime = Date.now() - startTime
      logger.error('Gemini AI analysis failed', {
        error: error.message,
        processingTime,
        textLength: text.length
      })

      // Return fallback analysis
      return this.getFallbackAnalysis(processingTime)
    }
  }

  /**
   * Build comprehensive analysis prompt for Gemini
   */
  private buildAnalysisPrompt(
    text: string,
    rules: MarketingRule[],
    ruleBasedViolations: ViolationMatch[]
  ): string {
    const ruleContext = rules.map(rule => ({
      id: rule.rule_id,
      category: rule.category,
      title: rule.title,
      description: rule.description,
      violations: rule.violation_keywords,
      required: rule.required_marketing_elements,
      prohibited: rule.prohibited_marketing_claims
    }))

    const existingViolations = ruleBasedViolations.map(v => ({
      rule: v.rule.rule_id,
      text: v.matchedText,
      type: v.violationType,
      severity: v.severity
    }))

    return `
You are an expert RBI (Reserve Bank of India) compliance analyst specializing in FinTech marketing materials. 
Analyze the following marketing content for compliance with RBI guidelines.

MARKETING CONTENT TO ANALYZE:
"""
${text}
"""

APPLICABLE RBI RULES:
${JSON.stringify(ruleContext, null, 2)}

RULE-BASED VIOLATIONS ALREADY DETECTED:
${JSON.stringify(existingViolations, null, 2)}

ANALYSIS REQUIREMENTS:
1. Provide contextual analysis beyond simple keyword matching
2. Assess marketing tone and appropriateness for financial services
3. Identify subtle violations that rule-based detection might miss
4. Consider customer perspective and potential for misleading interpretation
5. Evaluate compliance with fair marketing practices
6. Check for implicit claims or implications that violate RBI guidelines

OUTPUT FORMAT (JSON):
{
  "complianceScore": <number 0-100>,
  "overallStatus": "<compliant|needs_review|non_compliant>",
  "aiViolations": [
    {
      "text": "<problematic text from content>",
      "ruleCategory": "<relevant RBI rule category>",
      "severity": "<critical|high|medium|low>",
      "explanation": "<detailed explanation of why this violates RBI guidelines>",
      "suggestedFix": "<specific suggested replacement text>",
      "confidenceScore": <0-1>
    }
  ],
  "contextualInsights": [
    "<insight about overall marketing approach>",
    "<observation about customer impact>",
    "<note about regulatory risk>"
  ],
  "marketingToneAssessment": {
    "tone": "<description of marketing tone>",
    "appropriateness": "<appropriate|concerning|inappropriate>",
    "suggestions": [
      "<suggestion for tone improvement>"
    ]
  }
}

FOCUS AREAS:
- Misleading claims or implications
- Missing mandatory disclosures
- Inappropriate marketing language for financial services
- Customer protection considerations
- Regulatory compliance beyond obvious violations
- Marketing ethics and fair practices

Provide specific, actionable insights that help create compliant, effective marketing content.
`
  }

  /**
   * Parse Gemini AI response
   */
  private parseGeminiResponse(responseText: string): GeminiAnalysisResult {
    try {
      // Extract JSON from response (handle cases where Gemini adds extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response')
      }

      const jsonResponse = JSON.parse(jsonMatch[0])
      
      // Validate and structure the response
      return {
        complianceScore: this.validateScore(jsonResponse.complianceScore),
        overallStatus: this.validateStatus(jsonResponse.overallStatus),
        aiViolations: this.validateViolations(jsonResponse.aiViolations || []),
        contextualInsights: Array.isArray(jsonResponse.contextualInsights) ? jsonResponse.contextualInsights : [],
        marketingToneAssessment: {
          tone: jsonResponse.marketingToneAssessment?.tone || 'neutral',
          appropriateness: this.validateAppropriateness(jsonResponse.marketingToneAssessment?.appropriateness),
          suggestions: Array.isArray(jsonResponse.marketingToneAssessment?.suggestions) 
            ? jsonResponse.marketingToneAssessment.suggestions 
            : []
        },
        processingTimeMs: 0 // Will be set by caller
      }

    } catch (error: any) {
      logger.error('Failed to parse Gemini response', {
        error: error.message,
        responseLength: responseText.length
      })

      // Return basic parsed response
      return {
        complianceScore: 70,
        overallStatus: 'needs_review',
        aiViolations: [],
        contextualInsights: ['AI analysis parsing failed - manual review recommended'],
        marketingToneAssessment: {
          tone: 'unknown',
          appropriateness: 'concerning',
          suggestions: ['Manual review required due to AI parsing error']
        },
        processingTimeMs: 0
      }
    }
  }

  /**
   * Generate marketing copy recommendations using Gemini
   */
  async generateMarketingRecommendations(
    originalText: string,
    violations: ViolationMatch[],
    missingElements: string[]
  ): Promise<{
    improvedCopy: string
    beforeAfterComparisons: Array<{
      before: string
      after: string
      reason: string
      rbiReference: string
    }>
    additionalSuggestions: string[]
  }> {
    try {
      const prompt = this.buildRecommendationPrompt(originalText, violations, missingElements)
      
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const recommendationText = response.text()

      return this.parseRecommendations(recommendationText)

    } catch (error: any) {
      logger.error('Failed to generate Gemini recommendations', {
        error: error.message,
        violationsCount: violations.length
      })

      return {
        improvedCopy: originalText,
        beforeAfterComparisons: [],
        additionalSuggestions: ['AI recommendation generation failed - manual review required']
      }
    }
  }

  /**
   * Build recommendation prompt
   */
  private buildRecommendationPrompt(
    text: string,
    violations: ViolationMatch[],
    missingElements: string[]
  ): string {
    const violationDetails = violations.map(v => ({
      text: v.matchedText,
      rule: v.rule.title,
      reason: v.rule.description,
      citation: v.rule.citation
    }))

    return `
You are an expert copywriter specializing in RBI-compliant FinTech marketing content.
Rewrite the following marketing content to be fully RBI compliant while maintaining its marketing effectiveness.

ORIGINAL CONTENT:
"""
${text}
"""

VIOLATIONS TO FIX:
${JSON.stringify(violationDetails, null, 2)}

MISSING REQUIRED ELEMENTS:
${JSON.stringify(missingElements, null, 2)}

REQUIREMENTS:
1. Fix all identified violations
2. Add all missing required elements naturally
3. Maintain marketing appeal and brand voice
4. Ensure clear, transparent communication
5. Follow RBI fair practices guidelines
6. Make content customer-friendly and informative

OUTPUT FORMAT (JSON):
{
  "improvedCopy": "<complete rewritten marketing content>",
  "beforeAfterComparisons": [
    {
      "before": "<original problematic text>",
      "after": "<compliant replacement>", 
      "reason": "<explanation of change>",
      "rbiReference": "<relevant RBI guideline>"
    }
  ],
  "additionalSuggestions": [
    "<additional improvement suggestion>",
    "<marketing enhancement idea>",
    "<compliance best practice tip>"
  ]
}

Focus on creating marketing content that is both compliant and effective.
`
  }

  /**
   * Parse recommendation response
   */
  private parseRecommendations(responseText: string): {
    improvedCopy: string
    beforeAfterComparisons: Array<{
      before: string
      after: string
      reason: string
      rbiReference: string
    }>
    additionalSuggestions: string[]
  } {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in recommendation response')
      }

      const jsonResponse = JSON.parse(jsonMatch[0])
      
      return {
        improvedCopy: jsonResponse.improvedCopy || 'Improved copy generation failed',
        beforeAfterComparisons: Array.isArray(jsonResponse.beforeAfterComparisons) 
          ? jsonResponse.beforeAfterComparisons 
          : [],
        additionalSuggestions: Array.isArray(jsonResponse.additionalSuggestions)
          ? jsonResponse.additionalSuggestions
          : []
      }

    } catch (error: any) {
      logger.error('Failed to parse recommendations', { error: error.message })
      
      return {
        improvedCopy: 'Recommendation parsing failed - manual review required',
        beforeAfterComparisons: [],
        additionalSuggestions: ['Manual copywriting review recommended due to AI parsing error']
      }
    }
  }

  /**
   * Get fallback analysis when AI fails
   */
  private getFallbackAnalysis(processingTime: number): GeminiAnalysisResult {
    return {
      complianceScore: 50, // Conservative score when AI fails
      overallStatus: 'needs_review',
      aiViolations: [],
      contextualInsights: [
        'AI analysis unavailable - manual review required',
        'Consider consulting RBI guidelines directly',
        'Recommend legal compliance review'
      ],
      marketingToneAssessment: {
        tone: 'unknown',
        appropriateness: 'concerning',
        suggestions: ['Manual tone assessment needed']
      },
      processingTimeMs: processingTime
    }
  }

  // Validation helper methods
  private validateScore(score: any): number {
    const num = Number(score)
    return isNaN(num) ? 50 : Math.max(0, Math.min(100, num))
  }

  private validateStatus(status: any): 'compliant' | 'needs_review' | 'non_compliant' {
    if (['compliant', 'needs_review', 'non_compliant'].includes(status)) {
      return status
    }
    return 'needs_review'
  }

  private validateAppropriateness(appropriateness: any): 'appropriate' | 'concerning' | 'inappropriate' {
    if (['appropriate', 'concerning', 'inappropriate'].includes(appropriateness)) {
      return appropriateness
    }
    return 'concerning'
  }

  private validateViolations(violations: any[]): GeminiAnalysisResult['aiViolations'] {
    if (!Array.isArray(violations)) return []
    
    return violations.map(v => ({
      text: String(v.text || ''),
      ruleCategory: String(v.ruleCategory || 'unknown'),
      severity: ['critical', 'high', 'medium', 'low'].includes(v.severity) ? v.severity : 'medium',
      explanation: String(v.explanation || ''),
      suggestedFix: String(v.suggestedFix || ''),
      confidenceScore: Math.max(0, Math.min(1, Number(v.confidenceScore) || 0.5))
    }))
  }
}

// Export singleton instance
export const geminiAnalyzer = new GeminiMarketingAnalyzer()