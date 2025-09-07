import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import { reportsAPI } from '../../../services/reportsAPI';

const ExportOptions = ({ onExport, reportConfig, selectedTemplate }) => {
  const [exportSettings, setExportSettings] = useState({
    format: 'pdf',
    quality: 'high',
    includeCharts: true,
    includeRawData: false,
    includeAppendix: true,
    password: '',
    watermark: false,
    recipients: [],
    scheduleExport: false,
    frequency: 'monthly'
  });

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const formatOptions = [
    { value: 'pdf', label: 'PDF Document', description: 'Best for formal reports and presentations' },
    { value: 'excel', label: 'Excel Spreadsheet', description: 'Ideal for data analysis and manipulation' },
    { value: 'powerpoint', label: 'PowerPoint Presentation', description: 'Perfect for executive presentations' },
    { value: 'word', label: 'Word Document', description: 'Editable format for collaborative review' }
  ];

  const qualityOptions = [
    { value: 'high', label: 'High Quality', description: 'Best quality, larger file size' },
    { value: 'medium', label: 'Medium Quality', description: 'Balanced quality and file size' },
    { value: 'low', label: 'Low Quality', description: 'Smaller file size, reduced quality' }
  ];

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' }
  ];

  const handleSettingChange = (field, value) => {
    setExportSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleAddRecipient = () => {
    if (recipientEmail && !exportSettings?.recipients?.includes(recipientEmail)) {
      setExportSettings(prev => ({
        ...prev,
        recipients: [...prev?.recipients, recipientEmail]
      }));
      setRecipientEmail('');
    }
  };

  const handleRemoveRecipient = (email) => {
    setExportSettings(prev => ({
      ...prev,
      recipients: prev?.recipients?.filter(r => r !== email)
    }));
  };

  const handlePreviewExport = async () => {
    if (!reportConfig?.title) {
      alert('Please configure report settings before previewing');
      return;
    }

    setIsPreviewing(true);
    try {
      const config = {
        ...reportConfig,
        template: selectedTemplate
      };

      // Generate a quick preview (you could implement a separate preview endpoint)
      const previewData = await reportsAPI.getReportData(config);
      
      if (previewData.success) {
        alert('Report preview generated successfully!');
        // Could open in new tab or modal here
      } else {
        alert(`Failed to generate preview: ${previewData.error}`);
      }
    } catch (error) {
      console.error('Preview export error:', error);
      alert('Failed to generate preview. Please try again.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleExport = async () => {
    if (!reportConfig?.title) {
      alert('Please configure report settings before exporting');
      return;
    }

    setIsExporting(true);
    try {
      const config = {
        ...reportConfig,
        template: selectedTemplate
      };

      const result = await reportsAPI.generateReport(config, exportSettings);
      
      if (result.success) {
        alert('Report generated successfully!');
        
        // Automatically download the report
        if (result.data.downloadUrl && result.data.fileName) {
          const downloadResult = await reportsAPI.downloadReport(
            result.data.downloadUrl, 
            result.data.fileName
          );
          
          if (!downloadResult.success) {
            console.error('Download failed:', downloadResult.error);
          }
        }
        
        // Call the parent callback if provided
        if (onExport) {
          onExport(exportSettings);
        }
      } else {
        alert(`Failed to generate report: ${result.error}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'pdf': return 'FileText';
      case 'excel': return 'Sheet';
      case 'powerpoint': return 'Presentation';
      case 'word': return 'FileEdit';
      default: return 'File';
    }
  };

  const estimatedFileSize = () => {
    const baseSize = exportSettings?.format === 'pdf' ? 2.5 : 
                    exportSettings?.format === 'excel' ? 1.8 :
                    exportSettings?.format === 'powerpoint' ? 4.2 : 3.1;
    
    const qualityMultiplier = exportSettings?.quality === 'high' ? 1.5 :
                             exportSettings?.quality === 'medium' ? 1.0 : 0.6;
    
    const chartsMultiplier = exportSettings?.includeCharts ? 1.3 : 1.0;
    const dataMultiplier = exportSettings?.includeRawData ? 1.8 : 1.0;
    
    return (baseSize * qualityMultiplier * chartsMultiplier * dataMultiplier)?.toFixed(1);
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Icon name="Download" size={16} color="white" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-lg text-foreground">
              Export Options
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure export settings and distribution
            </p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {/* Format Selection */}
        <div>
          <Select
            label="Export Format"
            description="Choose the output format for your report"
            options={formatOptions}
            value={exportSettings?.format}
            onChange={(value) => handleSettingChange('format', value)}
            required
          />
        </div>

        {/* Quality Settings */}
        <div>
          <Select
            label="Quality Settings"
            description="Balance between file size and output quality"
            options={qualityOptions}
            value={exportSettings?.quality}
            onChange={(value) => handleSettingChange('quality', value)}
          />
        </div>

        {/* Content Options */}
        <div>
          <label className="block text-sm font-body font-medium text-foreground mb-3">
            Content Options
          </label>
          <div className="space-y-3">
            <Checkbox
              label="Include Charts & Visualizations"
              description="Add graphical representations to the report"
              checked={exportSettings?.includeCharts}
              onChange={(e) => handleSettingChange('includeCharts', e?.target?.checked)}
            />
            <Checkbox
              label="Include Raw Data"
              description="Append detailed data tables and source information"
              checked={exportSettings?.includeRawData}
              onChange={(e) => handleSettingChange('includeRawData', e?.target?.checked)}
            />
            <Checkbox
              label="Include Appendix"
              description="Add regulatory references and methodology notes"
              checked={exportSettings?.includeAppendix}
              onChange={(e) => handleSettingChange('includeAppendix', e?.target?.checked)}
            />
          </div>
        </div>

        {/* Security Options */}
        <div className="space-y-4">
          <h3 className="font-heading font-medium text-foreground">Security Options</h3>
          
          <Input
            label="Password Protection"
            type="password"
            placeholder="Enter password (optional)"
            description="Protect the exported file with a password"
            value={exportSettings?.password}
            onChange={(e) => handleSettingChange('password', e?.target?.value)}
          />

          <Checkbox
            label="Add Watermark"
            description="Include company watermark on all pages"
            checked={exportSettings?.watermark}
            onChange={(e) => handleSettingChange('watermark', e?.target?.checked)}
          />
        </div>

        {/* Distribution */}
        <div className="space-y-4">
          <h3 className="font-heading font-medium text-foreground">Distribution</h3>
          
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter recipient email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e?.target?.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={handleAddRecipient}>
              <Icon name="Plus" size={16} />
            </Button>
          </div>

          {exportSettings?.recipients?.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-body font-medium text-foreground">
                Recipients ({exportSettings?.recipients?.length})
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {exportSettings?.recipients?.map((email, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <span className="text-sm text-foreground">{email}</span>
                    <button
                      onClick={() => handleRemoveRecipient(email)}
                      className="text-muted-foreground hover:text-error transition-colors duration-200"
                    >
                      <Icon name="X" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Scheduled Export */}
        <div className="space-y-4">
          <Checkbox
            label="Schedule Automatic Export"
            description="Automatically generate and distribute this report"
            checked={exportSettings?.scheduleExport}
            onChange={(e) => handleSettingChange('scheduleExport', e?.target?.checked)}
          />

          {exportSettings?.scheduleExport && (
            <div className="ml-6 space-y-4">
              <Select
                label="Frequency"
                options={frequencyOptions}
                value={exportSettings?.frequency}
                onChange={(value) => handleSettingChange('frequency', value)}
              />
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Icon name="Clock" size={20} className="text-primary mt-0.5" />
                  <div>
                    <p className="font-body font-medium text-foreground">
                      Next Export: September 23, 2025 at 9:00 AM
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Reports will be automatically generated and sent to {exportSettings?.recipients?.length} recipients
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Export Summary */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-body font-medium text-foreground mb-3">Export Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Icon name={getFormatIcon(exportSettings?.format)} size={16} className="text-muted-foreground" />
              <span className="text-foreground">{formatOptions?.find(f => f?.value === exportSettings?.format)?.label}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="HardDrive" size={16} className="text-muted-foreground" />
              <span className="text-foreground">~{estimatedFileSize()} MB</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="Users" size={16} className="text-muted-foreground" />
              <span className="text-foreground">{exportSettings?.recipients?.length} recipients</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="Shield" size={16} className="text-muted-foreground" />
              <span className="text-foreground">
                {exportSettings?.password ? 'Password protected' : 'No protection'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handlePreviewExport}
            disabled={isPreviewing || !reportConfig?.title}
          >
            {isPreviewing ? (
              <>
                <Icon name="Loader" size={16} className="mr-2 animate-spin" />
                Previewing...
              </>
            ) : (
              <>
                <Icon name="Eye" size={16} className="mr-2" />
                Preview Export
              </>
            )}
          </Button>
          <Button 
            variant="default" 
            className="flex-1" 
            onClick={handleExport}
            disabled={isExporting || !reportConfig?.title}
          >
            {isExporting ? (
              <>
                <Icon name="Loader" size={16} className="mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Icon name="Download" size={16} className="mr-2" />
                Export Report
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportOptions;