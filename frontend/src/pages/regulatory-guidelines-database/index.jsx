import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import GuidelinesSidebar from './components/GuidelinesSidebar';
import GuidelinesSearch from './components/GuidelinesSearch';
import GuidelinesList from './components/GuidelinesList';
import GuidelineDetails from './components/GuidelineDetails';
import RecentUpdates from './components/RecentUpdates';
import guidelinesService from '../../services/guidelinesService';

const RegulatoryGuidelinesDatabase = () => {
  const [selectedCategory, setSelectedCategory] = useState('rbi-guidelines');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedGuideline, setSelectedGuideline] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    regulatoryBody: 'all',
    dateRange: 'all',
    productType: 'all',
    customDateFrom: '',
    customDateTo: '',
    includeAmendments: true,
    onlyActive: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showRecentUpdates, setShowRecentUpdates] = useState(false);
  const [guidelines, setGuidelines] = useState([]);

  // Guidelines data will come from the API
  // Keeping this commented out for reference
  /*const mockGuidelines = [
    {
      id: 'RBI-2023-001',
      referenceNumber: 'RBI/2023-24/87',
      title: 'Guidelines on Digital Lending Platforms and Customer Protection',
      summary: 'Comprehensive framework for digital lending platforms covering customer consent, data protection, fair practices, and grievance redressal mechanisms.',
      regulatoryBody: 'Reserve Bank of India',
      category: 'Digital Lending',
      effectiveDate: '31/10/2023',
      lastUpdated: '23/08/2023',
      status: 'active',
      urgency: 'high',
      relevanceScore: 95,
      keyRequirements: [
        'Mandatory customer consent for data processing and sharing',
        'Clear disclosure of all fees and charges upfront',
        'Implementation of robust data protection measures',
        'Establishment of grievance redressal mechanism within 30 days',
        'Regular audit and compliance reporting to RBI'
      ],
      detailedRequirements: [
        {
          title: 'Customer Consent Framework',
          items: [
            'Explicit consent for data collection and processing',
            'Opt-in mechanism for marketing communications',
            'Clear explanation of data usage and sharing'
          ]
        },
        {
          title: 'Fee Disclosure Requirements',
          items: [
            'All-inclusive cost disclosure before loan approval',
            'No hidden charges or surprise fees',
            'Standardized fee disclosure format'
          ]
        }
      ],
      recentUpdates: [
        {
          date: '23/08/2023',
          summary: 'Enhanced data protection requirements and customer consent mechanisms'
        }
      ],
      implementationDeadline: '31st October 2023 - All digital lending platforms must comply',
      tags: ['Digital Lending', 'Customer Protection', 'Data Privacy', 'Consent Management', 'Fee Disclosure']
    },
    {
      id: 'SEBI-2023-045',
      referenceNumber: 'SEBI/HO/IMD/IMD-I/P/CIR/2023/123',
      title: 'Investment Advisory Services - Disclosure and Transparency Norms',
      summary: 'Updated disclosure requirements for investment advisory services including fee structures, risk profiling, and performance reporting standards.',
      regulatoryBody: 'Securities and Exchange Board of India',
      category: 'Investment Advisory',
      effectiveDate: '01/11/2023',
      lastUpdated: '22/08/2023',
      status: 'active',
      urgency: 'medium',
      relevanceScore: 88,
      keyRequirements: [
        'Comprehensive fee structure disclosure to clients',
        'Mandatory risk profiling and suitability assessment',
        'Quarterly performance reporting with benchmarking',
        'Clear documentation of investment advisory agreements',
        'Regular compliance audits and reporting'
      ],
      recentUpdates: [
        {
          date: '22/08/2023',
          summary: 'Revised fee disclosure formats and performance reporting standards'
        }
      ],
      implementationDeadline: '1st November 2023 - All registered investment advisors',
      tags: ['Investment Advisory', 'Fee Disclosure', 'Risk Assessment', 'Performance Reporting', 'Client Documentation']
    },
    {
      id: 'RBI-2023-034',
      referenceNumber: 'RBI/2023-24/65',
      title: 'Know Your Customer (KYC) Guidelines for Fintech Companies',
      summary: 'Enhanced KYC requirements for fintech companies including digital verification methods, risk-based approach, and customer due diligence procedures.',
      regulatoryBody: 'Reserve Bank of India',
      category: 'KYC & AML',
      effectiveDate: '15/09/2023',
      lastUpdated: '20/08/2023',
      status: 'active',
      urgency: 'high',
      relevanceScore: 92,
      keyRequirements: [
        'Implementation of risk-based KYC approach',
        'Digital verification methods with proper audit trails',
        'Enhanced due diligence for high-risk customers',
        'Regular monitoring and updating of customer information',
        'Compliance with AML and CFT requirements'
      ],
      recentUpdates: [
        {
          date: '20/08/2023',
          summary: 'Added provisions for digital KYC verification and risk assessment'
        }
      ],
      implementationDeadline: '15th September 2023 - All regulated fintech entities',
      tags: ['KYC', 'AML', 'Digital Verification', 'Risk Assessment', 'Customer Due Diligence']
    },
    {
      id: 'IRDAI-2023-012',
      referenceNumber: 'IRDAI/REG/5/2023-24',
      title: 'Insurance Web Aggregators - Operational Guidelines',
      summary: 'Comprehensive framework for insurance web aggregator operations covering licensing, technology standards, customer protection, and commission structures.',
      regulatoryBody: 'Insurance Regulatory and Development Authority',
      category: 'Insurance Distribution',
      effectiveDate: '21/02/2024',
      lastUpdated: '21/08/2023',
      status: 'active',
      urgency: 'medium',
      relevanceScore: 85,
      keyRequirements: [
        'Valid registration and licensing from IRDAI',
        'Robust technology and data security infrastructure',
        'Clear customer protection and grievance mechanisms',
        'Transparent commission and fee disclosure',
        'Regular compliance reporting and audits'
      ],
      recentUpdates: [
        {
          date: '21/08/2023',
          summary: 'New guidelines released for insurance web aggregator operations'
        }
      ],
      implementationDeadline: '21st February 2024 - 6 months compliance timeline',
      tags: ['Insurance', 'Web Aggregators', 'Technology Standards', 'Customer Protection', 'Commission Structure']
    },
    {
      id: 'RBI-2023-028',
      referenceNumber: 'RBI/2023-24/58',
      title: 'Payment System Operators - Security and Risk Management',
      summary: 'Updated security requirements for payment system operators including cybersecurity frameworks, incident reporting, and risk management protocols.',
      regulatoryBody: 'Reserve Bank of India',
      category: 'Payment Systems',
      effectiveDate: '01/10/2023',
      lastUpdated: '18/08/2023',
      status: 'active',
      urgency: 'high',
      relevanceScore: 90,
      keyRequirements: [
        'Implementation of comprehensive cybersecurity framework',
        'Real-time transaction monitoring and fraud detection',
        'Incident reporting within 6 hours of detection',
        'Regular security audits and penetration testing',
        'Business continuity and disaster recovery plans'
      ],
      recentUpdates: [
        {
          date: '18/08/2023',
          summary: 'Enhanced cybersecurity requirements and incident reporting timelines'
        }
      ],
      implementationDeadline: '1st October 2023 - All payment system operators',
      tags: ['Payment Systems', 'Cybersecurity', 'Risk Management', 'Incident Reporting', 'Fraud Detection']
    },
    {
      id: 'ASCI-2023-008',
      referenceNumber: 'ASCI/2023/FS-ADV/08',
      title: 'Financial Services Advertising - Digital Marketing Guidelines',
      summary: 'Updated advertising standards for financial services focusing on digital marketing, social media compliance, and prevention of misleading claims.',
      regulatoryBody: 'Advertising Standards Council of India',
      category: 'Advertising Standards',
      effectiveDate: '30/09/2023',
      lastUpdated: '19/08/2023',
      status: 'active',
      urgency: 'low',
      relevanceScore: 78,
      keyRequirements: [
        'Compliance with digital marketing best practices',
        'Clear and prominent disclosure of terms and conditions',
        'Prohibition of misleading or exaggerated claims',
        'Social media advertising compliance requirements',
        'Influencer marketing guidelines adherence'
      ],
      recentUpdates: [
        {
          date: '19/08/2023',
          summary: 'New guidelines for digital marketing and social media advertising'
        }
      ],
      implementationDeadline: '30th September 2023 - Recommended adoption timeline',
      tags: ['Advertising Standards', 'Digital Marketing', 'Social Media', 'Misleading Claims', 'Influencer Marketing']
    }
  ];*/

  // Function to fetch and transform RBI guidelines from the API
  const fetchRBIGuidelines = async () => {
    setIsLoading(true);
    try {
      const data = await guidelinesService.getRBIGuidelines();
      
      // Transform the data structure to match our frontend component's expected format
      const transformedGuidelines = [];
      
      // Process each category of guidelines
      Object.entries(data.rbi_guidelines).forEach(([category, rules]) => {
        rules.forEach((rule, index) => {
          transformedGuidelines.push({
            id: rule.rule_id,
            referenceNumber: rule.rule_id,
            title: rule.title,
            summary: rule.description,
            regulatoryBody: 'Reserve Bank of India',
            category: category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            effectiveDate: rule.effective_date || 'N/A',
            lastUpdated: rule.effective_date || 'N/A',
            status: 'active',
            urgency: rule.severity || 'medium',
            relevanceScore: 90 - (index * 5), // Just for display purposes
            keyRequirements: rule.required_elements || [],
            detailedRequirements: [
              {
                title: 'Requirements',
                items: rule.required_elements || []
              },
              {
                title: 'Violations to Avoid',
                items: rule.violation_keywords || []
              }
            ],
            recentUpdates: rule.effective_date ? [
              {
                date: rule.effective_date,
                summary: 'Guideline updated or introduced'
              }
            ] : [],
            implementationDeadline: rule.effective_date ? `${rule.effective_date} - All regulated entities must comply` : 'N/A',
            tags: [category, rule.severity || 'medium', ...rule.violation_keywords?.slice(0, 3) || []]
          });
        });
      });
      
      let filteredGuidelines = transformedGuidelines;
      
      // Filter by category
      if (selectedCategory !== 'all') {
        const categoryMap = {
          'rbi-guidelines': 'Reserve Bank of India',
          'sebi-regulations': 'Securities and Exchange Board of India',
          'irdai-guidelines': 'Insurance Regulatory and Development Authority',
          'advertising-standards': 'Advertising Standards Council of India'
        };
        
        if (categoryMap?.[selectedCategory]) {
          filteredGuidelines = filteredGuidelines?.filter(
            guideline => guideline?.regulatoryBody === categoryMap?.[selectedCategory]
          );
        }
      }

      // Filter by subcategory
      if (selectedSubcategory) {
        const subcategoryMap = {
          'digital-lending': 'Digital Lending',
          'payment-systems': 'Payment Systems',
          'kyc-aml': 'KYC & AML',
          'commercial-banking': 'Commercial Banking',
          'nbfc': 'NBFC',
          'financial-markets': 'Financial Markets',
          'consumer-protection': 'Consumer Protection',
          'fraud-risk-management': 'Fraud Risk Management'
        };
        
        if (subcategoryMap?.[selectedSubcategory]) {
          filteredGuidelines = filteredGuidelines?.filter(
            guideline => guideline?.category === subcategoryMap?.[selectedSubcategory]
          );
        }
      }

      // Filter by search query
      if (searchQuery) {
        filteredGuidelines = filteredGuidelines?.filter(guideline =>
          guideline?.title?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
          guideline?.summary?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
          guideline?.keyRequirements?.some(req => 
            req?.toLowerCase()?.includes(searchQuery?.toLowerCase())
          ) ||
          guideline?.tags?.some(tag => 
            tag?.toLowerCase()?.includes(searchQuery?.toLowerCase())
          )
        );
      }

      setGuidelines(filteredGuidelines);
    } catch (error) {
      console.error('Failed to fetch RBI guidelines:', error);
      // Fallback to empty array if API fails
      setGuidelines([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRBIGuidelines();
  }, [selectedCategory, selectedSubcategory, searchQuery]);

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory('');
    setSelectedGuideline(null);
  };

  const handleSubcategorySelect = (subcategoryId) => {
    setSelectedSubcategory(subcategoryId);
    setSelectedGuideline(null);
  };

  const handleGuidelineSelect = (guideline) => {
    setSelectedGuideline(guideline);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setSelectedGuideline(null);
  };

  const handleAdvancedSearch = () => {
    // Implement advanced search logic here
    console.log('Advanced search with filters:', searchFilters);
  };

  const handleFiltersChange = (newFilters) => {
    setSearchFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex h-screen pt-16">
        {/* Sidebar */}
        <GuidelinesSidebar
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          selectedSubcategory={selectedSubcategory}
          onSubcategorySelect={handleSubcategorySelect}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Search */}
          <GuidelinesSearch
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onAdvancedSearch={handleAdvancedSearch}
            searchFilters={searchFilters}
            onFiltersChange={handleFiltersChange}
          />

          <div className="flex flex-1">
            {/* Guidelines List */}
            <GuidelinesList
              guidelines={guidelines}
              selectedGuideline={selectedGuideline}
              onGuidelineSelect={handleGuidelineSelect}
              searchQuery={searchQuery}
              isLoading={isLoading}
            />

            {/* Guidelines Details */}
            {selectedGuideline && (
              <GuidelineDetails
                guideline={selectedGuideline}
                onClose={() => setSelectedGuideline(null)}
                onAnnotate={(annotation) => console.log('Annotation added:', annotation)}
              />
            )}
          </div>
        </div>

        {/* Recent Updates Panel */}
        <RecentUpdates
          isVisible={showRecentUpdates}
          onToggle={() => setShowRecentUpdates(!showRecentUpdates)}
        />
      </div>
    </div>
  );
};

export default RegulatoryGuidelinesDatabase;