import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { AuthService } from '@/lib/auth-service';
import { StorageService } from '@/lib/storage';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function Header() {
  // Subscribe to auth store - this will cause re-render when user changes
  const user = useAuthStore((state) => state.user);
  
  // Always check sessionStorage directly as source of truth
  // This prevents stale data from showing Dashboard when user is logged out
  const [actualUser, setActualUser] = useState<typeof user>(() => StorageService.getCurrentUser());
  
  // Sync with auth store user whenever it changes
  useEffect(() => {
    const currentUserFromStorage = StorageService.getCurrentUser();
    
    // If store user is null but we have one in storage, clear storage
    if (!user && currentUserFromStorage) {
      StorageService.logout();
      setActualUser(null);
      return;
    }
    
    // If store user exists, use it (it's the source of truth after login)
    if (user) {
      setActualUser(user);
      return;
    }
    
    // If both are null, ensure we're synced
    if (!user && !currentUserFromStorage) {
      setActualUser(null);
    }
  }, [user]); // Re-run whenever store user changes
  
  const dashboardPath = actualUser ? AuthService.getDashboardPath(actualUser.role) : null;

  // Sync auth store with sessionStorage on mount and when storage changes
  useEffect(() => {
    const checkAuthState = () => {
      const currentUser = StorageService.getCurrentUser();
      const storeUser = useAuthStore.getState().user;
      
      // Immediately update local state
      setActualUser(currentUser);
      
      // If sessionStorage has no user but store has one, clear the store
      if (!currentUser && storeUser) {
        useAuthStore.setState({ user: null });
      }
      // If sessionStorage has a user but store doesn't, update the store
      else if (currentUser && !storeUser) {
        useAuthStore.setState({ user: currentUser });
      }
      // If both have users but they're different, sync with sessionStorage
      else if (currentUser && storeUser && currentUser.id !== storeUser.id) {
        useAuthStore.setState({ user: currentUser });
      }
    };

    // Check on mount
    checkAuthState();

    // Listen for storage changes (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser' || e.key === null) {
        checkAuthState();
      }
    };

    // Listen for custom logout events - immediately update
    const handleLogout = () => {
      // Immediately clear local state
      setActualUser(null);
      // Also check storage to be sure
      checkAuthState();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLogout', handleLogout);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLogout', handleLogout);
    };
  }, []); // Empty dependency array - only run on mount and cleanup

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gold-200/20 dark:border-gold-800/30 bg-white/95 dark:bg-black-950/95 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img 
                src="/assets/images/logo.png" 
                alt="M.C DENTAL CLINIC Logo" 
                className="h-12 w-12 object-contain transition-transform group-hover:scale-105" 
              />
            </div>
            <span className="text-xl font-bold text-black-900 dark:text-gray-100 group-hover:text-gold-500 dark:group-hover:text-gold-400 transition-colors">
              M.C DENTAL CLINIC
            </span>
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <nav className="flex items-center gap-1">
              <Link 
                to="/" 
                className="px-4 py-2 text-sm font-medium text-black-700 dark:text-gray-300 hover:text-gold-500 dark:hover:text-gold-400 hover:bg-gold-50 dark:hover:bg-gold-900/20 rounded-lg transition-all duration-200"
              >
                Home
              </Link>
              <Link 
                to="/services" 
                className="px-4 py-2 text-sm font-medium text-black-700 dark:text-gray-300 hover:text-gold-500 dark:hover:text-gold-400 hover:bg-gold-50 dark:hover:bg-gold-900/20 rounded-lg transition-all duration-200"
              >
                Services
              </Link>
              <Link 
                to="/about" 
                className="px-4 py-2 text-sm font-medium text-black-700 dark:text-gray-300 hover:text-gold-500 dark:hover:text-gold-400 hover:bg-gold-50 dark:hover:bg-gold-900/20 rounded-lg transition-all duration-200"
              >
                About
              </Link>
              <Link 
                to="/contact" 
                className="px-4 py-2 text-sm font-medium text-black-700 dark:text-gray-300 hover:text-gold-500 dark:hover:text-gold-400 hover:bg-gold-50 dark:hover:bg-gold-900/20 rounded-lg transition-all duration-200"
              >
                Contact
              </Link>
            </nav>
            {actualUser ? (
              <Link 
                to={dashboardPath || '/login'} 
                className="ml-2 px-6 py-2.5 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
              >
                Dashboard
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="ml-2 px-6 py-2.5 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
              >
                Login/Signup
              </Link>
            )}
            {/* Theme Toggle */}
            <ThemeToggle size="sm" />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle size="sm" />
            <button className="p-2 text-black-700 dark:text-gray-300 hover:text-gold-500 dark:hover:text-gold-400 hover:bg-gold-50 dark:hover:bg-gold-900/20 rounded-lg transition-colors">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          </div>
        </div>
      </div>
    </header>
  );
}
