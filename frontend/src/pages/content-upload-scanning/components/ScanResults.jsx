import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ScanResults = ({ uploads = [], onViewDetails, onDownloadReport, onClearCompleted }) => {
  const [expandedResults, setExpandedResults] = useState(new Set());

  const toggleExpanded = (uploadId) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded?.has(uploadId)) {
      newExpanded?.delete(uploadId);
    } else {
      newExpanded?.add(uploadId);
    }
    setExpandedResults(newExpanded);
  };

  const getComplianceColor = (score) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  };

  const getComplianceBadge = (score) => {
    if (score >= 80) return { color: 'bg-success', text: 'Compliant' };
    if (score >= 60) return { color: 'bg-warning', text: 'Needs Review' };
    return { color: 'bg-error', text: 'Non-Compliant' };
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'text-error';
      case 'medium':
        return 'text-warning';
      case 'low':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return 'AlertTriangle';
      case 'medium':
        return 'AlertCircle';
      case 'low':
        return 'Info';
      default:
        return 'Info';
    }
  };

  // Filter uploads with results
  const completedUploads = uploads.filter(upload => 
    upload.status === 'completed' && upload.result
  );

  if (completedUploads.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="FileSearch" size={32} className="text-muted-foreground" />
        </div>
        <h3 className="font-heading font-medium text-lg text-foreground mb-2">
          No scan results yet
        </h3>
        <p className="text-muted-foreground font-body">
          Upload and scan content to view compliance results here
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-semibold text-xl text-foreground">
              Scan Results ({completedUploads.length})
            </h2>
            <p className="text-muted-foreground font-body text-sm">
              Real-time compliance analysis and violation detection
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownloadReport()}
              iconName="Download"
              iconPosition="left"
            >
              Export All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearCompleted}
              iconName="Trash2"
              iconPosition="left"
            >
              Clear Results
            </Button>
          </div>
        </div>
      </div>
      <div className="divide-y divide-border max-h-96 overflow-y-auto">
        {completedUploads?.map((upload) => {
          const isExpanded = expandedResults?.has(upload.fileId);
          const result = upload.result;
          const badge = getComplianceBadge(result?.complianceScore);

          return (
            <div key={upload.fileId} className="p-6">
              {/* Result Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Icon name="FileText" size={20} className="text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-body font-medium text-foreground truncate max-w-xs">
                      {upload.file.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-body font-medium ${badge?.color} text-white`}>
                        {badge?.text}
                      </span>
                      <span className="text-sm text-muted-foreground font-body">
                        Completed {upload.endTime ? new Date(upload.endTime).toLocaleString() : 'just now'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className={`text-2xl font-heading font-semibold ${getComplianceColor(result?.complianceScore)}`}>
                      {result?.complianceScore}%
                    </div>
                    <div className="text-xs text-muted-foreground font-body">
                      Compliance Score
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(upload.fileId)}
                    iconName={isExpanded ? "ChevronUp" : "ChevronDown"}
                  />
                </div>
              </div>
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg font-heading font-semibold text-error">
                    {result?.violationsFound || 0}
                  </div>
                  <div className="text-xs text-muted-foreground font-body">
                    Violations
                  </div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg font-heading font-semibold text-warning">
                    {result?.warningsFound || 0}
                  </div>
                  <div className="text-xs text-muted-foreground font-body">
                    Warnings
                  </div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg font-heading font-semibold text-success">
                    {result?.suggestionsFound || 0}
                  </div>
                  <div className="text-xs text-muted-foreground font-body">
                    Suggestions
                  </div>
                </div>
              </div>
              {/* Expanded Details */}
              {isExpanded && (
                <div className="space-y-4">
                  {/* Violations */}
                  {result?.violations && result?.violations?.length > 0 && (
                    <div>
                      <h4 className="font-body font-medium text-foreground mb-3 flex items-center">
                        <Icon name="AlertTriangle" size={16} className="text-error mr-2" />
                        Compliance Violations
                      </h4>
                      <div className="space-y-3">
                        {result?.violations?.map((violation, index) => (
                          <div key={index} className="bg-error/5 border border-error/20 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                              <Icon
                                name={getSeverityIcon(violation?.severity)}
                                size={16}
                                className={`mt-0.5 ${getSeverityColor(violation?.severity)}`}
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className={`text-sm font-body font-medium ${getSeverityColor(violation?.severity)}`}>
                                    {violation?.type}
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs font-body font-medium ${
                                    violation?.severity === 'high' ? 'bg-error text-white' :
                                    violation?.severity === 'medium'? 'bg-warning text-white' : 'bg-muted text-muted-foreground'
                                  }`}>
                                    {violation?.severity?.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground font-body mb-2">
                                  {violation?.description}
                                </p>
                                <div className="text-xs text-muted-foreground font-body">
                                  <strong>Guideline:</strong> {violation?.guideline}
                                </div>
                                {violation?.suggestion && (
                                  <div className="mt-2 p-2 bg-success/10 border border-success/20 rounded">
                                    <div className="text-xs text-success font-body">
                                      <strong>Suggestion:</strong> {violation?.suggestion}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(upload.fileId)}
                      iconName="Eye"
                      iconPosition="left"
                    >
                      View Full Report
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownloadReport(upload.fileId)}
                      iconName="Download"
                      iconPosition="left"
                    >
                      Download Report
                    </Button>
                    {result?.complianceScore < 80 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        iconName="RefreshCw"
                        iconPosition="left"
                      >
                        Re-scan
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScanResults;