import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const UpdateCard = ({ update, onMarkAsRead, onShare, onViewDetails }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'critical':
        return {
          border: 'border-l-4 border-l-error bg-error/5',
          badge: 'bg-error text-error-foreground',
          icon: 'AlertTriangle'
        };
      case 'high':
        return {
          border: 'border-l-4 border-l-warning bg-warning/5',
          badge: 'bg-warning text-warning-foreground',
          icon: 'AlertCircle'
        };
      case 'medium':
        return {
          border: 'border-l-4 border-l-primary bg-primary/5',
          badge: 'bg-primary text-primary-foreground',
          icon: 'Info'
        };
      default:
        return {
          border: 'border-l-4 border-l-muted bg-muted/20',
          badge: 'bg-muted text-muted-foreground',
          icon: 'FileText'
        };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const styles = getPriorityStyles(update?.priority);
  const daysUntilDeadline = getDaysUntilDeadline(update?.complianceDeadline);

  return (
    <div className={`bg-card border border-border rounded-lg p-6 ${styles?.border} ${update?.isRead ? 'opacity-75' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4 flex-1">
          {/* Regulatory Body Logo */}
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon name={update?.regulatoryBody?.icon} size={24} className="text-primary" />
          </div>

          {/* Update Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles?.badge}`}>
                {update?.priority?.toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground">
                {update?.regulatoryBody?.name}
              </span>
              {!update?.isRead && (
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              )}
            </div>
            
            <h3 className="font-heading font-semibold text-lg text-foreground mb-2 line-clamp-2">
              {update?.title}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {update?.summary}
            </p>

            {/* Metadata */}
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Icon name="Calendar" size={14} />
                <span>Published: {formatDate(update?.publishedDate)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Icon name="Clock" size={14} />
                <span>Effective: {formatDate(update?.effectiveDate)}</span>
              </div>
              {update?.complianceDeadline && (
                <div className={`flex items-center space-x-1 ${daysUntilDeadline <= 7 ? 'text-error' : ''}`}>
                  <Icon name="AlertCircle" size={14} />
                  <span>Deadline: {daysUntilDeadline} days</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            iconName="Share2"
            iconSize={16}
            onClick={() => onShare(update)}
            className="text-muted-foreground hover:text-foreground"
          >
          </Button>
          {!update?.isRead && (
            <Button
              variant="ghost"
              size="sm"
              iconName="Check"
              iconSize={16}
              onClick={() => onMarkAsRead(update?.id)}
              className="text-muted-foreground hover:text-foreground"
            >
            </Button>
          )}
        </div>
      </div>
      {/* Impact Areas */}
      <div className="flex flex-wrap gap-2 mb-4">
        {update?.impactAreas?.map((area, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-md font-medium"
          >
            {area}
          </span>
        ))}
      </div>
      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-border pt-4 mt-4">
          <div className="space-y-4">
            {/* Full Description */}
            <div>
              <h4 className="font-heading font-medium text-foreground mb-2">
                Detailed Description
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {update?.fullDescription}
              </p>
            </div>

            {/* Implementation Requirements */}
            {update?.implementationRequirements && (
              <div>
                <h4 className="font-heading font-medium text-foreground mb-2">
                  Implementation Requirements
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {update?.implementationRequirements?.map((req, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Icon name="ChevronRight" size={14} className="mt-0.5 flex-shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Actions */}
            {update?.recommendedActions && (
              <div>
                <h4 className="font-heading font-medium text-foreground mb-2">
                  Recommended Actions
                </h4>
                <div className="space-y-2">
                  {update?.recommendedActions?.map((action, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 bg-muted/50 rounded-lg">
                      <Icon name="CheckCircle" size={16} className="text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Guidelines */}
            {update?.relatedGuidelines && update?.relatedGuidelines?.length > 0 && (
              <div>
                <h4 className="font-heading font-medium text-foreground mb-2">
                  Related Guidelines
                </h4>
                <div className="space-y-2">
                  {update?.relatedGuidelines?.map((guideline, index) => (
                    <button
                      key={index}
                      onClick={() => onViewDetails(guideline)}
                      className="flex items-center space-x-2 p-2 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors duration-200 w-full text-left"
                    >
                      <Icon name="ExternalLink" size={14} className="text-primary" />
                      <span className="text-sm text-primary font-medium">{guideline}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Footer Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          iconName={isExpanded ? "ChevronUp" : "ChevronDown"}
          iconPosition="right"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </Button>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            iconName="BookOpen"
            iconPosition="left"
            onClick={() => onViewDetails(update)}
          >
            View in Database
          </Button>
          {update?.priority === 'critical' && (
            <Button
              variant="default"
              size="sm"
              iconName="Zap"
              iconPosition="left"
            >
              Take Action
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateCard;