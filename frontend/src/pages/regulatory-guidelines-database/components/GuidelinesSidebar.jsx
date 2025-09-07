import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const GuidelinesSidebar = ({ 
  selectedCategory, 
  onCategorySelect, 
  selectedSubcategory, 
  onSubcategorySelect,
  isCollapsed,
  onToggleCollapse 
}) => {
  const [expandedCategories, setExpandedCategories] = useState(['rbi-guidelines']);

  const categories = [
    {
      id: 'rbi-guidelines',
      name: 'RBI Guidelines',
      icon: 'Building2',
      count: 16,
      subcategories: [
        { id: 'digital-lending', name: 'Digital Lending', count: 2 },
        { id: 'commercial-banking', name: 'Commercial Banking', count: 4 },
        { id: 'payment-systems', name: 'Payment Systems', count: 2 },
        { id: 'nbfc', name: 'NBFC', count: 2 },
        { id: 'financial-markets', name: 'Financial Markets', count: 2 },
        { id: 'consumer-protection', name: 'Consumer Protection', count: 2 },
        { id: 'fraud-risk-management', name: 'Fraud Risk Management', count: 2 }
      ]
    },
    {
      id: 'sebi-regulations',
      name: 'SEBI Regulations',
      icon: 'TrendingUp',
      count: 89,
      subcategories: [
        { id: 'mutual-funds', name: 'Mutual Funds', count: 25 },
        { id: 'portfolio-management', name: 'Portfolio Management', count: 18 },
        { id: 'investment-advisory', name: 'Investment Advisory', count: 22 },
        { id: 'disclosure-norms', name: 'Disclosure Norms', count: 24 }
      ]
    },
    {
      id: 'irdai-guidelines',
      name: 'IRDAI Guidelines',
      icon: 'Shield',
      count: 67,
      subcategories: [
        { id: 'insurance-broking', name: 'Insurance Broking', count: 15 },
        { id: 'web-aggregators', name: 'Web Aggregators', count: 12 },
        { id: 'point-of-sale', name: 'Point of Sale', count: 18 },
        { id: 'corporate-agents', name: 'Corporate Agents', count: 22 }
      ]
    },
    {
      id: 'advertising-standards',
      name: 'Advertising Standards',
      icon: 'Megaphone',
      count: 45,
      subcategories: [
        { id: 'asci-guidelines', name: 'ASCI Guidelines', count: 20 },
        { id: 'financial-advertising', name: 'Financial Advertising', count: 15 },
        { id: 'digital-marketing', name: 'Digital Marketing', count: 10 }
      ]
    },
    {
      id: 'consumer-protection',
      name: 'Consumer Protection',
      icon: 'Users',
      count: 38,
      subcategories: [
        { id: 'grievance-redressal', name: 'Grievance Redressal', count: 12 },
        { id: 'ombudsman-scheme', name: 'Ombudsman Scheme', count: 14 },
        { id: 'consumer-rights', name: 'Consumer Rights', count: 12 }
      ]
    }
  ];

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => 
      prev?.includes(categoryId) 
        ? prev?.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (isCollapsed) {
    return (
      <div className="w-16 bg-card border-r border-border flex flex-col items-center py-4 space-y-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-200"
        >
          <Icon name="ChevronRight" size={20} />
        </button>
        {categories?.map((category) => (
          <button
            key={category?.id}
            onClick={() => onCategorySelect(category?.id)}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              selectedCategory === category?.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title={category?.name}
          >
            <Icon name={category?.icon} size={20} />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-lg text-foreground">
            Guidelines Database
          </h2>
          <button
            onClick={onToggleCollapse}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors duration-200"
          >
            <Icon name="ChevronLeft" size={16} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Browse regulatory requirements by category
        </p>
      </div>
      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {categories?.map((category) => {
            const isExpanded = expandedCategories?.includes(category?.id);
            const isSelected = selectedCategory === category?.id;

            return (
              <div key={category?.id} className="space-y-1">
                <button
                  onClick={() => {
                    onCategorySelect(category?.id);
                    toggleCategory(category?.id);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors duration-200 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon name={category?.icon} size={18} />
                    <div>
                      <span className="font-body font-medium text-sm">
                        {category?.name}
                      </span>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs opacity-75">
                          {category?.count} guidelines
                        </span>
                      </div>
                    </div>
                  </div>
                  <Icon 
                    name="ChevronDown" 
                    size={16} 
                    className={`transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {/* Subcategories */}
                {isExpanded && (
                  <div className="ml-6 space-y-1">
                    {category?.subcategories?.map((subcategory) => (
                      <button
                        key={subcategory?.id}
                        onClick={() => onSubcategorySelect(subcategory?.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-md text-left text-sm transition-colors duration-200 ${
                          selectedSubcategory === subcategory?.id
                            ? 'bg-secondary text-secondary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <span className="font-body">{subcategory?.name}</span>
                        <span className="text-xs opacity-75">
                          {subcategory?.count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Quick Stats */}
      <div className="p-4 border-t border-border">
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="Database" size={16} className="text-primary" />
            <span className="font-body font-medium text-sm text-foreground">
              Database Stats
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Total Guidelines:</span>
              <div className="font-medium text-foreground">16</div>
            </div>
            <div>
              <span className="text-muted-foreground">Last Updated:</span>
              <div className="font-medium text-foreground">2025-08-28</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidelinesSidebar;