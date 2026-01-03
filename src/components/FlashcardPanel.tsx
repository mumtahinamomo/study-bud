import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, RotateCcw, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardPanelProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  materialName?: string;
}

export function FlashcardPanel({ isOpen, onClose, topic, materialName }: FlashcardPanelProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateFlashcards = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-flashcards", {
        body: { topic, materialName, count: 5 },
      });

      if (error) throw error;

      if (data.flashcards && data.flashcards.length > 0) {
        setFlashcards(data.flashcards);
        setCurrentIndex(0);
        setIsFlipped(false);
        setHasGenerated(true);
        toast.success("Flashcards generated!");
      } else {
        toast.error("Could not generate flashcards");
      }
    } catch (error) {
      console.error("Flashcard generation error:", error);
      toast.error("Failed to generate flashcards");
    } finally {
      setIsLoading(false);
    }
  };

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const resetCards = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card rounded-2xl shadow-2xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Flashcards</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {!hasGenerated ? (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Generate flashcards for: <span className="font-medium text-foreground">{topic}</span>
            </p>
            <Button onClick={generateFlashcards} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Flashcards
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center text-sm text-muted-foreground mb-4">
              Card {currentIndex + 1} of {flashcards.length}
            </div>

            <div
              className="relative h-64 cursor-pointer perspective-1000"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentIndex}-${isFlipped}`}
                  initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`absolute inset-0 rounded-xl p-6 flex items-center justify-center text-center ${
                    isFlipped
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <p className="text-lg font-medium">
                    {isFlipped ? flashcards[currentIndex]?.back : flashcards[currentIndex]?.front}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-2">
              Click card to flip
            </p>

            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={prevCard}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" onClick={resetCards}>
                <RotateCcw className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextCard}
                disabled={currentIndex === flashcards.length - 1}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="mt-4 text-center">
              <Button variant="ghost" size="sm" onClick={generateFlashcards} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Regenerate"}
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
