import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const GuidelinesSearch = ({ 
  searchQuery, 
  onSearchChange, 
  onAdvancedSearch,
  searchFilters,
  onFiltersChange 
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  const suggestions = [
    { text: "Digital lending guidelines", type: "guideline", count: 23 },
    { text: "KYC requirements", type: "requirement", count: 45 },
    { text: "Payment system norms", type: "norm", count: 34 },
    { text: "Customer protection", type: "protection", count: 28 },
    { text: "Data localization", type: "data", count: 12 },
    { text: "Fair practice code", type: "practice", count: 19 },
    { text: "Grievance redressal", type: "grievance", count: 15 },
    { text: "Outsourcing guidelines", type: "outsourcing", count: 8 }
  ];

  const filteredSuggestions = suggestions?.filter(suggestion =>
    suggestion?.text?.toLowerCase()?.includes(searchQuery?.toLowerCase()) && searchQuery?.length > 0
  );

  const regulatoryBodies = [
    { value: 'all', label: 'All Regulatory Bodies' },
    { value: 'rbi', label: 'Reserve Bank of India (RBI)' },
    { value: 'sebi', label: 'Securities and Exchange Board of India (SEBI)' },
    { value: 'irdai', label: 'Insurance Regulatory and Development Authority (IRDAI)' },
    { value: 'asci', label: 'Advertising Standards Council of India (ASCI)' }
  ];

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '1year', label: 'Last Year' },
    { value: '2years', label: 'Last 2 Years' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const productTypes = [
    { value: 'all', label: 'All Product Types' },
    { value: 'lending', label: 'Lending Products' },
    { value: 'payments', label: 'Payment Services' },
    { value: 'investments', label: 'Investment Products' },
    { value: 'insurance', label: 'Insurance Products' },
    { value: 'banking', label: 'Banking Services' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef?.current && !searchRef?.current?.contains(event?.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion) => {
    onSearchChange(suggestion?.text);
    setShowSuggestions(false);
  };

  const handleAdvancedToggle = () => {
    setShowAdvanced(!showAdvanced);
  };

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...searchFilters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      regulatoryBody: 'all',
      dateRange: 'all',
      productType: 'all',
      customDateFrom: '',
      customDateTo: '',
      includeAmendments: true,
      onlyActive: true
    });
  };

  return (
    <div className="bg-card border-b border-border">
      <div className="p-6">
        {/* Main Search */}
        <div className="relative" ref={searchRef}>
          <div className="relative">
            <Input
              type="search"
              placeholder="Search guidelines, regulations, or specific requirements..."
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e?.target?.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="pl-12 pr-24 h-12 text-base"
            />
            <Icon 
              name="Search" 
              size={20} 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAdvancedToggle}
                className="text-xs"
              >
                <Icon name="SlidersHorizontal" size={16} className="mr-1" />
                Advanced
              </Button>
            </div>
          </div>

          {/* Search Suggestions */}
          {showSuggestions && filteredSuggestions?.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-modal z-50 max-h-64 overflow-y-auto">
              {filteredSuggestions?.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-muted transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Icon 
                      name={
                        suggestion?.type === 'guideline' ? 'FileText' :
                        suggestion?.type === 'requirement' ? 'CheckCircle' :
                        suggestion?.type === 'norm'? 'Scale' : 'BookOpen'
                      } 
                      size={16} 
                      className="text-muted-foreground" 
                    />
                    <span className="font-body text-sm text-popover-foreground">
                      {suggestion?.text}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {suggestion?.count} results
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Advanced Search Filters */}
        {showAdvanced && (
          <div className="mt-6 p-4 bg-muted rounded-lg border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-medium text-foreground">
                Advanced Search Filters
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Clear All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Regulatory Body Filter */}
              <div>
                <label className="block text-sm font-body font-medium text-foreground mb-2">
                  Regulatory Body
                </label>
                <select
                  value={searchFilters?.regulatoryBody}
                  onChange={(e) => handleFilterChange('regulatoryBody', e?.target?.value)}
                  className="w-full px-3 py-2 text-sm bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {regulatoryBodies?.map((body) => (
                    <option key={body?.value} value={body?.value}>
                      {body?.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-body font-medium text-foreground mb-2">
                  Date Range
                </label>
                <select
                  value={searchFilters?.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e?.target?.value)}
                  className="w-full px-3 py-2 text-sm bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {dateRanges?.map((range) => (
                    <option key={range?.value} value={range?.value}>
                      {range?.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Type Filter */}
              <div>
                <label className="block text-sm font-body font-medium text-foreground mb-2">
                  Product Type
                </label>
                <select
                  value={searchFilters?.productType}
                  onChange={(e) => handleFilterChange('productType', e?.target?.value)}
                  className="w-full px-3 py-2 text-sm bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {productTypes?.map((type) => (
                    <option key={type?.value} value={type?.value}>
                      {type?.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Date Range */}
            {searchFilters?.dateRange === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Input
                  type="date"
                  label="From Date"
                  value={searchFilters?.customDateFrom}
                  onChange={(e) => handleFilterChange('customDateFrom', e?.target?.value)}
                />
                <Input
                  type="date"
                  label="To Date"
                  value={searchFilters?.customDateTo}
                  onChange={(e) => handleFilterChange('customDateTo', e?.target?.value)}
                />
              </div>
            )}

            {/* Additional Options */}
            <div className="flex flex-wrap gap-4 mt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={searchFilters?.includeAmendments}
                  onChange={(e) => handleFilterChange('includeAmendments', e?.target?.checked)}
                  className="w-4 h-4 text-primary border-border rounded focus:ring-ring"
                />
                <span className="text-sm font-body text-foreground">
                  Include Amendments
                </span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={searchFilters?.onlyActive}
                  onChange={(e) => handleFilterChange('onlyActive', e?.target?.checked)}
                  className="w-4 h-4 text-primary border-border rounded focus:ring-ring"
                />
                <span className="text-sm font-body text-foreground">
                  Only Active Guidelines
                </span>
              </label>
            </div>

            {/* Search Actions */}
            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAdvanced(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={onAdvancedSearch}
                iconName="Search"
                iconPosition="left"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        )}

        {/* Quick Search Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-sm font-body text-muted-foreground">
            Popular searches:
          </span>
          {['KYC Guidelines', 'Digital Lending', 'Payment Systems', 'Data Protection']?.map((tag) => (
            <button
              key={tag}
              onClick={() => onSearchChange(tag)}
              className="px-3 py-1 text-xs font-body bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground rounded-full transition-colors duration-200"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GuidelinesSearch;