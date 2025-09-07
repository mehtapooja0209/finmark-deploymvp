import { apiClient } from './api.js';

export const reportsAPI = {
  // Generate a new PDF report
  async generateReport(config, exportSettings) {
    try {
      const response = await apiClient.post('/api/reports/generate', {
        config,
        exportSettings
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Report generation failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to generate report',
        details: error.response?.data?.details
      };
    }
  },

  // Get available report templates
  async getTemplates() {
    try {
      const response = await apiClient.get('/api/reports/templates');
      return {
        success: true,
        data: response.data.templates
      };
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch templates'
      };
    }
  },

  // Save a new report template
  async saveTemplate(template) {
    try {
      const response = await apiClient.post('/api/reports/templates', template);
      return {
        success: true,
        data: response.data.template
      };
    } catch (error) {
      console.error('Failed to save template:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to save template'
      };
    }
  },

  // Get report generation history
  async getReportHistory(limit = 50, offset = 0) {
    try {
      const response = await apiClient.get('/api/reports/history', {
        params: { limit, offset }
      });
      return {
        success: true,
        data: response.data.reports
      };
    } catch (error) {
      console.error('Failed to fetch report history:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch report history'
      };
    }
  },

  // Download a generated report
  async downloadReport(downloadUrl, fileName) {
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'report.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Download failed:', error);
      return {
        success: false,
        error: 'Failed to download report'
      };
    }
  },

  // Preview report data (for frontend preview)
  async getReportData(config) {
    // This function generates preview data for the frontend
    // In a real scenario, this might call a separate preview endpoint
    return {
      success: true,
      data: {
        summary: {
          totalDocuments: 25,
          totalViolations: 12,
          averageComplianceScore: 87,
          complianceStatus: 'Compliant',
          reportPeriod: this.getReportPeriodLabel(config.dateRange),
          generatedAt: new Date().toISOString()
        },
        violationsBySeverity: {
          critical: 1,
          high: 3,
          medium: 5,
          low: 3
        },
        trendData: this.generateMockTrendData(),
        recentViolations: this.generateMockViolations(),
        departmentData: this.generateMockDepartmentData()
      }
    };
  },

  // Helper methods for generating mock preview data
  getReportPeriodLabel(dateRange) {
    const periods = {
      'last_7_days': 'Last 7 Days',
      'last_30_days': 'Last 30 Days',
      'last_90_days': 'Last 90 Days',
      'last_6_months': 'Last 6 Months',
      'last_year': 'Last Year'
    };
    return periods[dateRange] || 'Last 30 Days';
  },

  generateMockTrendData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      avgScore: 75 + Math.floor(Math.random() * 20),
      violationCount: Math.floor(Math.random() * 15),
      documentCount: 3 + Math.floor(Math.random() * 8)
    }));
  },

  generateMockViolations() {
    const categories = [
      'Misleading Claims',
      'Interest Rate Disclosure',
      'Risk Warnings',
      'KYC Compliance',
      'Data Protection'
    ];
    
    const severities = ['high', 'medium', 'low'];
    
    return Array.from({ length: 8 }, (_, i) => ({
      id: `V${String(i + 1).padStart(3, '0')}`,
      title: `${categories[Math.floor(Math.random() * categories.length)]} Issue`,
      description: 'Sample violation description for preview',
      category: categories[Math.floor(Math.random() * categories.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      suggestion: 'Review and update content according to RBI guidelines',
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }));
  },

  generateMockDepartmentData() {
    const departments = ['Marketing', 'Product', 'Legal', 'Operations'];
    const deptData = {};
    
    departments.forEach(dept => {
      deptData[dept] = {
        score: 75 + Math.floor(Math.random() * 20),
        documentCount: 3 + Math.floor(Math.random() * 10),
        violationCount: Math.floor(Math.random() * 8)
      };
    });
    
    return deptData;
  }
};