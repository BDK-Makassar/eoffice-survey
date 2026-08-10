export const QUESTION_TYPES = [
  { value: "scale_1_5", label: "Skala 1–5", needsOptions: false },
  { value: "single_choice", label: "Pilihan Tunggal", needsOptions: true },
  { value: "multi_choice", label: "Pilihan Ganda (checkbox)", needsOptions: true },
  { value: "dropdown", label: "Dropdown", needsOptions: true },
  { value: "short_text", label: "Teks Singkat", needsOptions: false },
  { value: "long_text", label: "Teks Panjang", needsOptions: false },
  { value: "number", label: "Angka", needsOptions: false },
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number]["value"];

export function questionNeedsOptions(type: string) {
  return QUESTION_TYPES.find((t) => t.value === type)?.needsOptions ?? false;
}

export function questionTypeLabel(type: string) {
  return QUESTION_TYPES.find((t) => t.value === type)?.label ?? type;
}

export interface QuestionDef {
  id?: number;
  questionnaire_id?: number;
  type: QuestionType;
  label: string;
  options: string[] | null;
  required: boolean;
  order_index: number;
}

export interface UserDef {
  id?: number;
  nama: string;
  nip: string;
  jabatan: string;
}

export interface QuestionnaireDef {
  id?: number;
  title: string;
  description: string;
  is_active: boolean;
}

export interface AnswerInput {
  question_id: number;
  value: string;
}
