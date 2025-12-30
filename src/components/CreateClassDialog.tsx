import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClassFolder } from "@/types";

interface CreateClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (classData: Omit<ClassFolder, "id" | "createdAt">) => void;
}

const icons = ["📚", "🧠", "📐", "🧪", "💻", "🎨", "🌍", "📈", "⚖️", "🔬"];
const colors = [
  "hsl(175, 60%, 40%)",
  "hsl(38, 92%, 50%)",
  "hsl(220, 60%, 50%)",
  "hsl(340, 75%, 50%)",
  "hsl(280, 65%, 50%)",
  "hsl(150, 60%, 40%)",
];

export const CreateClassDialog = ({
  open,
  onOpenChange,
  onCreate,
}: CreateClassDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(icons[0]);
  const [selectedColor, setSelectedColor] = useState(colors[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name,
      description,
      icon: selectedIcon,
      color: selectedColor,
      materialsCount: 0,
    });
    setName("");
    setDescription("");
    setSelectedIcon(icons[0]);
    setSelectedColor(colors[0]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
          <DialogDescription>
            Add a new class to organize your study materials.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Class Name</Label>
            <Input
              id="name"
              placeholder="e.g., Introduction to Psychology"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="e.g., PSY 101 - Fall 2024"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {icons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                    selectedIcon === icon
                      ? "bg-primary/10 ring-2 ring-primary"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    selectedColor === color
                      ? "ring-2 ring-offset-2 ring-primary"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Class</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
