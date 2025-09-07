import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ReportPreview = ({ reportConfig, selectedTemplate }) => {
  // Mock data for charts
  const violationTrendData = [
    { month: 'Jan', violations: 12, resolved: 10 },
    { month: 'Feb', violations: 8, resolved: 8 },
    { month: 'Mar', violations: 15, resolved: 12 },
    { month: 'Apr', violations: 6, resolved: 6 },
    { month: 'May', violations: 9, resolved: 7 },
    { month: 'Jun', violations: 4, resolved: 4 }
  ];

  const violationCategoryData = [
    { name: 'Misleading Claims', value: 35, color: '#E74C3C' },
    { name: 'Interest Rate Disclosure', value: 25, color: '#F39C12' },
    { name: 'Risk Warnings', value: 20, color: '#3498DB' },
    { name: 'KYC Compliance', value: 12, color: '#27AE60' },
    { name: 'Data Protection', value: 8, color: '#9B59B6' }
  ];

  const complianceScoreData = [
    { department: 'Marketing', score: 85 },
    { department: 'Product', score: 92 },
    { department: 'Legal', score: 98 },
    { department: 'Operations', score: 88 }
  ];

  const getTemplateContent = () => {
    switch (selectedTemplate) {
      case 'executive_summary':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-success/10 border border-success/20 rounded-lg p-6">
                <div className="flex items-center space-x-3">
                  <Icon name="CheckCircle" size={24} className="text-success" />
                  <div>
                    <p className="text-2xl font-heading font-bold text-success">94%</p>
                    <p className="text-sm text-muted-foreground">Overall Compliance</p>
                  </div>
                </div>
              </div>
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-6">
                <div className="flex items-center space-x-3">
                  <Icon name="AlertTriangle" size={24} className="text-warning" />
                  <div>
                    <p className="text-2xl font-heading font-bold text-warning">23</p>
                    <p className="text-sm text-muted-foreground">Active Violations</p>
                  </div>
                </div>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
                <div className="flex items-center space-x-3">
                  <Icon name="TrendingUp" size={24} className="text-primary" />
                  <div>
                    <p className="text-2xl font-heading font-bold text-primary">+12%</p>
                    <p className="text-sm text-muted-foreground">Improvement</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-heading font-semibold text-lg mb-4">Compliance Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={violationTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="violations" stroke="#E74C3C" strokeWidth={2} />
                    <Line type="monotone" dataKey="resolved" stroke="#27AE60" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      case 'detailed_audit':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-heading font-semibold text-lg mb-4">Violation Categories</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={violationCategoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                      >
                        {violationCategoryData?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry?.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-heading font-semibold text-lg mb-4">Department Scores</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={complianceScoreData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="score" fill="#1B365D" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-heading font-semibold text-lg mb-4">Recent Violations</h3>
              <div className="space-y-4">
                {[
                  {
                    id: 'V001',
                    content: 'Marketing banner for personal loans',
                    violation: 'Missing risk disclosure statement',
                    severity: 'High',
                    department: 'Marketing',
                    date: '2025-08-20'
                  },
                  {
                    id: 'V002',
                    content: 'Credit card promotional email',
                    violation: 'Unclear interest rate terms',
                    severity: 'Medium',
                    department: 'Product',
                    date: '2025-08-19'
                  },
                  {
                    id: 'V003',
                    content: 'Investment product brochure',
                    violation: 'Insufficient risk warnings',
                    severity: 'High',
                    department: 'Marketing',
                    date: '2025-08-18'
                  }
                ]?.map((violation) => (
                  <div key={violation?.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-sm text-muted-foreground">{violation?.id}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          violation?.severity === 'High' ?'bg-error/10 text-error' :'bg-warning/10 text-warning'
                        }`}>
                          {violation?.severity}
                        </span>
                      </div>
                      <p className="font-body font-medium text-foreground mt-1">{violation?.content}</p>
                      <p className="text-sm text-muted-foreground">{violation?.violation}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{violation?.department}</p>
                      <p className="text-xs text-muted-foreground">{violation?.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'trend_analysis':
        return (
          <div className="space-y-8">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-heading font-semibold text-lg mb-4">Violation Trends Over Time</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={violationTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="violations" fill="#E74C3C" name="New Violations" />
                    <Bar dataKey="resolved" fill="#27AE60" name="Resolved" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-heading font-semibold text-lg mb-4">Key Insights</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Icon name="TrendingDown" size={20} className="text-success mt-0.5" />
                    <div>
                      <p className="font-body font-medium text-foreground">Decreasing Trend</p>
                      <p className="text-sm text-muted-foreground">
                        Violations decreased by 67% over the last 6 months
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Icon name="Target" size={20} className="text-primary mt-0.5" />
                    <div>
                      <p className="font-body font-medium text-foreground">Top Category</p>
                      <p className="text-sm text-muted-foreground">
                        Misleading claims account for 35% of all violations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Icon name="Clock" size={20} className="text-warning mt-0.5" />
                    <div>
                      <p className="font-body font-medium text-foreground">Resolution Time</p>
                      <p className="text-sm text-muted-foreground">
                        Average resolution time improved to 2.3 days
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-heading font-semibold text-lg mb-4">Recommendations</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="font-body font-medium text-foreground mb-2">Enhanced Training</p>
                    <p className="text-sm text-muted-foreground">
                      Focus on marketing team training for claim substantiation
                    </p>
                  </div>
                  <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
                    <p className="font-body font-medium text-foreground mb-2">Process Improvement</p>
                    <p className="text-sm text-muted-foreground">
                      Implement automated pre-screening for high-risk content
                    </p>
                  </div>
                  <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
                    <p className="font-body font-medium text-foreground mb-2">Regular Audits</p>
                    <p className="text-sm text-muted-foreground">
                      Schedule monthly compliance reviews for all departments
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'impact_assessment':
        return (
          <div className="space-y-8">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-heading font-semibold text-lg mb-4">Regulatory Change Impact</h3>
              <div className="space-y-6">
                <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Icon name="AlertCircle" size={20} className="text-warning mt-0.5" />
                    <div>
                      <p className="font-body font-semibold text-foreground">
                        RBI Digital Lending Guidelines Update
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Effective Date: September 1, 2025
                      </p>
                      <p className="text-sm text-foreground mt-2">
                        New requirements for interest rate disclosure and cooling-off period notifications
                        will impact 45% of current marketing materials.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-error/5 border border-error/20 rounded-lg">
                    <p className="text-2xl font-heading font-bold text-error">127</p>
                    <p className="text-sm text-muted-foreground">Content Items Affected</p>
                  </div>
                  <div className="text-center p-4 bg-warning/5 border border-warning/20 rounded-lg">
                    <p className="text-2xl font-heading font-bold text-warning">15</p>
                    <p className="text-sm text-muted-foreground">Days to Compliance</p>
                  </div>
                  <div className="text-center p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-2xl font-heading font-bold text-primary">₹2.3L</p>
                    <p className="text-sm text-muted-foreground">Estimated Cost</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-heading font-semibold text-lg mb-4">Action Plan</h3>
                <div className="space-y-4">
                  {[
                    {
                      task: 'Review all loan product marketing materials',
                      deadline: '2025-08-25',
                      status: 'in_progress',
                      assignee: 'Marketing Team'
                    },
                    {
                      task: 'Update interest rate disclosure templates',
                      deadline: '2025-08-27',
                      status: 'pending',
                      assignee: 'Legal Team'
                    },
                    {
                      task: 'Implement cooling-off period notifications',
                      deadline: '2025-08-30',
                      status: 'pending',
                      assignee: 'Product Team'
                    },
                    {
                      task: 'Conduct compliance training session',
                      deadline: '2025-09-01',
                      status: 'pending',
                      assignee: 'Compliance Team'
                    }
                  ]?.map((task, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-body font-medium text-foreground">{task?.task}</p>
                        <p className="text-sm text-muted-foreground">{task?.assignee}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task?.status === 'in_progress' ?'bg-primary/10 text-primary' :'bg-muted-foreground/10 text-muted-foreground'
                        }`}>
                          {task?.status === 'in_progress' ? 'In Progress' : 'Pending'}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">{task?.deadline}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-heading font-semibold text-lg mb-4">Risk Assessment</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-error/5 border border-error/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-body font-medium text-foreground">Non-Compliance Risk</p>
                      <span className="text-sm font-medium text-error">High</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Potential regulatory penalties and reputational damage
                    </p>
                  </div>
                  <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-body font-medium text-foreground">Implementation Risk</p>
                      <span className="text-sm font-medium text-warning">Medium</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Tight timeline may impact quality of compliance updates
                    </p>
                  </div>
                  <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-body font-medium text-foreground">Resource Availability</p>
                      <span className="text-sm font-medium text-success">Good</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sufficient team capacity for required changes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <Icon name="FileText" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Select a report template to preview content</p>
          </div>
        );
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="Eye" size={16} color="white" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-lg text-foreground">
                Report Preview
              </h2>
              <p className="text-sm text-muted-foreground">
                {reportConfig?.title || 'Compliance Report'} - {new Date()?.toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Icon name="Download" size={16} className="mr-2" />
              Export
            </Button>
            <Button variant="default" size="sm">
              <Icon name="Share" size={16} className="mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>
      <div className="p-6">
        {getTemplateContent()}
      </div>
    </div>
  );
};

export default ReportPreview;