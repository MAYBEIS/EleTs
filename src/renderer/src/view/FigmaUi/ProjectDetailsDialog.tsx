import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { 
  Calendar, 
  Clock, 
  Users, 
  Target, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ProjectData } from "./NewProjectDialog";

interface ProjectDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectData | null;
  onEdit: (project: ProjectData) => void;
  onDelete: (projectId: string) => void;
  onUpdateProgress: (projectId: string, progress: number) => void;
}

export function ProjectDetailsDialog({ 
  open, 
  onOpenChange, 
  project, 
  onEdit, 
  onDelete,
  onUpdateProgress 
}: ProjectDetailsDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!project) return null;

  const handleDelete = () => {
    onDelete(project.id);
    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "活跃": return "bg-green-500";
      case "开发中": return "bg-blue-500";
      case "测试": return "bg-yellow-500";
      case "已完成": return "bg-gray-500";
      case "暂停": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "紧急": return "text-red-600 bg-red-50";
      case "高": return "text-orange-600 bg-orange-50";
      case "中": return "text-yellow-600 bg-yellow-50";
      case "低": return "text-green-600 bg-green-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "活跃": return <Play className="h-4 w-4" />;
      case "开发中": return <Clock className="h-4 w-4" />;
      case "测试": return <AlertCircle className="h-4 w-4" />;
      case "已完成": return <CheckCircle className="h-4 w-4" />;
      case "暂停": return <Pause className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{project.name}</DialogTitle>
              <DialogDescription className="mt-2">
                {project.description || "暂无项目描述"}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(project)}>
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDeleteConfirm(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </Button>
            </div>
          </div>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">项目概览</TabsTrigger>
              <TabsTrigger value="progress">进度管理</TabsTrigger>
              <TabsTrigger value="details">详细信息</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`} />
                      <div>
                        <p className="text-sm text-muted-foreground">状态</p>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(project.status)}
                          <span className="font-medium">{project.status}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">团队</p>
                        <p className="font-medium">{project.team}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">优先级</p>
                        <Badge className={getPriorityColor(project.priority)}>
                          {project.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">进度</p>
                        <p className="font-medium">{project.progress}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>项目进度</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>完成进度</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-3" />
                  </div>
                </CardContent>
              </Card>

              {project.tags && project.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>项目标签</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="progress" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>进度管理</CardTitle>
                  <DialogDescription>
                    更新项目的完成进度
                  </DialogDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>当前进度</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[25, 50, 75, 100].map((value) => (
                      <Button
                        key={value}
                        variant={project.progress === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => onUpdateProgress(project.id, value)}
                      >
                        {value}%
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>里程碑</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${project.progress >= 25 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div className="flex-1">
                        <p className="font-medium">项目启动</p>
                        <p className="text-sm text-muted-foreground">完成项目规划和团队组建</p>
                      </div>
                      <Badge variant={project.progress >= 25 ? "default" : "secondary"}>
                        {project.progress >= 25 ? "已完成" : "待完成"}
                      </Badge>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${project.progress >= 50 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div className="flex-1">
                        <p className="font-medium">开发阶段</p>
                        <p className="text-sm text-muted-foreground">核心功能开发完成</p>
                      </div>
                      <Badge variant={project.progress >= 50 ? "default" : "secondary"}>
                        {project.progress >= 50 ? "已完成" : "待完成"}
                      </Badge>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${project.progress >= 75 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div className="flex-1">
                        <p className="font-medium">测试阶段</p>
                        <p className="text-sm text-muted-foreground">功能测试和优化完成</p>
                      </div>
                      <Badge variant={project.progress >= 75 ? "default" : "secondary"}>
                        {project.progress >= 75 ? "已完成" : "待完成"}
                      </Badge>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${project.progress >= 100 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div className="flex-1">
                        <p className="font-medium">项目交付</p>
                        <p className="text-sm text-muted-foreground">项目正式上线发布</p>
                      </div>
                      <Badge variant={project.progress >= 100 ? "default" : "secondary"}>
                        {project.progress >= 100 ? "已完成" : "待完成"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>时间安排</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">开始日期</p>
                        <p className="font-medium">
                          {project.startDate 
                            ? format(project.startDate, "PPP", { locale: zhCN })
                            : "未设置"
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">结束日期</p>
                        <p className="font-medium">
                          {project.endDate 
                            ? format(project.endDate, "PPP", { locale: zhCN })
                            : "未设置"
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>项目信息</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">项目ID</p>
                      <p className="font-medium font-mono text-sm">{project.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">创建时间</p>
                      <p className="font-medium">
                        {format(new Date(parseInt(project.id)), "PPP", { locale: zhCN })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {project.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>项目描述</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6">{project.description}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>

        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-10"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-6 max-w-sm mx-4"
            >
              <h3 className="font-medium mb-2">确认删除项目</h3>
              <p className="text-sm text-muted-foreground mb-4">
                确定要删除项目 "{project.name}" 吗？此操作不可撤销。
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  取消
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  删除
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}