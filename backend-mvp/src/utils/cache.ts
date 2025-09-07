import NodeCache from 'node-cache'
import crypto from 'crypto'

const cache = new NodeCache({ 
  stdTTL: 600,
  checkperiod: 120 
})

export const analysisCache = cache
export const guidelinesCache = cache

export const getCacheStats = () => {
  const keys = cache.keys()
  const stats = cache.getStats()
  
  return {
    keys: keys.length,
    hits: stats.hits,
    misses: stats.misses,
    size: `${Math.round(cache.getStats().vsize / 1024)} KB`
  }
}

export const getCache = (key: string) => {
  return cache.get(key)
}

export const setCache = (key: string, value: any, ttl?: number) => {
  if (ttl !== undefined) {
    return cache.set(key, value, ttl)
  }
  return cache.set(key, value)
}

export const deleteCache = (key: string) => {
  return cache.del(key)
}

export const clearCache = () => {
  return cache.flushAll()
}

export const hashText = (text: string): string => {
  return crypto.createHash('md5').update(text).digest('hex')
}

export const createCacheKey = {
  analysis: (textOrId: string, options: { marketing?: boolean; context?: string } = {}): string => {
    const hash = hashText(textOrId)
    const suffix = options.marketing ? ':marketing' : ''
    const contextSuffix = options.context ? `:${hashText(options.context)}` : ''
    return `analysis:${hash}${suffix}${contextSuffix}`
  },
  simple: (text: string, type: string = 'analysis'): string => {
    const hash = hashText(text)
    return `${type}:${hash}`
  }
}

export const getCachedAnalysisResult = (documentId: string, textHash: string, aiModel: string) => {
  const key = `${documentId}:${textHash}:${aiModel}`
  return cache.get(key)
}

export const cacheAnalysisResult = (documentId: string, textHash: string, aiModel: string, result: any) => {
  const key = `${documentId}:${textHash}:${aiModel}`
  return cache.set(key, result)
}