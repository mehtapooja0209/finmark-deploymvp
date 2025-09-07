import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PriorityAlerts = () => {
  const [expandedAlert, setExpandedAlert] = useState(null);

  const alerts = [
    {
      id: 1,
      type: 'urgent',
      title: 'High-Risk Content Detected',
      description: 'Credit card promotional material contains potentially misleading interest rate claims',
      priority: 'Critical',
      deadline: '2024-08-23T18:00:00',
      assignee: 'Priya Sharma',
      details: `The content violates RBI Master Direction on Credit Card and Debit Card - Issuance and Conduct Directions, 2022. Specifically:\n\n• Interest rate disclosure is incomplete\n• Processing fee structure not clearly mentioned\n• Penalty charges section missing\n\nImmediate action required to prevent regulatory non-compliance.`,
      actions: ['Review Content', 'Contact Legal Team', 'Update Guidelines']
    },
    {
      id: 2,
      type: 'deadline',
      title: 'RBI Compliance Deadline Approaching',
      description: 'New digital lending guidelines implementation deadline in 7 days',
      priority: 'High',
      deadline: '2024-08-30T23:59:59',
      assignee: 'Rajesh Kumar',
      details: `RBI Digital Lending Guidelines 2022 amendments become effective on August 30, 2024:\n\n• All existing marketing content must be reviewed\n• New disclosure requirements for loan processing fees\n• Updated fair practices code implementation\n• Customer grievance mechanism updates required`,
      actions: ['Review All Content', 'Update Processes', 'Train Team']
    },
    {
      id: 3,
      type: 'regulatory',
      title: 'New SEBI Guidelines Published',
      description: 'Investment advisory content guidelines updated for mutual fund advertisements',
      priority: 'Medium',
      deadline: '2024-09-15T17:00:00',
      assignee: 'Amit Patel',
      details: `SEBI has updated guidelines for mutual fund advertisements and investment advisory content:\n\n• Risk disclosure requirements enhanced\n• Performance data presentation rules updated\n• Mandatory disclaimers for past performance\n• New format for expense ratio disclosure`,
      actions: ['Review Guidelines', 'Update Templates', 'Scan Existing Content']
    },
    {
      id: 4,
      type: 'violation',
      title: 'Recurring Violation Pattern',
      description: 'Multiple instances of incomplete risk disclosure in investment products',
      priority: 'High',
      deadline: '2024-08-25T12:00:00',
      assignee: 'Sneha Reddy',
      details: `Pattern analysis shows recurring violations in investment product marketing:\n\n• 15 instances in the last 30 days\n• Common issue: Risk disclosure placement\n• Affects mutual fund and insurance products\n• Training gap identified in content creation team`,
      actions: ['Conduct Training', 'Update Checklist', 'Review Process']
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'text-error bg-error/10 border-error/20';
      case 'High': return 'text-warning bg-warning/10 border-warning/20';
      case 'Medium': return 'text-primary bg-primary/10 border-primary/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'urgent': return 'AlertTriangle';
      case 'deadline': return 'Clock';
      case 'regulatory': return 'BookOpen';
      case 'violation': return 'XCircle';
      default: return 'Bell';
    }
  };

  const formatDeadline = (deadline) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffHours = Math.ceil((date - now) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours} hours remaining`;
    } else {
      const diffDays = Math.ceil(diffHours / 24);
      return `${diffDays} days remaining`;
    }
  };

  const toggleExpanded = (alertId) => {
    setExpandedAlert(expandedAlert === alertId ? null : alertId);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-lg text-foreground">Priority Alerts</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {alerts?.filter(a => a?.priority === 'Critical')?.length} Critical
          </span>
          <Button variant="ghost" size="sm">
            <Icon name="Settings" size={16} />
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        {alerts?.map((alert) => (
          <div key={alert?.id} className={`border rounded-lg p-4 ${getPriorityColor(alert?.priority)}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <Icon name={getTypeIcon(alert?.type)} size={20} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-body font-medium text-foreground text-sm">
                      {alert?.title}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(alert?.priority)}`}>
                      {alert?.priority}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {alert?.description}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      <Icon name="Clock" size={12} />
                      <span>{formatDeadline(alert?.deadline)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Icon name="User" size={12} />
                      <span>{alert?.assignee}</span>
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggleExpanded(alert?.id)}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 ml-2"
              >
                <Icon 
                  name={expandedAlert === alert?.id ? "ChevronUp" : "ChevronDown"} 
                  size={16} 
                />
              </button>
            </div>

            {expandedAlert === alert?.id && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="mb-4">
                  <h5 className="font-body font-medium text-sm text-foreground mb-2">Details</h5>
                  <div className="text-sm text-muted-foreground whitespace-pre-line">
                    {alert?.details}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {alert?.actions?.map((action, index) => (
                    <Button key={index} variant="outline" size="sm">
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriorityAlerts;