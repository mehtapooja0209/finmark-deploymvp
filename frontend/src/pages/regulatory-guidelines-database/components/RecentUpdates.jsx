import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RecentUpdates = ({ isVisible, onToggle }) => {
  const [selectedUpdate, setSelectedUpdate] = useState(null);

  const recentUpdates = [
    {
      id: 1,
      title: 'RBI Updates Digital Lending Guidelines',
      date: '23/08/2023',
      time: '10:30 AM',
      type: 'guideline-update',
      urgency: 'high',
      summary: 'New requirements for customer consent and data protection in digital lending platforms',
      details: `The Reserve Bank of India has issued updated guidelines for digital lending platforms, introducing stricter requirements for:\n\n• Enhanced customer consent mechanisms\n• Mandatory data localization for sensitive customer information\n• Revised fee disclosure formats\n• Strengthened grievance redressal procedures\n\nImplementation deadline: 31st October 2023`,
      impactedAreas: ['Digital Lending', 'Data Protection', 'Customer Consent'],
      referenceNumber: 'RBI/2023-24/87',
      source: 'RBI Official Circular'
    },
    {
      id: 2,
      title: 'SEBI Revises Investment Advisory Disclosure Norms',
      date: '22/08/2023',
      time: '2:15 PM',
      type: 'regulation-change',
      urgency: 'medium',
      summary: 'Updated disclosure requirements for investment advisory services and fee structures',
      details: `SEBI has revised the disclosure norms for investment advisory services with focus on:\n\n• Clear fee structure disclosure\n• Risk profiling documentation\n• Performance reporting standards\n• Client agreement templates\n\nEffective from: 1st November 2023`,
      impactedAreas: ['Investment Advisory', 'Fee Disclosure', 'Client Documentation'],
      referenceNumber: 'SEBI/HO/IMD/IMD-I/P/CIR/2023/123',
      source: 'SEBI Circular'
    },
    {
      id: 3,
      title: 'IRDAI Issues Guidelines for Insurance Web Aggregators',
      date: '21/08/2023',
      time: '4:45 PM',
      type: 'new-guideline',
      urgency: 'medium',
      summary: 'Comprehensive framework for insurance web aggregator operations and compliance',
      details: `IRDAI has released new guidelines for insurance web aggregators covering:\n\n• Registration and licensing requirements\n• Technology and data security standards\n• Customer protection measures\n• Commission and fee structures\n\nCompliance timeline: 6 months from notification`,
      impactedAreas: ['Insurance Distribution', 'Web Aggregators', 'Technology Standards'],
      referenceNumber: 'IRDAI/REG/5/2023-24',
      source: 'IRDAI Regulation'
    },
    {
      id: 4,
      title: 'Updated Fair Practices Code for NBFCs',
      date: '20/08/2023',
      time: '11:20 AM',
      type: 'amendment',
      urgency: 'low',
      summary: 'Minor amendments to fair practices code focusing on customer communication',
      details: `RBI has made minor amendments to the Fair Practices Code for NBFCs:\n\n• Enhanced customer communication standards\n• Simplified complaint resolution process\n• Updated documentation requirements\n• Revised timeline for loan processing\n\nImplementation: Immediate effect`,
      impactedAreas: ['Fair Practices', 'Customer Communication', 'Loan Processing'],
      referenceNumber: 'RBI/2023-24/85',
      source: 'RBI Master Direction'
    },
    {
      id: 5,
      title: 'ASCI Updates Financial Services Advertising Guidelines',
      date: '19/08/2023',
      time: '9:00 AM',
      type: 'industry-standard',
      urgency: 'low',
      summary: 'Revised advertising standards for financial services with focus on digital marketing',
      details: `ASCI has updated advertising guidelines for financial services:\n\n• Digital marketing compliance requirements\n• Social media advertising standards\n• Influencer marketing guidelines\n• Misleading claims prevention\n\nAdoption recommended by: 30th September 2023`,
      impactedAreas: ['Advertising Standards', 'Digital Marketing', 'Social Media'],
      referenceNumber: 'ASCI/2023/FS-ADV/08',
      source: 'ASCI Guidelines'
    }
  ];

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'text-error bg-error/10 border-error/20';
      case 'medium': return 'text-warning bg-warning/10 border-warning/20';
      case 'low': return 'text-success bg-success/10 border-success/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'guideline-update': return 'RefreshCw';
      case 'regulation-change': return 'Edit';
      case 'new-guideline': return 'Plus';
      case 'amendment': return 'GitBranch';
      case 'industry-standard': return 'Award';
      default: return 'Bell';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'guideline-update': return 'text-primary bg-primary/10';
      case 'regulation-change': return 'text-warning bg-warning/10';
      case 'new-guideline': return 'text-success bg-success/10';
      case 'amendment': return 'text-secondary bg-secondary/10';
      case 'industry-standard': return 'text-accent bg-accent/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed top-1/2 right-0 transform -translate-y-1/2 z-40">
        <button
          onClick={onToggle}
          className="bg-primary text-primary-foreground p-3 rounded-l-lg shadow-lg hover:bg-primary/90 transition-colors duration-200"
          title="Show Recent Updates"
        >
          <Icon name="Bell" size={20} />
          <span className="absolute -top-1 -left-1 w-3 h-3 bg-error rounded-full animate-pulse"></span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-16 right-0 bottom-0 w-96 bg-card border-l border-border shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon name="Bell" size={20} className="text-primary" />
            <h2 className="font-heading font-semibold text-lg text-foreground">
              Recent Updates
            </h2>
          </div>
          <button
            onClick={onToggle}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors duration-200"
          >
            <Icon name="X" size={16} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Latest regulatory changes and announcements
        </p>
      </div>
      {/* Updates List */}
      <div className="flex-1 overflow-y-auto">
        {selectedUpdate ? (
          /* Update Details View */
          (<div className="p-4">
            <button
              onClick={() => setSelectedUpdate(null)}
              className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <Icon name="ArrowLeft" size={16} />
              <span>Back to updates</span>
            </button>
            <div className="space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getUrgencyColor(selectedUpdate?.urgency)}`}>
                    {selectedUpdate?.urgency?.toUpperCase()} PRIORITY
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(selectedUpdate?.type)}`}>
                    {selectedUpdate?.type?.replace('-', ' ')?.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-heading font-semibold text-lg text-foreground leading-tight">
                  {selectedUpdate?.title}
                </h3>
                <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Icon name="Calendar" size={12} />
                    <span>{selectedUpdate?.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Icon name="Clock" size={12} />
                    <span>{selectedUpdate?.time}</span>
                  </div>
                </div>
              </div>

              {/* Reference */}
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">Reference Number:</span>
                    <div className="font-mono text-sm text-foreground">{selectedUpdate?.referenceNumber}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Source:</span>
                    <div className="text-sm text-foreground">{selectedUpdate?.source}</div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div>
                <h4 className="font-body font-medium text-foreground mb-2">Summary</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedUpdate?.summary}
                </p>
              </div>

              {/* Details */}
              <div>
                <h4 className="font-body font-medium text-foreground mb-2">Details</h4>
                <div className="bg-muted rounded-lg p-3">
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-body">
                    {selectedUpdate?.details}
                  </pre>
                </div>
              </div>

              {/* Impacted Areas */}
              <div>
                <h4 className="font-body font-medium text-foreground mb-2">Impacted Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedUpdate?.impactedAreas?.map((area, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-full"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                <Button variant="default" size="sm" iconName="FileText" iconPosition="left">
                  View Full Document
                </Button>
                <Button variant="outline" size="sm" iconName="Download" iconPosition="left">
                  Download PDF
                </Button>
                <Button variant="outline" size="sm" iconName="Share" iconPosition="left">
                  Share with Team
                </Button>
              </div>
            </div>
          </div>)
        ) : (
          /* Updates List View */
          (<div className="divide-y divide-border">
            {recentUpdates?.map((update) => (
              <div
                key={update?.id}
                className="p-4 hover:bg-muted/50 cursor-pointer transition-colors duration-200"
                onClick={() => setSelectedUpdate(update)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(update?.type)}`}>
                    <Icon name={getTypeIcon(update?.type)} size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${getUrgencyColor(update?.urgency)}`}>
                        {update?.urgency?.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="font-body font-medium text-sm text-foreground leading-tight mb-1">
                      {update?.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {update?.summary}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Icon name="Calendar" size={10} />
                          <span>{update?.date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Icon name="Clock" size={10} />
                          <span>{update?.time}</span>
                        </div>
                      </div>
                      <Icon name="ChevronRight" size={12} className="text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>)
        )}
      </div>
      {/* Footer */}
      {!selectedUpdate && (
        <div className="p-4 border-t border-border">
          <Button variant="outline" size="sm" className="w-full" iconName="RefreshCw" iconPosition="left">
            Refresh Updates
          </Button>
          <div className="flex items-center justify-center mt-2">
            <span className="text-xs text-muted-foreground">
              Last updated: {new Date()?.toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentUpdates;