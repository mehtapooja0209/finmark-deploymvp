import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import ReportBuilder from './components/ReportBuilder';
import ReportPreview from './components/ReportPreview';
import ReportHistory from './components/ReportHistory';
import ExportOptions from './components/ExportOptions';

const ComplianceReports = () => {
  const [activeTab, setActiveTab] = useState('builder');
  const [selectedTemplate, setSelectedTemplate] = useState('executive_summary');
  const [reportConfig, setReportConfig] = useState({});
  const [isExporting, setIsExporting] = useState(false);

  // Mock data for dashboard stats
  const dashboardStats = [
    {
      label: 'Total Reports Generated',
      value: '247',
      change: '+12%',
      trend: 'up',
      icon: 'FileText'
    },
    {
      label: 'Active Templates',
      value: '8',
      change: '+2',
      trend: 'up',
      icon: 'Bookmark'
    },
    {
      label: 'Scheduled Reports',
      value: '15',
      change: '+3',
      trend: 'up',
      icon: 'Clock'
    },
    {
      label: 'Average Generation Time',
      value: '2.3 min',
      change: '-15%',
      trend: 'down',
      icon: 'Zap'
    }
  ];

  const quickActions = [
    {
      title: 'Executive Summary',
      description: 'Generate high-level compliance overview',
      icon: 'BarChart3',
      template: 'executive_summary',
      color: 'primary'
    },
    {
      title: 'Detailed Audit',
      description: 'Comprehensive compliance analysis',
      icon: 'FileSearch',
      template: 'detailed_audit',
      color: 'secondary'
    },
    {
      title: 'Trend Analysis',
      description: 'Historical violation patterns',
      icon: 'TrendingUp',
      template: 'trend_analysis',
      color: 'success'
    },
    {
      title: 'Impact Assessment',
      description: 'Regulatory change impact analysis',
      icon: 'AlertTriangle',
      template: 'impact_assessment',
      color: 'warning'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'Report Generated',
      details: 'Q2 2025 Executive Summary completed',
      user: 'Priya Sharma',
      timestamp: '2 hours ago',
      icon: 'FileText',
      status: 'success'
    },
    {
      id: 2,
      action: 'Template Updated',
      details: 'Marketing Audit Template modified',
      user: 'Rajesh Kumar',
      timestamp: '4 hours ago',
      icon: 'Edit',
      status: 'info'
    },
    {
      id: 3,
      action: 'Scheduled Export',
      details: 'Monthly compliance report scheduled',
      user: 'Anita Patel',
      timestamp: '6 hours ago',
      icon: 'Clock',
      status: 'info'
    },
    {
      id: 4,
      action: 'Report Shared',
      details: 'Violation trends report shared with 5 users',
      user: 'Vikram Singh',
      timestamp: '1 day ago',
      icon: 'Share2',
      status: 'success'
    }
  ];

  const handlePreviewUpdate = (config) => {
    setReportConfig(config);
  };

  const handleTemplateChange = (template) => {
    setSelectedTemplate(template);
    setActiveTab('builder');
  };

  const handleQuickAction = (template) => {
    setSelectedTemplate(template);
    setActiveTab('builder');
  };

  const handleExport = async (exportSettings) => {
    setIsExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      // Show success notification
      alert(`Report exported successfully as ${exportSettings?.format?.toUpperCase()}!`);
    }, 3000);
  };

  const tabs = [
    { id: 'builder', label: 'Report Builder', icon: 'Settings' },
    { id: 'preview', label: 'Preview', icon: 'Eye' },
    { id: 'history', label: 'History', icon: 'History' },
    { id: 'export', label: 'Export', icon: 'Download' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
                  Compliance Reports
                </h1>
                <p className="text-muted-foreground">
                  Generate comprehensive regulatory adherence documentation for audits and management review
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline">
                  <Icon name="Upload" size={16} className="mr-2" />
                  Import Template
                </Button>
                <Button variant="default">
                  <Icon name="Plus" size={16} className="mr-2" />
                  New Report
                </Button>
              </div>
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {dashboardStats?.map((stat, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat?.label}</p>
                    <p className="text-2xl font-heading font-bold text-foreground">{stat?.value}</p>
                    <div className="flex items-center mt-2">
                      <Icon 
                        name={stat?.trend === 'up' ? 'TrendingUp' : 'TrendingDown'} 
                        size={14} 
                        className={stat?.trend === 'up' ? 'text-success' : 'text-error'} 
                      />
                      <span className={`text-sm ml-1 ${
                        stat?.trend === 'up' ? 'text-success' : 'text-error'
                      }`}>
                        {stat?.change}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon name={stat?.icon} size={24} className="text-primary" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-heading font-semibold text-foreground mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions?.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action?.template)}
                  className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-all duration-200 text-left group"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-10 h-10 bg-${action?.color}/10 rounded-lg flex items-center justify-center group-hover:bg-${action?.color}/20 transition-colors duration-200`}>
                      <Icon name={action?.icon} size={20} className={`text-${action?.color}`} />
                    </div>
                    <Icon name="ArrowRight" size={16} className="text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                  </div>
                  <h3 className="font-body font-semibold text-foreground mb-1">
                    {action?.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {action?.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {/* Tab Navigation */}
              <div className="bg-card border border-border rounded-lg mb-6">
                <div className="flex border-b border-border">
                  {tabs?.map((tab) => (
                    <button
                      key={tab?.id}
                      onClick={() => setActiveTab(tab?.id)}
                      className={`flex items-center space-x-2 px-6 py-4 font-body font-medium transition-colors duration-200 ${
                        activeTab === tab?.id
                          ? 'text-primary border-b-2 border-primary bg-primary/5' :'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Icon name={tab?.icon} size={16} />
                      <span>{tab?.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {activeTab === 'builder' && (
                  <ReportBuilder
                    onPreviewUpdate={handlePreviewUpdate}
                    selectedTemplate={selectedTemplate}
                    onTemplateChange={setSelectedTemplate}
                  />
                )}

                {activeTab === 'preview' && (
                  <ReportPreview
                    reportConfig={reportConfig}
                    selectedTemplate={selectedTemplate}
                  />
                )}

                {activeTab === 'history' && (
                  <ReportHistory
                    onTemplateSelect={handleTemplateChange}
                  />
                )}

                {activeTab === 'export' && (
                  <ExportOptions
                    onExport={handleExport}
                    reportConfig={reportConfig}
                    selectedTemplate={selectedTemplate}
                  />
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Activity */}
              <div className="bg-card border border-border rounded-lg">
                <div className="p-6 border-b border-border">
                  <h3 className="font-heading font-semibold text-foreground">Recent Activity</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recentActivity?.map((activity) => (
                      <div key={activity?.id} className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity?.status === 'success' ? 'bg-success/10' :
                          activity?.status === 'warning'? 'bg-warning/10' : 'bg-primary/10'
                        }`}>
                          <Icon 
                            name={activity?.icon} 
                            size={14} 
                            className={
                              activity?.status === 'success' ? 'text-success' :
                              activity?.status === 'warning'? 'text-warning' : 'text-primary'
                            } 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-medium text-foreground text-sm">
                            {activity?.action}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {activity?.details}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">
                              {activity?.user}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {activity?.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Help & Resources */}
              <div className="bg-card border border-border rounded-lg">
                <div className="p-6 border-b border-border">
                  <h3 className="font-heading font-semibold text-foreground">Help & Resources</h3>
                </div>
                <div className="p-6 space-y-4">
                  <a
                    href="#"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors duration-200"
                  >
                    <Icon name="BookOpen" size={16} className="text-primary" />
                    <div>
                      <p className="font-body font-medium text-foreground text-sm">
                        Report Templates Guide
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Learn about different report types
                      </p>
                    </div>
                  </a>
                  <a
                    href="#"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors duration-200"
                  >
                    <Icon name="Video" size={16} className="text-primary" />
                    <div>
                      <p className="font-body font-medium text-foreground text-sm">
                        Video Tutorials
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Step-by-step report creation
                      </p>
                    </div>
                  </a>
                  <a
                    href="#"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors duration-200"
                  >
                    <Icon name="MessageCircle" size={16} className="text-primary" />
                    <div>
                      <p className="font-body font-medium text-foreground text-sm">
                        Contact Support
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Get help with report issues
                      </p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Export Loading Modal */}
      {isExporting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="Download" size={32} className="text-primary animate-pulse" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                Exporting Report
              </h3>
              <p className="text-muted-foreground mb-4">
                Please wait while we generate your compliance report...
              </p>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceReports;