import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../AppIcon';
import Button from './Button';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationCount] = useState(3);

  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'LayoutDashboard',
      tooltip: 'Compliance overview and status monitoring'
    },
    {
      label: 'Content Compliance',
      path: '/content-upload-scanning',
      icon: 'FileSearch',
      tooltip: 'Upload and scan content for regulatory compliance',
      subItems: [
        { label: 'Content Upload & Scanning', path: '/content-upload-scanning' },
        { label: 'Compliance Results & Violations', path: '/compliance-results-violations' }
      ]
    },
    {
      label: 'Regulatory Intelligence',
      path: '/regulatory-guidelines-database',
      icon: 'BookOpen',
      tooltip: 'Access regulatory guidelines and updates',
      subItems: [
        { label: 'Guidelines Database', path: '/regulatory-guidelines-database' },
        { label: 'Regulatory Updates', path: '/regulatory-updates-notifications' }
      ]
    },
    {
      label: 'Reports',
      path: '/compliance-reports',
      icon: 'FileText',
      tooltip: 'Generate compliance reports and audit trails'
    }
  ];

  const notifications = [
    {
      id: 1,
      title: 'New RBI Guideline Update',
      message: 'Updated guidelines for digital lending platforms',
      time: '2 hours ago',
      type: 'regulatory',
      unread: true
    },
    {
      id: 2,
      title: 'Compliance Violation Detected',
      message: 'Marketing content requires immediate review',
      time: '4 hours ago',
      type: 'violation',
      unread: true
    },
    {
      id: 3,
      title: 'Report Generation Complete',
      message: 'Monthly compliance report is ready for download',
      time: '1 day ago',
      type: 'success',
      unread: false
    }
  ];

  const isActiveRoute = (path, subItems = []) => {
    if (location?.pathname === path) return true;
    return subItems?.some(item => location?.pathname === item?.path);
  };

  const getActiveSubItem = (subItems) => {
    return subItems?.find(item => location?.pathname === item?.path);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleMobileNavigation = (path) => {
    navigate(path);
    closeMobileMenu();
  };

  // Handle escape key to close mobile menu
  React.useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden'; // Prevent body scroll
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Logo */}
        <div className="flex items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="Shield" size={20} color="white" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-heading font-semibold text-lg text-foreground leading-tight">
                FinCompliance
              </h1>
              <span className="font-caption text-xs text-muted-foreground leading-none">
                Scanner
              </span>
            </div>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="hidden lg:flex items-center space-x-1" role="navigation" aria-label="Main navigation">
          {navigationItems?.map((item) => {
            const isActive = isActiveRoute(item?.path, item?.subItems);
            const activeSubItem = item?.subItems ? getActiveSubItem(item?.subItems) : null;
            
            return (
              <div key={item?.path} className="relative group">
                <button
                  onClick={() => handleNavigation(item?.path)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all duration-200 min-h-[44px] ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  title={item?.tooltip}
                  aria-current={isActive ? 'page' : undefined}
                  aria-expanded={item?.subItems ? 'false' : undefined}
                  aria-haspopup={item?.subItems ? 'menu' : undefined}
                >
                  <Icon name={item?.icon} size={16} />
                  <span>{item?.label}</span>
                  {item?.subItems && (
                    <Icon name="ChevronDown" size={14} className="opacity-60" />
                  )}
                </button>
                {/* Dropdown for sub-items */}
                {item?.subItems && (
                  <div 
                    className="absolute top-full left-0 mt-1 w-64 bg-popover border border-border rounded-lg shadow-modal opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
                    role="menu"
                    aria-label={`${item?.label} submenu`}
                  >
                    <div className="p-2">
                      {item?.subItems?.map((subItem) => (
                        <button
                          key={subItem?.path}
                          onClick={() => handleNavigation(subItem?.path)}
                          className={`w-full text-left px-3 py-3 rounded-md text-sm font-body transition-colors duration-200 min-h-[44px] ${
                            location?.pathname === subItem?.path
                              ? 'bg-primary text-primary-foreground'
                              : 'text-popover-foreground hover:bg-muted'
                          }`}
                          role="menuitem"
                          aria-current={location?.pathname === subItem?.path ? 'page' : undefined}
                        >
                          {subItem?.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Global Search */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Search guidelines, violations..."
                className="w-64 pl-10 pr-4 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              <Icon 
                name="Search" 
                size={16} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
              />
            </div>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
              aria-expanded={isNotificationOpen}
              aria-haspopup="menu"
            >
              <Icon name="Bell" size={20} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-error-foreground text-xs font-medium rounded-full flex items-center justify-center" aria-hidden="true">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationOpen && (
              <div 
                className="absolute top-full right-0 mt-2 w-80 bg-popover border border-border rounded-lg shadow-modal z-50"
                role="menu"
                aria-label="Notifications menu"
              >
                <div className="p-4 border-b border-border">
                  <h3 className="font-heading font-medium text-popover-foreground">
                    Notifications
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications?.map((notification) => (
                    <div
                      key={notification?.id}
                      className={`p-4 border-b border-border last:border-b-0 hover:bg-muted transition-colors duration-200 ${
                        notification?.unread ? 'bg-muted/50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification?.type === 'regulatory' ? 'bg-primary' :
                          notification?.type === 'violation'? 'bg-error' : 'bg-success'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-medium text-sm text-popover-foreground">
                            {notification?.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification?.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {notification?.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-border">
                  <Button variant="ghost" size="sm" className="w-full">
                    View All Notifications
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-200 min-w-[44px] min-h-[44px]"
              aria-label="User profile menu"
              aria-expanded={isProfileOpen}
              aria-haspopup="menu"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Icon name="User" size={16} color="white" />
              </div>
              <Icon name="ChevronDown" size={14} className="hidden md:block" />
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div 
                className="absolute top-full right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-modal z-50"
                role="menu"
                aria-label="User profile menu"
              >
                <div className="p-4 border-b border-border">
                  <p className="font-body font-medium text-popover-foreground">
                    {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user?.email || 'user@example.com'}
                  </p>
                  <p className="text-xs text-primary capitalize font-medium mt-1">
                    {user?.role || 'user'}
                  </p>
                </div>
                <div className="p-2">
                  <button 
                    className="w-full text-left px-3 py-3 text-sm font-body text-popover-foreground hover:bg-muted rounded-md transition-colors duration-200 min-h-[44px]"
                    role="menuitem"
                  >
                    Profile Settings
                  </button>
                  <button 
                    className="w-full text-left px-3 py-3 text-sm font-body text-popover-foreground hover:bg-muted rounded-md transition-colors duration-200 min-h-[44px]"
                    role="menuitem"
                  >
                    Role Management
                  </button>
                  <button 
                    className="w-full text-left px-3 py-3 text-sm font-body text-popover-foreground hover:bg-muted rounded-md transition-colors duration-200 min-h-[44px]"
                    role="menuitem"
                  >
                    Help & Support
                  </button>
                  <div className="border-t border-border my-2" role="separator" />
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-3 text-sm font-body text-error hover:bg-muted rounded-md transition-colors duration-200 min-h-[44px]"
                    role="menuitem"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMobileMenu}
            className="lg:hidden p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-haspopup="true"
          >
            <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={20} />
          </button>
        </div>
      </div>
      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 top-16 z-40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
        >
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-background/95 backdrop-blur-sm mobile-backdrop-enter"
            onClick={closeMobileMenu}
            aria-label="Close navigation menu"
          />
          
          {/* Menu Content */}
          <div className="relative bg-card border-b border-border shadow-lg mobile-menu-enter">
            <div className="p-6">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 id="mobile-menu-title" className="font-heading font-semibold text-lg text-foreground">
                  Navigation
                </h2>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Close navigation menu"
                >
                  <Icon name="X" size={20} />
                </button>
              </div>
              
              {/* Mobile Navigation */}
              <nav 
                id="mobile-navigation"
                className="space-y-2"
                role="navigation"
                aria-label="Mobile navigation"
              >
                {navigationItems?.map((item) => (
                  <div key={item?.path}>
                    <button
                      onClick={() => handleMobileNavigation(item?.path)}
                      className={`w-full flex items-center space-x-3 px-4 py-4 rounded-lg text-left font-body font-medium transition-colors duration-200 min-h-[44px] ${
                        isActiveRoute(item?.path, item?.subItems)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted'
                      }`}
                      aria-current={isActiveRoute(item?.path, item?.subItems) ? 'page' : undefined}
                    >
                      <Icon name={item?.icon} size={20} />
                      <span>{item?.label}</span>
                      {item?.subItems && (
                        <Icon name="ChevronRight" size={16} className="ml-auto opacity-60" />
                      )}
                    </button>
                    {item?.subItems && (
                      <div className="ml-6 mt-2 space-y-1" role="group" aria-label={`${item?.label} submenu`}>
                        {item?.subItems?.map((subItem) => (
                          <button
                            key={subItem?.path}
                            onClick={() => handleMobileNavigation(subItem?.path)}
                            className={`w-full text-left px-4 py-3 rounded-md text-sm font-body transition-colors duration-200 min-h-[44px] ${
                              location?.pathname === subItem?.path
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                            aria-current={location?.pathname === subItem?.path ? 'page' : undefined}
                          >
                            {subItem?.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
              
              {/* Mobile Search */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search guidelines, violations..."
                    className="w-full pl-10 pr-4 py-3 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent min-h-[44px]"
                    aria-label="Search guidelines and violations"
                  />
                  <Icon 
                    name="Search" 
                    size={16} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;