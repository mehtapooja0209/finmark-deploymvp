import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import FilterSidebar from './components/FilterSidebar';
import UpdatesFeed from './components/UpdatesFeed';
import NotificationPanel from './components/NotificationPanel';

const RegulatoryUpdatesNotifications = () => {
  const [updates, setUpdates] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [filters, setFilters] = useState({
    regulatoryBodies: [],
    priorities: [],
    businessAreas: [],
    dateRange: 'month',
    customStartDate: '',
    customEndDate: '',
    readStatus: 'all'
  });
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [savedPresets, setSavedPresets] = useState([]);

  // Mock user profile
  const userProfile = {
    name: "Priya Sharma",
    role: "Senior Compliance Officer",
    company: "FinTech Solutions Pvt Ltd",
    businessAreas: ["Digital Lending", "Payment Services", "KYC/AML"],
    email: "priya.sharma@fintech.com"
  };

  // Mock regulatory updates data
  const mockUpdates = [
    {
      id: 1,
      title: "RBI Issues New Guidelines for Digital Lending Platforms - Enhanced Due Diligence Requirements",
      summary: "Reserve Bank of India introduces stricter compliance requirements for digital lending platforms including enhanced customer verification and risk assessment protocols.",
      fullDescription: `The Reserve Bank of India has issued comprehensive guidelines for digital lending platforms operating in India. These guidelines mandate enhanced due diligence processes, stricter customer verification protocols, and improved risk assessment mechanisms.\n\nKey requirements include implementation of robust KYC processes, regular auditing of lending practices, and establishment of grievance redressal mechanisms. All digital lending platforms must comply with these guidelines within 90 days of publication.\n\nThe guidelines also emphasize the importance of data protection and privacy, requiring platforms to implement adequate cybersecurity measures and obtain explicit customer consent for data processing activities.`,
      regulatoryBody: {
        name: "Reserve Bank of India",
        icon: "Building2",
        logo: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=100&h=100&fit=crop"
      },
      priority: "critical",
      publishedDate: "2025-01-20T10:30:00Z",
      effectiveDate: "2025-04-20T00:00:00Z",
      complianceDeadline: "2025-04-20T23:59:59Z",
      impactAreas: ["Digital Lending", "KYC/AML", "Data Protection", "Risk Management"],
      implementationRequirements: [
        "Update customer onboarding processes to include enhanced KYC verification",
        "Implement automated risk assessment algorithms with RBI-approved parameters",
        "Establish dedicated compliance monitoring dashboard",
        "Create customer grievance portal with 48-hour response SLA",
        "Conduct quarterly compliance audits by certified external auditors"
      ],
      recommendedActions: [
        "Schedule immediate compliance team meeting to assess current gaps",
        "Engage with technology vendors for KYC enhancement solutions",
        "Review and update existing customer agreements and privacy policies",
        "Initiate staff training programs on new compliance requirements"
      ],
      relatedGuidelines: [
        "RBI Master Direction on KYC - 2016",
        "Digital Lending Guidelines - 2022",
        "Data Protection Framework for NBFCs"
      ],
      isRead: false,
      contentImpact: {
        affectedContent: 45,
        requiresReview: 23,
        autoCompliant: 22
      }
    },
    {
      id: 2,
      title: "SEBI Updates Disclosure Requirements for Fintech Investment Platforms",
      summary: "Securities and Exchange Board of India mandates enhanced disclosure requirements for investment platforms, focusing on risk communication and fee transparency.",
      fullDescription: `SEBI has updated disclosure requirements for fintech investment platforms to ensure better investor protection and transparency. The new requirements focus on clear risk communication, comprehensive fee disclosure, and standardized reporting formats.\n\nPlatforms must now provide detailed risk profiles for all investment products, including scenario-based return projections and historical performance data. Fee structures must be disclosed upfront with no hidden charges, and investors must acknowledge understanding of risks before proceeding with investments.\n\nThe guidelines also introduce mandatory cooling-off periods for high-risk investments and require platforms to implement suitability assessments for all users.`,
      regulatoryBody: {
        name: "SEBI",
        icon: "TrendingUp",
        logo: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop"
      },
      priority: "high",
      publishedDate: "2025-01-18T14:15:00Z",
      effectiveDate: "2025-03-15T00:00:00Z",
      complianceDeadline: "2025-03-15T23:59:59Z",
      impactAreas: ["Wealth Management", "Investment Services", "Consumer Protection"],
      implementationRequirements: [
        "Redesign investment product disclosure documents",
        "Implement risk profiling questionnaires for all users",
        "Update fee calculation and display mechanisms",
        "Create standardized risk warning templates",
        "Establish investor education content library"
      ],
      recommendedActions: [
        "Review current disclosure practices against new requirements",
        "Update user interface to accommodate enhanced disclosures",
        "Develop investor education materials and risk communication tools",
        "Train customer support team on new disclosure requirements"
      ],
      relatedGuidelines: [
        "SEBI Investment Adviser Regulations - 2013",
        "Mutual Fund Disclosure Guidelines",
        "Portfolio Management Services Regulations"
      ],
      isRead: true,
      contentImpact: {
        affectedContent: 32,
        requiresReview: 18,
        autoCompliant: 14
      }
    },
    {
      id: 3,
      title: "Updated AML Guidelines for Payment Service Providers - Transaction Monitoring Enhancement",
      summary: "Financial Intelligence Unit releases enhanced anti-money laundering guidelines with stricter transaction monitoring and suspicious activity reporting requirements.",
      fullDescription: `The Financial Intelligence Unit (FIU-IND) has released updated Anti-Money Laundering guidelines specifically targeting payment service providers. These guidelines introduce enhanced transaction monitoring requirements, stricter suspicious activity reporting protocols, and improved customer due diligence measures.\n\nKey changes include real-time transaction monitoring for amounts above ₹50,000, mandatory reporting of cash transactions exceeding ₹10 lakhs, and enhanced due diligence for high-risk customers. Payment service providers must also implement advanced analytics for pattern recognition and anomaly detection.\n\nThe guidelines emphasize the importance of staff training and regular system updates to combat evolving money laundering techniques.`,
      regulatoryBody: {
        name: "Financial Intelligence Unit",
        icon: "Eye",
        logo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop"
      },
      priority: "high",
      publishedDate: "2025-01-15T09:45:00Z",
      effectiveDate: "2025-02-28T00:00:00Z",
      complianceDeadline: "2025-02-28T23:59:59Z",
      impactAreas: ["Payment Services", "KYC/AML", "Transaction Monitoring"],
      implementationRequirements: [
        "Upgrade transaction monitoring systems with real-time capabilities",
        "Implement advanced analytics for suspicious pattern detection",
        "Update customer risk scoring algorithms",
        "Enhance suspicious transaction reporting workflows",
        "Establish dedicated AML compliance team with certified professionals"
      ],
      recommendedActions: [
        "Conduct gap analysis of current AML systems against new requirements",
        "Engage with technology vendors for system upgrades",
        "Develop comprehensive staff training program on new AML procedures",
        "Review and update internal AML policies and procedures"
      ],
      relatedGuidelines: [
        "Prevention of Money Laundering Act - 2002",
        "FIU-IND Guidelines for Reporting Entities",
        "RBI Master Direction on KYC"
      ],
      isRead: false,
      contentImpact: {
        affectedContent: 28,
        requiresReview: 15,
        autoCompliant: 13
      }
    },
    {
      id: 4,
      title: "Data Protection Framework Updates for Financial Services - GDPR Alignment",
      summary: "Ministry of Electronics and IT releases updated data protection guidelines for financial services, aligning with global privacy standards and introducing consent management requirements.",
      fullDescription: `The Ministry of Electronics and Information Technology has released comprehensive updates to the data protection framework for financial services. These updates align Indian regulations with global privacy standards including GDPR-like provisions for data subject rights, consent management, and cross-border data transfers.\n\nKey provisions include mandatory data protection impact assessments for high-risk processing activities, appointment of data protection officers for organizations processing large volumes of personal data, and implementation of privacy-by-design principles in all new systems.\n\nThe framework also introduces strict breach notification requirements, with organizations required to report significant data breaches to authorities within 72 hours and affected individuals within 30 days.`,
      regulatoryBody: {
        name: "Ministry of Corporate Affairs",
        icon: "FileText",
        logo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
      },
      priority: "medium",
      publishedDate: "2025-01-12T16:20:00Z",
      effectiveDate: "2025-06-01T00:00:00Z",
      complianceDeadline: "2025-06-01T23:59:59Z",
      impactAreas: ["Data Protection", "Privacy", "Cybersecurity", "Consumer Protection"],
      implementationRequirements: [
        "Conduct comprehensive data mapping and classification exercise",
        "Implement consent management platform with granular controls",
        "Establish data protection impact assessment procedures",
        "Appoint qualified data protection officer",
        "Create data breach response and notification procedures"
      ],
      recommendedActions: [
        "Audit current data processing activities and legal bases",
        "Update privacy policies and consent mechanisms",
        "Implement technical and organizational security measures",
        "Train staff on data protection principles and breach response"
      ],
      relatedGuidelines: [
        "Information Technology Act - 2000",
        "Personal Data Protection Bill - 2023",
        "RBI Guidelines on Data Security"
      ],
      isRead: true,
      contentImpact: {
        affectedContent: 67,
        requiresReview: 34,
        autoCompliant: 33
      }
    },
    {
      id: 5,
      title: "Cybersecurity Framework for Digital Banking - Incident Response Requirements",
      summary: "RBI introduces mandatory cybersecurity framework for digital banking services with enhanced incident response and recovery requirements.",
      fullDescription: `The Reserve Bank of India has introduced a comprehensive cybersecurity framework specifically designed for digital banking services. This framework mandates enhanced incident response capabilities, regular security assessments, and improved customer data protection measures.\n\nKey requirements include establishment of 24/7 security operations centers, implementation of multi-factor authentication for all customer transactions, and regular penetration testing by certified security firms. Banks must also maintain detailed incident logs and report significant security incidents to RBI within 6 hours.\n\nThe framework emphasizes the importance of customer education and awareness, requiring banks to implement comprehensive security awareness programs and provide regular updates on emerging cyber threats.`,
      regulatoryBody: {
        name: "Reserve Bank of India",
        icon: "Building2",
        logo: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=100&h=100&fit=crop"
      },
      priority: "critical",
      publishedDate: "2025-01-10T11:30:00Z",
      effectiveDate: "2025-03-01T00:00:00Z",
      complianceDeadline: "2025-03-01T23:59:59Z",
      impactAreas: ["Cybersecurity", "Digital Banking", "Incident Response", "Customer Protection"],
      implementationRequirements: [
        "Establish 24/7 Security Operations Center (SOC)",
        "Implement advanced threat detection and response systems",
        "Conduct quarterly penetration testing and vulnerability assessments",
        "Create comprehensive incident response and business continuity plans",
        "Develop customer security awareness and education programs"
      ],
      recommendedActions: [
        "Assess current cybersecurity posture against new framework requirements",
        "Engage with cybersecurity vendors for SOC implementation",
        "Develop incident response team and procedures",
        "Create customer communication templates for security incidents"
      ],
      relatedGuidelines: [
        "RBI Cyber Security Framework - 2016",
        "IT Risk Management Guidelines",
        "Business Continuity Planning Guidelines"
      ],
      isRead: false,
      contentImpact: {
        affectedContent: 41,
        requiresReview: 25,
        autoCompliant: 16
      }
    }
  ];

  // Mock notifications data
  const mockNotifications = [
    {
      id: 1,
      type: 'deadline',
      title: 'Digital Lending Compliance Deadline',
      description: 'RBI digital lending guidelines compliance deadline approaching',
      deadline: '2025-04-20T23:59:59Z',
      daysLeft: 87,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: false,
      actionRequired: true,
      actionText: 'Review Requirements'
    },
    {
      id: 2,
      type: 'new_regulation',
      title: 'New SEBI Investment Platform Guidelines',
      description: 'Updated disclosure requirements for investment platforms published',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      isRead: false,
      actionRequired: false
    },
    {
      id: 3,
      type: 'critical',
      title: 'Critical Security Framework Update',
      description: 'Mandatory cybersecurity framework for digital banking services',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      isRead: true,
      actionRequired: true,
      actionText: 'Assess Impact'
    },
    {
      id: 4,
      type: 'amendment',
      title: 'AML Guidelines Amendment',
      description: 'Enhanced transaction monitoring requirements for PSPs',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      isRead: false,
      actionRequired: false
    },
    {
      id: 5,
      type: 'team',
      title: 'Compliance Team Update',
      description: 'Monthly compliance review meeting scheduled for next week',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isRead: true,
      actionRequired: false
    }
  ];

  // Mock saved presets
  const mockPresets = [
    {
      name: "Critical Updates Only",
      filters: {
        regulatoryBodies: [],
        priorities: ['critical'],
        businessAreas: [],
        dateRange: 'month',
        readStatus: 'unread'
      }
    },
    {
      name: "RBI & Digital Lending",
      filters: {
        regulatoryBodies: ['rbi'],
        priorities: [],
        businessAreas: ['Digital Lending'],
        dateRange: 'quarter',
        readStatus: 'all'
      }
    }
  ];

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setUpdates(mockUpdates);
      setNotifications(mockNotifications);
      setSavedPresets(mockPresets);
      setLoading(false);
    }, 1000);
  }, []);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    // In a real app, this would trigger an API call with the new filters
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    // In a real app, this would re-sort the updates
  };

  const handleMarkAsRead = (updateId) => {
    setUpdates(prev => prev?.map(update => 
      update?.id === updateId ? { ...update, isRead: true } : update
    ));
  };

  const handleShare = (update) => {
    // In a real app, this would open a share dialog or copy link to clipboard
    console.log('Sharing update:', update?.title);
  };

  const handleViewDetails = (update) => {
    // In a real app, this would navigate to the regulatory guidelines database
    console.log('Viewing details for:', update);
  };

  const handleLoadMore = () => {
    setLoading(true);
    // Simulate loading more updates
    setTimeout(() => {
      setLoading(false);
      setHasMore(false); // For demo purposes
    }, 1000);
  };

  const handleSavePreset = (name, filters) => {
    const newPreset = { name, filters };
    setSavedPresets(prev => [...prev, newPreset]);
  };

  const handleLoadPreset = (preset) => {
    setFilters(preset?.filters);
  };

  const handleNotificationAction = (notification, action) => {
    switch (action) {
      case 'read':
        setNotifications(prev => prev?.map(n => 
          n?.id === notification?.id ? { ...n, isRead: true } : n
        ));
        break;
      case 'markAllRead':
        setNotifications(prev => prev?.map(n => ({ ...n, isRead: true })));
        break;
      case 'action': console.log('Taking action for notification:', notification);
        break;
      case 'view': console.log('Viewing notification details:', notification);
        break;
      case 'viewAll': console.log('Viewing all notifications');
        break;
      default:
        break;
    }
  };

  const handleUpdateSettings = (settings) => {
    console.log('Updating notification settings:', settings);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex pt-16">
        <FilterSidebar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSavePreset={handleSavePreset}
          savedPresets={savedPresets}
          onLoadPreset={handleLoadPreset}
        />
        
        <UpdatesFeed
          updates={updates}
          loading={loading}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          onMarkAsRead={handleMarkAsRead}
          onShare={handleShare}
          onViewDetails={handleViewDetails}
          sortBy={sortBy}
          onSortChange={handleSortChange}
        />
        
        <NotificationPanel
          notifications={notifications}
          userProfile={userProfile}
          onNotificationAction={handleNotificationAction}
          onUpdateSettings={handleUpdateSettings}
        />
      </div>
    </div>
  );
};

export default RegulatoryUpdatesNotifications;