import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const envFilePath = fileURLToPath(new URL('../.env', import.meta.url));

function loadEnvFile() {
  if (!existsSync(envFilePath)) {
    return;
  }

  const content = readFileSync(envFilePath, 'utf-8');
  content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .forEach((line) => {
      const equalIndex = line.indexOf('=');
      if (equalIndex <= 0) {
        return;
      }
      const key = line.slice(0, equalIndex).trim();
      const value = line.slice(equalIndex + 1).trim();
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
}

loadEnvFile();

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return fallback;
}

function resolveDirectoryPath(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();

  if (!normalized) {
    return fallback;
  }

  if (path.isAbsolute(normalized)) {
    return normalized;
  }

  return path.resolve(process.cwd(), normalized);
}

const defaultDataDirPath = fileURLToPath(new URL('../data', import.meta.url));
const defaultFrontendDistDirPath = fileURLToPath(new URL('../../client/dist', import.meta.url));

export const envConfig = {
  dataDirPath: resolveDirectoryPath(process.env.DATA_DIR, defaultDataDirPath),
  frontendDistDirPath: resolveDirectoryPath(
    process.env.FRONTEND_DIST_DIR,
    defaultFrontendDistDirPath
  ),
  bigModelApiKey: process.env.BIGMODEL_API_KEY ?? '',
  bigModelTtsUrl:
    process.env.BIGMODEL_TTS_URL ?? 'https://open.bigmodel.cn/api/paas/v4/audio/speech',
  bigModelTtsModel: process.env.BIGMODEL_TTS_MODEL ?? 'glm-tts',
  bigModelTtsVoice: process.env.BIGMODEL_TTS_VOICE ?? 'female',
  bigModelTtsFormat: process.env.BIGMODEL_TTS_FORMAT ?? 'wav',
  bigModelTtsSpeed: parseNumber(process.env.BIGMODEL_TTS_SPEED, 1),
  bigModelTtsVolume: parseNumber(process.env.BIGMODEL_TTS_VOLUME, 1),
};
