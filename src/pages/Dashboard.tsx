import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { 
  Plus, 
  FolderOpen, 
  Clock, 
  FileText, 
  BookOpen, 
  Settings,
  LogOut,
  Search,
  Sparkles,
  Trash2,
  MoreVertical
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { CreateClassDialog } from "@/components/CreateClassDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { ClassFolder } from "@/types";

// Mock data
const mockClasses: ClassFolder[] = [
  {
    id: "1",
    name: "Introduction to Psychology",
    description: "PSY 101 - Fall 2024",
    color: "hsl(175, 60%, 40%)",
    icon: "🧠",
    materialsCount: 12,
    lastStudied: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    createdAt: new Date(),
  },
  {
    id: "2",
    name: "Calculus II",
    description: "MATH 201 - Fall 2024",
    color: "hsl(38, 92%, 50%)",
    icon: "📐",
    materialsCount: 8,
    lastStudied: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    createdAt: new Date(),
  },
  {
    id: "3",
    name: "Organic Chemistry",
    description: "CHEM 301 - Fall 2024",
    color: "hsl(220, 60%, 50%)",
    icon: "🧪",
    materialsCount: 15,
    lastStudied: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    createdAt: new Date(),
  },
];

const Dashboard = () => {
  const [classes, setClasses] = useState<ClassFolder[]>(mockClasses);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<ClassFolder | null>(null);
  const navigate = useNavigate();

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatLastStudied = (date?: Date) => {
    if (!date) return "Not yet studied";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  const handleCreateClass = (newClass: Omit<ClassFolder, "id" | "createdAt">) => {
    const classFolder: ClassFolder = {
      ...newClass,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setClasses([classFolder, ...classes]);
    setIsCreateOpen(false);
  };

  const handleDeleteClass = (cls: ClassFolder, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setClassToDelete(cls);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (classToDelete) {
      setClasses(classes.filter(c => c.id !== classToDelete.id));
      toast.success(`"${classToDelete.name}" has been deleted`);
      setClassToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo size="sm" />
          
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Button variant="ghost" size="icon-sm">
              <Settings size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon-sm"
              onClick={() => navigate("/login")}
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
            <p className="text-muted-foreground">
              Ready to continue learning? Pick a class to get started.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{classes.length}</p>
                <p className="text-sm text-muted-foreground">Active Classes</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {classes.reduce((acc, cls) => acc + cls.materialsCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Materials</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <Sparkles className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">Study Sessions</p>
              </div>
            </Card>
          </div>

          {/* Classes Section */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Your Classes</h2>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus size={18} />
              New Class
            </Button>
          </div>

          {filteredClasses.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No classes yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first class to start organizing your study materials.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus size={18} className="mr-2" />
                Create Your First Class
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClasses.map((cls, index) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link to={`/class/${cls.id}`}>
                    <Card variant="interactive" className="p-5 group relative">
                      <div className="absolute top-3 right-3 z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon-sm" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                              onClick={(e) => e.preventDefault()}
                            >
                              <MoreVertical size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => handleDeleteClass(cls, e as unknown as React.MouseEvent)}
                            >
                              <Trash2 size={14} className="mr-2" />
                              Delete Class
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-start justify-between mb-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                          style={{ backgroundColor: `${cls.color}15` }}
                        >
                          {cls.icon}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mr-8">
                          <Clock size={12} />
                          {formatLastStudied(cls.lastStudied)}
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                        {cls.name}
                      </h3>
                      {cls.description && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {cls.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText size={14} />
                        {cls.materialsCount} materials
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <CreateClassDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={handleCreateClass}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{classToDelete?.name}"? This will remove all materials and study history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
