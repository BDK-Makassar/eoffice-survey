export const QUESTION_TYPES = [
  { value: "scale_1_4", label: "Skala Kepuasan 1–4", needsOptions: false },
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
  indicator?: string | null;
}

export interface UserDef {
  id?: number;
  nama: string;
  nip: string;
  jabatan: string;
  has_responded?: boolean;
}

export interface QuestionnaireDef {
  id?: number;
  title: string;
  description: string;
  image_url?: string;
  is_active: boolean;
}

export interface AnswerInput {
  question_id: number;
  value: string;
}

// Skala kepuasan genap (tanpa nilai tengah), mengikuti Permenpan RB No. 14 Tahun 2017.
export const SCALE_1_4_LABELS = ["Tidak Puas", "Kurang Puas", "Puas", "Sangat Puas"];

// Indikator penilaian: rata-rata skala 1–4 dikonversi ke 25–100 (x25), lalu dikategorikan.
export function ikmCategory(avg: number) {
  const nilai = avg * 25;
  const [mutu, kinerja] =
    nilai >= 88.31 ? ["A", "Sangat Baik"] : nilai >= 76.61 ? ["B", "Baik"] : nilai >= 65 ? ["C", "Kurang Baik"] : ["D", "Tidak Baik"];
  return { nilai, mutu, kinerja };
}
