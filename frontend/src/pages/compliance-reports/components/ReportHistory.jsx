import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ReportHistory = ({ onTemplateSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const reportHistory = [
    {
      id: 'RPT-001',
      title: 'Q2 2025 Executive Summary',
      type: 'executive_summary',
      createdBy: 'Priya Sharma',
      createdAt: '2025-08-20T10:30:00Z',
      size: '2.4 MB',
      format: 'PDF',
      status: 'completed',
      downloads: 12,
      shared: true
    },
    {
      id: 'RPT-002',
      title: 'Marketing Content Audit - July 2025',
      type: 'detailed_audit',
      createdBy: 'Rajesh Kumar',
      createdAt: '2025-08-18T14:15:00Z',
      size: '5.7 MB',
      format: 'PDF',
      status: 'completed',
      downloads: 8,
      shared: false
    },
    {
      id: 'RPT-003',
      title: 'Violation Trends Analysis',
      type: 'trend_analysis',
      createdBy: 'Anita Patel',
      createdAt: '2025-08-15T09:45:00Z',
      size: '3.1 MB',
      format: 'Excel',
      status: 'completed',
      downloads: 15,
      shared: true
    },
    {
      id: 'RPT-004',
      title: 'RBI Guidelines Impact Assessment',
      type: 'impact_assessment',
      createdBy: 'Vikram Singh',
      createdAt: '2025-08-12T16:20:00Z',
      size: '4.2 MB',
      format: 'PowerPoint',
      status: 'completed',
      downloads: 6,
      shared: false
    },
    {
      id: 'RPT-005',
      title: 'Monthly Compliance Report - July',
      type: 'executive_summary',
      createdBy: 'Priya Sharma',
      createdAt: '2025-08-10T11:00:00Z',
      size: '1.8 MB',
      format: 'PDF',
      status: 'archived',
      downloads: 22,
      shared: true
    }
  ];

  const savedTemplates = [
    {
      id: 'TPL-001',
      name: 'Executive Summary Template',
      type: 'executive_summary',
      description: 'Standard template for leadership reports',
      lastUsed: '2025-08-20',
      usageCount: 8
    },
    {
      id: 'TPL-002',
      name: 'Marketing Audit Template',
      type: 'detailed_audit',
      description: 'Comprehensive marketing content analysis',
      lastUsed: '2025-08-18',
      usageCount: 5
    },
    {
      id: 'TPL-003',
      name: 'Trend Analysis Template',
      type: 'trend_analysis',
      description: 'Historical violation pattern analysis',
      lastUsed: '2025-08-15',
      usageCount: 12
    }
  ];

  const getTypeIcon = (type) => {
    switch (type) {
      case 'executive_summary': return 'BarChart3';
      case 'detailed_audit': return 'FileSearch';
      case 'trend_analysis': return 'TrendingUp';
      case 'impact_assessment': return 'AlertTriangle';
      default: return 'FileText';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'executive_summary': return 'Executive Summary';
      case 'detailed_audit': return 'Detailed Audit';
      case 'trend_analysis': return 'Trend Analysis';
      case 'impact_assessment': return 'Impact Assessment';
      default: return 'Report';
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'PDF': return 'FileText';
      case 'Excel': return 'Sheet';
      case 'PowerPoint': return 'Presentation';
      default: return 'File';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredReports = reportHistory?.filter(report => {
    const matchesSearch = report?.title?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
                         report?.createdBy?.toLowerCase()?.includes(searchQuery?.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || report?.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Saved Templates */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="Bookmark" size={16} color="white" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-lg text-foreground">
                Saved Templates
              </h2>
              <p className="text-sm text-muted-foreground">
                Quick access to your frequently used report configurations
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedTemplates?.map((template) => (
              <div
                key={template?.id}
                className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors duration-200 cursor-pointer"
                onClick={() => onTemplateSelect(template?.type)}
              >
                <div className="flex items-start justify-between mb-3">
                  <Icon name={getTypeIcon(template?.type)} size={20} className="text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Used {template?.usageCount} times
                  </span>
                </div>
                <h3 className="font-body font-medium text-foreground mb-1">
                  {template?.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {template?.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Last used: {template?.lastUsed}
                  </span>
                  <Button variant="ghost" size="sm">
                    Use Template
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Report History */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="History" size={16} color="white" />
              </div>
              <div>
                <h2 className="font-heading font-semibold text-lg text-foreground">
                  Report History
                </h2>
                <p className="text-sm text-muted-foreground">
                  Access and manage previously generated reports
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Icon name="Archive" size={16} className="mr-2" />
              Archive Old Reports
            </Button>
          </div>
        </div>

        <div className="p-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search reports by title or creator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e?.target?.value)}
              />
            </div>
            <div className="flex gap-2">
              {['all', 'executive_summary', 'detailed_audit', 'trend_analysis', 'impact_assessment']?.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    selectedCategory === category
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {category === 'all' ? 'All' : getTypeLabel(category)}
                </button>
              ))}
            </div>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            {filteredReports?.map((report) => (
              <div
                key={report?.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Icon name={getFormatIcon(report?.format)} size={20} className="text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-body font-medium text-foreground">
                        {report?.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        report?.status === 'completed' 
                          ? 'bg-success/10 text-success' :'bg-muted-foreground/10 text-muted-foreground'
                      }`}>
                        {report?.status}
                      </span>
                      {report?.shared && (
                        <Icon name="Share2" size={14} className="text-primary" />
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>By {report?.createdBy}</span>
                      <span>{formatDate(report?.createdAt)}</span>
                      <span>{report?.size}</span>
                      <span>{report?.downloads} downloads</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Icon name="Download" size={16} className="mr-2" />
                    Download
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Icon name="Share2" size={16} className="mr-2" />
                    Share
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Icon name="Copy" size={16} className="mr-2" />
                    Duplicate
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Icon name="MoreVertical" size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredReports?.length === 0 && (
            <div className="text-center py-12">
              <Icon name="Search" size={48} className="text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No reports found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportHistory;