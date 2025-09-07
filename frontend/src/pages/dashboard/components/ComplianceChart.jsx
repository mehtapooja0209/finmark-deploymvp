import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import apiService from '../../../services/apiService';
import Icon from '../../../components/AppIcon';

const ComplianceChart = ({ type = 'line', data, title, height = 300, chartType = 'compliance' }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let response;
        
        switch (chartType) {
          case 'compliance':
            response = await apiService.getComplianceTrends(30);
            // Transform data for chart
            const complianceData = response.data.data?.map(item => ({
              date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              compliance: item.averageScore,
              analysesCount: item.analysesCount
            })) || [];
            setChartData(complianceData);
            break;
            
          case 'violations':
            response = await apiService.getViolationCategories();
            const violationData = response.data.byCategory?.map(item => ({
              category: item.category,
              total: item.total,
              critical: item.critical,
              high: item.high,
              medium: item.medium,
              low: item.low
            })) || [];
            setChartData(violationData);
            break;
            
          case 'processing':
            response = await apiService.getDocumentProcessingData(30);
            const processingData = response.data.timeline?.map(item => ({
              date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              uploaded: item.uploaded,
              processed: item.processed,
              errors: item.errors
            })) || [];
            setChartData(processingData);
            break;
            
          case 'performance':
            response = await apiService.getPerformanceMetrics(24);
            const performanceData = response.data.timeline?.map(item => ({
              hour: item.hour,
              avgProcessingTime: Math.round(item.avgProcessingTime / 1000), // Convert to seconds
              avgTokens: item.avgTokens,
              avgConfidence: item.avgConfidence,
              analysesCount: item.analysesCount
            })) || [];
            setChartData(performanceData);
            break;
            
          default:
            // Fallback to provided data or mock data
            if (data && data.length > 0) {
              setChartData(data);
            } else {
              const mockData = [
                { month: 'Jan', compliance: 94, violations: 12, scanned: 1250 },
                { month: 'Feb', compliance: 96, violations: 8, scanned: 1380 },
                { month: 'Mar', compliance: 92, violations: 18, scanned: 1420 },
                { month: 'Apr', compliance: 98, violations: 5, scanned: 1180 },
                { month: 'May', compliance: 95, violations: 11, scanned: 1520 },
                { month: 'Jun', compliance: 97, violations: 7, scanned: 1650 }
              ];
              setChartData(mockData);
            }
        }
      } catch (err) {
        console.error('Failed to fetch chart data:', err);
        setError('Failed to load chart data');
        
        // Set fallback data
        const fallbackData = data && data.length > 0 ? data : [
          { month: 'No data', compliance: 0, violations: 0, scanned: 0 }
        ];
        setChartData(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [chartType, data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-modal">
          <p className="font-body font-medium text-popover-foreground mb-2">{`${label} 2024`}</p>
          {payload?.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry?.color }}>
              {`${entry?.name}: ${entry?.value}${entry?.name === 'Compliance Rate' ? '%' : ''}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getDataKey = () => {
    switch (chartType) {
      case 'compliance':
        return type === 'line' ? 'date' : 'date';
      case 'violations':
        return 'category';
      case 'processing':
        return 'date';
      case 'performance':
        return 'hour';
      default:
        return 'month';
    }
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Icon name="Loader2" size={20} className="animate-spin" />
            <span className="font-body">Loading chart data...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="flex items-center space-x-2 text-error">
            <Icon name="AlertCircle" size={20} />
            <span className="font-body">{error}</span>
          </div>
        </div>
      );
    }

    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="text-center text-muted-foreground">
            <Icon name="BarChart3" size={32} className="mx-auto mb-2 opacity-50" />
            <p className="font-body">No data available</p>
          </div>
        </div>
      );
    }

    const dataKey = getDataKey();

    if (type === 'line') {
      return (
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis 
            dataKey={dataKey}
            stroke="var(--color-muted-foreground)"
            fontSize={12}
            fontFamily="Source Sans Pro"
          />
          <YAxis 
            stroke="var(--color-muted-foreground)"
            fontSize={12}
            fontFamily="Source Sans Pro"
          />
          <Tooltip content={<CustomTooltip />} />
          {chartType === 'compliance' && (
            <Line 
              type="monotone" 
              dataKey="compliance" 
              stroke="var(--color-success)" 
              strokeWidth={2}
              name="Compliance Rate"
              dot={{ fill: 'var(--color-success)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'var(--color-success)', strokeWidth: 2 }}
            />
          )}
          {chartType === 'performance' && (
            <>
              <Line 
                type="monotone" 
                dataKey="avgProcessingTime" 
                stroke="var(--color-primary)" 
                strokeWidth={2}
                name="Avg Processing Time (s)"
                dot={{ fill: 'var(--color-primary)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'var(--color-primary)', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="avgConfidence" 
                stroke="var(--color-success)" 
                strokeWidth={2}
                name="Avg Confidence (%)"
                dot={{ fill: 'var(--color-success)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'var(--color-success)', strokeWidth: 2 }}
              />
            </>
          )}
        </LineChart>
      );
    } else if (type === 'bar') {
      return (
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis 
            dataKey={dataKey}
            stroke="var(--color-muted-foreground)"
            fontSize={12}
            fontFamily="Source Sans Pro"
          />
          <YAxis 
            stroke="var(--color-muted-foreground)"
            fontSize={12}
            fontFamily="Source Sans Pro"
          />
          <Tooltip content={<CustomTooltip />} />
          {chartType === 'processing' && (
            <>
              <Bar 
                dataKey="uploaded" 
                fill="var(--color-primary)" 
                name="Documents Uploaded"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="processed" 
                fill="var(--color-success)" 
                name="Documents Processed"
                radius={[2, 2, 0, 0]}
              />
              {chartData.some(d => d.errors > 0) && (
                <Bar 
                  dataKey="errors" 
                  fill="var(--color-error)" 
                  name="Processing Errors"
                  radius={[2, 2, 0, 0]}
                />
              )}
            </>
          )}
          {chartType === 'violations' && (
            <Bar 
              dataKey="total" 
              fill="var(--color-warning)" 
              name="Total Violations"
              radius={[4, 4, 0, 0]}
            />
          )}
          {!chartType || chartType === 'default' && (
            <Bar 
              dataKey="scanned" 
              fill="var(--color-primary)" 
              name="Content Scanned"
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      );
    }

    return null;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-lg text-foreground">{title}</h3>
        {!loading && !error && chartData.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {chartData.length} data point{chartData.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ComplianceChart;