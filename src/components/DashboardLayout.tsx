import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Wallet, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { WalletConnectDialog } from "@/components/WalletConnectDialog";
import { ModeToggle } from "@/components/ModeToggle";
import { UserNav } from "@/components/UserNav";
import { useLocation, Link } from "react-router-dom";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [walletOpen, setWalletOpen] = useState(false);
  const location = useLocation();

  // Simple breadcrumb logic
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const url = `/${pathSegments.slice(0, index + 1).join("/")}`;
    return { title: segment.charAt(0).toUpperCase() + segment.slice(1), url };
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col relative overflow-hidden transition-all duration-300 ease-in-out">
          {/* Subtle background gradients */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]" />
          </div>

          <header className="h-16 flex items-center justify-between border-b px-6 bg-background/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
              
              {/* Breadcrumbs */}
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
                {breadcrumbs.map((crumb) => (
                  <div key={crumb.url} className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" />
                    <Link 
                      to={crumb.url} 
                      className={`hover:text-foreground transition-colors ${
                        location.pathname === crumb.url ? "text-foreground font-medium" : ""
                      }`}
                    >
                      {crumb.title}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all"
                onClick={() => setWalletOpen(true)}
              >
                <Wallet className="h-4 w-4 text-primary" />
                <span className="font-medium">Connect Wallet</span>
              </Button>
              
              {/* Mobile Wallet Icon */}
              <Button
                 variant="ghost"
                 size="icon"
                 className="md:hidden"
                 onClick={() => setWalletOpen(true)}
              >
                <Wallet className="h-5 w-5" />
              </Button>

              <div className="h-6 w-px bg-border mx-1" />
              
              <ModeToggle />
              <UserNav />
            </div>
          </header>
          
          <main className="flex-1 p-4 md:p-8 overflow-auto z-0 relative scroll-smooth">
            <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-500">
              {children}
            </div>
          </main>
        </div>
      </div>
      <WalletConnectDialog open={walletOpen} onOpenChange={setWalletOpen} />
    </SidebarProvider>
  );
}
