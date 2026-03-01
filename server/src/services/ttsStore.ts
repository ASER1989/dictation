import { createHash } from 'crypto';
import { constants } from 'fs';
import { access, mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { envConfig } from '../config/env';
import type { WordAudioItem } from '../types/vocabulary';

type WordAudioCache = Record<
  string,
  {
    word: string;
    audioFileName: string;
    audioRelativePath: string;
    updatedAt: string;
  }
>;

const dataDirPath = fileURLToPath(new URL('../data', import.meta.url));
const audioDirPath = path.join(dataDirPath, 'audio');
const audioMapFilePath = path.join(dataDirPath, 'wordAudioMap.json');

function normalizeWord(word: string) {
  return word.trim();
}

function getWordHash(word: string) {
  return createHash('sha1').update(word).digest('hex').slice(0, 16);
}

function getAudioFileName(word: string) {
  return `${getWordHash(word)}.${envConfig.bigModelTtsFormat}`;
}

export function getAudioAbsolutePath(fileName: string) {
  return path.join(audioDirPath, fileName);
}

function toRelativeAudioPath(fileName: string) {
  return `data/audio/${fileName}`;
}

async function ensureDataFiles() {
  await mkdir(audioDirPath, { recursive: true });

  try {
    await access(audioMapFilePath, constants.F_OK);
  } catch {
    await writeFile(audioMapFilePath, '{}', 'utf-8');
  }
}

async function readAudioCache(): Promise<WordAudioCache> {
  await ensureDataFiles();
  const content = await readFile(audioMapFilePath, 'utf-8');
  if (!content.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(content) as WordAudioCache;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
    return {};
  } catch {
    return {};
  }
}

async function saveAudioCache(cache: WordAudioCache) {
  await ensureDataFiles();
  await writeFile(audioMapFilePath, JSON.stringify(cache, null, 2), 'utf-8');
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function requestWordAudio(word: string): Promise<Buffer> {
  if (!envConfig.bigModelApiKey) {
    throw new Error('BIGMODEL_API_KEY 未配置，无法生成词汇语音');
  }

  const response = await fetch(envConfig.bigModelTtsUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${envConfig.bigModelApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: envConfig.bigModelTtsModel,
      input: word,
      voice: envConfig.bigModelTtsVoice,
      speed: envConfig.bigModelTtsSpeed,
      volume: envConfig.bigModelTtsVolume,
      response_format: envConfig.bigModelTtsFormat,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`词汇语音生成失败(${response.status}): ${errorText.slice(0, 200)}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error('词汇语音生成失败：响应内容为空');
  }
  return buffer;
}

async function createOrReuseWordAudio(
  word: string,
  cache: WordAudioCache
): Promise<{ item: WordAudioItem; cacheUpdated: boolean }> {
  const normalizedWord = normalizeWord(word);
  const cachedItem = cache[normalizedWord];

  if (cachedItem) {
    const targetAudioPath = path.join(audioDirPath, cachedItem.audioFileName);
    if (await fileExists(targetAudioPath)) {
      return {
        item: {
          word: cachedItem.word,
          audioFileName: cachedItem.audioFileName,
          audioRelativePath: cachedItem.audioRelativePath,
        },
        cacheUpdated: false,
      };
    }
  }

  const fileName = getAudioFileName(normalizedWord);
  const absolutePath = path.join(audioDirPath, fileName);
  const relativePath = toRelativeAudioPath(fileName);

  if (!(await fileExists(absolutePath))) {
    const audioBuffer = await requestWordAudio(normalizedWord);
    await writeFile(absolutePath, audioBuffer);
  }

  cache[normalizedWord] = {
    word: normalizedWord,
    audioFileName: fileName,
    audioRelativePath: relativePath,
    updatedAt: new Date().toISOString(),
  };

  return {
    item: {
      word: normalizedWord,
      audioFileName: fileName,
      audioRelativePath: relativePath,
    },
    cacheUpdated: true,
  };
}

export async function ensureWordAudios(words: string[]): Promise<WordAudioItem[]> {
  await ensureDataFiles();
  const normalizedWords = Array.from(
    new Set(words.map((word) => normalizeWord(word)).filter((word) => word.length > 0))
  );

  if (normalizedWords.length === 0) {
    return [];
  }

  const cache = await readAudioCache();
  let cacheUpdated = false;
  const result: WordAudioItem[] = [];

  for (const word of normalizedWords) {
    const resolved = await createOrReuseWordAudio(word, cache);
    result.push(resolved.item);
    cacheUpdated = cacheUpdated || resolved.cacheUpdated;
  }

  if (cacheUpdated) {
    await saveAudioCache(cache);
  }

  return result;
}
