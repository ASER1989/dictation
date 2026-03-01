import Router from '@koa/router';
import type {Context} from 'koa';
import {extname} from 'path';
import {readFile} from 'fs/promises';
import {getAudioAbsolutePath} from '../services/ttsStore';
import {
  getVocabularyBookForDictation,
  getVocabularyBooks,
} from '../services/vocabularyStore';

function isValidAudioFileName(fileName: string) {
  return /^[a-f0-9]{16}\.[a-z0-9]+$/i.test(fileName);
}

function getContentType(fileName: string) {
  const ext = extname(fileName).toLowerCase();
  if (ext === '.wav') {
    return 'audio/wav';
  }
  if (ext === '.mp3') {
    return 'audio/mpeg';
  }
  return 'application/octet-stream';
}

function formatId(prefix: string, rawValue: string) {
  return `${prefix}-${rawValue.trim().toLowerCase().replace(/\s+/g, '-')}`;
}

export default (prefix: string) => {
  const router = new Router({prefix});

  router.get('/client/books/tree', async (ctx: Context) => {
    const books = await getVocabularyBooks();
    const gradeMap = new Map<
      string,
      {
        id: string;
        name: string;
        versions: Array<{
          id: string;
          name: string;
          units: Array<{
            id: string;
            name: string;
            lessons: Array<{
              id: string;
              name: string;
              vocabularyId: string;
              wordCount: number;
            }>;
          }>;
        }>;
      }
    >();

    books.forEach((item) => {
      const gradeName = item.grade.trim();
      const versionName = item.version.trim();
      const unitName = item.unit.trim();
      const lessonName = item.lesson.trim() || item.name.trim();

      if (!gradeName || !versionName || !unitName || !lessonName || item.words.length === 0) {
        return;
      }

      const gradeId = formatId('grade', gradeName);
      const versionId = formatId('version', `${gradeName}-${versionName}`);
      const unitId = formatId('unit', `${gradeName}-${versionName}-${unitName}`);

      if (!gradeMap.has(gradeId)) {
        gradeMap.set(gradeId, {
          id: gradeId,
          name: gradeName,
          versions: [],
        });
      }

      const grade = gradeMap.get(gradeId)!;

      let version = grade.versions.find((versionItem) => versionItem.id === versionId);
      if (!version) {
        version = {
          id: versionId,
          name: versionName,
          units: [],
        };
        grade.versions.push(version);
      }

      let unit = version.units.find((unitItem) => unitItem.id === unitId);
      if (!unit) {
        unit = {
          id: unitId,
          name: unitName,
          lessons: [],
        };
        version.units.push(unit);
      }

      unit.lessons.push({
        id: item.id,
        name: lessonName,
        vocabularyId: item.id,
        wordCount: item.words.length,
      });
    });

    return {items: Array.from(gradeMap.values())};
  });

  router.get('/client/vocabularies', async (ctx: Context) => {
    const books = await getVocabularyBooks();
    const items = books.map((item) => ({
      id: item.id,
      name: item.name,
      grade: item.grade,
      version: item.version,
      unit: item.unit,
      lesson: item.lesson,
      wordCount: item.words.length,
    }));

    return {items};
  });

  router.get('/client/vocabularies/:id/dictation', async (ctx: Context) => {
    const target = await getVocabularyBookForDictation(ctx.params.id);

    if (!target) {
      ctx.throw(404, '词汇表不存在');
    }

    const audioMap = new Map((target.wordAudios ?? []).map((item) => [item.word, item]));
    const words: Array<{ word: string; audioUrl: string }> = [];

    for (const word of target.words) {
      const matchedAudio = audioMap.get(word.trim());

      if (!matchedAudio) {
        ctx.throw(500, `词汇 ${word} 缺少语音文件`);
      }

      words.push({
        word,
        audioUrl: `/api/client/audio/${matchedAudio.audioFileName}`,
      });
    }

    return {
      book: {
        id: target.id,
        name: target.name,
        grade: target.grade,
        version: target.version,
        unit: target.unit,
        lesson: target.lesson,
      },
      repeatTimes: 3,
      intervalSeconds: 10,
      words,
    };
  });

  router.get('/client/audio/:fileName', async (ctx: Context) => {
    const fileName = ctx.params.fileName;

    if (!isValidAudioFileName(fileName)) {
      ctx.throw(400, '音频文件名非法');
    }

    let audioBuffer: Buffer;
    try {
      audioBuffer = await readFile(getAudioAbsolutePath(fileName));
    } catch {
      ctx.throw(404, '音频文件不存在');
    }
    ctx.type = getContentType(fileName);
    ctx.set('Cache-Control', 'public, max-age=31536000, immutable');
    ctx.body = audioBuffer;
  });

  return router.routes();
};
