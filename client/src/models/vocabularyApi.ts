import type { BookGrade } from "@client/types/books";
import type {
  ClientVocabularyItem,
  DictationData,
  VocabularyBook,
  VocabularyBookPayload,
} from "@client/types/vocabulary";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

type ListResponse = {
  items: VocabularyBook[];
};

type ItemResponse = {
  item: VocabularyBook;
};

type ClientListResponse = {
  items: ClientVocabularyItem[];
};

type ClientBookTreeResponse = {
  items: BookGrade[];
};

async function parseResponse<T>(response: Response): Promise<T> {
  const json = await response.json();

  if (!response.ok) {
    if (json?.error && typeof json.error === "string") {
      throw new Error(json.error);
    }
    throw new Error("请求失败");
  }

  if (json && typeof json === "object" && "success" in json) {
    const wrapped = json as ApiResponse<T>;
    if (!wrapped.success) {
      throw new Error(wrapped.error || "请求失败");
    }
    return wrapped.data;
  }

  return json as T;
}

export async function fetchVocabularyBooks(): Promise<VocabularyBook[]> {
  const response = await fetch("/api/vocabularies");
  const data = await parseResponse<ListResponse>(response);
  return data.items;
}

export async function fetchClientVocabularyBooks(): Promise<ClientVocabularyItem[]> {
  const response = await fetch("/api/client/vocabularies");
  const data = await parseResponse<ClientListResponse>(response);
  return data.items;
}

export async function fetchClientBooksTree(): Promise<BookGrade[]> {
  const response = await fetch("/api/client/books/tree");
  const data = await parseResponse<ClientBookTreeResponse>(response);
  return data.items;
}

export async function createVocabulary(payload: VocabularyBookPayload): Promise<VocabularyBook> {
  const response = await fetch("/api/vocabularies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<ItemResponse>(response);
  return data.item;
}

export async function updateVocabulary(
  id: string,
  payload: VocabularyBookPayload,
): Promise<VocabularyBook> {
  const response = await fetch(`/api/vocabularies/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<ItemResponse>(response);
  return data.item;
}

export async function deleteVocabulary(id: string): Promise<void> {
  const response = await fetch(`/api/vocabularies/${id}`, {
    method: "DELETE",
  });
  await parseResponse<{ deleted: boolean }>(response);
}

export async function fetchDictationData(vocabularyId: string): Promise<DictationData> {
  const response = await fetch(`/api/client/vocabularies/${vocabularyId}/dictation`);
  return await parseResponse<DictationData>(response);
}
