import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const FileQueue = ({ files, onRemoveFile, onStartScan, scanResults, isScanning }) => {
  const [selectedFiles, setSelectedFiles] = useState(new Set());

  const getFileIcon = (fileName) => {
    const extension = fileName?.split('.')?.pop()?.toLowerCase();
    switch (extension) {
      case 'jpg': case'jpeg': case'png': case'gif': case'webp':
        return 'Image';
      case 'pdf':
        return 'FileText';
      case 'doc': case'docx':
        return 'FileText';
      case 'txt':
        return 'FileText';
      case 'ppt': case'pptx':
        return 'Presentation';
      default:
        return 'File';
    }
  };

  const getFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i))?.toFixed(2)) + ' ' + sizes?.[i];
  };

  const getScanStatus = (fileName) => {
    const result = scanResults?.[fileName];
    if (!result) return 'pending';
    return result?.status;
  };

  const getScanStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-success';
      case 'scanning':
        return 'text-warning';
      case 'failed':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  const getScanStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'CheckCircle';
      case 'scanning':
        return 'Loader';
      case 'failed':
        return 'XCircle';
      default:
        return 'Clock';
    }
  };

  const handleSelectFile = (fileName) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected?.has(fileName)) {
      newSelected?.delete(fileName);
    } else {
      newSelected?.add(fileName);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFiles?.size === files?.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(upload => upload.file?.name || upload.fileId)));
    }
  };

  const handleBulkAction = (action) => {
    const selectedFilesList = files?.filter(upload => selectedFiles?.has(upload.file?.name || upload.fileId));
    if (action === 'scan') {
      onStartScan(selectedFilesList.map(upload => upload.fileId));
    } else if (action === 'remove') {
      selectedFilesList?.forEach(upload => onRemoveFile(upload.fileId));
      setSelectedFiles(new Set());
    }
  };

  if (files?.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="FileX" size={32} className="text-muted-foreground" />
        </div>
        <h3 className="font-heading font-medium text-lg text-foreground mb-2">
          No files uploaded
        </h3>
        <p className="text-muted-foreground font-body">
          Upload marketing content to begin compliance scanning
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading font-semibold text-xl text-foreground">
              Upload Queue
            </h2>
            <p className="text-muted-foreground font-body text-sm">
              {files?.length} file{files?.length !== 1 ? 's' : ''} ready for processing
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              iconName={selectedFiles?.size === files?.length ? 'Square' : 'CheckSquare'}
              iconPosition="left"
            >
              {selectedFiles?.size === files?.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedFiles?.size > 0 && (
          <div className="flex items-center space-x-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <span className="text-sm font-body text-foreground">
              {selectedFiles?.size} file{selectedFiles?.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('scan')}
                disabled={isScanning}
                iconName="Play"
                iconPosition="left"
              >
                Scan Selected
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkAction('remove')}
                iconName="Trash2"
                iconPosition="left"
              >
                Remove Selected
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* File List */}
      <div className="divide-y divide-border max-h-96 overflow-y-auto">
        {files?.map((upload, index) => {
          const file = upload.file;
          const fileName = file?.name || upload.fileId;
          const scanStatus = getScanStatus(fileName);
          const isSelected = selectedFiles?.has(fileName);
          
          return (
            <div
              key={index}
              className={`p-4 hover:bg-muted/30 transition-colors duration-200 ${
                isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : ''
              }`}
            >
              <div className="flex items-center space-x-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleSelectFile(fileName)}
                  className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-2"
                />

                {/* File Icon/Thumbnail */}
                <div className="flex-shrink-0">
                  {file?.type?.startsWith('image/') ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={fileName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <Icon name={getFileIcon(fileName)} size={20} className="text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-body font-medium text-foreground truncate">
                    {fileName}
                  </h4>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-muted-foreground font-body">
                      {getFileSize(file?.size)}
                    </span>
                    <span className="text-sm text-muted-foreground font-body">
                      {file?.type}
                    </span>
                  </div>
                </div>

                {/* Scan Status */}
                <div className="flex items-center space-x-2">
                  <Icon
                    name={getScanStatusIcon(scanStatus)}
                    size={16}
                    className={`${getScanStatusColor(scanStatus)} ${
                      scanStatus === 'scanning' ? 'animate-spin' : ''
                    }`}
                  />
                  <span className={`text-sm font-body capitalize ${getScanStatusColor(scanStatus)}`}>
                    {scanStatus === 'pending' ? 'Ready' : scanStatus}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {scanStatus === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStartScan([upload.fileId])}
                      disabled={isScanning}
                      iconName="Play"
                    />
                  )}
                  {scanStatus === 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="Eye"
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFile(upload.fileId)}
                    iconName="X"
                    className="text-muted-foreground hover:text-error"
                  />
                </div>
              </div>
              {/* Progress Bar for Scanning */}
              {scanStatus === 'scanning' && (
                <div className="mt-3 ml-16">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${scanResults?.[fileName]?.progress || 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    Scanning for compliance violations...
                  </p>
                </div>
              )}
              {/* Quick Results Preview */}
              {scanStatus === 'completed' && scanResults?.[fileName] && (
                <div className="mt-3 ml-16">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${
                        scanResults?.[fileName]?.complianceScore >= 80 ? 'bg-success' :
                        scanResults?.[fileName]?.complianceScore >= 60 ? 'bg-warning' : 'bg-error'
                      }`} />
                      <span className="font-body text-foreground">
                        Score: {scanResults?.[fileName]?.complianceScore}%
                      </span>
                    </div>
                    <span className="text-muted-foreground font-body">
                      {scanResults?.[fileName]?.violations} violation{scanResults?.[fileName]?.violations !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileQueue;