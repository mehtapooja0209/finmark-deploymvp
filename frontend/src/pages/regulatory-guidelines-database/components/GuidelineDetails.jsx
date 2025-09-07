import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const GuidelineDetails = ({ guideline, onClose, onAnnotate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [annotations, setAnnotations] = useState([]);
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);

  if (!guideline) {
    return (
      <div className="w-96 bg-card border-l border-border flex items-center justify-center">
        <div className="text-center p-6">
          <Icon name="FileText" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading font-medium text-lg text-foreground mb-2">
            Select a Guideline
          </h3>
          <p className="text-sm text-muted-foreground">
            Choose a guideline from the list to view detailed information
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'FileText' },
    { id: 'requirements', label: 'Requirements', icon: 'CheckSquare' },
    { id: 'amendments', label: 'Amendments', icon: 'GitBranch' },
    { id: 'examples', label: 'Examples', icon: 'Lightbulb' },
    { id: 'related', label: 'Related', icon: 'Link' }
  ];

  const mockAmendments = [
    {
      id: 1,
      date: '15/08/2023',
      version: '2.1',
      summary: 'Updated digital lending disclosure requirements',
      changes: ['Enhanced customer consent mechanisms', 'Revised fee disclosure formats'],
      status: 'active'
    },
    {
      id: 2,
      date: '22/06/2023',
      version: '2.0',
      summary: 'Major revision to compliance framework',
      changes: ['New data localization requirements', 'Updated grievance redressal timelines'],
      status: 'superseded'
    }
  ];

  const mockExamples = [
    {
      id: 1,
      title: 'Compliant Loan Advertisement',
      type: 'good',
      description: 'Example of proper interest rate disclosure in digital lending ads',
      content: `"Personal Loan at 12% p.a. onwards*\n*Terms and conditions apply. Processing fee: ₹999 + GST. For detailed terms, visit our website."`
    },
    {
      id: 2,
      title: 'Non-Compliant Advertisement',
      type: 'bad',
      description: 'Missing mandatory disclosures and misleading claims',
      content: `"Instant Loan Approval! Get money in 2 minutes!"\n❌ Missing interest rate disclosure\n❌ Unrealistic approval claims\n❌ No terms and conditions mention`
    }
  ];

  const mockRelatedGuidelines = [
    {
      id: 'RBI-2023-002',
      title: 'Fair Practices Code for Digital Lending',
      relevance: 'high',
      relationship: 'complementary'
    },
    {
      id: 'RBI-2022-045',
      title: 'Customer Protection in Digital Financial Services',
      relevance: 'medium',
      relationship: 'related'
    },
    {
      id: 'SEBI-2023-012',
      title: 'Investment Advisory Disclosure Norms',
      relevance: 'low',
      relationship: 'cross-reference'
    }
  ];

  const addAnnotation = (text, section) => {
    const newAnnotation = {
      id: Date.now(),
      text,
      section,
      author: 'Current User',
      timestamp: new Date()?.toLocaleString(),
      type: 'note'
    };
    setAnnotations([...annotations, newAnnotation]);
    setShowAnnotationForm(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-success bg-success/10';
      case 'superseded': return 'text-muted-foreground bg-muted';
      case 'draft': return 'text-warning bg-warning/10';
      default: return 'text-foreground bg-muted';
    }
  };

  const getRelevanceColor = (relevance) => {
    switch (relevance) {
      case 'high': return 'text-error bg-error/10';
      case 'medium': return 'text-warning bg-warning/10';
      case 'low': return 'text-success bg-success/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="w-96 bg-card border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                {guideline?.referenceNumber}
              </span>
              <span className={`text-xs font-body px-2 py-1 rounded-full ${getStatusColor(guideline?.status)}`}>
                {guideline?.status?.charAt(0)?.toUpperCase() + guideline?.status?.slice(1)}
              </span>
            </div>
            <h2 className="font-heading font-semibold text-lg text-foreground leading-tight">
              {guideline?.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors duration-200"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" iconName="Bookmark" iconPosition="left">
            Bookmark
          </Button>
          <Button variant="outline" size="sm" iconName="Share" iconPosition="left">
            Share
          </Button>
          <Button variant="outline" size="sm" iconName="Download" iconPosition="left">
            Export
          </Button>
        </div>
      </div>
      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex overflow-x-auto">
          {tabs?.map((tab) => (
            <button
              key={tab?.id}
              onClick={() => setActiveTab(tab?.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-body font-medium border-b-2 transition-colors duration-200 whitespace-nowrap ${
                activeTab === tab?.id
                  ? 'border-primary text-primary bg-primary/5' :'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon name={tab?.icon} size={14} />
              <span>{tab?.label}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="font-heading font-medium text-foreground mb-3">
                Basic Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Regulatory Body:</span>
                  <span className="text-sm font-medium text-foreground">{guideline?.regulatoryBody}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Effective Date:</span>
                  <span className="text-sm font-medium text-foreground">{guideline?.effectiveDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Category:</span>
                  <span className="text-sm font-medium text-foreground">{guideline?.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Updated:</span>
                  <span className="text-sm font-medium text-foreground">{guideline?.lastUpdated}</span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div>
              <h3 className="font-heading font-medium text-foreground mb-3">
                Summary
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {guideline?.summary}
              </p>
            </div>

            {/* Key Requirements */}
            {guideline?.keyRequirements && (
              <div>
                <h3 className="font-heading font-medium text-foreground mb-3">
                  Key Requirements
                </h3>
                <ul className="space-y-2">
                  {guideline?.keyRequirements?.map((requirement, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Icon name="CheckCircle2" size={14} className="text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Implementation Deadline */}
            {guideline?.implementationDeadline && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Icon name="Clock" size={16} className="text-warning" />
                  <span className="font-body font-medium text-warning">
                    Implementation Deadline
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  {guideline?.implementationDeadline}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'requirements' && (
          <div className="space-y-4">
            <h3 className="font-heading font-medium text-foreground">
              Detailed Requirements
            </h3>
            {guideline?.detailedRequirements?.map((section, index) => (
              <div key={index} className="border border-border rounded-lg p-4">
                <h4 className="font-body font-medium text-foreground mb-2">
                  {section?.title}
                </h4>
                <ul className="space-y-2">
                  {section?.items?.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-2">
                      <Icon name="ArrowRight" size={12} className="text-muted-foreground mt-1 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )) || (
              <p className="text-sm text-muted-foreground">
                Detailed requirements will be displayed here when available.
              </p>
            )}
          </div>
        )}

        {activeTab === 'amendments' && (
          <div className="space-y-4">
            <h3 className="font-heading font-medium text-foreground">
              Amendment History
            </h3>
            {mockAmendments?.map((amendment) => (
              <div key={amendment?.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-body font-medium text-foreground">
                      Version {amendment?.version}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(amendment?.status)}`}>
                      {amendment?.status}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {amendment?.date}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {amendment?.summary}
                </p>
                <ul className="space-y-1">
                  {amendment?.changes?.map((change, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Icon name="GitCommit" size={12} className="text-primary mt-1 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'examples' && (
          <div className="space-y-4">
            <h3 className="font-heading font-medium text-foreground">
              Compliance Examples
            </h3>
            {mockExamples?.map((example) => (
              <div key={example?.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Icon 
                    name={example?.type === 'good' ? 'CheckCircle' : 'XCircle'} 
                    size={16} 
                    className={example?.type === 'good' ? 'text-success' : 'text-error'} 
                  />
                  <span className="font-body font-medium text-foreground">
                    {example?.title}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {example?.description}
                </p>
                <div className="bg-muted rounded p-3">
                  <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
                    {example?.content}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'related' && (
          <div className="space-y-4">
            <h3 className="font-heading font-medium text-foreground">
              Related Guidelines
            </h3>
            {mockRelatedGuidelines?.map((related) => (
              <div key={related?.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors duration-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                      {related?.id}
                    </span>
                    <h4 className="font-body font-medium text-foreground mt-2">
                      {related?.title}
                    </h4>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getRelevanceColor(related?.relevance)}`}>
                    {related?.relevance}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Icon name="Link" size={12} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground capitalize">
                    {related?.relationship}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Annotations Panel */}
      <div className="border-t border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-body font-medium text-foreground">
            Team Annotations
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnnotationForm(true)}
            iconName="Plus"
            iconPosition="left"
          >
            Add Note
          </Button>
        </div>

        {annotations?.length > 0 ? (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {annotations?.map((annotation) => (
              <div key={annotation?.id} className="bg-muted rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-body font-medium text-foreground">
                    {annotation?.author}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {annotation?.timestamp}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {annotation?.text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No annotations yet. Add notes for your team.
          </p>
        )}

        {showAnnotationForm && (
          <div className="mt-3 p-3 border border-border rounded-lg">
            <textarea
              placeholder="Add your annotation..."
              className="w-full p-2 text-sm bg-input border border-border rounded resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              onKeyDown={(e) => {
                if (e?.key === 'Enter' && e?.ctrlKey) {
                  addAnnotation(e?.target?.value, activeTab);
                  e.target.value = '';
                }
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                Ctrl+Enter to save
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAnnotationForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    const textarea = document.querySelector('textarea');
                    if (textarea?.value?.trim()) {
                      addAnnotation(textarea?.value, activeTab);
                      textarea.value = '';
                    }
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuidelineDetails;