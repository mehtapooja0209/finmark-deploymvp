import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ViolationAnalysis = ({ violations, selectedViolation, onViolationSelect, onStatusUpdate }) => {
  const [expandedViolations, setExpandedViolations] = useState(new Set());
  const [filterSeverity, setFilterSeverity] = useState('all');

  const toggleExpanded = (violationId) => {
    const newExpanded = new Set(expandedViolations);
    if (newExpanded?.has(violationId)) {
      newExpanded?.delete(violationId);
    } else {
      newExpanded?.add(violationId);
    }
    setExpandedViolations(newExpanded);
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return 'AlertTriangle';
      case 'warning': return 'AlertCircle';
      case 'minor': return 'Info';
      default: return 'AlertCircle';
    }
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

  const filteredViolations = violations?.filter(violation => 
    filterSeverity === 'all' || violation?.severity === filterSeverity
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return 'Clock';
      case 'acknowledged': return 'Eye';
      case 'under_review': return 'Search';
      case 'resolved': return 'CheckCircle';
      default: return 'Clock';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-warning';
      case 'acknowledged': return 'text-primary';
      case 'under_review': return 'text-accent';
      case 'resolved': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-foreground">Compliance Analysis</h3>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" iconName="Download">
              Export Report
            </Button>
            <Button variant="outline" size="sm" iconName="Share">
              Share
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Filter by severity:</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e?.target?.value)}
            className="text-sm border border-border rounded-md px-2 py-1 bg-background"
          >
            <option value="all">All ({violations?.length})</option>
            <option value="critical">Critical ({violations?.filter(v => v?.severity === 'critical')?.length})</option>
            <option value="warning">Warning ({violations?.filter(v => v?.severity === 'warning')?.length})</option>
            <option value="minor">Minor ({violations?.filter(v => v?.severity === 'minor')?.length})</option>
          </select>
        </div>
      </div>
      {/* Violations List */}
      <div className="flex-1 overflow-auto">
        {filteredViolations?.length === 0 ? (
          <div className="p-8 text-center">
            <Icon name="CheckCircle" size={48} className="text-success mx-auto mb-4" />
            <h4 className="font-heading font-medium text-foreground mb-2">No Violations Found</h4>
            <p className="text-muted-foreground">Content appears to be compliant with selected filters.</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {filteredViolations?.map((violation) => (
              <div
                key={violation?.id}
                className={`border rounded-lg transition-all duration-200 ${
                  selectedViolation === violation?.id 
                    ? 'ring-2 ring-primary border-primary' 
                    : getSeverityBg(violation?.severity)
                }`}
              >
                {/* Violation Header */}
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => onViolationSelect(violation?.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Icon 
                        name={getSeverityIcon(violation?.severity)} 
                        size={20} 
                        className={getSeverityColor(violation?.severity)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-body font-medium text-foreground">
                            {violation?.title}
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            violation?.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            violation?.severity === 'warning'? 'bg-amber-100 text-amber-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {violation?.severity?.charAt(0)?.toUpperCase() + violation?.severity?.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {violation?.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>RBI Guideline: {violation?.guidelineRef}</span>
                          <span>Section: {violation?.section}</span>
                          <div className="flex items-center space-x-1">
                            <Icon name={getStatusIcon(violation?.status)} size={12} />
                            <span className={getStatusColor(violation?.status)}>
                              {violation?.status?.replace('_', ' ')?.charAt(0)?.toUpperCase() + violation?.status?.replace('_', ' ')?.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e?.stopPropagation();
                        toggleExpanded(violation?.id);
                      }}
                      className="p-1 hover:bg-muted rounded-md transition-colors"
                    >
                      <Icon 
                        name={expandedViolations?.has(violation?.id) ? 'ChevronUp' : 'ChevronDown'} 
                        size={16} 
                        className="text-muted-foreground"
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedViolations?.has(violation?.id) && (
                  <div className="px-4 pb-4 border-t border-border/50">
                    <div className="pt-4 space-y-4">
                      {/* Guideline Text */}
                      <div>
                        <h5 className="font-body font-medium text-foreground mb-2">RBI Guideline Text:</h5>
                        <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
                          {violation?.guidelineText}
                        </div>
                      </div>

                      {/* Violation Explanation */}
                      <div>
                        <h5 className="font-body font-medium text-foreground mb-2">Why This Violates:</h5>
                        <p className="text-sm text-muted-foreground">
                          {violation?.explanation}
                        </p>
                      </div>

                      {/* Potential Impact */}
                      <div>
                        <h5 className="font-body font-medium text-foreground mb-2">Potential Impact:</h5>
                        <div className="flex items-start space-x-2">
                          <Icon name="AlertTriangle" size={16} className="text-warning mt-0.5" />
                          <p className="text-sm text-muted-foreground">
                            {violation?.potentialImpact}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onStatusUpdate(violation?.id, 'acknowledged')}
                          disabled={violation?.status === 'acknowledged'}
                        >
                          Acknowledge
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onStatusUpdate(violation?.id, 'under_review')}
                          disabled={violation?.status === 'under_review'}
                        >
                          Request Review
                        </Button>
                        {violation?.severity !== 'critical' && (
                          <Button 
                            variant="success" 
                            size="sm"
                            onClick={() => onStatusUpdate(violation?.id, 'resolved')}
                            disabled={violation?.status === 'resolved'}
                          >
                            Mark Resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Summary Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {filteredViolations?.length} of {violations?.length} violations
          </span>
          <div className="flex items-center space-x-4">
            <span className="text-muted-foreground">
              Last updated: {new Date()?.toLocaleDateString('en-IN')}
            </span>
            <Button variant="ghost" size="sm" iconName="RefreshCw">
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViolationAnalysis;