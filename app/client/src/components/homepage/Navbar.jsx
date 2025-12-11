import React, { useState, useEffect, useRef } from "react";
import { Stethoscope, Menu, X, Sun, Moon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const Button = ({ children, className, variant = "default", ...props }) => {
  const base = "px-4 py-2 rounded-full font-medium transition-all duration-300";
  const variants = {
    default: "bg-gradient-to-r from-primary to-secondary text-white hover:from-primary-dark hover:to-secondary-dark",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-white",
    ghost: "bg-transparent text-primary hover:bg-primary-light",
  };
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
};

const Navbar = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  const navItems = ["Home", "How It Works", "Contact"];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };

  const logout = () => {
    localStorage.clear();
    toast.success("Logged out successfully");
    navigate("/signin");
    window.location.reload();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 px-4 md:px-8",
      scrolled ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg" : "bg-transparent dark:bg-gray-900"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-70"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-full p-1">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
          </div>
          <Link to="/" className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            MediScan
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item, index) =>
            item === "Home" ? (
              <Link key={index} to="/" className="text-gray-700 dark:text-gray-100 hover:text-primary transition-colors relative group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ) : (
              <button
                key={index}
                onClick={() =>
                  document.getElementById(item.toLowerCase().replace(/\s+/g, "-"))?.scrollIntoView({ behavior: "smooth" })
                }
                className="text-gray-700 dark:text-gray-100 hover:text-primary transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:w-full"></span>
              </button>
            )
          )}
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-4 relative">
          <button onClick={toggleDarkMode} className="text-primary dark:text-secondary hover:text-secondary p-2">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center font-bold uppercase hover:ring-2 ring-white"
              >
                {user.name.charAt(0)}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 z-50">
                  <span className="block px-4 py-2 text-sm text-gray-600 dark:text-white font-medium">{user.name}</span>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <Link
  to={
    user.role === "doctor"
      ? "/doctor-dashboard"
      : user.role === "admin"
      ? "/admin-dashboard"
      : "/dashboard"
  }
  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
>
  Dashboard
</Link>

                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">My Profile</Link>
                  <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700">Logout</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/signin"><Button variant="outline">Login</Button></Link>
              <Link to="/signup"><Button>Sign Up</Button></Link>
            </>
          )}
        </div>

        {/* Mobile: Dark Mode + Hamburger */}
        <div className="md:hidden flex items-center gap-2 ml-auto">
          <button onClick={toggleDarkMode} className="text-primary dark:text-secondary p-2" title="Toggle Dark Mode">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Button variant="ghost" className="p-1" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6 text-gray-800 dark:text-white" /> : <Menu className="w-6 h-6 text-gray-800 dark:text-white" />}
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div ref={dropdownRef} className="md:hidden bg-white dark:bg-gray-800 px-4 py-4 shadow-md rounded-b-lg mt-2 space-y-4">
          {navItems.map((item, index) =>
            item === "Home" ? (
              <Link
                key={index}
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 dark:text-white"
              >
                {item}
              </Link>
            ) : (
              <button
                key={index}
                onClick={() => {
                  setMobileMenuOpen(false);
                  document.getElementById(item.toLowerCase().replace(/\s+/g, "-"))?.scrollIntoView({ behavior: "smooth" });
                }}
                className="block w-full text-left text-gray-700 dark:text-white"
              >
                {item}
              </button>
            )
          )}

          {user ? (
            <>
              <Link
  to={
    user.role === "doctor"
      ? "/doctor-dashboard"
      : user.role === "admin"
      ? "/admin-dashboard"
      : "/dashboard"
  }
  onClick={() => setMobileMenuOpen(false)}
  className="block text-primary dark:text-cyan-400"
>
  Dashboard
</Link>

              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block text-primary dark:text-cyan-400">My Profile</Link>
              <button onClick={logout} className="block text-left text-red-600">Logout</button>
            </>
          ) : (
            <>
              <Link to="/signin" onClick={() => setMobileMenuOpen(false)} className="block text-primary">Login</Link>
              <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="block text-primary">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
