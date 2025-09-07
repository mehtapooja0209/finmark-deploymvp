import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import Select from '../../../components/ui/Select';

const FilterSidebar = ({ filters, onFiltersChange, onSavePreset, savedPresets, onLoadPreset }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  const regulatoryBodies = [
    { value: 'rbi', label: 'Reserve Bank of India', icon: 'Building2' },
    { value: 'sebi', label: 'SEBI', icon: 'TrendingUp' },
    { value: 'irdai', label: 'IRDAI', icon: 'Shield' },
    { value: 'mca', label: 'Ministry of Corporate Affairs', icon: 'FileText' },
    { value: 'fiu', label: 'Financial Intelligence Unit', icon: 'Eye' }
  ];

  const priorityLevels = [
    { value: 'critical', label: 'Critical', color: 'text-error' },
    { value: 'high', label: 'High', color: 'text-warning' },
    { value: 'medium', label: 'Medium', color: 'text-primary' },
    { value: 'low', label: 'Low', color: 'text-muted-foreground' }
  ];

  const businessAreas = [
    'Digital Lending',
    'Payment Services',
    'Wealth Management',
    'Insurance',
    'Credit Scoring',
    'KYC/AML',
    'Data Protection',
    'Consumer Protection',
    'Risk Management',
    'Cybersecurity'
  ];

  const dateRanges = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handleFilterChange = (filterType, value, checked = null) => {
    const newFilters = { ...filters };
    
    if (filterType === 'regulatoryBodies' || filterType === 'priorities' || filterType === 'businessAreas') {
      if (checked !== null) {
        if (checked) {
          newFilters[filterType] = [...(newFilters?.[filterType] || []), value];
        } else {
          newFilters[filterType] = (newFilters?.[filterType] || [])?.filter(item => item !== value);
        }
      }
    } else {
      newFilters[filterType] = value;
    }
    
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      regulatoryBodies: [],
      priorities: [],
      businessAreas: [],
      dateRange: 'month',
      customStartDate: '',
      customEndDate: '',
      readStatus: 'all'
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters?.regulatoryBodies?.length > 0) count++;
    if (filters?.priorities?.length > 0) count++;
    if (filters?.businessAreas?.length > 0) count++;
    if (filters?.dateRange !== 'month') count++;
    if (filters?.readStatus !== 'all') count++;
    return count;
  };

  const handleSavePreset = () => {
    if (presetName?.trim()) {
      onSavePreset(presetName?.trim(), filters);
      setPresetName('');
      setShowSavePreset(false);
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-card border-r border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          iconName="ChevronRight"
          onClick={() => setIsCollapsed(false)}
          className="w-full"
        />
        {getActiveFilterCount() > 0 && (
          <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium mt-2 mx-auto">
            {getActiveFilterCount()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-80 bg-card border-r border-border p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={20} className="text-foreground" />
          <h2 className="font-heading font-semibold text-lg text-foreground">Filters</h2>
          {getActiveFilterCount() > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
              {getActiveFilterCount()}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          iconName="ChevronLeft"
          onClick={() => setIsCollapsed(true)}
        />
      </div>
      {/* Saved Presets */}
      {savedPresets && savedPresets?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-heading font-medium text-foreground mb-3">Saved Presets</h3>
          <div className="space-y-2">
            {savedPresets?.map((preset, index) => (
              <button
                key={index}
                onClick={() => onLoadPreset(preset)}
                className="w-full flex items-center justify-between p-2 bg-muted/50 hover:bg-muted rounded-lg transition-colors duration-200"
              >
                <span className="text-sm font-medium text-foreground">{preset?.name}</span>
                <Icon name="ChevronRight" size={14} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Quick Actions */}
      <div className="flex space-x-2 mb-6">
        <Button
          variant="outline"
          size="sm"
          iconName="RotateCcw"
          onClick={clearAllFilters}
          className="flex-1"
        >
          Clear All
        </Button>
        <Button
          variant="outline"
          size="sm"
          iconName="Save"
          onClick={() => setShowSavePreset(true)}
          className="flex-1"
        >
          Save
        </Button>
      </div>
      {/* Save Preset Modal */}
      {showSavePreset && (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
          <h4 className="font-heading font-medium text-foreground mb-2">Save Filter Preset</h4>
          <div className="space-y-3">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e?.target?.value)}
              placeholder="Enter preset name"
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex space-x-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleSavePreset}
                disabled={!presetName?.trim()}
                className="flex-1"
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSavePreset(false);
                  setPresetName('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-6">
        {/* Regulatory Bodies */}
        <div>
          <h3 className="font-heading font-medium text-foreground mb-3">Regulatory Bodies</h3>
          <div className="space-y-2">
            {regulatoryBodies?.map((body) => (
              <Checkbox
                key={body?.value}
                label={
                  <div className="flex items-center space-x-2">
                    <Icon name={body?.icon} size={16} className="text-muted-foreground" />
                    <span className="text-sm">{body?.label}</span>
                  </div>
                }
                checked={filters?.regulatoryBodies?.includes(body?.value) || false}
                onChange={(e) => handleFilterChange('regulatoryBodies', body?.value, e?.target?.checked)}
              />
            ))}
          </div>
        </div>

        {/* Priority Levels */}
        <div>
          <h3 className="font-heading font-medium text-foreground mb-3">Priority Level</h3>
          <div className="space-y-2">
            {priorityLevels?.map((priority) => (
              <Checkbox
                key={priority?.value}
                label={
                  <span className={`text-sm font-medium ${priority?.color}`}>
                    {priority?.label}
                  </span>
                }
                checked={filters?.priorities?.includes(priority?.value) || false}
                onChange={(e) => handleFilterChange('priorities', priority?.value, e?.target?.checked)}
              />
            ))}
          </div>
        </div>

        {/* Business Areas */}
        <div>
          <h3 className="font-heading font-medium text-foreground mb-3">Business Areas</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {businessAreas?.map((area) => (
              <Checkbox
                key={area}
                label={<span className="text-sm">{area}</span>}
                checked={filters?.businessAreas?.includes(area) || false}
                onChange={(e) => handleFilterChange('businessAreas', area, e?.target?.checked)}
              />
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <h3 className="font-heading font-medium text-foreground mb-3">Date Range</h3>
          <Select
            options={dateRanges}
            value={filters?.dateRange || 'month'}
            onChange={(value) => handleFilterChange('dateRange', value)}
            placeholder="Select date range"
          />
          
          {filters?.dateRange === 'custom' && (
            <div className="mt-3 space-y-2">
              <input
                type="date"
                value={filters?.customStartDate || ''}
                onChange={(e) => handleFilterChange('customStartDate', e?.target?.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Start date"
              />
              <input
                type="date"
                value={filters?.customEndDate || ''}
                onChange={(e) => handleFilterChange('customEndDate', e?.target?.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="End date"
              />
            </div>
          )}
        </div>

        {/* Read Status */}
        <div>
          <h3 className="font-heading font-medium text-foreground mb-3">Read Status</h3>
          <Select
            options={[
              { value: 'all', label: 'All Updates' },
              { value: 'unread', label: 'Unread Only' },
              { value: 'read', label: 'Read Only' }
            ]}
            value={filters?.readStatus || 'all'}
            onChange={(value) => handleFilterChange('readStatus', value)}
            placeholder="Select read status"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;