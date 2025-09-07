import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const NotificationPanel = ({ notifications, userProfile, onNotificationAction, onUpdateSettings }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'deadline':
        return { icon: 'Clock', color: 'text-warning' };
      case 'new_regulation':
        return { icon: 'FileText', color: 'text-primary' };
      case 'amendment':
        return { icon: 'Edit', color: 'text-secondary' };
      case 'critical':
        return { icon: 'AlertTriangle', color: 'text-error' };
      case 'team':
        return { icon: 'Users', color: 'text-success' };
      default:
        return { icon: 'Bell', color: 'text-muted-foreground' };
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const upcomingDeadlines = notifications?.filter(n => n?.type === 'deadline')?.slice(0, 3);
  const recentNotifications = notifications?.filter(n => n?.type !== 'deadline')?.slice(0, 5);

  if (isCollapsed) {
    return (
      <div className="w-12 bg-card border-l border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          iconName="ChevronLeft"
          onClick={() => setIsCollapsed(false)}
          className="w-full"
        />
        {notifications?.filter(n => !n?.isRead)?.length > 0 && (
          <div className="w-6 h-6 bg-error text-error-foreground rounded-full flex items-center justify-center text-xs font-medium mt-2 mx-auto">
            {notifications?.filter(n => !n?.isRead)?.length}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-80 bg-card border-l border-border p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Icon name="Bell" size={20} className="text-foreground" />
          <h2 className="font-heading font-semibold text-lg text-foreground">Notifications</h2>
          {notifications?.filter(n => !n?.isRead)?.length > 0 && (
            <span className="bg-error text-error-foreground text-xs px-2 py-1 rounded-full">
              {notifications?.filter(n => !n?.isRead)?.length}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            iconName="Settings"
            onClick={() => setShowSettings(!showSettings)}
          />
          <Button
            variant="ghost"
            size="sm"
            iconName="ChevronRight"
            onClick={() => setIsCollapsed(true)}
          />
        </div>
      </div>
      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
          <h3 className="font-heading font-medium text-foreground mb-3">Notification Settings</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Critical Updates</span>
              <button className="w-10 h-6 bg-primary rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Email Notifications</span>
              <button className="w-10 h-6 bg-primary rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Team Updates</span>
              <button className="w-10 h-6 bg-muted rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1"></div>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* User Profile Summary */}
      <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <Icon name="User" size={20} color="white" />
          </div>
          <div>
            <p className="font-heading font-medium text-foreground">{userProfile?.name}</p>
            <p className="text-xs text-muted-foreground">{userProfile?.role}</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          <p>Monitoring: {userProfile?.businessAreas?.join(', ')}</p>
          <p>Company: {userProfile?.company}</p>
        </div>
      </div>
      {/* Upcoming Deadlines */}
      {upcomingDeadlines?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-heading font-medium text-foreground mb-3 flex items-center space-x-2">
            <Icon name="Clock" size={16} className="text-warning" />
            <span>Upcoming Deadlines</span>
          </h3>
          <div className="space-y-3">
            {upcomingDeadlines?.map((notification) => (
              <div
                key={notification?.id}
                className="p-3 bg-warning/5 border border-warning/20 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-body font-medium text-sm text-foreground line-clamp-2">
                    {notification?.title}
                  </h4>
                  <span className="text-xs text-warning font-medium ml-2 flex-shrink-0">
                    {notification?.daysLeft}d left
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {notification?.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Due: {new Date(notification.deadline)?.toLocaleDateString('en-IN')}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName="ExternalLink"
                    iconSize={12}
                    onClick={() => onNotificationAction(notification, 'view')}
                    className="text-warning hover:text-warning"
                  >
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Recent Notifications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-medium text-foreground">Recent Updates</h3>
          <Button
            variant="ghost"
            size="sm"
            iconName="CheckCheck"
            iconSize={14}
            onClick={() => onNotificationAction(null, 'markAllRead')}
            className="text-muted-foreground hover:text-foreground"
          >
          </Button>
        </div>
        
        <div className="space-y-3">
          {recentNotifications?.map((notification) => {
            const iconConfig = getNotificationIcon(notification?.type);
            
            return (
              <div
                key={notification?.id}
                className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer ${
                  notification?.isRead 
                    ? 'bg-card border-border opacity-75' :'bg-primary/5 border-primary/20'
                }`}
                onClick={() => onNotificationAction(notification, 'read')}
              >
                <div className="flex items-start space-x-3">
                  <Icon 
                    name={iconConfig?.icon} 
                    size={16} 
                    className={`${iconConfig?.color} mt-0.5 flex-shrink-0`} 
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-body font-medium text-sm text-foreground mb-1 line-clamp-2">
                      {notification?.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {notification?.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(notification?.timestamp)}
                      </span>
                      {!notification?.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
                {notification?.actionRequired && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="ArrowRight"
                      iconPosition="right"
                      onClick={(e) => {
                        e?.stopPropagation();
                        onNotificationAction(notification, 'action');
                      }}
                      className="w-full"
                    >
                      {notification?.actionText || 'Take Action'}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* View All Button */}
      <div className="mt-6 pt-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          iconName="ArrowRight"
          iconPosition="right"
          onClick={() => onNotificationAction(null, 'viewAll')}
          className="w-full"
        >
          View All Notifications
        </Button>
      </div>
    </div>
  );
};

export default NotificationPanel;