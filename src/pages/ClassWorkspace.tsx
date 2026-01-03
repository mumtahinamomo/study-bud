import { useState, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  Loader2,
  Trash2,
  Volume2,
  VolumeX,
  Layers,
} from "lucide-react";
import { MaterialNotesPanel } from "@/components/MaterialNotesPanel";
import { FlashcardPanel } from "@/components/FlashcardPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import type { Material, ChatMessage } from "@/types";

interface DbMaterial {
  id: string;
  class_id: string;
  name: string;
  type: string;
  file_path: string;
  size: number | null;
  uploaded_at: string;
}

interface DbClass {
  id: string;
  name: string;
  code: string | null;
  emoji: string | null;
}

const quickActions = [
  { icon: Lightbulb, label: "Explain a concept", prompt: "Explain the concept of " },
  { icon: GraduationCap, label: "Quiz me", prompt: "Create a quick quiz on " },
  { icon: FileText, label: "Make notes", prompt: "Create comprehensive notes on " },
];

const ClassWorkspace = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [classInfo, setClassInfo] = useState<DbClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [flashcardOpen, setFlashcardOpen] = useState(false);
  const [flashcardTopic, setFlashcardTopic] = useState("");
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { speak, stop, isSpeaking, isSupported: ttsSupported } = useSpeechSynthesis();

  const handleSpeak = (messageId: string, text: string) => {
    if (speakingMessageId === messageId && isSpeaking) {
      stop();
      setSpeakingMessageId(null);
    } else {
      stop();
      setSpeakingMessageId(messageId);
      speak(text);
    }
  };

  useEffect(() => {
    if (!isSpeaking) {
      setSpeakingMessageId(null);
    }
  }, [isSpeaking]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user && classId) {
      fetchClassData();
    }
  }, [user, classId]);

  const fetchClassData = async () => {
    try {
      // Fetch class info
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .maybeSingle();

      if (classError) throw classError;
      if (!classData) {
        toast.error("Class not found");
        navigate("/dashboard");
        return;
      }

      setClassInfo(classData as DbClass);

      // Fetch materials
      const { data: materialsData, error: materialsError } = await supabase
        .from("materials")
        .select("*")
        .eq("class_id", classId)
        .order("uploaded_at", { ascending: false });

      if (materialsError) throw materialsError;

      const mappedMaterials: Material[] = (materialsData as DbMaterial[]).map((m) => ({
        id: m.id,
        classId: m.class_id,
        name: m.name,
        type: m.type as Material["type"],
        fileUrl: m.file_path,
        uploadedAt: new Date(m.uploaded_at),
        size: m.size || 0,
      }));

      setMaterials(mappedMaterials);

      // Set initial welcome message
      setMessages([
        {
          id: "1",
          classId: classId || "1",
          role: "assistant",
          content: `Hi! I'm your study buddy for ${classData.name}. Upload your course materials and I'll help you understand them. What would you like to learn about today?`,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error fetching class data:", error);
      toast.error("Failed to load class data");
    } finally {
      setLoading(false);
    }
  };

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
      const apiMessages = [...messages.filter(m => m.id !== "1"), userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: apiMessages,
          classContext: {
            className: classInfo?.name || "Study Material",
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user || !classId) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Upload to storage
        const filePath = `${user.id}/${classId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Save record to database
        const { data, error: dbError } = await supabase
          .from("materials")
          .insert({
            class_id: classId,
            user_id: user.id,
            name: file.name,
            type: getFileType(file.name),
            file_path: filePath,
            size: file.size,
          })
          .select()
          .single();

        if (dbError) throw dbError;

        const newMaterial: Material = {
          id: data.id,
          classId: data.class_id,
          name: data.name,
          type: data.type as Material["type"],
          fileUrl: data.file_path,
          uploadedAt: new Date(data.uploaded_at),
          size: data.size || 0,
        };

        setMaterials((prev) => [newMaterial, ...prev]);
      }

      toast.success("Files uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteMaterial = async (material: Material, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Delete from storage
      if (material.fileUrl) {
        await supabase.storage.from("materials").remove([material.fileUrl]);
      }

      // Delete from database
      const { error } = await supabase
        .from("materials")
        .delete()
        .eq("id", material.id);

      if (error) throw error;

      setMaterials((prev) => prev.filter((m) => m.id !== material.id));
      if (selectedMaterial?.id === material.id) {
        setSelectedMaterial(null);
      }
      toast.success("Material deleted");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete material");
    }
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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            {classInfo?.emoji || "📚"}
          </div>
          <div>
            <h1 className="font-semibold text-sm">{classInfo?.name || "Class"}</h1>
            {classInfo?.code && (
              <p className="text-xs text-muted-foreground">{classInfo.code}</p>
            )}
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
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {uploading ? "Uploading..." : "Upload Files"}
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
                    {materials.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No materials yet. Upload some files to get started.
                      </p>
                    ) : (
                      materials.map((material) => (
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
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMaterial(material);
                              }}
                            >
                              <StickyNote size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={(e) => handleDeleteMaterial(material, e)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
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
                        <div className="ml-auto flex items-center gap-1">
                          {ttsSupported && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-6 w-6"
                              onClick={() => handleSpeak(message.id, message.content)}
                              title={speakingMessageId === message.id && isSpeaking ? "Stop reading" : "Read aloud"}
                            >
                              {speakingMessageId === message.id && isSpeaking ? (
                                <VolumeX size={12} />
                              ) : (
                                <Volume2 size={12} />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-6 w-6"
                            onClick={() => {
                              setFlashcardTopic(classInfo?.name || "this topic");
                              setFlashcardOpen(true);
                            }}
                            title="Generate flashcards"
                          >
                            <Layers size={12} />
                          </Button>
                        </div>
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      setFlashcardTopic(classInfo?.name || "this topic");
                      setFlashcardOpen(true);
                    }}
                  >
                    <Layers size={14} />
                    Flashcards
                  </Button>
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

        {/* Flashcard Panel */}
        <FlashcardPanel
          isOpen={flashcardOpen}
          onClose={() => setFlashcardOpen(false)}
          topic={flashcardTopic}
          materialName={selectedMaterial?.name}
        />
      </div>
    </div>
  );
};

export default ClassWorkspace;
