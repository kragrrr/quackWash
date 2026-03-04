import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

interface TopBarProps {
  breadcrumbs: number;
  notifications: number;
}

const TopBar = ({ breadcrumbs, notifications }: TopBarProps) => {
  return (
    <header className="sticky top-0 z-40 bg-primary px-4 py-3 flex items-center justify-between shadow-lg">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">🦆</span>
        <h1 className="font-display text-xl font-bold text-primary-foreground tracking-tight">
          QuackWash
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Breadcrumb balance */}
        <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
          <span className="text-sm">🍞</span>
          <span className="font-display font-bold text-sm text-primary-foreground">
            {breadcrumbs}
          </span>
        </div>

        {/* Notification bell */}
        <button className="relative p-1.5" aria-label="Notifications">
          <Bell className="w-5 h-5 text-primary-foreground" />
          {notifications > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-accent text-accent-foreground border-0 flex items-center justify-center">
              {notifications}
            </Badge>
          )}
        </button>
      </div>
    </header>
  );
};

export default TopBar;
