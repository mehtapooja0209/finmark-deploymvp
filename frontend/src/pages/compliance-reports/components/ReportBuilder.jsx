import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import { reportsAPI } from '../../../services/reportsAPI';

const ReportBuilder = ({ onPreviewUpdate, selectedTemplate, onTemplateChange, onReportGenerated }) => {
  const [reportConfig, setReportConfig] = useState({
    title: '',
    description: '',
    dateRange: 'last_30_days',
    contentTypes: [],
    violationCategories: [],
    departments: [],
    regulatoryFrameworks: [],
    includeCharts: true,
    includeMetrics: true,
    includeRecommendations: true
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const reportTemplates = [
    { 
      value: 'executive_summary', 
      label: 'Executive Summary',
      description: 'High-level compliance overview for leadership'
    },
    { 
      value: 'detailed_audit', 
      label: 'Detailed Compliance Audit',
      description: 'Comprehensive analysis with full violation details'
    },
    { 
      value: 'trend_analysis', 
      label: 'Violation Trend Analysis',
      description: 'Historical patterns and trending violations'
    },
    { 
      value: 'impact_assessment', 
      label: 'Regulatory Change Impact',
      description: 'Assessment of new regulatory requirements'
    }
  ];

  const dateRangeOptions = [
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'last_90_days', label: 'Last 90 Days' },
    { value: 'last_6_months', label: 'Last 6 Months' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const contentTypeOptions = [
    { value: 'marketing_materials', label: 'Marketing Materials' },
    { value: 'product_descriptions', label: 'Product Descriptions' },
    { value: 'terms_conditions', label: 'Terms & Conditions' },
    { value: 'privacy_policies', label: 'Privacy Policies' },
    { value: 'promotional_content', label: 'Promotional Content' },
    { value: 'social_media', label: 'Social Media Posts' }
  ];

  const violationCategoryOptions = [
    { value: 'misleading_claims', label: 'Misleading Claims' },
    { value: 'interest_rate_disclosure', label: 'Interest Rate Disclosure' },
    { value: 'risk_warnings', label: 'Risk Warnings' },
    { value: 'kyc_compliance', label: 'KYC Compliance' },
    { value: 'data_protection', label: 'Data Protection' },
    { value: 'fair_practices', label: 'Fair Practices Code' }
  ];

  const departmentOptions = [
    { value: 'marketing', label: 'Marketing' },
    { value: 'product', label: 'Product' },
    { value: 'legal', label: 'Legal' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'customer_service', label: 'Customer Service' },
    { value: 'operations', label: 'Operations' }
  ];

  const regulatoryFrameworkOptions = [
    { value: 'rbi_guidelines', label: 'RBI Guidelines' },
    { value: 'sebi_regulations', label: 'SEBI Regulations' },
    { value: 'irdai_norms', label: 'IRDAI Norms' },
    { value: 'consumer_protection', label: 'Consumer Protection Act' },
    { value: 'data_protection_bill', label: 'Data Protection Bill' },
    { value: 'fair_practices_code', label: 'Fair Practices Code' }
  ];

  const handleConfigChange = (field, value) => {
    const newConfig = { ...reportConfig, [field]: value };
    setReportConfig(newConfig);
    onPreviewUpdate(newConfig);
  };

  const handleArrayFieldChange = (field, value) => {
    const currentArray = reportConfig?.[field];
    const newArray = currentArray?.includes(value)
      ? currentArray?.filter(item => item !== value)
      : [...currentArray, value];
    handleConfigChange(field, newArray);
  };

  const handleSaveTemplate = async () => {
    if (!reportConfig.title) {
      alert('Please enter a report title before saving template');
      return;
    }

    setIsSavingTemplate(true);
    try {
      const template = {
        name: reportConfig.title,
        description: reportConfig.description,
        template_type: selectedTemplate,
        config: {
          ...reportConfig,
          template: selectedTemplate
        }
      };

      const result = await reportsAPI.saveTemplate(template);
      
      if (result.success) {
        alert('Template saved successfully!');
      } else {
        alert(`Failed to save template: ${result.error}`);
      }
    } catch (error) {
      console.error('Save template error:', error);
      alert('Failed to save template. Please try again.');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handlePreviewReport = async () => {
    if (!reportConfig.title) {
      alert('Please enter a report title before generating preview');
      return;
    }

    setIsGenerating(true);
    try {
      // First update the preview with mock data
      const previewData = await reportsAPI.getReportData({
        ...reportConfig,
        template: selectedTemplate
      });
      
      if (previewData.success) {
        onPreviewUpdate(previewData.data);
      }

      // Optionally generate actual PDF (uncomment for real PDF generation)
      /*
      const config = {
        ...reportConfig,
        template: selectedTemplate
      };

      const exportSettings = {
        format: 'pdf',
        quality: 'high',
        includeCharts: reportConfig.includeCharts,
        includeRawData: false,
        includeAppendix: true,
        watermark: false
      };

      const result = await reportsAPI.generateReport(config, exportSettings);
      
      if (result.success) {
        alert('Report generated successfully!');
        if (onReportGenerated) {
          onReportGenerated(result.data);
        }
      } else {
        alert(`Failed to generate report: ${result.error}`);
      }
      */
    } catch (error) {
      console.error('Preview report error:', error);
      alert('Failed to generate report preview. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Icon name="Settings" size={16} color="white" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-lg text-foreground">
              Report Builder
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure your compliance report parameters
            </p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {/* Report Template Selection */}
        <div>
          <Select
            label="Report Template"
            description="Choose a pre-configured report template"
            options={reportTemplates}
            value={selectedTemplate}
            onChange={onTemplateChange}
            required
          />
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-heading font-medium text-foreground">Basic Information</h3>
          
          <Input
            label="Report Title"
            type="text"
            placeholder="Enter report title"
            value={reportConfig?.title}
            onChange={(e) => handleConfigChange('title', e?.target?.value)}
            required
          />

          <div>
            <label className="block text-sm font-body font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
              rows="3"
              placeholder="Brief description of the report purpose"
              value={reportConfig?.description}
              onChange={(e) => handleConfigChange('description', e?.target?.value)}
            />
          </div>
        </div>

        {/* Date Range */}
        <div>
          <Select
            label="Date Range"
            description="Select the time period for analysis"
            options={dateRangeOptions}
            value={reportConfig?.dateRange}
            onChange={(value) => handleConfigChange('dateRange', value)}
            required
          />
        </div>

        {/* Content Types */}
        <div>
          <label className="block text-sm font-body font-medium text-foreground mb-3">
            Content Types
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {contentTypeOptions?.map((option) => (
              <Checkbox
                key={option?.value}
                label={option?.label}
                checked={reportConfig?.contentTypes?.includes(option?.value)}
                onChange={() => handleArrayFieldChange('contentTypes', option?.value)}
              />
            ))}
          </div>
        </div>

        {/* Violation Categories */}
        <div>
          <label className="block text-sm font-body font-medium text-foreground mb-3">
            Violation Categories
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {violationCategoryOptions?.map((option) => (
              <Checkbox
                key={option?.value}
                label={option?.label}
                checked={reportConfig?.violationCategories?.includes(option?.value)}
                onChange={() => handleArrayFieldChange('violationCategories', option?.value)}
              />
            ))}
          </div>
        </div>

        {/* Departments */}
        <div>
          <Select
            label="Departments"
            description="Select departments to include in analysis"
            options={departmentOptions}
            value={reportConfig?.departments}
            onChange={(value) => handleConfigChange('departments', value)}
            multiple
            searchable
          />
        </div>

        {/* Regulatory Frameworks */}
        <div>
          <Select
            label="Regulatory Frameworks"
            description="Choose applicable regulatory guidelines"
            options={regulatoryFrameworkOptions}
            value={reportConfig?.regulatoryFrameworks}
            onChange={(value) => handleConfigChange('regulatoryFrameworks', value)}
            multiple
            searchable
          />
        </div>

        {/* Report Options */}
        <div>
          <label className="block text-sm font-body font-medium text-foreground mb-3">
            Report Options
          </label>
          <div className="space-y-3">
            <Checkbox
              label="Include Charts & Visualizations"
              description="Add graphical representations of compliance data"
              checked={reportConfig?.includeCharts}
              onChange={(e) => handleConfigChange('includeCharts', e?.target?.checked)}
            />
            <Checkbox
              label="Include Compliance Metrics"
              description="Add detailed numerical analysis and KPIs"
              checked={reportConfig?.includeMetrics}
              onChange={(e) => handleConfigChange('includeMetrics', e?.target?.checked)}
            />
            <Checkbox
              label="Include Recommendations"
              description="Add suggested actions for improvement"
              checked={reportConfig?.includeRecommendations}
              onChange={(e) => handleConfigChange('includeRecommendations', e?.target?.checked)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={handleSaveTemplate}
            disabled={isSavingTemplate || !reportConfig.title}
          >
            {isSavingTemplate ? (
              <>
                <Icon name="Loader" size={16} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Icon name="Save" size={16} className="mr-2" />
                Save Template
              </>
            )}
          </Button>
          <Button 
            variant="default" 
            className="flex-1"
            onClick={handlePreviewReport}
            disabled={isGenerating || !reportConfig.title}
          >
            {isGenerating ? (
              <>
                <Icon name="Loader" size={16} className="mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Icon name="Eye" size={16} className="mr-2" />
                Preview Report
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;