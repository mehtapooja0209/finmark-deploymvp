import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ScanProgress = ({ isScanning, currentFile, progress, onCancel, estimatedTime }) => {
  if (!isScanning) return null;

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const scanStages = [
    { id: 'upload', label: 'File Processing', completed: progress >= 20 },
    { id: 'ocr', label: 'Text Extraction', completed: progress >= 40 },
    { id: 'analysis', label: 'Compliance Analysis', completed: progress >= 70 },
    { id: 'validation', label: 'Guideline Validation', completed: progress >= 90 },
    { id: 'report', label: 'Report Generation', completed: progress >= 100 }
  ];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-modal w-full max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon name="FileSearch" size={20} className="text-primary animate-pulse" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg text-foreground">
                  Scanning in Progress
                </h3>
                <p className="text-sm text-muted-foreground font-body">
                  Analyzing content for compliance violations
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              iconName="X"
              className="text-muted-foreground hover:text-foreground"
            />
          </div>

          {/* Current File */}
          {currentFile && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Icon name="File" size={16} className="text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-body font-medium text-foreground truncate">
                    {currentFile}
                  </p>
                  <p className="text-sm text-muted-foreground font-body">
                    Currently processing...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-body text-foreground">
                Overall Progress
              </span>
              <span className="text-sm font-body text-foreground font-medium">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            {estimatedTime && (
              <p className="text-xs text-muted-foreground font-body mt-2">
                Estimated time remaining: {formatTime(estimatedTime)}
              </p>
            )}
          </div>

          {/* Scan Stages */}
          <div className="space-y-3">
            <h4 className="font-body font-medium text-foreground text-sm">
              Scanning Stages
            </h4>
            {scanStages?.map((stage, index) => (
              <div key={stage?.id} className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  stage?.completed
                    ? 'bg-success text-white'
                    : progress >= (index + 1) * 20 - 10
                    ? 'bg-primary text-white' :'bg-muted text-muted-foreground'
                }`}>
                  {stage?.completed ? (
                    <Icon name="Check" size={12} />
                  ) : progress >= (index + 1) * 20 - 10 ? (
                    <Icon name="Loader" size={12} className="animate-spin" />
                  ) : (
                    <span className="text-xs font-body font-medium">{index + 1}</span>
                  )}
                </div>
                <span className={`text-sm font-body ${
                  stage?.completed
                    ? 'text-success'
                    : progress >= (index + 1) * 20 - 10
                    ? 'text-primary' :'text-muted-foreground'
                }`}>
                  {stage?.label}
                </span>
              </div>
            ))}
          </div>

          {/* Processing Info */}
          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <Icon name="Info" size={16} className="text-primary mt-0.5" />
              <div>
                <h5 className="font-body font-medium text-foreground text-sm mb-1">
                  What's happening?
                </h5>
                <ul className="text-xs text-muted-foreground font-body space-y-1">
                  <li>• Extracting text content from uploaded files</li>
                  <li>• Cross-referencing against RBI guidelines database</li>
                  <li>• Identifying potential compliance violations</li>
                  <li>• Generating detailed compliance report</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Cancel Button */}
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={onCancel}
              iconName="Square"
              iconPosition="left"
            >
              Cancel Scanning
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanProgress;