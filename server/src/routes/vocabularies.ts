import Router from '@koa/router';
import type { Context } from 'koa';
import {
  SUPPORTED_TTS_VOICES,
  type TtsRegenerateOptions,
} from '../services/ttsStore';
import {
  createVocabularyBook,
  deleteVocabularyBook,
  getVocabularyBooks,
  regenerateVocabularyWordAudio,
  updateVocabularyBook,
} from '../services/vocabularyStore';
import type { VocabularyBookInput } from '../types/vocabulary';

function parseInput(ctx: Context): VocabularyBookInput {
  const body = (ctx.request.body ?? {}) as Record<string, unknown>;
  return {
    name: typeof body.name === 'string' ? body.name : '',
    grade: typeof body.grade === 'string' ? body.grade : '',
    version: typeof body.version === 'string' ? body.version : '',
    unit: typeof body.unit === 'string' ? body.unit : '',
    lesson: typeof body.lesson === 'string' ? body.lesson : '',
    words: Array.isArray(body.words)
      ? body.words.filter((item): item is string => typeof item === 'string')
      : [],
  };
}

function getValidationError(input: VocabularyBookInput): string | null {
  if (!input.name.trim()) {
    return '词汇表名称不能为空';
  }
  if (!input.grade.trim()) {
    return '年级不能为空';
  }
  if (!input.version.trim()) {
    return '版本不能为空';
  }
  if (!input.unit.trim()) {
    return '课程单元不能为空';
  }
  return null;
}

export default (prefix: string) => {
  const router = new Router({ prefix });

  router.get('/vocabularies', async (ctx: Context) => {
    const items = await getVocabularyBooks();
    ctx.body = { items };
  });

  router.post('/vocabularies', async (ctx: Context) => {
    const input = parseInput(ctx);
    const validationError = getValidationError(input);
    if (validationError) {
      ctx.throw(400, validationError);
    }
    const item = await createVocabularyBook(input);
    ctx.body = { item };
  });

  router.put('/vocabularies/:id', async (ctx: Context) => {
    const input = parseInput(ctx);
    const validationError = getValidationError(input);
    if (validationError) {
      ctx.throw(400, validationError);
    }
    const item = await updateVocabularyBook(ctx.params.id, input);

    if (!item) {
      ctx.throw(404, '词汇表不存在');
    }

    ctx.body = { item };
  });

  router.delete('/vocabularies/:id', async (ctx: Context) => {
    const deleted = await deleteVocabularyBook(ctx.params.id);

    if (!deleted) {
      ctx.throw(404, '词汇表不存在');
    }

    ctx.body = { deleted: true };
  });

  router.post('/vocabularies/:id/audio/regenerate', async (ctx: Context) => {
    const body = (ctx.request.body ?? {}) as Record<string, unknown>;
    const word = typeof body.word === 'string' ? body.word : '';
    const voice = typeof body.voice === 'string' ? body.voice : undefined;
    const speedRaw = body.speed;

    if (!word.trim()) {
      ctx.throw(400, '词汇不能为空');
    }

    const options: TtsRegenerateOptions = {};
    if (voice !== undefined) {
      const validVoice = SUPPORTED_TTS_VOICES.find((item) => item === voice);
      if (!validVoice) {
        ctx.throw(400, '音色不支持');
      }
      options.voice = validVoice;
    }

    if (speedRaw !== undefined) {
      const speedNumber =
        typeof speedRaw === 'number'
          ? speedRaw
          : typeof speedRaw === 'string'
            ? Number(speedRaw)
            : Number.NaN;
      if (!Number.isFinite(speedNumber) || speedNumber < 0.5 || speedNumber > 2) {
        ctx.throw(400, '速度参数必须在 0.5 到 2 之间');
      }
      options.speed = speedNumber;
    }

    let item;
    try {
      item = await regenerateVocabularyWordAudio(ctx.params.id, word, options);
    } catch (error) {
      ctx.throw(400, (error as Error).message || '重新生成词汇音频失败');
    }

    if (!item) {
      ctx.throw(404, '词汇表不存在');
    }

    ctx.body = { item };
  });

  return router.routes();
};
