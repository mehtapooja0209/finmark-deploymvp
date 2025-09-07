import { Request, Response } from 'express'
import * as fs from 'fs'
import * as path from 'path'
import { logger } from '../utils/logger'
import { guidelinesCache } from '../utils/cache'

/**
 * Get all RBI guidelines
 */
export const getRBIGuidelines = async (req: Request, res: Response) => {
  try {
    // Check cache first
    const cacheKey = 'rbi_guidelines_all'
    const cachedData = await guidelinesCache.get(cacheKey)
    
    if (cachedData) {
      logger.debug('Serving RBI guidelines from cache')
      return res.json(cachedData)
    }
    
    // If not in cache, read from file
    const guidelinesPath = path.join(process.cwd(), 'data', 'rbi_guidelines.json')
    
    if (!fs.existsSync(guidelinesPath)) {
      logger.error('RBI guidelines file not found', { path: guidelinesPath })
      return res.status(404).json({ error: 'Guidelines data not found' })
    }

    const fileContent = fs.readFileSync(guidelinesPath, 'utf-8')
    const guidelines = JSON.parse(fileContent)
    
    // Cache the data for 1 hour
    await guidelinesCache.set(cacheKey, guidelines, 3600)
    
    res.json(guidelines)
  } catch (error: any) {
    logger.error('Failed to retrieve RBI guidelines', {
      error: error.message,
      stack: error.stack
    })
    
    res.status(500).json({ 
      error: 'Failed to retrieve guidelines',
      details: error.message 
    })
  }
}

/**
 * Get guidelines by category
 */
export const getGuidelinesByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params
    
    if (!category) {
      return res.status(400).json({ error: 'Category parameter is required' })
    }
    
    // Check cache first
    const cacheKey = `rbi_guidelines_${category}`
    const cachedData = await guidelinesCache.get(cacheKey)
    
    if (cachedData) {
      logger.debug('Serving category guidelines from cache', { category })
      return res.json(cachedData)
    }
    
    // If not in cache, read from file
    const guidelinesPath = path.join(process.cwd(), 'data', 'rbi_guidelines.json')
    
    if (!fs.existsSync(guidelinesPath)) {
      logger.error('RBI guidelines file not found', { path: guidelinesPath })
      return res.status(404).json({ error: 'Guidelines data not found' })
    }

    const fileContent = fs.readFileSync(guidelinesPath, 'utf-8')
    const allGuidelines = JSON.parse(fileContent)
    
    // Check if the category exists
    if (!allGuidelines.rbi_guidelines[category]) {
      return res.status(404).json({ error: `Category '${category}' not found` })
    }
    
    const categoryGuidelines = {
      metadata: allGuidelines.metadata,
      guidelines: allGuidelines.rbi_guidelines[category]
    }
    
    // Cache the data for 1 hour
    await guidelinesCache.set(cacheKey, categoryGuidelines, 3600)
    
    res.json(categoryGuidelines)
  } catch (error: any) {
    logger.error('Failed to retrieve guidelines by category', {
      error: error.message,
      stack: error.stack,
      category: req.params.category
    })
    
    res.status(500).json({ 
      error: 'Failed to retrieve guidelines',
      details: error.message 
    })
  }
}
