import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const GuidelinesList = ({ 
  guidelines, 
  selectedGuideline, 
  onGuidelineSelect,
  searchQuery,
  isLoading 
}) => {
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState('list');
  const [bookmarkedItems, setBookmarkedItems] = useState(new Set(['RBI-2023-001', 'SEBI-2023-045']));

  const sortOptions = [
    { value: 'relevance', label: 'Relevance', icon: 'Target' },
    { value: 'date-desc', label: 'Newest First', icon: 'ArrowDown' },
    { value: 'date-asc', label: 'Oldest First', icon: 'ArrowUp' },
    { value: 'title', label: 'Title A-Z', icon: 'AlphabeticalOrder' }
  ];

  const toggleBookmark = (guidelineId) => {
    const newBookmarks = new Set(bookmarkedItems);
    if (newBookmarks?.has(guidelineId)) {
      newBookmarks?.delete(guidelineId);
    } else {
      newBookmarks?.add(guidelineId);
    }
    setBookmarkedItems(newBookmarks);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-success bg-success/10';
      case 'amended': return 'text-warning bg-warning/10';
      case 'superseded': return 'text-muted-foreground bg-muted';
      default: return 'text-foreground bg-muted';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'text-error bg-error/10';
      case 'medium': return 'text-warning bg-warning/10';
      case 'low': return 'text-success bg-success/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text?.replace(regex, '<mark class="bg-accent/30 text-accent-foreground">$1</mark>');
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading guidelines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading font-semibold text-xl text-foreground">
              Guidelines & Regulations
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {guidelines?.length} guidelines found
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  viewMode === 'list' ?'bg-background text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name="List" size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  viewMode === 'grid' ?'bg-background text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name="Grid3X3" size={16} />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e?.target?.value)}
                className="appearance-none bg-input border border-border rounded-lg px-4 py-2 pr-8 text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {sortOptions?.map((option) => (
                  <option key={option?.value} value={option?.value}>
                    {option?.label}
                  </option>
                ))}
              </select>
              <Icon 
                name="ChevronDown" 
                size={16} 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" 
              />
            </div>
          </div>
        </div>

        {/* Active Filters */}
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-body rounded-full flex items-center">
            <Icon name="Filter" size={12} className="mr-1" />
            RBI Guidelines
            <button className="ml-2 hover:bg-primary/20 rounded-full p-0.5">
              <Icon name="X" size={10} />
            </button>
          </span>
          <span className="px-3 py-1 bg-secondary/10 text-secondary text-xs font-body rounded-full flex items-center">
            <Icon name="Calendar" size={12} className="mr-1" />
            Last 6 Months
            <button className="ml-2 hover:bg-secondary/20 rounded-full p-0.5">
              <Icon name="X" size={10} />
            </button>
          </span>
        </div>
      </div>
      {/* Guidelines List */}
      <div className="flex-1 overflow-y-auto p-6">
        {guidelines?.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="FileSearch" size={48} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading font-medium text-lg text-foreground mb-2">
              No Guidelines Found
            </h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or browse categories
            </p>
            <Button variant="outline">
              Browse All Guidelines
            </Button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4'}>
            {guidelines?.map((guideline) => (
              <div
                key={guideline?.id}
                className={`bg-card border border-border rounded-lg hover:shadow-sm transition-all duration-200 cursor-pointer ${
                  selectedGuideline?.id === guideline?.id ? 'ring-2 ring-primary border-primary' : ''
                }`}
                onClick={() => onGuidelineSelect(guideline)}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                          {guideline?.referenceNumber}
                        </span>
                        <span className={`text-xs font-body px-2 py-1 rounded-full ${getStatusColor(guideline?.status)}`}>
                          {guideline?.status?.charAt(0)?.toUpperCase() + guideline?.status?.slice(1)}
                        </span>
                        {guideline?.urgency && (
                          <span className={`text-xs font-body px-2 py-1 rounded-full ${getUrgencyColor(guideline?.urgency)}`}>
                            {guideline?.urgency?.charAt(0)?.toUpperCase() + guideline?.urgency?.slice(1)} Priority
                          </span>
                        )}
                      </div>
                      <h3 
                        className="font-heading font-semibold text-lg text-foreground mb-2 leading-tight"
                        dangerouslySetInnerHTML={{ __html: highlightText(guideline?.title, searchQuery) }}
                      />
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {guideline?.summary}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e?.stopPropagation();
                        toggleBookmark(guideline?.id);
                      }}
                      className={`p-2 rounded-lg transition-colors duration-200 ${
                        bookmarkedItems?.has(guideline?.id)
                          ? 'text-warning bg-warning/10 hover:bg-warning/20' :'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon name={bookmarkedItems?.has(guideline?.id) ? 'Bookmark' : 'BookmarkPlus'} size={16} />
                    </button>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Icon name="Building2" size={12} />
                        <span>{guideline?.regulatoryBody}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Icon name="Calendar" size={12} />
                        <span>{guideline?.effectiveDate}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Icon name="Tag" size={12} />
                        <span>{guideline?.category}</span>
                      </div>
                    </div>
                    {guideline?.relevanceScore && (
                      <div className="flex items-center space-x-1">
                        <Icon name="Target" size={12} />
                        <span>{guideline?.relevanceScore}% match</span>
                      </div>
                    )}
                  </div>

                  {/* Key Requirements Preview */}
                  {guideline?.keyRequirements && (
                    <div className="mb-4">
                      <h4 className="text-sm font-body font-medium text-foreground mb-2">
                        Key Requirements:
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {guideline?.keyRequirements?.slice(0, 2)?.map((requirement, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <Icon name="CheckCircle2" size={12} className="text-success mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-1">{requirement}</span>
                          </li>
                        ))}
                        {guideline?.keyRequirements?.length > 2 && (
                          <li className="text-xs text-muted-foreground italic">
                            +{guideline?.keyRequirements?.length - 2} more requirements
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Recent Updates */}
                  {guideline?.recentUpdates && guideline?.recentUpdates?.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Icon name="Clock" size={12} className="text-warning" />
                        <span className="text-xs font-body font-medium text-foreground">
                          Recent Update:
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {guideline?.recentUpdates?.[0]?.date}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        {guideline?.recentUpdates?.[0]?.summary}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {guideline?.tags && (
                    <div className="flex flex-wrap gap-1">
                      {guideline?.tags?.slice(0, 4)?.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {guideline?.tags?.length > 4 && (
                        <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                          +{guideline?.tags?.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuidelinesList;