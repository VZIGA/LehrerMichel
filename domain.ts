export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface Book {
  id: string;
  title: string;
  publisher?: string;
  language: string;
  level?: CEFRLevel;
}

export interface Lesson {
  id: string;
  bookId: string;
  number: number;
  title: string;
  topic?: string;
  level: CEFRLevel;
  learningObjectives: string[];
  vocabulary: string[];
  grammar: string[];
  phrases: string[];
}

export interface TestGenerationInput {
  bookId: string;
  lessonId: string;
  level: CEFRLevel;
  duration: number;
  totalPoints: number;
  difficulty: "leicht" | "mittel" | "schwer";
  competencies: string[];
  notes?: string;
}
