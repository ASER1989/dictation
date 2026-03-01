import {Context, Middleware, Next} from 'koa';

type ResponseModel<T> = {
  success: boolean;
  data: T | null;
  error: string | undefined;
};

function responseModel<T>(data: T | null, error?: string): ResponseModel<T> {
  return {
    success: error === undefined,
    data,
    error,
  };
}

export const useResponseFormatter: () => Middleware = () => {
  return async function (ctx: Context, next: Next) {
    if (!/\/api\//.test(ctx.path)) {
      return await next();
    }

    try {
      const result = await next();
      if (ctx.body instanceof Error) {
        ctx.body = responseModel(null, ctx.body.message);
      } else if (!ctx.body) {
        ctx.body = responseModel(result);
      }
    } catch (ex) {
      ctx.body = responseModel(null, (ex as Error).message.toString());
    }
  };
};
