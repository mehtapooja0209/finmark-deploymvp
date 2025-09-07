import React from 'react';
import Icon from '../../../components/AppIcon';

const ActivityFeed = ({ activities = [], loading = false }) => {
  // Fallback to mock data if no activities provided
  const fallbackActivities = [
    {
      id: 'mock-1',
      type: 'scan_complete',
      title: 'Content Scan Completed',
      description: 'Marketing campaign materials for personal loans',
      timestamp: '2 minutes ago',
      status: 'success',
      user: 'System',
      details: '15 files scanned, 2 violations found'
    },
    {
      id: 'mock-2',
      type: 'violation_detected',
      title: 'Compliance Violation Detected',
      description: 'Interest rate disclosure missing in credit card ad',
      timestamp: '15 minutes ago',
      status: 'error',
      user: 'System',
      details: 'RBI Guidelines Section 4.2.1 violated'
    }
  ];

  const displayActivities = activities.length > 0 ? activities : fallbackActivities;

  const getActivityIcon = (type) => {
    switch (type) {
      case 'scan_complete': return 'CheckCircle';
      case 'violation_detected': return 'AlertTriangle';
      case 'guideline_update': return 'BookOpen';
      case 'report_generated': return 'FileText';
      case 'bulk_scan': return 'Layers';
      case 'approval_pending': return 'Clock';
      default: return 'Activity';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-success bg-success/10';
      case 'error': return 'text-error bg-error/10';
      case 'warning': return 'text-warning bg-warning/10';
      case 'info': return 'text-primary bg-primary/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-lg text-foreground">Recent Activity</h3>
        <button className="text-sm text-primary hover:text-primary/80 font-body font-medium">
          View All
        </button>
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {loading ? (
          // Loading skeleton
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start space-x-3 p-3 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-1/3 animate-pulse"></div>
                </div>
              </div>
            ))}
          </>
        ) : (
          displayActivities?.map((activity) => (
          <div key={activity?.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-200">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusColor(activity?.status)}`}>
              <Icon name={getActivityIcon(activity?.type)} size={16} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-body font-medium text-foreground text-sm">
                    {activity?.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activity?.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity?.details}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                  {activity?.timestamp}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 mt-2">
                <div className="w-4 h-4 bg-muted rounded-full flex items-center justify-center">
                  <Icon name="User" size={10} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {activity?.user}
                </span>
              </div>
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;