import type { TestGenerationInput } from "@/types/domain";

export interface GeneratedTest {
  title: string;
  instructions: string;
  totalPoints: number;
  sections: Array<{
    title: string;
    points: number;
    tasks: Array<{
      instruction: string;
      items: string[];
      solution?: string | string[];
    }>;
  }>;
}

export interface AIProvider {
  generateTest(input: TestGenerationInput): Promise<GeneratedTest>;
}
