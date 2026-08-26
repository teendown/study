import { createClient } from '@libsql/client/web';

const url = 'https://study-bongkeun-choi.aws-ap-northeast-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODc0OTQxMzYsImlkIjoiMDFhMDJlZjMtNjkwMS03OTUzLTk2ZTktY2ZmNDQ5MjExNTY3Iiwia2lkIjoicEo1RHFMd2V3dHJZLTBXWGNxRTd0cnVRNWxrWDlYOVFJNTYxZl9lSC1YTSIsInJpZCI6ImU3OGNiNjUxLTY1YjEtNGYwYy1hYzE4LTRiNWU0NDMwMTViMCJ9.9VgR0mn1uwZNt_FkThfqyOyUmJ7gl1ZlkJuAR925K1pDq86RYsIYUFCu2IaBF-v2alJLxtDiFwSnVsNi9rKJAg';

const client = createClient({ url, authToken });

async function checkPassages() {
  const res = await client.execute(`
    SELECT id, title, metadata
    FROM learning_items
    WHERE type = 'reading'
    ORDER BY created_at DESC
  `);
  
  for (const r of res.rows) {
    console.log(`\n=== ID: ${r.id}, Title: ${r.title} ===`);
    try {
      const meta = typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata;
      console.log('translation:', meta.translation ? meta.translation.substring(0, 100) : 'NONE');
      console.log('sentenceTranslations count:', meta.sentenceTranslations ? meta.sentenceTranslations.length : 0);
      if (meta.sentenceTranslations) {
        console.log('First 2 sentence translations:', meta.sentenceTranslations.slice(0, 2));
      }
    } catch (e) {
      console.error(e);
    }
  }
}

checkPassages();
