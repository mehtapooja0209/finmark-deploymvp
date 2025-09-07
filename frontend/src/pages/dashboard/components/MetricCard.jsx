import React from 'react';
import Icon from '../../../components/AppIcon';

const MetricCard = ({ title, value, subtitle, icon, trend, trendValue, color = 'primary', onClick }) => {
  const getTrendIcon = () => {
    if (trend === 'up') return 'TrendingUp';
    if (trend === 'down') return 'TrendingDown';
    return 'Minus';
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-success';
    if (trend === 'down') return 'text-error';
    return 'text-muted-foreground';
  };

  return (
    <div 
      className={`bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-primary/20' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-body text-muted-foreground mb-1">{title}</p>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-2xl font-heading font-semibold text-foreground">{value}</h3>
            {trendValue && (
              <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
                <Icon name={getTrendIcon()} size={14} />
                <span className="text-sm font-medium">{trendValue}</span>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          color === 'primary' ? 'bg-primary/10' :
          color === 'success' ? 'bg-success/10' :
          color === 'warning' ? 'bg-warning/10' :
          color === 'error'? 'bg-error/10' : 'bg-muted'
        }`}>
          <Icon 
            name={icon} 
            size={24} 
            color={
              color === 'primary' ? 'var(--color-primary)' :
              color === 'success' ? 'var(--color-success)' :
              color === 'warning' ? 'var(--color-warning)' :
              color === 'error' ? 'var(--color-error)' :
              'var(--color-muted-foreground)'
            }
          />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;