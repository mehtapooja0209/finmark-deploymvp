import * as fs from 'fs'
import * as path from 'path'
import { logger } from '../../utils/logger'
import { guidelinesCache } from '../../utils/cache'

export interface MarketingRule {
  rule_id: string
  category: string
  title: string
  description: string
  marketing_context: string
  content: string
  violation_keywords: string[]
  required_marketing_elements: string[]
  prohibited_marketing_claims: string[]
  severity: 'critical' | 'high' | 'medium' | 'low'
  scoring_weight: number
  effective_date?: string
  penalties?: string[]
  citation: {
    document: string
    title: string
    date: string
    section: string
    url?: string
    size?: string
    updated?: string
  }
}

export interface MarketingGuidelines {
  metadata: {
    source: string
    created_date: string
    version: string
    purpose: string
    scope: string
    total_marketing_rules: number
    citation_policy: string
  }
  marketing_compliance_rules: {
    [category: string]: MarketingRule[]
  }
  marketing_violation_patterns: {
    high_risk_phrases: string[]
    medium_risk_phrases: string[]
    required_disclaimers: string[]
  }
  scoring_methodology: {
    total_possible_score: number
    critical_violations: number
    high_violations: number
    medium_violations: number
    missing_required_elements: number
    prohibited_claims_usage: number
    inadequate_citations: number
    color_coding: {
      green: string
      yellow: string
      red: string
    }
  }
}

export class RBIMarketingLoader {
  private guidelines: MarketingGuidelines | null = null
  private rulesIndex: Map<string, MarketingRule> = new Map()
  private categoryIndex: Map<string, MarketingRule[]> = new Map()
  private keywordIndex: Map<string, MarketingRule[]> = new Map()

  constructor() {
    this.loadGuidelines()
  }

  /**
   * Load RBI marketing guidelines from JSON file
   */
  private loadGuidelines(): void {
    try {
      const guidelinesPath = path.join(process.cwd(), 'data', 'rbi_marketing_guidelines.json')
      
      if (!fs.existsSync(guidelinesPath)) {
        throw new Error(`Marketing guidelines file not found at: ${guidelinesPath}`)
      }

      const fileContent = fs.readFileSync(guidelinesPath, 'utf-8')
      this.guidelines = JSON.parse(fileContent) as MarketingGuidelines
      
      this.buildIndexes()
      
      logger.info('RBI Marketing Guidelines loaded successfully', {
        totalRules: this.guidelines.metadata.total_marketing_rules,
        categories: Object.keys(this.guidelines.marketing_compliance_rules).length,
        version: this.guidelines.metadata.version
      })

    } catch (error: any) {
      logger.error('Failed to load RBI Marketing Guidelines', {
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  /**
   * Build indexes for efficient rule lookup
   */
  private buildIndexes(): void {
    if (!this.guidelines) return

    // Clear existing indexes
    this.rulesIndex.clear()
    this.categoryIndex.clear()
    this.keywordIndex.clear()

    // Build rule and category indexes
    Object.entries(this.guidelines.marketing_compliance_rules).forEach(([category, rules]) => {
      this.categoryIndex.set(category, rules)
      
      rules.forEach(rule => {
        // Rule index
        this.rulesIndex.set(rule.rule_id, rule)
        
        // Keyword index
        const violationKeywords = rule.violation_keywords || []
        const prohibitedClaims = rule.prohibited_marketing_claims || []
        const allKeywords = [...violationKeywords, ...prohibitedClaims]
        allKeywords.forEach(keyword => {
          const normalizedKeyword = keyword.toLowerCase()
          if (!this.keywordIndex.has(normalizedKeyword)) {
            this.keywordIndex.set(normalizedKeyword, [])
          }
          this.keywordIndex.get(normalizedKeyword)!.push(rule)
        })
      })
    })

    logger.debug('Marketing guidelines indexes built', {
      rulesIndexSize: this.rulesIndex.size,
      categoryIndexSize: this.categoryIndex.size,
      keywordIndexSize: this.keywordIndex.size
    })
  }

  /**
   * Get all marketing rules
   */
  getAllRules(): MarketingRule[] {
    if (!this.guidelines) {
      throw new Error('Marketing guidelines not loaded')
    }
    
    return Array.from(this.rulesIndex.values())
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: string): MarketingRule[] {
    return this.categoryIndex.get(category) || []
  }

  /**
   * Get rule by ID
   */
  getRuleById(ruleId: string): MarketingRule | null {
    return this.rulesIndex.get(ruleId) || null
  }

  /**
   * Get rules that match violation keywords
   */
  getRulesByKeywords(keywords: string[]): MarketingRule[] {
    const matchingRules = new Set<MarketingRule>()
    
    keywords.forEach(keyword => {
      const normalizedKeyword = keyword.toLowerCase()
      const rules = this.keywordIndex.get(normalizedKeyword)
      if (rules) {
        rules.forEach(rule => matchingRules.add(rule))
      }
    })
    
    return Array.from(matchingRules)
  }

  /**
   * Get rules applicable to specific marketing context
   */
  getRulesByMarketingContext(context: string): MarketingRule[] {
    const contextKeywords = context.toLowerCase().split(/\s+/)
    const matchingRules: MarketingRule[] = []
    
    this.getAllRules().forEach(rule => {
      const marketingContext = rule.marketing_context.toLowerCase()
      if (contextKeywords.some(keyword => marketingContext.includes(keyword))) {
        matchingRules.push(rule)
      }
    })
    
    return matchingRules
  }

  /**
   * Get high-risk phrases for quick violation detection
   */
  getHighRiskPhrases(): string[] {
    return this.guidelines?.marketing_violation_patterns.high_risk_phrases || []
  }

  /**
   * Get medium-risk phrases
   */
  getMediumRiskPhrases(): string[] {
    return this.guidelines?.marketing_violation_patterns.medium_risk_phrases || []
  }

  /**
   * Get required disclaimers
   */
  getRequiredDisclaimers(): string[] {
    return this.guidelines?.marketing_violation_patterns.required_disclaimers || []
  }

  /**
   * Get scoring methodology
   */
  getScoringMethodology() {
    return this.guidelines?.scoring_methodology || null
  }

  /**
   * Get guidelines metadata
   */
  getMetadata() {
    return this.guidelines?.metadata || null
  }

  /**
   * Search rules by text content (fuzzy search)
   */
  searchRules(searchText: string): MarketingRule[] {
    if (!searchText.trim()) return []
    
    const searchLower = searchText.toLowerCase()
    const matchingRules: MarketingRule[] = []
    
    this.getAllRules().forEach(rule => {
      const searchableContent = [
        rule.title,
        rule.description,
        rule.content,
        rule.marketing_context,
        ...rule.violation_keywords,
        ...rule.required_marketing_elements
      ].join(' ').toLowerCase()
      
      if (searchableContent.includes(searchLower)) {
        matchingRules.push(rule)
      }
    })
    
    return matchingRules
  }

  /**
   * Validate rule citation URLs (check if they're accessible)
   */
  async validateCitationUrls(): Promise<{ valid: number; invalid: string[] }> {
    const invalidUrls: string[] = []
    let validCount = 0
    
    for (const rule of this.getAllRules()) {
      if (rule.citation.url) {
        try {
          // This would require a HTTP client to actually validate
          // For now, we'll do basic URL format validation
          new URL(rule.citation.url)
          validCount++
        } catch {
          invalidUrls.push(`${rule.rule_id}: ${rule.citation.url}`)
        }
      }
    }
    
    logger.info('Citation URL validation completed', {
      valid: validCount,
      invalid: invalidUrls.length
    })
    
    return { valid: validCount, invalid: invalidUrls }
  }

  /**
   * Get rules by severity level
   */
  getRulesBySeverity(severity: MarketingRule['severity']): MarketingRule[] {
    return this.getAllRules().filter(rule => rule.severity === severity)
  }

  /**
   * Get cached or fresh rules
   */
  async getCachedRules(): Promise<MarketingRule[]> {
    const cacheKey = 'marketing_rules_all'
    
    try {
      const cached = await guidelinesCache.get(cacheKey)
      if (cached) {
        logger.debug('Serving marketing rules from cache')
        return cached as MarketingRule[]
      }
      
      const rules = this.getAllRules()
      await guidelinesCache.set(cacheKey, rules, 3600) // Cache for 1 hour
      
      return rules
    } catch (error) {
      logger.error('Cache error, serving fresh rules', { error })
      return this.getAllRules()
    }
  }

  /**
   * Reload guidelines from file (for updates)
   */
  reloadGuidelines(): void {
    logger.info('Reloading RBI Marketing Guidelines')
    this.loadGuidelines()
  }
}

// Singleton instance
export const marketingLoader = new RBIMarketingLoader()