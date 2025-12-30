import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  X,
  Sparkles,
  Save,
  Loader2,
  FileText,
  Presentation,
  Video,
  BookOpen,
} from "lucide-react";
import type { Material } from "@/types";

interface MaterialNotesPanelProps {
  material: Material;
  onClose: () => void;
}

// Notes storage - starts empty, user generates via AI
const mockNotes: Record<string, string> = {};

export const MaterialNotesPanel = ({ material, onClose }: MaterialNotesPanelProps) => {
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Load existing notes
    const existingNotes = mockNotes[material.id] || "";
    setNotes(existingNotes);
    setHasChanges(false);
  }, [material.id]);

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

  const handleGenerateNotes = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [
            {
              role: "user",
              content: `Generate comprehensive, well-organized study notes for the material titled "${material.name}". 
              
Format the notes with:
- Clear headings using # and ##
- Bullet points for key concepts
- Bold text for important terms
- A summary section
- Study tips at the end

Make the notes detailed and useful for studying.`
            }
          ],
          classContext: {
            className: "Study Material",
            materials: [material.name]
          }
        }
      });

      if (error) throw error;
      
      setNotes(data.response);
      setHasChanges(true);
      toast.success("Notes generated successfully!");
    } catch (error) {
      console.error("Error generating notes:", error);
      toast.error("Failed to generate notes. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveNotes = () => {
    setIsSaving(true);
    // Simulate saving - in real app would save to database
    setTimeout(() => {
      mockNotes[material.id] = notes;
      setHasChanges(false);
      setIsSaving(false);
      toast.success("Notes saved!");
    }, 500);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setHasChanges(true);
  };

  // Simple markdown-like rendering
  const renderNotes = (text: string) => {
    if (!text) return null;
    
    return text.split("\n").map((line, i) => {
      if (line.startsWith("# ")) {
        return <h1 key={i} className="text-xl font-bold mt-4 mb-2 text-foreground">{line.slice(2)}</h1>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={i} className="text-lg font-semibold mt-3 mb-2 text-foreground">{line.slice(3)}</h2>;
      }
      if (line.startsWith("### ")) {
        return <h3 key={i} className="text-base font-medium mt-2 mb-1 text-foreground">{line.slice(4)}</h3>;
      }
      if (line.startsWith("- **") || line.match(/^\d+\.\s*\*\*/)) {
        const match = line.match(/^[-\d.]+\s*\*\*(.+?)\*\*\s*[-–:]*\s*(.*)/);
        if (match) {
          return (
            <p key={i} className="ml-4 mb-1">
              <span className="text-muted-foreground mr-2">•</span>
              <strong className="text-foreground">{match[1]}</strong>
              {match[2] && <span className="text-muted-foreground"> - {match[2]}</span>}
            </p>
          );
        }
      }
      if (line.startsWith("- ")) {
        return (
          <p key={i} className="ml-4 mb-1">
            <span className="text-muted-foreground mr-2">•</span>
            <span>{line.slice(2)}</span>
          </p>
        );
      }
      if (line.match(/^\d+\./)) {
        return (
          <p key={i} className="ml-4 mb-1 text-foreground">
            {line}
          </p>
        );
      }
      if (line.trim() === "") {
        return <div key={i} className="h-2" />;
      }
      return <p key={i} className="mb-1 text-muted-foreground">{line}</p>;
    });
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="w-[400px] border-l bg-background flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 border-b flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getFileIcon(material.type)}
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {material.type}
            </span>
          </div>
          <h3 className="font-semibold text-sm truncate">{material.name}</h3>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>

      {/* Actions */}
      <div className="p-3 border-b flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 flex-1"
          onClick={handleGenerateNotes}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          {isGenerating ? "Generating..." : "Generate Notes"}
        </Button>
        <Button
          variant="default"
          size="sm"
          className="gap-2"
          onClick={handleSaveNotes}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Save
        </Button>
      </div>

      {/* Notes Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {notes ? (
            <div className="prose prose-sm max-w-none">
              {renderNotes(notes)}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                No notes yet for this material
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleGenerateNotes}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                Generate with AI
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Edit Mode Toggle */}
      {notes && (
        <div className="p-3 border-t">
          <Textarea
            placeholder="Edit your notes..."
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            className="min-h-[100px] text-sm resize-none"
          />
        </div>
      )}
    </motion.div>
  );
};
