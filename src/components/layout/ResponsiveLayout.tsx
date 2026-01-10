import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  FolderKanban,
  Settings,
  User,
  CreditCard,
  Mail,
  Calendar,
  Database,
  Cloud,
  Plug,
  Webhook,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Search,
  BarChart3,
  FileText,
  Shield,
  HelpCircle,
  Mic,
  Bot,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile, useIsTablet, useScrollLock, useViewportHeight } from '@/lib/responsive';
import { cn } from '@/lib/utils';

// Layout context for sidebar state
interface LayoutContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType>({
  sidebarOpen: false,
  setSidebarOpen: () => {},
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
});

export const useLayout = () => useContext(LayoutContext);

// Navigation items configuration
const mainNavItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/projects', icon: FolderKanban, label: 'Projects' },
  { href: '/templates', icon: FileText, label: 'Templates' },
];

const userMenuItems = [
  { href: '/account', icon: User, label: 'Account' },
  { href: '/settings', icon: Settings, label: 'Settings' },
  { href: '/usage', icon: BarChart3, label: 'Usage' },
  { href: '/billing', icon: CreditCard, label: 'Billing' },
  { href: '/mail', icon: Mail, label: 'Mail ADELE' },
  { href: '/scheduled-works', icon: Calendar, label: 'Scheduled Works' },
  { href: '/data-controls', icon: Database, label: 'Data Controls' },
  { href: '/cloud-browser', icon: Cloud, label: 'Cloud Browser' },
  { href: '/connectors', icon: Plug, label: 'Connectors' },
  { href: '/integrations', icon: Webhook, label: 'Integrations' },
];

const bottomNavItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/projects', icon: FolderKanban, label: 'Projects' },
  { href: '/mail', icon: Mail, label: 'Mail' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

// Sidebar component
function Sidebar({ className }: { className?: string }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { sidebarCollapsed, setSidebarCollapsed, setSidebarOpen } = useLayout();
  const isMobile = useIsMobile();

  const handleNavClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-zinc-950 border-r border-zinc-800 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-800">
        {!sidebarCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Bot className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold text-white">ADELE</span>
          </Link>
        )}
        {sidebarCollapsed && (
          <Link href="/dashboard" className="mx-auto">
            <Bot className="w-8 h-8 text-blue-500" />
          </Link>
        )}
        {!isMobile && (
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Main navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors min-h-[44px]',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* User menu section */}
        <div className="mt-6 pt-6 border-t border-zinc-800">
          {!sidebarCollapsed && (
            <h3 className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              User Menu
            </h3>
          )}
          <div className="space-y-1">
            {userMenuItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors min-h-[44px]',
                    isActive
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User profile section */}
      <div className="border-t border-zinc-800 p-4">
        {sidebarCollapsed ? (
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors min-h-[44px]"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => logout()}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

// Mobile bottom navigation
function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-zinc-800 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {bottomNavItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full min-w-[64px] transition-colors',
                isActive ? 'text-blue-500' : 'text-zinc-400'
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Mobile header
function MobileHeader() {
  const { setSidebarOpen } = useLayout();
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-zinc-950 border-b border-zinc-800 safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 rounded-lg hover:bg-zinc-800 text-zinc-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <Link href="/dashboard" className="flex items-center gap-2">
          <Bot className="w-7 h-7 text-blue-500" />
          <span className="text-lg font-bold text-white">ADELE</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

// Desktop header
function DesktopHeader() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950 px-6 flex items-center justify-between">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search projects, templates, settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 ml-6">
        <button
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          aria-label="Help"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
        <button
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}

// Mobile sidebar overlay
function MobileSidebarOverlay() {
  const { sidebarOpen, setSidebarOpen } = useLayout();
  useScrollLock(sidebarOpen);

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-72"
          >
            <div className="relative h-full">
              <Sidebar />
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Main layout component
interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Initialize viewport height CSS variable
  useViewportHeight();

  // Auto-collapse sidebar on tablet
  useEffect(() => {
    if (isTablet && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  }, [isTablet]);

  return (
    <LayoutContext.Provider
      value={{ sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed }}
    >
      <div className="min-h-screen bg-zinc-950 text-white">
        {isMobile ? (
          // Mobile layout
          <>
            <MobileHeader />
            <MobileSidebarOverlay />
            <main className="pt-14 pb-16 min-h-[calc(var(--vh,1vh)*100)]">
              {children}
            </main>
            <BottomNav />
          </>
        ) : (
          // Desktop/Tablet layout
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <DesktopHeader />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
        )}
      </div>
    </LayoutContext.Provider>
  );
}

// Page container with responsive padding
interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function PageContainer({ children, className, maxWidth = '2xl' }: PageContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={cn(
        'w-full mx-auto px-4 sm:px-6 lg:px-8 py-6',
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}

// Page header component
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
        {description && (
          <p className="mt-1 text-sm sm:text-base text-zinc-400">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

// Card component with responsive styling
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function Card({ children, className, padding = 'md', onClick }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={cn(
        'bg-zinc-900 border border-zinc-800 rounded-xl',
        paddingClasses[padding],
        onClick && 'cursor-pointer hover:border-zinc-700 transition-colors',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Grid component for responsive layouts
interface GridProps {
  children: React.ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Grid({ children, cols = {}, gap = 'md', className }: GridProps) {
  const { default: defaultCols = 1, sm, md, lg, xl } = cols;

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8',
  };

  const colClasses = [
    `grid-cols-${defaultCols}`,
    sm && `sm:grid-cols-${sm}`,
    md && `md:grid-cols-${md}`,
    lg && `lg:grid-cols-${lg}`,
    xl && `xl:grid-cols-${xl}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cn('grid', colClasses, gapClasses[gap], className)}>
      {children}
    </div>
  );
}

export default ResponsiveLayout;
