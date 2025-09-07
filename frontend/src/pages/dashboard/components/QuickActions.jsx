import React from 'react';
import Button from '../../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      id: 1,
      title: 'Bulk Content Scan',
      description: 'Upload multiple files for compliance scanning',
      icon: 'Upload',
      variant: 'default',
      onClick: () => navigate('/content-upload-scanning')
    },
    {
      id: 2,
      title: 'Review Guidelines',
      description: 'Browse latest regulatory guidelines',
      icon: 'BookOpen',
      variant: 'outline',
      onClick: () => navigate('/regulatory-guidelines-database')
    },
    {
      id: 3,
      title: 'Generate Report',
      description: 'Create compliance summary report',
      icon: 'FileText',
      variant: 'outline',
      onClick: () => navigate('/compliance-reports')
    },
    {
      id: 4,
      title: 'View Violations',
      description: 'Check recent compliance violations',
      icon: 'AlertTriangle',
      variant: 'outline',
      onClick: () => navigate('/compliance-results-violations')
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions?.map((action) => (
          <Button
            key={action?.id}
            variant={action?.variant}
            onClick={action?.onClick}
            iconName={action?.icon}
            iconPosition="left"
            className="h-auto p-4 justify-start"
          >
            <div className="text-left">
              <div className="font-medium text-sm">{action?.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{action?.description}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;