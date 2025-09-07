import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const ContentViewer = ({ content, violations, onViolationSelect, selectedViolation }) => {
  const [viewMode, setViewMode] = useState('original'); // original, highlighted, split

  const getViolationHighlight = (violationId) => {
    const colors = {
      'critical': 'bg-error/20 border-error/50 text-error-foreground',
      'warning': 'bg-warning/20 border-warning/50 text-warning-foreground',
      'minor': 'bg-accent/20 border-accent/50 text-accent-foreground'
    };
    const violation = violations?.find(v => v?.id === violationId);
    return colors?.[violation?.severity] || 'bg-muted border-border';
  };

  const renderHighlightedContent = () => {
    let highlightedText = content?.text;
    violations?.forEach(violation => {
      if (violation?.location) {
        const { start, end } = violation?.location;
        const beforeText = highlightedText?.substring(0, start);
        const violationText = highlightedText?.substring(start, end);
        const afterText = highlightedText?.substring(end);
        
        highlightedText = `${beforeText}<span class="violation-highlight ${getViolationHighlight(violation?.id)} px-1 rounded cursor-pointer" data-violation="${violation?.id}">${violationText}</span>${afterText}`;
      }
    });
    return highlightedText;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - Premium Financial Style */}
      <div className="p-6 border-b border-primary/20 bg-gradient-to-r from-muted/50 to-card/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-xl text-gradient-gold">Original Content</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('original')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                viewMode === 'original' ?'bg-primary text-primary-foreground shadow-premium' :'text-muted-foreground hover:text-primary hover:bg-primary/10 border border-primary/20'
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setViewMode('highlighted')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                viewMode === 'highlighted' ?'bg-primary text-primary-foreground shadow-premium' :'text-muted-foreground hover:text-primary hover:bg-primary/10 border border-primary/20'
              }`}
            >
              Highlighted
            </button>
          </div>
        </div>
        
        {/* Content Info - Professional Layout */}
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2 px-3 py-1 bg-muted/50 rounded-lg border border-primary/10">
            <Icon name="FileText" size={16} className="text-primary" />
            <span className="text-foreground font-medium">{content?.type}</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 bg-muted/50 rounded-lg border border-primary/10">
            <Icon name="Calendar" size={16} className="text-primary" />
            <span className="text-foreground font-medium">{content?.uploadDate}</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 bg-muted/50 rounded-lg border border-primary/10">
            <Icon name="User" size={16} className="text-primary" />
            <span className="text-foreground font-medium">{content?.uploadedBy}</span>
          </div>
        </div>
      </div>

      {/* Content Display - Premium Styling */}
      <div className="flex-1 p-6 overflow-auto">
        {content?.type === 'image' ? (
          <div className="space-y-6">
            <div className="border border-primary/20 rounded-xl overflow-hidden shadow-premium">
              <Image 
                src={content?.imageUrl} 
                alt="Marketing content" 
                className="w-full h-auto"
              />
            </div>
            {content?.extractedText && (
              <div className="bg-muted/30 border border-primary/20 p-6 rounded-xl">
                <h4 className="font-heading font-semibold text-primary mb-3">Extracted Text:</h4>
                <div 
                  className="text-sm text-muted-foreground leading-relaxed font-body"
                  dangerouslySetInnerHTML={{ 
                    __html: viewMode === 'highlighted' ? renderHighlightedContent() : content?.extractedText 
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="bg-muted/30 border border-primary/20 p-6 rounded-xl">
            <div 
              className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-body"
              dangerouslySetInnerHTML={{ 
                __html: viewMode === 'highlighted' ? renderHighlightedContent() : content?.text 
              }}
              onClick={(e) => {
                if (e?.target?.dataset?.violation) {
                  onViolationSelect(e?.target?.dataset?.violation);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Violation Summary - Premium Financial Dashboard Style */}
      <div className="p-6 border-t border-primary/20 bg-gradient-to-r from-card/50 to-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 px-3 py-2 bg-error/10 rounded-lg border border-error/20">
              <div className="w-3 h-3 bg-error rounded-full shadow-sm"></div>
              <span className="text-sm font-semibold text-error">
                {violations?.filter(v => v?.severity === 'critical')?.length} Critical
              </span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 bg-warning/10 rounded-lg border border-warning/20">
              <div className="w-3 h-3 bg-warning rounded-full shadow-sm"></div>
              <span className="text-sm font-semibold text-warning">
                {violations?.filter(v => v?.severity === 'warning')?.length} Warnings
              </span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 bg-accent/10 rounded-lg border border-accent/20">
              <div className="w-3 h-3 bg-accent rounded-full shadow-sm"></div>
              <span className="text-sm font-semibold text-accent-foreground">
                {violations?.filter(v => v?.severity === 'minor')?.length} Minor
              </span>
            </div>
          </div>
          <button className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors duration-200 flex items-center space-x-2">
            <Icon name="Download" size={14} />
            <span>Export Content</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentViewer;