import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Train, Plane, Home, Calendar, Bell, Clock, FileText, LayoutDashboard, LogOut, Menu, User } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth");
  };

  const navItems = [
    { label: "Home", path: "/", icon: Home },
    { label: "My Bookings", path: "/my-bookings", icon: Calendar },
    { label: "Waiting Monitor", path: "/waiting-monitor", icon: Clock },
    { label: "Notifications", path: "/notifications", icon: Bell },
    { label: "Grievance", path: "/grievance", icon: FileText },
    { label: "Admin", path: "/admin", icon: LayoutDashboard },
  ];

  const NavLink = ({ item, mobile = false }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    
    return (
      <button
        onClick={() => {
          navigate(item.path);
          if (mobile) setIsOpen(false);
        }}
        data-testid={`nav-${item.label.toLowerCase().replace(/ /g, '-')}`}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          isActive
            ? "bg-blue-100 text-blue-600 font-semibold"
            : "text-gray-600 hover:bg-gray-100"
        } ${mobile ? 'w-full' : ''}`}
      >
        <Icon className="w-5 h-5" />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
            data-testid="nav-logo"
          >
            <Train className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              TicketMate
            </span>
            <Plane className="w-6 h-6 text-green-600" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700" data-testid="user-name">{user.name || "User"}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              data-testid="logout-btn"
              className="hidden md:flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="outline" size="sm" data-testid="mobile-menu-btn">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-4 mt-8">
                  <div className="border-b pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold">{user.name || "User"}</span>
                    </div>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  
                  {navItems.map((item) => (
                    <NavLink key={item.path} item={item} mobile />
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full mt-4 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;