import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import UpdateCard from './UpdateCard';

const UpdatesFeed = ({ 
  updates, 
  loading, 
  onLoadMore, 
  hasMore, 
  onMarkAsRead, 
  onShare, 
  onViewDetails,
  sortBy,
  onSortChange 
}) => {
  const [viewMode, setViewMode] = useState('detailed'); // detailed, compact

  const sortOptions = [
    { value: 'newest', label: 'Newest First', icon: 'ArrowDown' },
    { value: 'oldest', label: 'Oldest First', icon: 'ArrowUp' },
    { value: 'priority', label: 'Priority', icon: 'AlertTriangle' },
    { value: 'deadline', label: 'Deadline', icon: 'Clock' },
    { value: 'relevance', label: 'Relevance', icon: 'Target' }
  ];

  const viewModeOptions = [
    { value: 'detailed', label: 'Detailed View', icon: 'List' },
    { value: 'compact', label: 'Compact View', icon: 'LayoutList' }
  ];

  const getUpdateStats = () => {
    const total = updates?.length;
    const unread = updates?.filter(u => !u?.isRead)?.length;
    const critical = updates?.filter(u => u?.priority === 'critical')?.length;
    const thisWeek = updates?.filter(u => {
      const updateDate = new Date(u.publishedDate);
      const weekAgo = new Date();
      weekAgo?.setDate(weekAgo?.getDate() - 7);
      return updateDate >= weekAgo;
    })?.length;

    return { total, unread, critical, thisWeek };
  };

  const stats = getUpdateStats();

  if (loading && updates?.length === 0) {
    return (
      <div className="flex-1 bg-background p-6">
        <div className="max-w-4xl mx-auto">
          {/* Loading Skeleton */}
          <div className="space-y-6">
            {[...Array(5)]?.map((_, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-6 animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-lg"></div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-4 bg-muted rounded"></div>
                      <div className="w-20 h-4 bg-muted rounded"></div>
                    </div>
                    <div className="w-3/4 h-6 bg-muted rounded"></div>
                    <div className="w-full h-4 bg-muted rounded"></div>
                    <div className="w-1/2 h-4 bg-muted rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-heading font-bold text-2xl text-foreground mb-2">
                Regulatory Updates & Notifications
              </h1>
              <p className="text-muted-foreground">
                Stay informed about the latest regulatory changes affecting your fintech operations
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                iconName="RefreshCw"
                iconPosition="left"
                onClick={() => window.location?.reload()}
              >
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                iconName="Download"
                iconPosition="left"
              >
                Export
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icon name="FileText" size={16} className="text-primary" />
                <span className="text-sm text-muted-foreground">Total Updates</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{stats?.total}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icon name="Eye" size={16} className="text-warning" />
                <span className="text-sm text-muted-foreground">Unread</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{stats?.unread}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icon name="AlertTriangle" size={16} className="text-error" />
                <span className="text-sm text-muted-foreground">Critical</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{stats?.critical}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icon name="Calendar" size={16} className="text-success" />
                <span className="text-sm text-muted-foreground">This Week</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{stats?.thisWeek}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Sort Options */}
              <div className="flex items-center space-x-2">
                <Icon name="ArrowUpDown" size={16} className="text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => onSortChange(e?.target?.value)}
                  className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {sortOptions?.map((option) => (
                    <option key={option?.value} value={option?.value}>
                      {option?.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-muted rounded-lg p-1">
                {viewModeOptions?.map((option) => (
                  <button
                    key={option?.value}
                    onClick={() => setViewMode(option?.value)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                      viewMode === option?.value
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon name={option?.icon} size={14} />
                    <span className="hidden sm:inline">{option?.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                iconName="CheckCheck"
                iconPosition="left"
                onClick={() => {
                  updates?.filter(u => !u?.isRead)?.forEach(u => onMarkAsRead(u?.id));
                }}
                disabled={stats?.unread === 0}
              >
                Mark All Read
              </Button>
            </div>
          </div>
        </div>

        {/* Updates List */}
        {updates?.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="FileText" size={48} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
              No Updates Found
            </h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or check back later for new regulatory updates.
            </p>
            <Button variant="outline" iconName="RefreshCw" iconPosition="left">
              Refresh Updates
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {updates?.map((update) => (
              <UpdateCard
                key={update?.id}
                update={update}
                onMarkAsRead={onMarkAsRead}
                onShare={onShare}
                onViewDetails={onViewDetails}
                viewMode={viewMode}
              />
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="text-center py-6">
                <Button
                  variant="outline"
                  iconName="ChevronDown"
                  iconPosition="right"
                  onClick={onLoadMore}
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More Updates'}
                </Button>
              </div>
            )}

            {!hasMore && updates?.length > 0 && (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">
                  You've reached the end of the updates feed
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdatesFeed;