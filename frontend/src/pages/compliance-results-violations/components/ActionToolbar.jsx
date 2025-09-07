import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ActionToolbar = ({ 
  contentId, 
  violations, 
  onExportReport, 
  onShareResults, 
  onResubmitContent,
  onBulkAction 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [shareDropdownOpen, setShareDropdownOpen] = useState(false);
  const [bulkActionDropdownOpen, setBulkActionDropdownOpen] = useState(false);

  const criticalCount = violations?.filter(v => v?.severity === 'critical')?.length;
  const warningCount = violations?.filter(v => v?.severity === 'warning')?.length;
  const minorCount = violations?.filter(v => v?.severity === 'minor')?.length;
  const totalViolations = violations?.length;

  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      await onExportReport(contentId, format);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = (method) => {
    onShareResults(contentId, method);
    setShareDropdownOpen(false);
  };

  const handleBulkAction = (action) => {
    onBulkAction(action, violations);
    setBulkActionDropdownOpen(false);
  };

  const getComplianceStatus = () => {
    if (criticalCount > 0) return { status: 'critical', color: 'text-error', bg: 'bg-red-50' };
    if (warningCount > 0) return { status: 'warning', color: 'text-warning', bg: 'bg-amber-50' };
    if (minorCount > 0) return { status: 'minor', color: 'text-accent', bg: 'bg-orange-50' };
    return { status: 'compliant', color: 'text-success', bg: 'bg-green-50' };
  };

  const complianceStatus = getComplianceStatus();

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        {/* Left Side - Status and Summary */}
        <div className="flex items-center space-x-6">
          {/* Compliance Status */}
          <div className={`px-4 py-2 rounded-lg border ${complianceStatus?.bg} ${
            complianceStatus?.status === 'critical' ? 'border-red-200' :
            complianceStatus?.status === 'warning' ? 'border-amber-200' :
            complianceStatus?.status === 'minor'? 'border-orange-200' : 'border-green-200'
          }`}>
            <div className="flex items-center space-x-2">
              <Icon 
                name={
                  complianceStatus?.status === 'critical' ? 'AlertTriangle' :
                  complianceStatus?.status === 'warning' ? 'AlertCircle' :
                  complianceStatus?.status === 'minor'? 'Info' : 'CheckCircle'
                } 
                size={16} 
                className={complianceStatus?.color}
              />
              <span className={`font-medium text-sm ${complianceStatus?.color}`}>
                {complianceStatus?.status === 'compliant' ? 'Compliant' : 
                 `${totalViolations} Violation${totalViolations > 1 ? 's' : ''} Found`}
              </span>
            </div>
          </div>

          {/* Violation Breakdown */}
          {totalViolations > 0 && (
            <div className="flex items-center space-x-4 text-sm">
              {criticalCount > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-error rounded-full"></div>
                  <span className="text-muted-foreground">{criticalCount} Critical</span>
                </div>
              )}
              {warningCount > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-warning rounded-full"></div>
                  <span className="text-muted-foreground">{warningCount} Warning</span>
                </div>
              )}
              {minorCount > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-accent rounded-full"></div>
                  <span className="text-muted-foreground">{minorCount} Minor</span>
                </div>
              )}
            </div>
          )}

          {/* Scan Info */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Icon name="Clock" size={14} />
              <span>Scanned: {new Date()?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icon name="Zap" size={14} />
              <span>Processing time: 2.3s</span>
            </div>
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center space-x-2">
          {/* Export Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              iconName="Download"
              loading={isExporting}
              onClick={() => handleExport('pdf')}
            >
              Export Report
            </Button>
          </div>

          {/* Share Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              iconName="Share"
              onClick={() => setShareDropdownOpen(!shareDropdownOpen)}
            >
              Share
            </Button>
            
            {shareDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-modal z-50">
                <div className="p-2">
                  <button
                    onClick={() => handleShare('email')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center space-x-2"
                  >
                    <Icon name="Mail" size={14} />
                    <span>Email Team</span>
                  </button>
                  <button
                    onClick={() => handleShare('slack')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center space-x-2"
                  >
                    <Icon name="MessageSquare" size={14} />
                    <span>Share to Slack</span>
                  </button>
                  <button
                    onClick={() => handleShare('link')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center space-x-2"
                  >
                    <Icon name="Link" size={14} />
                    <span>Copy Link</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {totalViolations > 0 && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                iconName="MoreHorizontal"
                onClick={() => setBulkActionDropdownOpen(!bulkActionDropdownOpen)}
              >
                Actions
              </Button>
              
              {bulkActionDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-modal z-50">
                  <div className="p-2">
                    <button
                      onClick={() => handleBulkAction('acknowledge_all')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center space-x-2"
                    >
                      <Icon name="Eye" size={14} />
                      <span>Acknowledge All Violations</span>
                    </button>
                    <button
                      onClick={() => handleBulkAction('request_review')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center space-x-2"
                    >
                      <Icon name="Search" size={14} />
                      <span>Request Legal Review</span>
                    </button>
                    <button
                      onClick={() => handleBulkAction('export_violations')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center space-x-2"
                    >
                      <Icon name="FileText" size={14} />
                      <span>Export Violation List</span>
                    </button>
                    <div className="border-t border-border my-1"></div>
                    <button
                      onClick={() => handleBulkAction('create_task')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center space-x-2"
                    >
                      <Icon name="Plus" size={14} />
                      <span>Create Remediation Tasks</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Primary Action */}
          <Button
            variant={totalViolations === 0 ? "success" : "default"}
            size="sm"
            iconName={totalViolations === 0 ? "CheckCircle" : "Upload"}
            onClick={() => onResubmitContent(contentId)}
            disabled={criticalCount > 0}
          >
            {totalViolations === 0 ? 'Approve Content' : 'Resubmit After Fixes'}
          </Button>
        </div>
      </div>
      {/* Progress Bar for Critical Issues */}
      {criticalCount > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="AlertTriangle" size={16} className="text-error" />
            <span className="text-sm font-medium text-error">
              Critical violations must be resolved before content approval
            </span>
          </div>
          <div className="w-full bg-red-200 rounded-full h-2">
            <div 
              className="bg-error h-2 rounded-full transition-all duration-300"
              style={{ width: `${(criticalCount / totalViolations) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-red-700 mt-1">
            <span>{criticalCount} critical issues remaining</span>
            <span>{Math.round((criticalCount / totalViolations) * 100)}% of total violations</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionToolbar;