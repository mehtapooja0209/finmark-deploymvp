import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import ContentViewer from './components/ContentViewer';
import ViolationAnalysis from './components/ViolationAnalysis';
import RemediationPanel from './components/RemediationPanel';
import ActionToolbar from './components/ActionToolbar';

const ComplianceResultsViolations = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data for compliance results
  const mockContent = {
    id: "content_001",
    type: "text",
    title: "Personal Loan Marketing Campaign - Diwali Special",
    text: `🎉 Diwali Special Offer! 🎉\n\nGet instant personal loans up to ₹5 lakhs with ZERO processing fees!\n\n✅ 100% Guaranteed Approval - No questions asked!\n✅ Lowest interest rates starting from 8.99% per annum\n✅ Get money in your account within 2 hours\n✅ No income proof required for loans up to ₹2 lakhs\n✅ Bad credit? No problem! We approve everyone!\n\nLimited time offer - Apply now and get additional cashback of ₹5000!\n\nCall now: 1800-XXX-XXXX or visit our website\n\n*Terms and conditions apply. Subject to credit approval.`,
    uploadDate: "23/08/2025",
    uploadedBy: "Priya Sharma",
    imageUrl: "https://images.unsplash.com/photo-1607863680198-23d4b2565df0?w=800&h=600&fit=crop",
    extractedText: null
  };

  const mockViolations = [
    {
      id: "v001",
      title: "Misleading Guarantee Claims",
      description: "Content contains absolute guarantee statements that violate RBI guidelines on responsible lending practices.",
      severity: "critical",
      status: "pending",
      guidelineRef: "RBI/2022-23/31",
      section: "Section 4.2.1",
      location: { start: 85, end: 125 },
      guidelineText: "NBFCs and digital lending platforms shall not make any misleading representations about guaranteed approvals or assured loan sanctions. All marketing communications must clearly state that loan approval is subject to the lender\'s credit assessment and eligibility criteria.",
      explanation: "The phrase '100% Guaranteed Approval - No questions asked!' creates a false impression that all loan applications will be approved regardless of creditworthiness, which violates RBI's responsible lending guidelines.",
      potentialImpact: "Regulatory action including monetary penalties up to ₹1 crore, operational restrictions, and potential license suspension.",
      effectiveDate: "April 1, 2023",
      applicableTo: "All NBFCs and Digital Lending Platforms",
      penalty: "Monetary penalty up to ₹1 crore and/or operational restrictions",
      suggestions: [
        {
          title: "Remove Absolute Guarantee Language",
          description: "Replace guarantee statements with conditional approval language that reflects actual lending practices.",
          originalText: "100% Guaranteed Approval - No questions asked!",
          suggestedText: "Quick approval process subject to eligibility criteria and credit assessment",
          estimatedTime: "5 minutes"
        },
        {
          title: "Add Eligibility Disclaimer",
          description: "Include clear disclaimer about approval being subject to credit assessment and eligibility criteria.",
          originalText: "Get instant personal loans up to ₹5 lakhs",
          suggestedText: "Get personal loans up to ₹5 lakhs (subject to eligibility and credit approval)",
          estimatedTime: "3 minutes"
        }
      ],
      examples: [
        {
          title: "Compliant Approval Language",
          description: "Example of responsible lending language that meets RBI guidelines",
          content: "Apply for personal loans up to ₹5 lakhs. Quick approval process with competitive interest rates. Approval subject to eligibility criteria, credit assessment, and documentation requirements.",
          keyPoints: [
            "Uses conditional language ('subject to')",
            "Mentions credit assessment requirement",
            "Avoids absolute guarantees",
            "Includes documentation requirements"
          ]
        }
      ]
    },
    {
      id: "v002",
      title: "Inadequate Interest Rate Disclosure",
      description: "Interest rate information lacks required disclaimers and complete pricing details as mandated by RBI guidelines.",
      severity: "warning",
      status: "pending",
      guidelineRef: "RBI/2022-23/45",
      section: "Section 6.1.3",
      location: { start: 145, end: 185 },
      guidelineText: "All interest rate advertisements must include the Annual Percentage Rate (APR), processing fees, and other charges. The lowest advertised rate must be clearly marked as applicable only to the most creditworthy borrowers with specific conditions clearly stated.",
      explanation: "The advertisement mentions 'starting from 8.99%' but fails to disclose APR, processing fees, and conditions for the lowest rate eligibility.",
      potentialImpact: "Warning notice from RBI, requirement to modify all marketing materials, and potential fine for misleading advertising.",
      suggestions: [
        {
          title: "Add Complete Rate Disclosure",
          description: "Include APR, processing fees, and eligibility conditions for the lowest advertised rate.",
          originalText: "Lowest interest rates starting from 8.99% per annum",
          suggestedText: "Interest rates starting from 8.99% per annum (APR: 12.5% - 24%) for eligible customers. Processing fees: 2% of loan amount. Rate depends on credit profile and loan amount.",
          estimatedTime: "10 minutes"
        }
      ],
      examples: [
        {
          title: "Complete Rate Disclosure",
          description: "Proper way to disclose interest rates with all required information",
          content: "Personal loans with competitive interest rates starting from 10.99% per annum (APR: 13.5% - 26.5%) for eligible customers. Processing fees: 2% of loan amount (minimum ₹1,000). Final rate depends on credit score, income, and loan amount. Representative example: ₹1,00,000 loan for 3 years at 15.99% APR results in 36 monthly payments of ₹3,567.",
          keyPoints: [
            "Includes APR range",
            "Mentions processing fees clearly",
            "Provides representative example",
            "States rate dependency factors"
          ]
        }
      ]
    },
    {
      id: "v003",
      title: "Unrealistic Processing Time Claims",
      description: "Claims about 2-hour fund disbursement may not be achievable for all customers and lacks proper disclaimers.",
      severity: "warning",
      status: "acknowledged",
      guidelineRef: "RBI/2022-23/31",
      section: "Section 4.3.2",
      location: { start: 205, end: 245 },
      guidelineText: "Marketing communications regarding processing times must be realistic and achievable for the majority of customers. Any time-based claims must include appropriate disclaimers about factors that may affect processing time.",
      explanation: "The claim 'Get money in your account within 2 hours' may not be achievable for all customers due to banking hours, verification requirements, and technical factors.",
      potentialImpact: "Customer complaints, regulatory scrutiny, and potential action for misleading advertising practices.",
      suggestions: [
        {
          title: "Add Realistic Timeframe Disclaimer",
          description: "Modify processing time claims to include realistic disclaimers and conditions.",
          originalText: "Get money in your account within 2 hours",
          suggestedText: "Quick disbursement - funds typically credited within 24-48 hours of approval (subject to banking hours and verification requirements)",
          estimatedTime: "5 minutes"
        }
      ],
      examples: [
        {
          title: "Realistic Processing Time Claims",
          description: "How to communicate processing times responsibly",
          content: "Fast loan processing with funds typically credited within 24-48 hours of final approval. Actual disbursement time may vary based on bank processing times, verification requirements, and documentation completeness. Funds are not disbursed on bank holidays or outside banking hours.",
          keyPoints: [
            "Uses \'typically\' instead of absolute claims",
            "Mentions factors affecting timing",
            "Includes banking hours disclaimer",
            "Sets realistic expectations"
          ]
        }
      ]
    },
    {
      id: "v004",
      title: "Income Proof Waiver Misrepresentation",
      description: "Claims about no income proof requirement may violate KYC and responsible lending norms.",
      severity: "critical",
      status: "pending",
      guidelineRef: "RBI/2022-23/67",
      section: "Section 3.1.1",
      location: { start: 265, end: 305 },
      guidelineText: "All lending institutions must conduct proper due diligence including income verification for loan amounts above ₹50,000. Income proof waiver is permitted only for specific categories of borrowers and loan amounts as defined in the guidelines.",
      explanation: "Claiming 'No income proof required for loans up to ₹2 lakhs' violates RBI's KYC and due diligence requirements for loans above ₹50,000.",
      potentialImpact: "Serious regulatory action including operational restrictions, penalty, and potential impact on lending license.",
      suggestions: [
        {
          title: "Correct Income Verification Requirements",
          description: "Update content to reflect actual income verification requirements as per RBI guidelines.",
          originalText: "No income proof required for loans up to ₹2 lakhs",
          suggestedText: "Simplified documentation process with minimal income verification for eligible customers",
          estimatedTime: "5 minutes"
        }
      ],
      examples: [
        {
          title: "Compliant Documentation Language",
          description: "How to communicate documentation requirements properly",
          content: "Streamlined application process with minimal documentation for eligible customers. Income verification required as per regulatory guidelines. Document requirements may vary based on loan amount and customer profile.",
          keyPoints: [
            "Mentions regulatory compliance",
            "Avoids false claims about documentation waiver",
            "Uses 'minimal' instead of 'no' documentation",
            "Acknowledges variation based on loan amount"
          ]
        }
      ]
    },
    {
      id: "v005",
      title: "Credit Score Misrepresentation",
      description: "Claims about approving customers with bad credit may violate responsible lending practices.",
      severity: "minor",
      status: "under_review",
      guidelineRef: "RBI/2022-23/31",
      section: "Section 4.1.4",
      location: { start: 325, end: 365 },
      guidelineText: "Lenders must conduct appropriate credit assessment for all borrowers. Marketing communications should not suggest that credit history is irrelevant to the lending decision.",
      explanation: "The statement 'Bad credit? No problem! We approve everyone!' suggests that credit history is not considered, which contradicts responsible lending practices.",
      potentialImpact: "Regulatory warning and requirement to modify marketing practices to align with responsible lending guidelines.",
      suggestions: [
        {
          title: "Responsible Credit Assessment Language",
          description: "Replace misleading credit claims with responsible lending language.",
          originalText: "Bad credit? No problem! We approve everyone!",
          suggestedText: "We consider applications from customers with varied credit profiles. Each application is assessed individually.",
          estimatedTime: "3 minutes"
        }
      ],
      examples: [
        {
          title: "Inclusive Yet Responsible Credit Language",
          description: "How to be inclusive while maintaining responsible lending standards",
          content: "We welcome applications from customers with diverse credit backgrounds. Our assessment process considers multiple factors beyond credit score to make fair lending decisions. Each application is evaluated individually based on current financial capacity and repayment ability.",
          keyPoints: [
            "Inclusive without being misleading",
            "Mentions individual assessment",
            "Focuses on current financial capacity",
            "Maintains responsible lending stance"
          ]
        }
      ]
    }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleViolationSelect = (violationId) => {
    setSelectedViolation(violationId);
  };

  const handleStatusUpdate = (violationId, newStatus) => {
    console.log(`Updating violation ${violationId} status to ${newStatus}`);
    // In a real app, this would update the violation status
  };

  const handleApplySuggestion = (violationId, suggestionId, applied) => {
    console.log(`${applied ? 'Applied' : 'Removed'} suggestion ${suggestionId} for violation ${violationId}`);
    // In a real app, this would track applied suggestions
  };

  const handleExportReport = async (contentId, format) => {
    console.log(`Exporting report for content ${contentId} in ${format} format`);
    // Simulate export delay
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const handleShareResults = (contentId, method) => {
    console.log(`Sharing results for content ${contentId} via ${method}`);
    // In a real app, this would handle sharing functionality
  };

  const handleResubmitContent = (contentId) => {
    console.log(`Resubmitting content ${contentId}`);
    // In a real app, this would trigger resubmission workflow
    navigate('/content-upload-scanning');
  };

  const handleBulkAction = (action, violations) => {
    console.log(`Performing bulk action: ${action} on ${violations?.length} violations`);
    // In a real app, this would handle bulk operations
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground font-body">Loading compliance results...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Breadcrumb Navigation - Premium Styling */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6 font-body">
            <button 
              onClick={() => navigate('/dashboard')}
              className="hover:text-primary transition-colors duration-200 font-medium"
            >
              Dashboard
            </button>
            <Icon name="ChevronRight" size={14} className="text-border" />
            <button 
              onClick={() => navigate('/content-upload-scanning')}
              className="hover:text-primary transition-colors duration-200 font-medium"
            >
              Content Upload & Scanning
            </button>
            <Icon name="ChevronRight" size={14} className="text-border" />
            <span className="text-primary font-semibold">Compliance Results & Violations</span>
          </div>

          {/* Page Header - Professional Financial App Style */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="bg-gradient-to-r from-card to-muted p-6 rounded-xl border border-primary/20 shadow-premium">
                <h1 className="text-3xl font-heading font-bold text-gradient-gold mb-2">
                  Compliance Results & Violations
                </h1>
                <p className="text-muted-foreground font-body text-lg">
                  Detailed analysis of content compliance with RBI guidelines and remediation guidance
                </p>
                <div className="flex items-center space-x-4 mt-4 text-sm">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-primary font-medium">Live Analysis</span>
                  </div>
                  <div className="text-muted-foreground">
                    <span className="font-semibold text-foreground">5</span> violations detected
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  iconName="ArrowLeft"
                  onClick={() => navigate('/content-upload-scanning')}
                  className="border-primary/30 hover:border-primary hover:bg-primary/10 transition-all duration-200"
                >
                  Back to Scanning
                </Button>
                <Button 
                  variant="outline" 
                  iconName="RefreshCw"
                  onClick={() => window.location?.reload()}
                  className="border-primary/30 hover:border-primary hover:bg-primary/10 transition-all duration-200"
                >
                  Refresh Results
                </Button>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="mb-6">
            <ActionToolbar
              contentId={mockContent?.id}
              violations={mockViolations}
              onExportReport={handleExportReport}
              onShareResults={handleShareResults}
              onResubmitContent={handleResubmitContent}
              onBulkAction={handleBulkAction}
            />
          </div>

          {/* Main Content Grid - Premium Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-350px)]">
            {/* Left Panel - Content Viewer */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-primary/20 rounded-xl shadow-premium h-full">
                <ContentViewer
                  content={mockContent}
                  violations={mockViolations}
                  onViolationSelect={handleViolationSelect}
                  selectedViolation={selectedViolation}
                />
              </div>
            </div>

            {/* Center Panel - Violation Analysis */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-primary/20 rounded-xl shadow-premium h-full">
                <ViolationAnalysis
                  violations={mockViolations}
                  selectedViolation={selectedViolation}
                  onViolationSelect={handleViolationSelect}
                  onStatusUpdate={handleStatusUpdate}
                />
              </div>
            </div>

            {/* Right Panel - Remediation */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-primary/20 rounded-xl shadow-premium h-full">
                <RemediationPanel
                  selectedViolation={selectedViolation}
                  violations={mockViolations}
                  onApplySuggestion={handleApplySuggestion}
                  onResubmitContent={handleResubmitContent}
                />
              </div>
            </div>
          </div>

          {/* Mobile Stacked Layout - Premium Styling */}
          <div className="lg:hidden space-y-6 mt-6">
            <div className="bg-card border border-primary/20 rounded-xl shadow-premium">
              <ContentViewer
                content={mockContent}
                violations={mockViolations}
                onViolationSelect={handleViolationSelect}
                selectedViolation={selectedViolation}
              />
            </div>
            <div className="bg-card border border-primary/20 rounded-xl shadow-premium">
              <ViolationAnalysis
                violations={mockViolations}
                selectedViolation={selectedViolation}
                onViolationSelect={handleViolationSelect}
                onStatusUpdate={handleStatusUpdate}
              />
            </div>
            <div className="bg-card border border-primary/20 rounded-xl shadow-premium">
              <RemediationPanel
                selectedViolation={selectedViolation}
                violations={mockViolations}
                onApplySuggestion={handleApplySuggestion}
                onResubmitContent={handleResubmitContent}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceResultsViolations;