import { neon } from "@neondatabase/serverless";
import type { QuestionDef, UserDef, QuestionnaireDef, AnswerInput } from "./types";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
export const usingDatabase = !!connectionString;

function maskConnectionString(url?: string) {
  if (!url) return "(kosong)";
  return url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:****@");
}

if (!connectionString) {
  console.log(
    "[db] DATABASE_URL belum diset — aplikasi tidak akan bisa menyimpan data. Lihat README.md."
  );
}
console.log("[db] connectionString:", maskConnectionString(connectionString));

const sql = connectionString
  ? neon(connectionString, { fetchOptions: { cache: "no-store" } })
  : (null as any);

function requireDb() {
  if (!sql) {
    throw new Error(
      "Database belum tersambung. Set environment variable DATABASE_URL (lihat README.md)."
    );
  }
  return sql;
}

let schemaReady = false;
export async function ensureSchema() {
  if (schemaReady) return;
  const db = requireDb();
  await db`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      nama TEXT NOT NULL,
      nip TEXT UNIQUE NOT NULL,
      jabatan TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  await db`
    CREATE TABLE IF NOT EXISTS questionnaires (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  await db`
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      questionnaire_id INT REFERENCES questionnaires(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      label TEXT NOT NULL,
      options TEXT,
      required BOOLEAN DEFAULT true,
      order_index INT DEFAULT 0
    );
  `;
  await db`
    CREATE TABLE IF NOT EXISTS responses (
      id SERIAL PRIMARY KEY,
      questionnaire_id INT REFERENCES questionnaires(id) ON DELETE CASCADE,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      submitted_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (questionnaire_id, user_id)
    );
  `;
  await db`
    CREATE TABLE IF NOT EXISTS answers (
      id SERIAL PRIMARY KEY,
      response_id INT REFERENCES responses(id) ON DELETE CASCADE,
      question_id INT REFERENCES questions(id) ON DELETE CASCADE,
      value TEXT
    );
  `;
  schemaReady = true;
}

// ---------- Users ----------
export async function listUsers(): Promise<UserDef[]> {
  await ensureSchema();
  const rows = await sql`SELECT id, nama, nip, jabatan FROM users ORDER BY nama ASC;`;
  console.log(`[db] listUsers() -> ${rows.length} baris`);
  return rows as unknown as UserDef[];
}

export async function listUsersWithStatus(questionnaireId: number): Promise<UserDef[]> {
  await ensureSchema();
  const rows = await sql`
    SELECT u.id, u.nama, u.nip, u.jabatan,
      EXISTS (
        SELECT 1 FROM responses r
        WHERE r.questionnaire_id = ${questionnaireId} AND r.user_id = u.id
      ) AS has_responded
    FROM users u ORDER BY u.nama ASC;
  `;
  console.log(`[db] listUsersWithStatus(${questionnaireId}) -> ${rows.length} baris`);
  return rows as unknown as UserDef[];
}

export async function createUser(u: UserDef) {
  await ensureSchema();
  const rows = await sql`
    INSERT INTO users (nama, nip, jabatan) VALUES (${u.nama}, ${u.nip}, ${u.jabatan})
    RETURNING id, nama, nip, jabatan;
  `;
  console.log(`[db] createUser(${u.nip}) ->`, rows[0]);
  return rows[0];
}

export async function updateUser(id: number, u: UserDef) {
  await ensureSchema();
  const rows = await sql`
    UPDATE users SET nama = ${u.nama}, nip = ${u.nip}, jabatan = ${u.jabatan}
    WHERE id = ${id}
    RETURNING id, nama, nip, jabatan;
  `;
  console.log(`[db] updateUser(${id}) ->`, rows[0] || "tidak ada baris ter-update");
  return rows[0];
}

export async function deleteUser(id: number) {
  await ensureSchema();
  await sql`DELETE FROM users WHERE id = ${id};`;
  console.log(`[db] deleteUser(${id}) -> selesai`);
}

export async function upsertUserByNip(u: UserDef) {
  await ensureSchema();
  const rows = await sql`
    INSERT INTO users (nama, nip, jabatan) VALUES (${u.nama}, ${u.nip}, ${u.jabatan})
    ON CONFLICT (nip) DO UPDATE SET nama = EXCLUDED.nama, jabatan = EXCLUDED.jabatan
    RETURNING id, nama, nip, jabatan;
  `;
  console.log(`[db] upsertUserByNip(${u.nip}) ->`, rows[0]);
  return rows[0];
}

// ---------- Questionnaires ----------
export async function listQuestionnaires() {
  await ensureSchema();
  const rows = await sql`
    SELECT q.id, q.title, q.description, q.is_active, q.created_at,
      (SELECT COUNT(*) FROM questions WHERE questionnaire_id = q.id)::int AS question_count,
      (SELECT COUNT(*) FROM responses WHERE questionnaire_id = q.id)::int AS response_count
    FROM questionnaires q ORDER BY q.created_at DESC;
  `;
  return rows;
}

export async function listActiveQuestionnaires() {
  await ensureSchema();
  const rows = await sql`
    SELECT q.id, q.title, q.description,
      (SELECT COUNT(*) FROM responses WHERE questionnaire_id = q.id)::int AS response_count,
      (SELECT COUNT(*) FROM users)::int AS total_users
    FROM questionnaires q WHERE q.is_active = true ORDER BY q.created_at DESC;
  `;
  return rows;
}

export async function getQuestionnaire(id: number) {
  await ensureSchema();
  const rows = await sql`SELECT * FROM questionnaires WHERE id = ${id};`;
  console.log(
    `[db] getQuestionnaire(${id}) ->`,
    rows[0] ? { id: rows[0].id, is_active: rows[0].is_active } : "tidak ditemukan"
  );
  return rows[0] || null;
}

export async function createQuestionnaire(q: QuestionnaireDef) {
  await ensureSchema();
  const rows = await sql`
    INSERT INTO questionnaires (title, description, is_active)
    VALUES (${q.title}, ${q.description}, ${q.is_active})
    RETURNING *;
  `;
  return rows[0];
}

export async function updateQuestionnaire(id: number, q: QuestionnaireDef) {
  await ensureSchema();
  const rows = await sql`
    UPDATE questionnaires SET title = ${q.title}, description = ${q.description}, is_active = ${q.is_active}
    WHERE id = ${id}
    RETURNING *;
  `;
  return rows[0];
}

export async function deleteQuestionnaire(id: number) {
  await ensureSchema();
  await sql`DELETE FROM questionnaires WHERE id = ${id};`;
}

// ---------- Questions ----------
export async function getQuestions(questionnaireId: number): Promise<QuestionDef[]> {
  await ensureSchema();
  const rows = await sql`
    SELECT * FROM questions WHERE questionnaire_id = ${questionnaireId} ORDER BY order_index ASC, id ASC;
  `;
  console.log(`[db] getQuestions(${questionnaireId}) -> ${rows.length} baris`);
  return (rows as any[]).map((r) => ({
    ...r,
    options: r.options ? JSON.parse(r.options) : null,
  }));
}

export async function replaceQuestions(questionnaireId: number, questions: QuestionDef[]) {
  await ensureSchema();

  // Update pertanyaan yang sudah ada di tempat (ID tetap sama) alih-alih delete+recreate,
  // supaya jawaban yang sudah masuk (answers.question_id -> questions.id, ON DELETE CASCADE)
  // tidak ikut terhapus saat admin cuma mengubah label/urutan pertanyaan yang masih dipakai.
  const existingRows = await sql`SELECT id FROM questions WHERE questionnaire_id = ${questionnaireId};`;
  const existingIds = new Set((existingRows as any[]).map((r) => r.id));
  const keepIds = new Set<number>();

  let i = 0;
  for (const q of questions) {
    const options = q.options && q.options.length ? JSON.stringify(q.options) : null;
    if (q.id && existingIds.has(q.id)) {
      await sql`
        UPDATE questions
        SET type = ${q.type}, label = ${q.label}, options = ${options}, required = ${q.required}, order_index = ${i}
        WHERE id = ${q.id} AND questionnaire_id = ${questionnaireId};
      `;
      keepIds.add(q.id);
    } else {
      const rows = await sql`
        INSERT INTO questions (questionnaire_id, type, label, options, required, order_index)
        VALUES (${questionnaireId}, ${q.type}, ${q.label}, ${options}, ${q.required}, ${i})
        RETURNING id;
      `;
      keepIds.add(rows[0].id);
    }
    i++;
  }

  // Pertanyaan yang tidak lagi ada di form (dihapus admin) dihapus dari DB,
  // dan itu memang seharusnya ikut menghapus jawaban terkait.
  const toDelete = [...existingIds].filter((id) => !keepIds.has(id));
  if (toDelete.length > 0) {
    await sql`DELETE FROM questions WHERE id = ANY(${toDelete});`;
  }
}

// ---------- Responses & Answers ----------
export async function hasResponded(questionnaireId: number, userId: number) {
  await ensureSchema();
  const rows = await sql`
    SELECT id FROM responses WHERE questionnaire_id = ${questionnaireId} AND user_id = ${userId};
  `;
  return rows.length > 0;
}

export async function submitResponse(
  questionnaireId: number,
  userId: number,
  answers: AnswerInput[]
) {
  await ensureSchema();
  const existing = await sql`
    SELECT id FROM responses WHERE questionnaire_id = ${questionnaireId} AND user_id = ${userId};
  `;
  if (existing.length > 0) {
    const err: any = new Error("ALREADY_SUBMITTED");
    err.code = "ALREADY_SUBMITTED";
    throw err;
  }
  const rows = await sql`
    INSERT INTO responses (questionnaire_id, user_id) VALUES (${questionnaireId}, ${userId})
    RETURNING id;
  `;
  const responseId = rows[0].id;
  for (const a of answers) {
    await sql`
      INSERT INTO answers (response_id, question_id, value) VALUES (${responseId}, ${a.question_id}, ${a.value});
    `;
  }
  return responseId;
}

export async function getCompletionStatus(questionnaireId: number) {
  await ensureSchema();
  const responded = await sql`
    SELECT u.id, u.nama, u.nip, u.jabatan, r.submitted_at
    FROM responses r JOIN users u ON u.id = r.user_id
    WHERE r.questionnaire_id = ${questionnaireId}
    ORDER BY r.submitted_at DESC;
  `;
  const respondedIds = new Set((responded as any[]).map((r) => r.id));
  const allUsers = await sql`SELECT id, nama, nip, jabatan FROM users ORDER BY nama ASC;`;
  const notResponded = (allUsers as any[]).filter((u) => !respondedIds.has(u.id));
  return {
    totalUsers: (allUsers as any[]).length,
    totalResponded: (responded as any[]).length,
    responded: responded as any[],
    notResponded,
  };
}

export async function getFullResults(questionnaireId: number) {
  await ensureSchema();
  const questions = await getQuestions(questionnaireId);
  const answerRows = await sql`
    SELECT a.question_id, a.value, r.user_id, u.nama
    FROM answers a
    JOIN responses r ON r.id = a.response_id
    JOIN users u ON u.id = r.user_id
    WHERE r.questionnaire_id = ${questionnaireId};
  `;
  const byQuestion: Record<number, { value: string; nama: string }[]> = {};
  for (const row of answerRows as any[]) {
    byQuestion[row.question_id] = byQuestion[row.question_id] || [];
    byQuestion[row.question_id].push({ value: row.value, nama: row.nama });
  }
  return questions.map((q) => ({ question: q, answers: byQuestion[q.id!] || [] }));
}

export async function getRawExportRows(questionnaireId: number) {
  await ensureSchema();
  const questions = await getQuestions(questionnaireId);
  const responses = await sql`
    SELECT r.id AS response_id, r.submitted_at, u.nama, u.nip, u.jabatan
    FROM responses r JOIN users u ON u.id = r.user_id
    WHERE r.questionnaire_id = ${questionnaireId}
    ORDER BY r.submitted_at ASC;
  `;
  const answers = await sql`
    SELECT a.response_id, a.question_id, a.value
    FROM answers a JOIN responses r ON r.id = a.response_id
    WHERE r.questionnaire_id = ${questionnaireId};
  `;
  const answersByResponse: Record<number, Record<number, string>> = {};
  for (const a of answers as any[]) {
    answersByResponse[a.response_id] = answersByResponse[a.response_id] || {};
    answersByResponse[a.response_id][a.question_id] = a.value;
  }
  return { questions, responses: responses as any[], answersByResponse };
}
