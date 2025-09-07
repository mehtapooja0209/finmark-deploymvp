import React, { useState, useEffect, useMemo } from 'react';
import apiService from '../../services/apiService';
import Header from '../../components/ui/Header';
import UploadZone from './components/UploadZone';
import FileQueue from './components/FileQueue';
import ScanConfiguration from './components/ScanConfiguration';
import ScanResults from './components/ScanResults';
import ScanProgress from './components/ScanProgress';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import useFileUploadProgress from '../../hooks/useFileUploadProgress';

const ContentUploadScanning = () => {
  const [scanConfig, setScanConfig] = useState({
    guidelines: ['RBI_LENDING', 'RBI_DIGITAL', 'FAIR_PRACTICES'],
    sensitivity: 'high',
    includeWarnings: true
  });

  const {
    uploads,
    stats,
    globalProgress,
    addUpload,
    startUpload,
    batchUpload,
    cancelUpload,
    removeUpload,
    clearCompleted
  } = useFileUploadProgress();

  // Mock scan results data
  const mockScanResults = {
    'marketing-banner.jpg': {
      complianceScore: 65,
      violations: 3,
      warnings: 2,
      suggestions: 5,
      scanTime: '2 minutes ago',
      status: 'completed',
      detailedViolations: [
        {
          type: 'Misleading Interest Rate Display',
          severity: 'high',
          description: 'Interest rate displayed without proper APR disclosure and terms clarification as required by RBI guidelines.',
          guideline: 'RBI Master Direction - Lending Guidelines Section 4.2.1',
          suggestion: 'Add "APR may vary based on credit profile" disclaimer and include processing fees in rate calculation.'
        },
        {
          type: 'Missing Risk Warning',
          severity: 'medium',
          description: 'Investment product promotion lacks mandatory risk disclosure statement.',
          guideline: 'RBI Guidelines on Investment Advisory Services',
          suggestion: 'Include "Investments are subject to market risks" warning prominently.'
        },
        {
          type: 'Incomplete Terms Reference',
          severity: 'low',
          description: 'Terms and conditions reference is not clearly visible or accessible.',
          guideline: 'Fair Practices Code for Lenders',
          suggestion: 'Make T&C link more prominent and ensure it opens the complete document.'
        }
      ]
    },
    'loan-brochure.pdf': {
      complianceScore: 85,
      violations: 1,
      warnings: 1,
      suggestions: 3,
      scanTime: '5 minutes ago',
      status: 'completed',
      detailedViolations: [
        {
          type: 'Processing Fee Disclosure',
          severity: 'medium',
          description: 'Processing fees mentioned but not clearly highlighted in the main offer section.',
          guideline: 'RBI Fair Practices Code Section 3.1',
          suggestion: 'Move processing fee information to the main offer box with the interest rate.'
        }
      ]
    }
  };

  const handleFilesUpload = async (files) => {
    // Use batchUpload which handles adding files to queue internally
    try {
      await batchUpload(files, { 
        maxConcurrent: 2,
        ...scanConfig 
      })
    } catch (error) {
      console.error('Batch upload failed:', error)
    }
  };

  const handleRemoveFile = (fileId) => {
    removeUpload(fileId)
  };

  const handleStartScan = async (fileIds) => {
    // Start upload/analysis for queued files
    try {
      const queuedUploads = uploads.filter(upload => 
        fileIds.includes(upload.fileId) && upload.status === 'queued'
      )
      
      for (const upload of queuedUploads) {
        await startUpload(upload.fileId, scanConfig)
      }
    } catch (error) {
      console.error('Failed to start scan:', error)
    }
  };

  const handleCancelScan = (fileId = null) => {
    if (fileId) {
      // Cancel specific upload
      cancelUpload(fileId)
    } else {
      // Cancel all active uploads
      const activeUploads = uploads.filter(upload => 
        ['uploading', 'processing', 'analyzing'].includes(upload.status)
      )
      activeUploads.forEach(upload => cancelUpload(upload.fileId))
    }
  };

  const handleConfigChange = (config) => {
    setScanConfig(config);
  };

  const handleViewDetails = (fileName) => {
    // Navigate to detailed results page
    window.location.href = `/compliance-results-violations?file=${encodeURIComponent(fileName)}`;
  };

  const handleDownloadReport = async (fileId = null) => {
    try {
      // Show processing message
      console.log(`Generating report ${fileId ? 'for document' : 'for all documents'}...`);
      
      // Check network connectivity
      const isOnline = navigator.onLine;
      if (!isOnline) {
        console.warn('Network connectivity issue detected. Using offline fallback.');
        return generateOfflineReport(fileId);
      }
      
      let response;
      let retryCount = 0;
      const maxRetries = 2;
      
      // Retry logic for API requests
      while (retryCount <= maxRetries) {
        try {
          if (fileId) {
            // Get document ID from upload
            const upload = uploads.find(u => u.fileId === fileId);
            if (!upload) {
              console.error('File not found in uploads');
              return generateOfflineReport(fileId, 'File not found');
            }
            
            const documentId = upload.documentId || upload.fileId;
            
            // Get report for specific document
            response = await apiService.exportAnalysisReport(documentId, 'pdf');
          } else {
            // Get report for all documents
            response = await apiService.exportViolationReport({}, 'pdf');
          }
          
          // Break out of retry loop if successful
          break;
        } catch (err) {
          retryCount++;
          if (retryCount <= maxRetries) {
            console.warn(`API request failed, retrying (${retryCount}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
          } else {
            throw err; // Rethrow after max retries
          }
        }
      }
      
      if (response?.data?.reportData) {
        // Generate PDF from report data
        const pdfData = await apiService.generatePDFReport(response.data.reportData);
        
        // For MVP, we'll show the report data in console
        console.log('Report data:', pdfData);
        
        // In a production app, this would download a PDF file
        alert(`Report ${fileId ? `for document` : 'for all documents'} generated successfully. Check console for details.`);
        return true;
      } else if (response?.data) {
        // Handle partial response
        console.warn('Partial response received:', response.data);
        alert(`Report generated with limited data. Check console for details.`);
        console.log('Partial report data:', response.data);
        return true;
      } else {
        throw new Error('Invalid report data received');
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert(`Failed to generate report: ${error.message || 'Unknown error'}`);
      
      // Fallback to offline report generation
      return generateOfflineReport(fileId, error.message);
    }
  };
  
  // Offline fallback for report generation
  const generateOfflineReport = (fileId, errorReason = 'Network connectivity issue') => {
    try {
      console.log('Generating offline report...');
      
      // Get data from local state
      let reportData;
      
      if (fileId) {
        // Get specific file data
        const upload = uploads.find(u => u.fileId === fileId);
        if (!upload) {
          throw new Error('File not found in local data');
        }
        
        // Generate basic report from available data
        reportData = {
          reportType: 'Offline Compliance Analysis Report',
          generatedAt: new Date().toISOString(),
          documentInfo: {
            name: upload.file?.name || 'Unknown',
            type: upload.file?.type || 'Unknown',
            analyzedAt: upload.endTime || new Date().toISOString()
          },
          complianceResults: upload.result ? {
            score: upload.result.complianceScore || 0,
            status: getComplianceStatus(upload.result.complianceScore || 0),
            violationsCount: upload.result.violationsFound || 0,
            warningsCount: upload.result.warningsFound || 0,
            suggestionsCount: upload.result.suggestionsFound || 0
          } : { status: 'Unknown', score: 0 },
          violations: upload.result?.violations || [],
          offlineGenerated: true,
          limitedFunctionality: true,
          reason: errorReason
        };
      } else {
        // Generate summary report for all completed uploads
        const completedUploads = uploads.filter(u => u.status === 'completed' && u.result);
        
        reportData = {
          reportType: 'Offline Compliance Summary Report',
          generatedAt: new Date().toISOString(),
          summary: {
            totalDocuments: completedUploads.length,
            averageScore: completedUploads.length > 0 ? 
              Math.round(completedUploads.reduce((sum, u) => sum + (u.result.complianceScore || 0), 0) / completedUploads.length) : 0,
            totalViolations: completedUploads.reduce((sum, u) => sum + (u.result.violationsFound || 0), 0),
            totalWarnings: completedUploads.reduce((sum, u) => sum + (u.result.warningsFound || 0), 0)
          },
          documents: completedUploads.map(u => ({
            name: u.file?.name,
            score: u.result.complianceScore || 0,
            violations: u.result.violationsFound || 0
          })),
          offlineGenerated: true,
          limitedFunctionality: true,
          reason: errorReason
        };
      }
      
      console.log('Offline report data:', reportData);
      alert(`Offline report generated with limited functionality. Check console for details.`);
      return true;
    } catch (error) {
      console.error('Failed to generate offline report:', error);
      alert(`Could not generate even offline report: ${error.message}`);
      return false;
    }
  };
  
  // Helper function to determine compliance status
  const getComplianceStatus = (score) => {
    if (score >= 80) return 'Compliant';
    if (score >= 60) return 'Needs Review';
    return 'Non-Compliant';
  };

  // Calculate overall stats from upload results
  const overallStats = useMemo(() => {
    const completedUploads = uploads.filter(upload => upload.status === 'completed' && upload.result)
    
    if (completedUploads.length === 0) return null

    const totalViolations = completedUploads.reduce((sum, upload) => sum + (upload.result.violationsFound || 0), 0)
    const totalWarnings = completedUploads.reduce((sum, upload) => sum + (upload.result.warningsFound || 0), 0)
    const avgScore = Math.round(
      completedUploads.reduce((sum, upload) => sum + (upload.result.complianceScore || 0), 0) / completedUploads.length
    )

    return {
      totalFiles: completedUploads.length,
      totalViolations,
      totalWarnings,
      avgScore
    }
  }, [uploads])

  // Get current scanning state
  const scanningState = useMemo(() => {
    const activeUploads = uploads.filter(upload => 
      ['uploading', 'processing', 'analyzing'].includes(upload.status)
    )
    
    if (activeUploads.length === 0) return null

    const currentUpload = activeUploads[0] // Show first active upload
    return {
      isScanning: activeUploads.length > 0,
      currentFile: currentUpload.file.name,
      progress: globalProgress.current,
      estimatedTime: currentUpload.estimatedTimeRemaining,
      activeCount: activeUploads.length
    }
  }, [uploads, globalProgress]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="Upload" size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-3xl text-foreground">
                  Content Upload & Scanning
                </h1>
                <p className="text-muted-foreground font-body">
                  Upload marketing content for automated RBI compliance validation
                </p>
              </div>
            </div>

            {/* Overall Stats */}
            {overallStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Icon name="FileCheck" size={16} className="text-primary" />
                    <span className="text-sm font-body text-muted-foreground">Files Scanned</span>
                  </div>
                  <div className="text-2xl font-heading font-semibold text-foreground mt-1">
                    {overallStats?.totalFiles}
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Icon name="TrendingUp" size={16} className="text-success" />
                    <span className="text-sm font-body text-muted-foreground">Avg Score</span>
                  </div>
                  <div className="text-2xl font-heading font-semibold text-success mt-1">
                    {overallStats?.avgScore}%
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Icon name="AlertTriangle" size={16} className="text-error" />
                    <span className="text-sm font-body text-muted-foreground">Violations</span>
                  </div>
                  <div className="text-2xl font-heading font-semibold text-error mt-1">
                    {overallStats?.totalViolations}
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Icon name="AlertCircle" size={16} className="text-warning" />
                    <span className="text-sm font-body text-muted-foreground">Warnings</span>
                  </div>
                  <div className="text-2xl font-heading font-semibold text-warning mt-1">
                    {overallStats?.totalWarnings}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Upload and Queue */}
            <div className="lg:col-span-2 space-y-8">
              <UploadZone 
                onFilesUpload={handleFilesUpload}
                isScanning={scanningState?.isScanning || false}
              />
              
              <FileQueue
                files={uploads}
                onRemoveFile={handleRemoveFile}
                onStartScan={handleStartScan}
                onCancelScan={handleCancelScan}
                stats={stats}
              />
            </div>

            {/* Right Column - Configuration and Results */}
            <div className="space-y-8">
              <ScanConfiguration
                onConfigChange={handleConfigChange}
                isScanning={scanningState?.isScanning || false}
                stats={stats}
              />
              
              <ScanResults
                uploads={uploads}
                onViewDetails={handleViewDetails}
                onDownloadReport={handleDownloadReport}
                onClearCompleted={clearCompleted}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-12 bg-card border border-border rounded-lg p-6">
            <h2 className="font-heading font-semibold text-xl text-foreground mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => window.location.href = '/regulatory-guidelines-database'}
                iconName="BookOpen"
                iconPosition="left"
              >
                <div className="text-left">
                  <div className="font-body font-medium">Browse Guidelines</div>
                  <div className="text-sm text-muted-foreground">View RBI compliance rules</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => window.location.href = '/compliance-results-violations'}
                iconName="AlertTriangle"
                iconPosition="left"
              >
                <div className="text-left">
                  <div className="font-body font-medium">View All Results</div>
                  <div className="text-sm text-muted-foreground">See detailed violations</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => window.location.href = '/compliance-reports'}
                iconName="FileText"
                iconPosition="left"
              >
                <div className="text-left">
                  <div className="font-body font-medium">Generate Reports</div>
                  <div className="text-sm text-muted-foreground">Create compliance reports</div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </main>
      {/* Scan Progress Modal */}
      {scanningState && (
        <ScanProgress
          isScanning={scanningState.isScanning}
          currentFile={scanningState.currentFile}
          progress={scanningState.progress}
          onCancel={() => handleCancelScan()}
          estimatedTime={scanningState.estimatedTime}
          activeCount={scanningState.activeCount}
        />
      )}
    </div>
  );
};

export default ContentUploadScanning;