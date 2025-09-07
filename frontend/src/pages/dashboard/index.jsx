import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import MetricCard from './components/MetricCard';
import ComplianceChart from './components/ComplianceChart';
import ActivityFeed from './components/ActivityFeed';
import PriorityAlerts from './components/PriorityAlerts';
import QuickActions from './components/QuickActions';
import RegulatoryUpdates from './components/RegulatoryUpdates';
import ComplianceCalendar from './components/ComplianceCalendar';
import useDashboardData from '../../hooks/useDashboardData';
import Icon from '../../components/AppIcon';

const Dashboard = () => {
  const navigate = useNavigate();
  const { 
    stats, 
    documents, 
    analyses, 
    recentActivity, 
    loading, 
    error, 
    refreshData,
    clearError 
  } = useDashboardData({ autoRefresh: true, refreshInterval: 30000 });

  const handleMetricClick = (route) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-semibold text-foreground mb-2">
              Compliance Dashboard
            </h1>
            <p className="text-muted-foreground font-body">
              Monitor regulatory compliance status and content scanning activities
            </p>
          </div>

          {/* Loading and Error States */}
          {error && (
            <div className="mb-6 bg-error/10 border border-error/20 rounded-lg p-4 flex items-start space-x-3">
              <Icon name="AlertCircle" size={20} className="text-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-error">Failed to load dashboard data</p>
                <p className="text-sm text-error/80 mt-1">{error}</p>
                <button
                  onClick={() => {
                    clearError();
                    refreshData();
                  }}
                  className="text-sm text-error hover:text-error/80 underline mt-2"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {loading && !stats ? (
              // Loading skeleton
              <>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
                    <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                ))}
              </>
            ) : (
              // Live data
              <>
                <MetricCard
                  title="Total Documents"
                  value={stats?.totalDocuments?.toLocaleString() || "0"}
                  subtitle="All time"
                  icon="FileSearch"
                  trend={stats?.weeklyTrend?.documents > 0 ? "up" : stats?.weeklyTrend?.documents < 0 ? "down" : "stable"}
                  trendValue={stats?.weeklyTrend?.documents > 0 ? `+${stats.weeklyTrend.documents}` : stats?.weeklyTrend?.documents < 0 ? `${stats.weeklyTrend.documents}` : "±0"}
                  color="primary"
                  onClick={() => handleMetricClick('/content-upload-scanning')}
                />
                <MetricCard
                  title="Compliance Rate"
                  value={stats?.averageComplianceScore ? `${stats.averageComplianceScore}%` : "0%"}
                  subtitle="Average score"
                  icon="CheckCircle"
                  trend={stats?.weeklyTrend?.compliance > 0 ? "up" : stats?.weeklyTrend?.compliance < 0 ? "down" : "stable"}
                  trendValue={stats?.weeklyTrend?.compliance > 0 ? `+${stats.weeklyTrend.compliance}%` : stats?.weeklyTrend?.compliance < 0 ? `${stats.weeklyTrend.compliance}%` : "±0%"}
                  color="success"
                  onClick={() => handleMetricClick('/compliance-results-violations')}
                />
                <MetricCard
                  title="Pending Analyses"
                  value={stats?.pendingAnalyses?.toString() || "0"}
                  subtitle="In queue"
                  icon="Clock"
                  trend="stable"
                  trendValue=""
                  color="warning"
                  onClick={() => handleMetricClick('/compliance-results-violations')}
                />
                <MetricCard
                  title="Active Violations"
                  value={stats?.activeViolations?.toString() || "0"}
                  subtitle="Need attention"
                  icon="AlertTriangle"
                  trend={stats?.weeklyTrend?.violations > 0 ? "up" : stats?.weeklyTrend?.violations < 0 ? "down" : "stable"}
                  trendValue={stats?.weeklyTrend?.violations > 0 ? `+${stats.weeklyTrend.violations}` : stats?.weeklyTrend?.violations < 0 ? `${stats.weeklyTrend.violations}` : "±0"}
                  color="error"
                  onClick={() => handleMetricClick('/compliance-results-violations')}
                />
              </>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column - Charts */}
            <div className="lg:col-span-2 space-y-6">
              <ComplianceChart
                type="line"
                title="Compliance Trends (Last 30 Days)"
                height={300}
                chartType="compliance"
              />
              <ComplianceChart
                type="bar"
                title="Document Processing Activity"
                height={250}
                chartType="processing"
              />
            </div>

            {/* Right Column - Activity Feed */}
            <div className="space-y-6">
              <ActivityFeed activities={recentActivity} loading={loading} />
              <QuickActions />
            </div>
          </div>

          {/* Priority Alerts Section */}
          <div className="mb-8">
            <PriorityAlerts />
          </div>

          {/* Bottom Grid - Updates and Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RegulatoryUpdates />
            <ComplianceCalendar />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;