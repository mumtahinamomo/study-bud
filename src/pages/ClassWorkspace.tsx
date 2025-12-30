import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  Upload,
  FileText,
  Presentation,
  Video,
  BookOpen,
  Sparkles,
  Lightbulb,
  GraduationCap,
  Headphones,
  PanelLeftClose,
  PanelLeft,
  StickyNote,
} from "lucide-react";
import { MaterialNotesPanel } from "@/components/MaterialNotesPanel";
import type { Material, ChatMessage } from "@/types";

// Mock data
const mockMaterials: Material[] = [
  {
    id: "1",
    classId: "1",
    name: "Week 1 - Introduction.pdf",
    type: "slides",
    uploadedAt: new Date(),
    size: 2500000,
  },
  {
    id: "2",
    classId: "1",
    name: "Chapter 1 Notes.docx",
    type: "notes",
    uploadedAt: new Date(),
    size: 150000,
  },
  {
    id: "3",
    classId: "1",
    name: "Research Paper - Memory.pdf",
    type: "readings",
    uploadedAt: new Date(),
    size: 800000,
  },
  {
    id: "4",
    classId: "1",
    name: "Lecture Recording - Week 1.mp4",
    type: "videos",
    uploadedAt: new Date(),
    size: 150000000,
  },
];

const initialMessages: ChatMessage[] = [
  {
    id: "1",
    classId: "1",
    role: "assistant",
    content: "Hi! I'm your study buddy for Introduction to Psychology. I've analyzed all your course materials. What would you like to learn about today?",
    timestamp: new Date(),
  },
];

const quickActions = [
  { icon: Lightbulb, label: "Explain a concept", prompt: "Explain the concept of " },
  { icon: GraduationCap, label: "Quiz me", prompt: "Create a quick quiz on " },
  { icon: FileText, label: "Make notes", prompt: "Create comprehensive notes on " },
  { icon: Headphones, label: "Audio summary", prompt: "Generate an audio summary of " },
];

const ClassWorkspace = () => {
  const { classId } = useParams();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      classId: classId || "1",
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      // Build messages array for API (exclude initial welcome message for cleaner context)
      const apiMessages = [...messages.filter(m => m.id !== "1"), userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: apiMessages,
          classContext: {
            className: "Introduction to Psychology",
            materials: materials.map(m => m.name)
          }
        }
      });

      if (error) throw error;

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        classId: classId || "1",
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const newMaterial: Material = {
        id: Date.now().toString() + Math.random(),
        classId: classId || "1",
        name: file.name,
        type: getFileType(file.name),
        uploadedAt: new Date(),
        size: file.size,
      };
      setMaterials((prev) => [...prev, newMaterial]);
    });
  };

  const getFileType = (filename: string): Material["type"] => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (["ppt", "pptx", "key"].includes(ext || "")) return "slides";
    if (["mp4", "mov", "avi", "webm"].includes(ext || "")) return "videos";
    if (["doc", "docx", "txt", "md"].includes(ext || "")) return "notes";
    return "readings";
  };

  const getFileIcon = (type: Material["type"]) => {
    switch (type) {
      case "slides":
        return <Presentation size={16} className="text-accent" />;
      case "videos":
        return <Video size={16} className="text-destructive" />;
      case "notes":
        return <FileText size={16} className="text-primary" />;
      default:
        return <BookOpen size={16} className="text-success" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 h-14 border-b bg-background/95 backdrop-blur flex items-center px-4 gap-4">
        <Link to="/dashboard">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
            🧠
          </div>
          <div>
            <h1 className="font-semibold text-sm">Introduction to Psychology</h1>
            <p className="text-xs text-muted-foreground">PSY 101 - Fall 2024</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Materials Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r bg-sidebar overflow-hidden flex-shrink-0"
            >
              <div className="w-[280px] h-full flex flex-col">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-medium text-sm">Materials</h2>
                    <span className="text-xs text-muted-foreground">
                      {materials.length} files
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={14} />
                    Upload Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.mp4,.mov"
                  />
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-1">
                    {materials.map((material) => (
                      <div
                        key={material.id}
                        onClick={() => setSelectedMaterial(material)}
                        className={`group flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors ${
                          selectedMaterial?.id === material.id ? "bg-sidebar-accent" : ""
                        }`}
                      >
                        {getFileIcon(material.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{material.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(material.size || 0)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMaterial(material);
                          }}
                        >
                          <StickyNote size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-chat-ai border border-chat-border"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <Sparkles size={12} className="text-primary" />
                        </div>
                        <span className="text-xs font-medium text-primary">StudyBud</span>
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content.split("\n").map((line, i) => {
                        if (line.startsWith("• **")) {
                          const match = line.match(/• \*\*(.+?)\*\*: (.+)/);
                          if (match) {
                            return (
                              <p key={i} className="mb-2">
                                • <strong>{match[1]}</strong>: {match[2]}
                              </p>
                            );
                          }
                        }
                        return <p key={i} className={line ? "mb-2" : "mb-1"}>{line}</p>;
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-chat-ai border border-chat-border rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles size={12} className="text-primary animate-pulse" />
                      </div>
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-4">
              <div className="max-w-3xl mx-auto">
                <p className="text-sm text-muted-foreground mb-3">Quick actions</p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setInputValue(action.prompt)}
                    >
                      <action.icon size={14} />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex-shrink-0 p-4 border-t bg-background">
            <div className="max-w-3xl mx-auto">
              <div className="relative flex items-center gap-2">
                <Input
                  placeholder="Ask anything about your course materials..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="pr-12 h-12 rounded-xl"
                />
                <Button
                  size="icon"
                  className="absolute right-1.5 h-9 w-9 rounded-lg"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                >
                  <Send size={16} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                StudyBud only uses your uploaded materials to answer questions
              </p>
            </div>
          </div>
        </div>

        {/* Material Notes Panel */}
        <AnimatePresence>
          {selectedMaterial && (
            <MaterialNotesPanel
              material={selectedMaterial}
              onClose={() => setSelectedMaterial(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ClassWorkspace;
