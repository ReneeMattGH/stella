import {
  LayoutDashboard,
  Upload,
  Layers,
  User,
  LogOut,
  Wallet,
  Home,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const businessNav = [
  { title: "Home", url: "/", icon: Home },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Upload Invoice", url: "/upload", icon: Upload },
  { title: "Browse Pools", url: "/pools", icon: Layers },
  { title: "Profile", url: "/profile", icon: User },
];

const investorNav = [
  { title: "Home", url: "/", icon: Home },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Browse Pools", url: "/pools", icon: Layers },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { userRole, signOut, user } = useAuth();
  const items = userRole === "investor" ? investorNav : businessNav;

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-stellar flex items-center justify-center">
            <Wallet className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-sidebar-foreground">StellarInvoice</h2>
            <p className="text-xs text-muted-foreground capitalize">{userRole || "business"} account</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary transition-all duration-200"
                      activeClassName="bg-sidebar-accent text-primary font-medium shadow-[inset_4px_0_0_0_hsl(var(--primary))]"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
         <div className="rounded-lg bg-sidebar-accent/50 p-4">
            <div className="flex items-center gap-3">
               <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-primary" />
               </div>
               <div>
                  <p className="text-xs font-medium">Stellar Network</p>
                  <p className="text-[10px] text-green-500 flex items-center gap-1">
                     <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                     Connected
                  </p>
               </div>
            </div>
         </div>
      </SidebarFooter>
    </Sidebar>
  );
}
