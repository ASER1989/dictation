import { constants } from 'fs';
import { access, readFile } from 'fs/promises';
import path from 'path';
import type { Context, Middleware, Next } from 'koa';

const STATIC_ASSET_CACHE_CONTROL = 'public, max-age=31536000, immutable';

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function decodePath(pathValue: string): string {
  try {
    return decodeURIComponent(pathValue);
  } catch {
    return pathValue;
  }
}

function isSafeChildPath(parentPath: string, childPath: string): boolean {
  const relativePath = path.relative(parentPath, childPath);

  return (
    relativePath === '' ||
    (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
  );
}

function hasExtension(pathname: string): boolean {
  return path.extname(pathname) !== '';
}

function toRequestFilePath(distDirPath: string, requestPath: string): string {
  const normalizedPath = requestPath === '/' ? '/index.html' : requestPath;
  return path.resolve(distDirPath, `.${normalizedPath}`);
}

export function useFrontendProxy(distDirPath: string): Middleware {
  const resolvedDistDirPath = path.resolve(distDirPath);

  return async function frontendProxy(ctx: Context, next: Next) {
    await next();

    if (ctx.method !== 'GET' && ctx.method !== 'HEAD') {
      return;
    }
    if (ctx.path.startsWith('/api/')) {
      return;
    }
    if (ctx.body !== undefined && ctx.body !== null) {
      return;
    }
    if (!(await fileExists(resolvedDistDirPath))) {
      return;
    }

    const decodedPath = decodePath(ctx.path);
    const requestFilePath = toRequestFilePath(resolvedDistDirPath, decodedPath);

    if (!isSafeChildPath(resolvedDistDirPath, requestFilePath)) {
      ctx.throw(400, '非法请求路径');
    }

    const requestHasExtension = hasExtension(decodedPath);
    let targetPath = requestFilePath;

    if (!(await fileExists(targetPath))) {
      if (requestHasExtension) {
        return;
      }

      targetPath = path.join(resolvedDistDirPath, 'index.html');
      if (!(await fileExists(targetPath))) {
        return;
      }
    }

    ctx.status = 200;
    ctx.type = path.extname(targetPath) || 'text/html';
    if (targetPath.endsWith('.html')) {
      ctx.set('Cache-Control', 'no-cache');
    } else {
      ctx.set('Cache-Control', STATIC_ASSET_CACHE_CONTROL);
    }

    if (ctx.method === 'HEAD') {
      return;
    }

    ctx.body = await readFile(targetPath);
  };
}
