import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ComplianceCalendar = () => {
  const [currentDate] = useState(new Date());
  
  const upcomingDeadlines = [
    {
      id: 1,
      title: 'RBI Digital Lending Compliance',
      date: '2024-08-30',
      type: 'regulatory',
      priority: 'Critical',
      description: 'Implementation of new digital lending guidelines',
      daysLeft: 7
    },
    {
      id: 2,
      title: 'Quarterly Compliance Report',
      date: '2024-09-01',
      type: 'internal',
      priority: 'High',
      description: 'Q2 2024 compliance summary submission',
      daysLeft: 9
    },
    {
      id: 3,
      title: 'SEBI Mutual Fund Guidelines',
      date: '2024-09-15',
      type: 'regulatory',
      priority: 'Medium',
      description: 'Updated advertisement guidelines implementation',
      daysLeft: 23
    },
    {
      id: 4,
      title: 'Content Review Cycle',
      date: '2024-09-20',
      type: 'internal',
      priority: 'Medium',
      description: 'Monthly review of all marketing materials',
      daysLeft: 28
    },
    {
      id: 5,
      title: 'IRDAI Insurance Disclosure',
      date: '2024-10-01',
      type: 'regulatory',
      priority: 'Medium',
      description: 'Enhanced transparency requirements',
      daysLeft: 39
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
      case 'regulatory': return 'BookOpen';
      case 'internal': return 'Building';
      default: return 'Calendar';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getDaysLeftColor = (daysLeft) => {
    if (daysLeft <= 7) return 'text-error';
    if (daysLeft <= 14) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-lg text-foreground">Compliance Calendar</h3>
        <Button variant="ghost" size="sm" iconName="Calendar">
          Full Calendar
        </Button>
      </div>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {upcomingDeadlines?.map((deadline) => (
          <div key={deadline?.id} className={`border rounded-lg p-3 ${getPriorityColor(deadline?.priority)}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name={getTypeIcon(deadline?.type)} size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-body font-medium text-foreground text-sm">
                      {deadline?.title}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(deadline?.priority)}`}>
                      {deadline?.priority}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {deadline?.description}
                  </p>
                  <div className="flex items-center space-x-4 text-xs">
                    <span className="flex items-center space-x-1 text-muted-foreground">
                      <Icon name="Calendar" size={12} />
                      <span>{formatDate(deadline?.date)}</span>
                    </span>
                    <span className={`flex items-center space-x-1 font-medium ${getDaysLeftColor(deadline?.daysLeft)}`}>
                      <Icon name="Clock" size={12} />
                      <span>{deadline?.daysLeft} days left</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {upcomingDeadlines?.filter(d => d?.daysLeft <= 7)?.length} urgent deadlines
          </span>
          <Button variant="outline" size="sm" iconName="Plus">
            Add Deadline
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComplianceCalendar;