import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RegulatoryUpdates = () => {
  const updates = [
    {
      id: 1,
      source: 'RBI',
      title: 'Digital Lending Guidelines Amendment',
      summary: 'New requirements for loan processing fee disclosure and customer consent mechanisms',
      publishDate: '2024-08-20',
      effectiveDate: '2024-08-30',
      priority: 'High',
      category: 'Digital Lending',
      status: 'Action Required',
      impactedContent: 15
    },
    {
      id: 2,
      source: 'SEBI',
      title: 'Mutual Fund Advertisement Guidelines',
      summary: 'Updated risk disclosure requirements and performance data presentation rules',
      publishDate: '2024-08-18',
      effectiveDate: '2024-09-15',
      priority: 'Medium',
      category: 'Investment Products',
      status: 'Under Review',
      impactedContent: 8
    },
    {
      id: 3,
      source: 'IRDAI',
      title: 'Insurance Product Disclosure Norms',
      summary: 'Enhanced transparency requirements for insurance product marketing materials',
      publishDate: '2024-08-15',
      effectiveDate: '2024-10-01',
      priority: 'Medium',
      category: 'Insurance',
      status: 'Monitoring',
      impactedContent: 12
    },
    {
      id: 4,
      source: 'RBI',
      title: 'Credit Card Issuance Guidelines',
      summary: 'Revised guidelines for credit card marketing and customer acquisition practices',
      publishDate: '2024-08-10',
      effectiveDate: '2024-09-01',
      priority: 'High',
      category: 'Credit Cards',
      status: 'Implemented',
      impactedContent: 22
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-error bg-error/10';
      case 'Medium': return 'text-warning bg-warning/10';
      case 'Low': return 'text-success bg-success/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Action Required': return 'text-error bg-error/10';
      case 'Under Review': return 'text-warning bg-warning/10';
      case 'Monitoring': return 'text-primary bg-primary/10';
      case 'Implemented': return 'text-success bg-success/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'RBI': return 'Landmark';
      case 'SEBI': return 'TrendingUp';
      case 'IRDAI': return 'Shield';
      default: return 'BookOpen';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-lg text-foreground">Regulatory Updates</h3>
        <Button variant="ghost" size="sm" iconName="ExternalLink">
          View All Updates
        </Button>
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {updates?.map((update) => (
          <div key={update?.id} className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon name={getSourceIcon(update?.source)} size={16} color="var(--color-primary)" />
                </div>
                <div>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                    {update?.source}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getPriorityColor(update?.priority)}`}>
                  {update?.priority}
                </span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(update?.status)}`}>
                  {update?.status}
                </span>
              </div>
            </div>

            <h4 className="font-body font-medium text-foreground text-sm mb-2">
              {update?.title}
            </h4>
            
            <p className="text-sm text-muted-foreground mb-3">
              {update?.summary}
            </p>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <Icon name="Calendar" size={12} />
                  <span>Published: {formatDate(update?.publishDate)}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Icon name="Clock" size={12} />
                  <span>Effective: {formatDate(update?.effectiveDate)}</span>
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Icon name="FileText" size={12} />
                <span>{update?.impactedContent} content items affected</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Category: {update?.category}
              </span>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="xs">
                  View Details
                </Button>
                <Button variant="outline" size="xs">
                  Impact Analysis
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegulatoryUpdates;