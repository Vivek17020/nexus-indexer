import { Home, Ticket, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'home', label: 'Stage', icon: Home },
  { id: 'proofs', label: 'Tickets', icon: Ticket },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-stage border-t border-primary/20 safe-bottom backdrop-blur-xl">
      <div className="flex justify-around items-center py-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 min-w-0 flex-1 relative",
                isActive 
                  ? "text-primary bg-gradient-primary/20 glow-stage scale-105" 
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10 hover:scale-105"
              )}
            >
              <Icon className={cn(
                "w-6 h-6 mb-1 transition-all duration-300",
                isActive && "drop-shadow-lg"
              )} />
              <span className={cn(
                "text-xs font-medium truncate transition-all duration-300",
                isActive && "font-bold"
              )}>{tab.label}</span>
              {isActive && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}