import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Disclosure, Transition } from '@headlessui/react';
import { 
  Home, 
  Users, 
  Briefcase, 
  Store, 
  Zap, 
  FileEdit, 
  BarChart, 
  Settings, 
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  to: string;
  badge?: {
    count: number;
    color: string;
  };
  children?: { 
    to: string; 
    label: string;
    badge?: {
      count: number;
      color: string;
    };
  }[];
}

const navItems: NavItem[] = [
  { to: '/', icon: <Home size={18} />, label: 'Dashboard' },
  { 
    to: '/users', 
    icon: <Users size={18} />, 
    label: 'User Management',
    children: [
      { to: '/users', label: 'All Users' },
      { to: '/users/roles', label: 'User Roles' },
      { to: '/users/permissions', label: 'Permissions' },
    ]
  },
  { 
    to: '/advisors', 
    icon: <Briefcase size={18} />, 
    label: 'Advisors',
    badge: {
      count: 5,
      color: 'bg-blue-400 text-white'
    },
    children: [
      { to: '/advisors', label: 'All Advisors' },
      { to: '/advisors/commission', label: 'Commission Structure' },
      { to: '/advisors/leads', label: 'Leads' },
      { 
        to: '/advisors/payments', 
        label: 'Payments',
        badge: {
          count: 3,
          color: 'bg-blue-400 text-white'
        }
      },
    ]
  },
  { 
    to: '/listings', 
    icon: <Store size={18} />, 
    label: 'Listings',
    children: [
      { to: '/listings', label: 'All Listings' },
      { to: '/listings/business', label: 'Business' },
      { to: '/listings/franchise', label: 'Franchise' },
      { to: '/listings/startup', label: 'Startup' },
      { to: '/listings/investor', label: 'Investor' },
      { to: '/listings/digital-asset', label: 'Digital Asset' },
      { to: '/listings/featured', label: 'Featured Listings' },
      { 
        to: '/listings/pending', 
        label: 'Pending Approval',
        badge: {
          count: 8,
          color: 'bg-yellow-400 text-white'
        }
      },
    ]
  },
  { 
    to: '/insta-apply', 
    icon: <Zap size={18} />, 
    label: 'Insta Apply',
    badge: {
      count: 12,
      color: 'bg-red-400 text-white'
    },
    children: [
      { to: '/insta-apply', label: 'All Applications' },
      { 
        to: '/insta-apply/new', 
        label: 'New Applications',
        badge: {
          count: 12,
          color: 'bg-red-400 text-white'
        }
      },
      { to: '/insta-apply/processed', label: 'Processed Applications' },
    ]
  },
  { 
    to: '/content', 
    icon: <FileEdit size={18} />, 
    label: 'Content',
    children: [
      { to: '/content/pages', label: 'Pages' },
      { to: '/content/blog', label: 'Blog' },
      { to: '/content/faqs', label: 'FAQs' },
      { to: '/content/testimonials', label: 'Testimonials' },
      { to: '/content/media', label: 'Media Library' },
    ]
  },
  { 
    to: '/analytics', 
    icon: <BarChart size={18} />, 
    label: 'Analytics',
    children: [
      { to: '/analytics', label: 'Overview' },
      { to: '/analytics/users', label: 'User Analytics' },
      { to: '/analytics/listings', label: 'Listing Analytics' },
      { to: '/analytics/conversion', label: 'Conversion Reports' },
      { to: '/analytics/advisor', label: 'Advisor Performance' },
    ]
  },
  { 
    to: '/settings', 
    icon: <Settings size={18} />, 
    label: 'Settings',
    children: [
      { to: '/settings/general', label: 'General Settings' },
      { to: '/settings/email', label: 'Email Templates' },
      { to: '/settings/payment', label: 'Payment Gateway' },
      { to: '/settings/plans', label: 'Subscription Plans' },
      { to: '/settings/logs', label: 'System Logs' },
    ]
  },
];

export default function Sidebar() {
  const location = useLocation();
  const [activeGroups, setActiveGroups] = useState<string[]>([]);
  
  // Auto-expand active section
  useEffect(() => {
    const currentPath = location.pathname;
    
    const activeParent = navItems.find(item => 
      item.children && (
        item.to === currentPath || 
        item.children.some(child => currentPath === child.to)
      )
    );
    
    if (activeParent && !activeGroups.includes(activeParent.to)) {
      setActiveGroups(prev => [...prev, activeParent.to]);
    }
  }, [location.pathname]);
  
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#0031ac] via-[#0a34a0] to-[#052380]">
      {/* Logo with enhanced styling */}
      <div className="py-4 flex justify-center relative">
        <div className="bg-white rounded-lg p-3 shadow-lg w-40 h-14 flex justify-center items-center border border-blue-100">
          <img src="/logo.svg" alt="Business Options" className="h-8 w-auto" />
        </div>
        {/* Small decorative elements */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-400 rounded-full opacity-10 -mr-8 -mt-8"></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 bg-blue-400 rounded-full opacity-10 -ml-6 -mb-6"></div>
      </div>
      
      {/* Navigation with enhanced styling */}
      <div className="flex-1 overflow-y-auto py-4 px-4">
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isCurrentRoute = location.pathname === item.to;
            const isActiveSection = item.children?.some(child => location.pathname === child.to);
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = activeGroups.includes(item.to);
            
            if (!hasChildren) {
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                    isCurrentRoute
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <div className="flex items-center">
                    <div className={cn(
                      'mr-3 flex items-center justify-center w-6 h-6',
                      isCurrentRoute ? 'text-white' : 'text-white/80'
                    )}>
                      {item.icon}
                    </div>
                    <span className="whitespace-nowrap">{item.label}</span>
                  </div>
                  
                  {item.badge && (
                    <span className={`${item.badge.color} text-xs px-2 py-1 rounded-full ml-2 shadow-sm`}>
                      {item.badge.count}
                    </span>
                  )}
                </Link>
              );
            }
            
            return (
              <Disclosure
                key={item.to}
                as="div"
                defaultOpen={isExpanded || isActiveSection}
                className="mb-1"
              >
                {({ open }) => (
                  <>
                    <Disclosure.Button
                      className={cn(
                        'group flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                        (open || isCurrentRoute || isActiveSection)
                          ? 'bg-white/15 text-white shadow-sm'
                          : 'text-white/90 hover:bg-white/10 hover:text-white'
                      )}
                      onClick={() => {
                        if (open) {
                          setActiveGroups(activeGroups.filter(g => g !== item.to));
                        } else {
                          setActiveGroups([...activeGroups, item.to]);
                        }
                      }}
                    >
                      <div className="flex items-center truncate">
                        <div className={cn(
                          'mr-3 flex items-center justify-center w-6 h-6',
                          (open || isCurrentRoute || isActiveSection) ? 'text-white' : 'text-white/80'
                        )}>
                          {item.icon}
                        </div>
                        <span className="truncate">{item.label}</span>
                      </div>
                      <div className="flex items-center">
                        {item.badge && (
                          <span className={`${item.badge.color} text-xs px-2 py-1 rounded-full mr-2 shadow-sm`}>
                            {item.badge.count}
                          </span>
                        )}
                        <ChevronRight
                          className={cn(
                            'h-4 w-4 transition-transform duration-200',
                            open && 'transform rotate-90'
                          )}
                        />
                      </div>
                    </Disclosure.Button>
                    
                    <Transition
                      enter="transition duration-100 ease-out"
                      enterFrom="transform scale-95 opacity-0"
                      enterTo="transform scale-100 opacity-100"
                      leave="transition duration-75 ease-out"
                      leaveFrom="transform scale-100 opacity-100"
                      leaveTo="transform scale-95 opacity-0"
                    >
                      <Disclosure.Panel className="mt-1 ml-4 pl-4 border-l border-blue-400/30 space-y-1">
                        {item.children?.map((subItem) => (
                          <Link
                            key={subItem.to}
                            to={subItem.to}
                            className={cn(
                              'flex items-center justify-between px-3 py-2 text-sm rounded-md transition-all duration-200',
                              location.pathname === subItem.to
                                ? 'bg-white/15 text-white font-medium shadow-sm'
                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                            )}
                          >
                            <span className="truncate">{subItem.label}</span>
                            
                            {subItem.badge && (
                              <span className={`${subItem.badge.color} text-xs px-2 py-0.5 rounded-full ml-2 shadow-sm`}>
                                {subItem.badge.count}
                              </span>
                            )}
                          </Link>
                        ))}
                      </Disclosure.Panel>
                    </Transition>
                  </>
                )}
              </Disclosure>
            );
          })}
        </nav>
      </div>
      
      {/* Footer decorative element */}
      <div className="h-12 border-t border-blue-700/30 bg-[#052380]/50">
        <div className="h-full flex items-center justify-center px-4">
          <div className="text-xs text-white/50 text-center">
            Business Options Admin
          </div>
        </div>
      </div>
    </div>
  );
}