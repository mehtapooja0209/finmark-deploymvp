import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RemediationPanel = ({ selectedViolation, violations, onApplySuggestion, onResubmitContent }) => {
  const [activeTab, setActiveTab] = useState('suggestions');
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set());

  const violation = violations?.find(v => v?.id === selectedViolation);

  if (!violation) {
    return (
      <div className="bg-card border border-border rounded-lg h-full flex items-center justify-center">
        <div className="text-center p-8">
          <Icon name="MousePointer" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h4 className="font-heading font-medium text-foreground mb-2">Select a Violation</h4>
          <p className="text-muted-foreground">
            Click on a violation from the analysis panel to view remediation suggestions.
          </p>
        </div>
      </div>
    );
  }

  const handleApplySuggestion = (suggestionId) => {
    const newApplied = new Set(appliedSuggestions);
    if (newApplied?.has(suggestionId)) {
      newApplied?.delete(suggestionId);
    } else {
      newApplied?.add(suggestionId);
    }
    setAppliedSuggestions(newApplied);
    onApplySuggestion(violation?.id, suggestionId, !appliedSuggestions?.has(suggestionId));
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-error';
      case 'warning': return 'text-warning';
      case 'minor': return 'text-accent';
      default: return 'text-muted-foreground';
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      case 'minor': return 'bg-orange-50 border-orange-200';
      default: return 'bg-muted border-border';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-heading font-semibold text-foreground mb-1">Remediation Guidance</h3>
            <p className="text-sm text-muted-foreground">
              Actionable steps to resolve compliance violations
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            violation?.severity === 'critical' ? 'bg-red-100 text-red-800' :
            violation?.severity === 'warning'? 'bg-amber-100 text-amber-800' : 'bg-orange-100 text-orange-800'
          }`}>
            {violation?.severity?.charAt(0)?.toUpperCase() + violation?.severity?.slice(1)}
          </div>
        </div>

        {/* Selected Violation Info */}
        <div className={`p-3 rounded-lg border ${getSeverityBg(violation?.severity)}`}>
          <h4 className="font-body font-medium text-foreground mb-1">{violation?.title}</h4>
          <p className="text-sm text-muted-foreground mb-2">{violation?.description}</p>
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span>RBI Guideline: {violation?.guidelineRef}</span>
            <span>Section: {violation?.section}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 mt-4">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'suggestions' ?'bg-primary text-primary-foreground' :'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Suggestions
          </button>
          <button
            onClick={() => setActiveTab('examples')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'examples' ?'bg-primary text-primary-foreground' :'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Examples
          </button>
          <button
            onClick={() => setActiveTab('guidelines')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'guidelines' ?'bg-primary text-primary-foreground' :'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Guidelines
          </button>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'suggestions' && (
          <div className="p-4 space-y-4">
            <div className="mb-4">
              <h4 className="font-body font-medium text-foreground mb-2">Recommended Actions</h4>
              <p className="text-sm text-muted-foreground">
                Apply these suggestions to resolve the compliance violation:
              </p>
            </div>

            {violation?.suggestions?.map((suggestion, index) => (
              <div key={index} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-body font-medium text-foreground mb-1">
                        {suggestion?.title}
                      </h5>
                      <p className="text-sm text-muted-foreground mb-3">
                        {suggestion?.description}
                      </p>
                      
                      {suggestion?.originalText && suggestion?.suggestedText && (
                        <div className="space-y-2">
                          <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Icon name="X" size={14} className="text-red-600" />
                              <span className="text-xs font-medium text-red-800">Current (Non-compliant)</span>
                            </div>
                            <p className="text-sm text-red-700">{suggestion?.originalText}</p>
                          </div>
                          <div className="bg-green-50 border border-green-200 rounded-md p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Icon name="Check" size={14} className="text-green-600" />
                              <span className="text-xs font-medium text-green-800">Suggested (Compliant)</span>
                            </div>
                            <p className="text-sm text-green-700">{suggestion?.suggestedText}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Icon name="Clock" size={12} />
                    <span>Estimated time: {suggestion?.estimatedTime || '5-10 minutes'}</span>
                  </div>
                  <Button
                    variant={appliedSuggestions?.has(index) ? "success" : "outline"}
                    size="sm"
                    onClick={() => handleApplySuggestion(index)}
                    iconName={appliedSuggestions?.has(index) ? "Check" : "Plus"}
                  >
                    {appliedSuggestions?.has(index) ? 'Applied' : 'Apply'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'examples' && (
          <div className="p-4 space-y-4">
            <div className="mb-4">
              <h4 className="font-body font-medium text-foreground mb-2">Compliant Examples</h4>
              <p className="text-sm text-muted-foreground">
                Reference examples that meet RBI compliance standards:
              </p>
            </div>

            {violation?.examples?.map((example, index) => (
              <div key={index} className="border border-border rounded-lg p-4">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="w-8 h-8 bg-success text-success-foreground rounded-lg flex items-center justify-center">
                    <Icon name="Check" size={16} />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-body font-medium text-foreground mb-1">
                      {example?.title}
                    </h5>
                    <p className="text-sm text-muted-foreground mb-3">
                      {example?.description}
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Icon name="FileText" size={14} className="text-green-600" />
                    <span className="text-xs font-medium text-green-800">Compliant Content</span>
                  </div>
                  <p className="text-sm text-green-700 leading-relaxed">
                    {example?.content}
                  </p>
                </div>

                {example?.keyPoints && (
                  <div className="mt-3">
                    <h6 className="text-xs font-medium text-foreground mb-2">Key Compliance Points:</h6>
                    <ul className="space-y-1">
                      {example?.keyPoints?.map((point, pointIndex) => (
                        <li key={pointIndex} className="flex items-start space-x-2 text-xs text-muted-foreground">
                          <Icon name="ArrowRight" size={12} className="mt-0.5 text-primary" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'guidelines' && (
          <div className="p-4 space-y-4">
            <div className="mb-4">
              <h4 className="font-body font-medium text-foreground mb-2">Relevant RBI Guidelines</h4>
              <p className="text-sm text-muted-foreground">
                Complete guideline text and regulatory context:
              </p>
            </div>

            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Icon name="BookOpen" size={16} className="text-primary" />
                <h5 className="font-body font-medium text-foreground">
                  {violation?.guidelineRef} - {violation?.section}
                </h5>
              </div>

              <div className="bg-muted p-4 rounded-lg mb-4">
                <h6 className="text-sm font-medium text-foreground mb-2">Full Guideline Text:</h6>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {violation?.guidelineText}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <h6 className="text-sm font-medium text-foreground mb-1">Effective Date:</h6>
                  <p className="text-sm text-muted-foreground">{violation?.effectiveDate || 'April 1, 2023'}</p>
                </div>
                <div>
                  <h6 className="text-sm font-medium text-foreground mb-1">Applicable To:</h6>
                  <p className="text-sm text-muted-foreground">{violation?.applicableTo || 'All NBFCs and Digital Lending Platforms'}</p>
                </div>
                <div>
                  <h6 className="text-sm font-medium text-foreground mb-1">Penalty for Non-compliance:</h6>
                  <p className="text-sm text-muted-foreground">{violation?.penalty || 'Monetary penalty up to ₹1 crore and/or operational restrictions'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Action Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Icon name="Info" size={14} />
            <span>
              {appliedSuggestions?.size} of {violation?.suggestions?.length || 0} suggestions applied
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" iconName="MessageSquare">
              Request Legal Review
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              iconName="Upload"
              onClick={() => onResubmitContent(violation?.id)}
              disabled={appliedSuggestions?.size === 0}
            >
              Resubmit Content
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemediationPanel;