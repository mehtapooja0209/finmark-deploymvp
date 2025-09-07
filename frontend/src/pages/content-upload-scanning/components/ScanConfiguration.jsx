import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const ScanConfiguration = ({ onConfigChange, isScanning }) => {
  const [config, setConfig] = useState({
    contentType: 'social-media',
    targetAudience: 'retail',
    productCategory: 'lending',
    strictnessLevel: 'standard',
    focusAreas: ['misleading-claims', 'interest-rates', 'terms-conditions'],
    enableOCR: true,
    checkSimilarity: false,
    generateReport: true
  });

  const contentTypeOptions = [
    { value: 'social-media', label: 'Social Media Posts' },
    { value: 'website-copy', label: 'Website Content' },
    { value: 'advertisements', label: 'Advertisements' },
    { value: 'email-campaigns', label: 'Email Campaigns' },
    { value: 'brochures', label: 'Brochures & Flyers' },
    { value: 'presentations', label: 'Presentations' }
  ];

  const audienceOptions = [
    { value: 'retail', label: 'Retail Customers' },
    { value: 'corporate', label: 'Corporate Clients' },
    { value: 'sme', label: 'SME Businesses' },
    { value: 'institutional', label: 'Institutional Investors' }
  ];

  const productCategoryOptions = [
    { value: 'lending', label: 'Lending Products' },
    { value: 'payments', label: 'Payment Services' },
    { value: 'investments', label: 'Investment Products' },
    { value: 'insurance', label: 'Insurance Services' },
    { value: 'banking', label: 'Banking Services' },
    { value: 'crypto', label: 'Cryptocurrency' }
  ];

  const strictnessOptions = [
    { value: 'lenient', label: 'Lenient - Basic compliance check' },
    { value: 'standard', label: 'Standard - Comprehensive scanning' },
    { value: 'strict', label: 'Strict - Detailed regulatory review' }
  ];

  const focusAreaOptions = [
    { value: 'misleading-claims', label: 'Misleading Claims' },
    { value: 'interest-rates', label: 'Interest Rate Disclosures' },
    { value: 'terms-conditions', label: 'Terms & Conditions' },
    { value: 'risk-warnings', label: 'Risk Warnings' },
    { value: 'data-privacy', label: 'Data Privacy' },
    { value: 'kyc-compliance', label: 'KYC Requirements' },
    { value: 'fair-practices', label: 'Fair Practices Code' },
    { value: 'grievance-redressal', label: 'Grievance Redressal' }
  ];

  const handleConfigUpdate = (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleFocusAreaChange = (area, checked) => {
    const newFocusAreas = checked
      ? [...config?.focusAreas, area]
      : config?.focusAreas?.filter(item => item !== area);
    handleConfigUpdate('focusAreas', newFocusAreas);
  };

  const resetToDefaults = () => {
    const defaultConfig = {
      contentType: 'social-media',
      targetAudience: 'retail',
      productCategory: 'lending',
      strictnessLevel: 'standard',
      focusAreas: ['misleading-claims', 'interest-rates', 'terms-conditions'],
      enableOCR: true,
      checkSimilarity: false,
      generateReport: true
    };
    setConfig(defaultConfig);
    onConfigChange(defaultConfig);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-semibold text-xl text-foreground">
            Scan Configuration
          </h2>
          <p className="text-muted-foreground font-body text-sm">
            Customize scanning parameters for accurate compliance checking
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetToDefaults}
          disabled={isScanning}
          iconName="RotateCcw"
          iconPosition="left"
        >
          Reset
        </Button>
      </div>
      <div className="space-y-6">
        {/* Content Type */}
        <div>
          <Select
            label="Content Type"
            description="Select the type of marketing content being scanned"
            options={contentTypeOptions}
            value={config?.contentType}
            onChange={(value) => handleConfigUpdate('contentType', value)}
            disabled={isScanning}
          />
        </div>

        {/* Target Audience */}
        <div>
          <Select
            label="Target Audience"
            description="Specify the intended audience for compliance context"
            options={audienceOptions}
            value={config?.targetAudience}
            onChange={(value) => handleConfigUpdate('targetAudience', value)}
            disabled={isScanning}
          />
        </div>

        {/* Product Category */}
        <div>
          <Select
            label="Financial Product Category"
            description="Choose the relevant financial product category"
            options={productCategoryOptions}
            value={config?.productCategory}
            onChange={(value) => handleConfigUpdate('productCategory', value)}
            disabled={isScanning}
          />
        </div>

        {/* Strictness Level */}
        <div>
          <Select
            label="Compliance Strictness"
            description="Set the level of regulatory scrutiny"
            options={strictnessOptions}
            value={config?.strictnessLevel}
            onChange={(value) => handleConfigUpdate('strictnessLevel', value)}
            disabled={isScanning}
          />
        </div>

        {/* Focus Areas */}
        <div>
          <label className="block text-sm font-body font-medium text-foreground mb-3">
            Compliance Focus Areas
          </label>
          <p className="text-xs text-muted-foreground font-body mb-4">
            Select specific regulatory areas to emphasize during scanning
          </p>
          <div className="grid grid-cols-1 gap-3">
            {focusAreaOptions?.map((area) => (
              <Checkbox
                key={area?.value}
                label={area?.label}
                checked={config?.focusAreas?.includes(area?.value)}
                onChange={(e) => handleFocusAreaChange(area?.value, e?.target?.checked)}
                disabled={isScanning}
              />
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="border-t border-border pt-6">
          <h3 className="font-body font-medium text-foreground mb-4">
            Advanced Options
          </h3>
          <div className="space-y-3">
            <Checkbox
              label="Enable OCR for Image Content"
              description="Extract and analyze text from images and PDFs"
              checked={config?.enableOCR}
              onChange={(e) => handleConfigUpdate('enableOCR', e?.target?.checked)}
              disabled={isScanning}
            />
            <Checkbox
              label="Check Content Similarity"
              description="Compare against previously scanned content for duplicates"
              checked={config?.checkSimilarity}
              onChange={(e) => handleConfigUpdate('checkSimilarity', e?.target?.checked)}
              disabled={isScanning}
            />
            <Checkbox
              label="Generate Detailed Report"
              description="Create comprehensive compliance report with recommendations"
              checked={config?.generateReport}
              onChange={(e) => handleConfigUpdate('generateReport', e?.target?.checked)}
              disabled={isScanning}
            />
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-body font-medium text-foreground mb-2 flex items-center">
            <Icon name="Settings" size={16} className="mr-2" />
            Current Configuration
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground font-body">Content:</span>
              <span className="ml-2 text-foreground font-body">
                {contentTypeOptions?.find(opt => opt?.value === config?.contentType)?.label}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground font-body">Audience:</span>
              <span className="ml-2 text-foreground font-body">
                {audienceOptions?.find(opt => opt?.value === config?.targetAudience)?.label}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground font-body">Product:</span>
              <span className="ml-2 text-foreground font-body">
                {productCategoryOptions?.find(opt => opt?.value === config?.productCategory)?.label}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground font-body">Strictness:</span>
              <span className="ml-2 text-foreground font-body capitalize">
                {config?.strictnessLevel}
              </span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-muted-foreground font-body text-sm">Focus Areas:</span>
            <span className="ml-2 text-foreground font-body text-sm">
              {config?.focusAreas?.length} selected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanConfiguration;