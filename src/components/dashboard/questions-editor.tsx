'use client';

import { useState } from 'react';
import type { Question } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface QuestionsEditorProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
}

export function QuestionsEditor({ questions, onChange }: QuestionsEditorProps) {
  function addQuestion() {
    const newQ: Question = {
      id: crypto.randomUUID(),
      text: '',
      type: 'text',
      required: false,
    };
    onChange([...questions, newQ]);
  }

  function removeQuestion(id: string) {
    onChange(questions.filter((q) => q.id !== id));
  }

  function updateQuestion(id: string, updates: Partial<Question>) {
    onChange(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((q, index) => (
        <div
          key={q.id}
          className="flex items-start gap-2 rounded-md border p-3"
        >
          <GripVertical className="mt-2.5 size-4 shrink-0 text-muted-foreground/50" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Question text..."
                value={q.text}
                onChange={(e) =>
                  updateQuestion(q.id, { text: e.target.value })
                }
                className="flex-1"
              />
              <Select
                value={q.type}
                onValueChange={(v) =>
                  updateQuestion(q.id, { type: v as 'text' | 'rating' })
                }
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={`required-${q.id}`}
                checked={q.required}
                onCheckedChange={(checked) =>
                  updateQuestion(q.id, { required: checked })
                }
              />
              <Label htmlFor={`required-${q.id}`} className="text-xs text-muted-foreground">
                Required
              </Label>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => removeQuestion(q.id)}
            className="mt-1.5 shrink-0 text-red-500 hover:text-red-700"
            disabled={questions.length <= 1}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addQuestion}
        className="w-full gap-1.5"
      >
        <Plus className="size-3.5" />
        Add Question
      </Button>
    </div>
  );
}
