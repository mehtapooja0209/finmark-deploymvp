import apiService from './apiService'

/**
 * Service for fetching regulatory guidelines data
 */
class GuidelinesService {
  /**
   * Get all RBI guidelines
   * @returns {Promise} Promise with guidelines data
   */
  async getRBIGuidelines() {
    try {
      const response = await apiService.get('/guidelines/rbi')
      return response.data
    } catch (error) {
      console.error('Failed to fetch RBI guidelines:', error)
      throw error
    }
  }

  /**
   * Get RBI guidelines by category
   * @param {string} category - The category to fetch
   * @returns {Promise} Promise with category guidelines data
   */
  async getRBIGuidelinesByCategory(category) {
    try {
      const response = await apiService.get(`/guidelines/rbi/${category}`)
      return response.data
    } catch (error) {
      console.error(`Failed to fetch RBI guidelines for category ${category}:`, error)
      throw error
    }
  }
}

export const guidelinesService = new GuidelinesService()
export default guidelinesService
