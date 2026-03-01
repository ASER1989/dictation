import { mkdir, readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { ensureWordAudios } from './ttsStore';
import type { VocabularyBook, VocabularyBookInput } from '../types/vocabulary';

const dataFilePath = new URL('../data/vocabularies.json', import.meta.url);
const dataFilePathname = fileURLToPath(dataFilePath);

function normalizeWords(words?: string[]): string[] {
  if (!Array.isArray(words)) {
    return [];
  }

  return words
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

async function ensureDataFile() {
  const filePath = dataFilePathname;
  const dirPath = path.dirname(filePath);
  await mkdir(dirPath, { recursive: true });

  try {
    await readFile(filePath, 'utf-8');
  } catch (error) {
    await writeFile(filePath, '[]', 'utf-8');
  }
}

export async function getVocabularyBooks(): Promise<VocabularyBook[]> {
  await ensureDataFile();
  const content = await readFile(dataFilePathname, 'utf-8');

  if (!content.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(content) as VocabularyBook[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveVocabularyBooks(books: VocabularyBook[]) {
  await ensureDataFile();
  await writeFile(dataFilePathname, JSON.stringify(books, null, 2), 'utf-8');
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createVocabularyBook(input: VocabularyBookInput): Promise<VocabularyBook> {
  const books = await getVocabularyBooks();
  const timestamp = new Date().toISOString();
  const normalizedWords = normalizeWords(input.words);
  const wordAudios = await ensureWordAudios(normalizedWords);
  const newBook: VocabularyBook = {
    id: createId(),
    name: input.name.trim(),
    grade: input.grade.trim(),
    version: input.version.trim(),
    unit: input.unit.trim(),
    lesson: (input.lesson ?? '').trim(),
    words: normalizedWords,
    wordAudios,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  books.push(newBook);
  await saveVocabularyBooks(books);
  return newBook;
}

function isWordAudioListEqual(
  left: VocabularyBook['wordAudios'] | undefined,
  right: VocabularyBook['wordAudios'] | undefined
) {
  if (!left && !right) {
    return true;
  }
  if (!left || !right || left.length !== right.length) {
    return false;
  }

  return left.every((item, index) => {
    const rightItem = right[index];
    return (
      item.word === rightItem.word &&
      item.audioFileName === rightItem.audioFileName &&
      item.audioRelativePath === rightItem.audioRelativePath
    );
  });
}

export async function updateVocabularyBook(
  id: string,
  input: VocabularyBookInput
): Promise<VocabularyBook | null> {
  const books = await getVocabularyBooks();
  const target = books.find((item) => item.id === id);

  if (!target) {
    return null;
  }

  const normalizedWords = normalizeWords(input.words);
  const wordAudios = await ensureWordAudios(normalizedWords);
  target.name = input.name.trim();
  target.grade = input.grade.trim();
  target.version = input.version.trim();
  target.unit = input.unit.trim();
  target.lesson = (input.lesson ?? '').trim();
  target.words = normalizedWords;
  target.wordAudios = wordAudios;
  target.updatedAt = new Date().toISOString();

  await saveVocabularyBooks(books);
  return target;
}

export async function getVocabularyBookForDictation(id: string): Promise<VocabularyBook | null> {
  const books = await getVocabularyBooks();
  const target = books.find((item) => item.id === id);

  if (!target) {
    return null;
  }

  const normalizedWords = normalizeWords(target.words);
  const wordAudios = await ensureWordAudios(normalizedWords);

  const wordsChanged =
    target.words.length !== normalizedWords.length ||
    target.words.some((item, index) => item !== normalizedWords[index]);
  const audiosChanged = !isWordAudioListEqual(target.wordAudios, wordAudios);

  if (wordsChanged || audiosChanged) {
    target.words = normalizedWords;
    target.wordAudios = wordAudios;
    target.updatedAt = new Date().toISOString();
    await saveVocabularyBooks(books);
  }

  return target;
}

export async function deleteVocabularyBook(id: string): Promise<boolean> {
  const books = await getVocabularyBooks();
  const nextBooks = books.filter((item) => item.id !== id);

  if (nextBooks.length === books.length) {
    return false;
  }

  await saveVocabularyBooks(nextBooks);
  return true;
}
