import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, MessageSquare, FileText, BarChart3, Settings, LogOut, Menu, X, ChevronDown, User, CreditCard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Chat", href: "/dashboard", icon: MessageSquare },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Analytics", href: "/admin", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Billing", href: "/pricing", icon: CreditCard },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<{ first_name: string | null; last_name: string | null; email: string | null } | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("first_name, last_name, email, company_id")
        .eq("id", user.id)
        .maybeSingle();
      if (prof) {
        setProfile({ first_name: prof.first_name, last_name: prof.last_name, email: prof.email });
        if (prof.company_id) {
          const { data: comp } = await supabase.from("companies").select("name").eq("id", prof.company_id).maybeSingle();
          if (comp) setCompanyName(comp.name);
        }
      }
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (roleData) setRole(roleData.role);
    };
    load();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const displayName =
    profile?.first_name || profile?.last_name
      ? `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()
      : profile?.email ?? "User";

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center justify-between px-4 border-b">
            <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-accent-foreground" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm">Company Brain</span>
                <span className="text-xs text-muted-foreground truncate">{companyName || "Workspace"}</span>
              </div>
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive ? "bg-accent text-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/10"}
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent/10 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{role || "Member"}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
          <div className="h-full px-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">
                {navigation.find(n => n.href === location.pathname)?.name || "Dashboard"}
              </h1>
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
