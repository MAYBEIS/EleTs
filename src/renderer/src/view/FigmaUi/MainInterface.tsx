import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  Home, 
  FolderOpen, 
  BarChart3, 
  Settings, 
  Bell, 
  Search,
  User,
  Minimize2,
  Square,
  X
} from "lucide-react";
import { DashboardContent, ProjectsContent, AnalyticsContent, SettingsContent } from "./TabContent";

const headerVariants = {
  initial: { y: -50, opacity: 0 },
  animate: { 
    y: 0, 
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const sidebarVariants = {
  initial: { x: -100, opacity: 0 },
  animate: { 
    x: 0, 
    opacity: 1,
    transition: { duration: 0.6, delay: 0.2, ease: "easeOut" }
  }
};

const contentVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.6, delay: 0.4, ease: "easeOut" }
  }
};

export function MainInterface() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notifications, setNotifications] = useState(3);

  const tabs = [
    { id: "dashboard", label: "仪表板", icon: Home, content: DashboardContent },
    { id: "projects", label: "项目", icon: FolderOpen, content: ProjectsContent },
    { id: "analytics", label: "分析", icon: BarChart3, content: AnalyticsContent },
    { id: "settings", label: "设置", icon: Settings, content: SettingsContent },
  ];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* 窗口标题栏 */}
      <motion.div
        variants={headerVariants}
        initial="initial"
        animate="animate"
        className="flex items-center justify-between px-4 py-2 bg-card border-b border-border"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm" />
          </div>
          <span className="font-medium">桌面程序</span>
          <Badge variant="secondary" className="text-xs">v1.0</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
            <Bell className="h-4 w-4" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {notifications}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <User className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-border mx-2" />
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Square className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 */}
        <motion.div
          variants={sidebarVariants}
          initial="initial"
          animate="animate"
          className="w-64 bg-card border-r border-border flex flex-col"
        >
          <div className="p-4">
            <h2 className="mb-4">导航菜单</h2>
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </motion.button>
                );
              })}
            </nav>
          </div>
          
          <div className="mt-auto p-4">
            <Card className="p-3">
              <div className="text-sm">
                <div className="font-medium mb-1">系统状态</div>
                <div className="text-muted-foreground">运行正常</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs">已连接</span>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* 主内容区 */}
        <motion.div
          variants={contentVariants}
          initial="initial"
          animate="animate"
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex-1 p-6 overflow-auto">
            <AnimatePresence mode="wait">
              {tabs.map((tab) => {
                if (tab.id === activeTab) {
                  const ContentComponent = tab.content;
                  return (
                    <motion.div
                      key={tab.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ContentComponent />
                    </motion.div>
                  );
                }
                return null;
              })}
            </AnimatePresence>
          </div>
          
          {/* 状态栏 */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="border-t border-border px-6 py-2 bg-card"
          >
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>就绪</span>
                <span>CPU: 45%</span>
                <span>内存: 2.1GB</span>
              </div>
              <div className="flex items-center gap-4">
                <span>版本 1.0.0</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}