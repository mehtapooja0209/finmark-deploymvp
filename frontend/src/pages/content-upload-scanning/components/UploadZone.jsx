import React, { useState, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const UploadZone = ({ onFilesUpload, isScanning }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const acceptedFormats = [
    { type: 'Images', formats: 'JPG, PNG, GIF, WebP', maxSize: '10MB' },
    { type: 'Documents', formats: 'PDF, DOC, DOCX, TXT', maxSize: '25MB' },
    { type: 'Presentations', formats: 'PPT, PPTX', maxSize: '50MB' }
  ];

  const handleDragOver = useCallback((e) => {
    e?.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e?.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e?.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e?.dataTransfer?.files);
    handleFileUpload(files);
  }, []);

  const handleFileSelect = (e) => {
    const files = Array.from(e?.target?.files);
    handleFileUpload(files);
  };

  const handleFileUpload = (files) => {
    const validFiles = files?.filter(file => {
      const isValidType = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|txt|ppt|pptx)$/i?.test(file?.name);
      const isValidSize = file?.size <= 50 * 1024 * 1024; // 50MB max
      return isValidType && isValidSize;
    });

    if (validFiles?.length > 0) {
      onFilesUpload(validFiles);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="mb-6">
        <h2 className="font-heading font-semibold text-xl text-foreground mb-2">
          Upload Marketing Content
        </h2>
        <p className="text-muted-foreground font-body">
          Upload your marketing materials for automated RBI compliance scanning
        </p>
      </div>
      {/* Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50 hover:bg-muted/30'
        } ${isScanning ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt,.ppt,.pptx"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isScanning}
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Icon name="Upload" size={32} className="text-primary" />
          </div>
          
          <div>
            <h3 className="font-heading font-medium text-lg text-foreground mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-muted-foreground font-body">
              Support for multiple file formats and bulk uploads
            </p>
          </div>

          <Button variant="outline" iconName="FolderOpen" iconPosition="left">
            Choose Files
          </Button>
        </div>
      </div>
      {/* Supported Formats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {acceptedFormats?.map((format, index) => (
          <div key={index} className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Icon 
                name={format?.type === 'Images' ? 'Image' : format?.type === 'Documents' ? 'FileText' : 'Presentation'} 
                size={16} 
                className="text-primary" 
              />
              <span className="font-body font-medium text-sm text-foreground">
                {format?.type}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-body">
              {format?.formats}
            </p>
            <p className="text-xs text-muted-foreground font-body mt-1">
              Max size: {format?.maxSize}
            </p>
          </div>
        ))}
      </div>
      {/* Upload Guidelines */}
      <div className="mt-6 bg-warning/10 border border-warning/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Icon name="AlertTriangle" size={16} className="text-warning mt-0.5" />
          <div>
            <h4 className="font-body font-medium text-sm text-foreground mb-1">
              Upload Guidelines
            </h4>
            <ul className="text-xs text-muted-foreground font-body space-y-1">
              <li>• Ensure content is in final or near-final form for accurate scanning</li>
              <li>• Remove any confidential information before uploading</li>
              <li>• Maximum 50 files per batch upload session</li>
              <li>• Processing time varies based on content complexity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadZone;