import Router from '@koa/router';
import type { Context } from 'koa';
import {
  createVocabularyBook,
  deleteVocabularyBook,
  getVocabularyBooks,
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

  return router.routes();
};
