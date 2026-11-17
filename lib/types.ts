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

export interface IndicatorRow {
  name: string;
  no: number[];
  nilai: number | null; // rata-rata skala 1–4 x25
  mutu: string | null;
  kinerja: string | null;
  positif: number | null; // % jawaban positif pilihan tunggal (2 opsi teratas)
  masukan: string[];
}

// Rekap per indikator: skala 1–4 -> nilai x25 + mutu; pilihan tunggal -> % positif (target ≥75%); isian -> daftar masukan.
export function indicatorRecap(results: { question: QuestionDef; answers: { value: string }[] }[]): IndicatorRow[] {
  const groups = new Map<string, { no: number[]; scale: number[]; pos: number; choice: number; masukan: string[] }>();
  results.forEach((r, i) => {
    const key = r.question.indicator?.trim();
    if (!key) return;
    const g = groups.get(key) || { no: [], scale: [], pos: 0, choice: 0, masukan: [] };
    g.no.push(i + 1);
    if (r.question.type === "scale_1_4") {
      const nums = r.answers.map((a) => Number(a.value)).filter((n) => n >= 1 && n <= 4);
      if (nums.length) g.scale.push(nums.reduce((a, b) => a + b, 0) / nums.length);
    } else if (r.question.type === "single_choice") {
      const top = (r.question.options || []).slice(0, 2);
      g.choice += r.answers.length;
      g.pos += r.answers.filter((a) => top.includes(a.value)).length;
    } else {
      g.masukan.push(...r.answers.map((a) => a.value.trim()).filter(Boolean));
    }
    groups.set(key, g);
  });
  return [...groups].map(([name, g]) => {
    const k = g.scale.length ? ikmCategory(g.scale.reduce((a, b) => a + b, 0) / g.scale.length) : null;
    return {
      name,
      no: g.no,
      nilai: k?.nilai ?? null,
      mutu: k?.mutu ?? null,
      kinerja: k?.kinerja ?? null,
      positif: g.choice ? (g.pos / g.choice) * 100 : null,
      masukan: g.masukan,
    };
  });
}

// Indeks keseluruhan = rata-rata nilai per unsur (pertanyaan skala 1–4) x 25.
export function overallIkm(results: { question: QuestionDef; answers: { value: string }[] }[]) {
  const avgs = results
    .filter((r) => r.question.type === "scale_1_4")
    .map((r) => r.answers.map((a) => Number(a.value)).filter((n) => n >= 1 && n <= 4))
    .filter((nums) => nums.length)
    .map((nums) => nums.reduce((a, b) => a + b, 0) / nums.length);
  return avgs.length ? { ...ikmCategory(avgs.reduce((a, b) => a + b, 0) / avgs.length), unsur: avgs.length } : null;
}
