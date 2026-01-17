import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, User, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="absolute left-0 right-0 top-0 z-50"
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-6">
        {/* Logo */}
        <Link to="/" className="font-serif text-2xl text-foreground">
          <span className="text-primary">Stahl</span> Tech 
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
         
          {/**<Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Collection
          </Link>
          <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Craft
          </Link>**/}

           <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Home
          </Link>
          

          <Link to="/about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            About
          </Link>

          <Link to="/contact" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Contact Us
          </Link>
          
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  <Shield className="h-4 w-4" />
                  Dashboard
                </Link>
              )}
              <div className="flex items-center gap-3 border-l border-border pl-4">
                <span className="text-sm text-muted-foreground">
                  {user?.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <User className="h-4 w-4" />
              Login
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 md:hidden"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-border bg-background md:hidden"
        >
          <nav className="container mx-auto flex flex-col gap-4 px-4 py-6">
            <Link to="/" className="text-sm font-medium text-foreground">
              Collection
            </Link>
            <Link to="/" className="text-sm font-medium text-foreground">
              Craft
            </Link>
            <Link to="/" className="text-sm font-medium text-foreground">
              About
            </Link>
            
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Shield className="h-4 w-4" />
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="flex items-center gap-2 text-sm font-medium text-foreground">
                <User className="h-4 w-4" />
                Login
              </Link>
            )}
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}
