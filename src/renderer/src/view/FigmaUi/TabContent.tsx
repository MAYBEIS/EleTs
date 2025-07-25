import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Activity, BarChart3, FileText, Settings, Users, Calendar, Plus, Eye } from "lucide-react";
import { NewProjectDialog, ProjectData } from "./NewProjectDialog";
import { ProjectDetailsDialog } from "./ProjectDetailsDialog";

const tabVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export function DashboardContent() {
  return (
    <motion.div
      variants={tabVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总用户数</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2,345</div>
          <p className="text-xs text-muted-foreground">比上月增长 20.1%</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">活跃会话</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,234</div>
          <p className="text-xs text-muted-foreground">实时数据</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">月度收入</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">¥45,231</div>
          <p className="text-xs text-muted-foreground">比上月增长 12%</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-3 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>项目进度</CardTitle>
          <CardDescription>当前进行中的项目状态</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">移动应用开发</span>
              <Badge variant="outline">进行中</Badge>
            </div>
            <Progress value={75} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">网站重构</span>
              <Badge variant="outline">即将完成</Badge>
            </div>
            <Progress value={90} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">数据分析系统</span>
              <Badge variant="outline">开始</Badge>
            </div>
            <Progress value={25} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ProjectsContent() {
  const [projects, setProjects] = useState<ProjectData[]>([
    { 
      id: "1", 
      name: "电商平台", 
      description: "构建一个现代化的电商平台，支持多商户和移动端",
      status: "活跃", 
      progress: 85, 
      team: "前端团队",
      priority: "高",
      tags: ["电商", "React", "移动端"],
      startDate: new Date(2024, 0, 1),
      endDate: new Date(2024, 5, 30)
    },
    { 
      id: "2", 
      name: "数据可视化", 
      description: "开发企业级数据可视化仪表板系统",
      status: "开发中", 
      progress: 60, 
      team: "后端团队",
      priority: "中",
      tags: ["数据", "可视化", "企业级"],
      startDate: new Date(2024, 1, 15),
      endDate: new Date(2024, 6, 15)
    },
    { 
      id: "3", 
      name: "移动端应用", 
      description: "跨平台移动应用开发项目",
      status: "测试", 
      progress: 95, 
      team: "移动团队",
      priority: "紧急",
      tags: ["移动端", "React Native", "跨平台"],
      startDate: new Date(2024, 0, 1),
      endDate: new Date(2024, 3, 30)
    },
    { 
      id: "4", 
      name: "API 服务", 
      description: "微服务架构的后端API开发",
      status: "计划中", 
      progress: 20, 
      team: "架构团队",
      priority: "低",
      tags: ["API", "微服务", "后端"],
      startDate: new Date(2024, 2, 1),
      endDate: new Date(2024, 8, 30)
    },
  ]);

  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectData | null>(null);

  const handleCreateProject = (projectData: ProjectData) => {
    setProjects(prev => [...prev, projectData]);
  };

  const handleViewProject = (project: ProjectData) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  const handleEditProject = (project: ProjectData) => {
    setEditingProject(project);
    setShowProjectDetails(false);
    setShowNewProjectDialog(true);
  };

  const handleUpdateProject = (updatedProject: ProjectData) => {
    setProjects(prev => 
      prev.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
    setEditingProject(null);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  const handleUpdateProgress = (projectId: string, progress: number) => {
    setProjects(prev => 
      prev.map(p => p.id === projectId ? { ...p, progress } : p)
    );
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "活跃": return "default";
      case "开发中": return "secondary";
      case "测试": return "outline";
      case "已完成": return "default";
      case "暂停": return "destructive";
      default: return "secondary";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "紧急": return "border-l-red-500";
      case "高": return "border-l-orange-500";
      case "中": return "border-l-yellow-500";
      case "低": return "border-l-green-500";
      default: return "border-l-gray-500";
    }
  };

  return (
    <motion.div
      variants={tabVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2>项目管理</h2>
          <p className="text-muted-foreground">管理您的所有项目和团队协作</p>
        </div>
        <Button onClick={() => setShowNewProjectDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新建项目
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
              <p className="text-sm text-muted-foreground">总项目数</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {projects.filter(p => p.status === "活跃").length}
              </div>
              <p className="text-sm text-muted-foreground">活跃项目</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {projects.filter(p => p.status === "开发中").length}
              </div>
              <p className="text-sm text-muted-foreground">开发中</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length)}%
              </div>
              <p className="text-sm text-muted-foreground">平均进度</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`hover:shadow-lg transition-all border-l-4 ${getPriorityColor(project.priority)}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{project.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(project.status)}>
                          {project.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {project.priority}优先级
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{project.team}</span>
                      <span>{project.progress}% 完成</span>
                    </div>
                    
                    <Progress value={project.progress} className="h-2" />
                    
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {project.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {project.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{project.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProject(project)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      查看
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <NewProjectDialog
        open={showNewProjectDialog}
        onOpenChange={setShowNewProjectDialog}
        onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
      />

      <ProjectDetailsDialog
        open={showProjectDetails}
        onOpenChange={setShowProjectDetails}
        project={selectedProject}
        onEdit={handleEditProject}
        onDelete={handleDeleteProject}
        onUpdateProgress={handleUpdateProgress}
      />
    </motion.div>
  );
}

export function AnalyticsContent() {
  return (
    <motion.div
      variants={tabVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            数据分析
          </CardTitle>
          <CardDescription>系统性能和用户行为分析</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4>服务器性能</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">CPU 使用率</span>
                  <span className="text-sm">45%</span>
                </div>
                <Progress value={45} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">内存使用率</span>
                  <span className="text-sm">62%</span>
                </div>
                <Progress value={62} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">磁盘使用率</span>
                  <span className="text-sm">78%</span>
                </div>
                <Progress value={78} />
              </div>
            </div>
            
            <div className="space-y-4">
              <h4>用户活动</h4>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">1,234</div>
                    <div className="text-sm text-muted-foreground">今日访问</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">98.5%</div>
                    <div className="text-sm text-muted-foreground">系统可用性</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function SettingsContent() {
  return (
    <motion.div
      variants={tabVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            系统设置
          </CardTitle>
          <CardDescription>配置应用程序的各项参数</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4>用户偏好</h4>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">暗色主题</div>
                  <div className="text-sm text-muted-foreground">启用深色界面主题</div>
                </div>
                <Button variant="outline" size="sm">切换</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">自动保存</div>
                  <div className="text-sm text-muted-foreground">自动保存工作进度</div>
                </div>
                <Button variant="outline" size="sm">启用</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">通知设置</div>
                  <div className="text-sm text-muted-foreground">接收系统通知</div>
                </div>
                <Button variant="outline" size="sm">配置</Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4>系统配置</h4>
            <div className="grid gap-4">
              <Button variant="outline" className="justify-start">
                <FileText className="mr-2 h-4 w-4" />
                导出数据
              </Button>
              <Button variant="outline" className="justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                备份设置
              </Button>
              <Button variant="outline" className="justify-start">
                <Users className="mr-2 h-4 w-4" />
                用户管理
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}