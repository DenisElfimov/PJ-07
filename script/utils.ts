import type { CommentType } from './comment.js';

export interface ElementsType {
  [key: string]: HTMLElement;
}

export function getElements(basis: HTMLElement, elements: ElementsType) {
  [...basis.querySelectorAll('[data-element]')].forEach((element: Element) => {
    if (element instanceof HTMLElement) {
      elements[element.dataset.element as string] = element;
    }
  });
}

export const _ = () => {};

export function createUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const rawValue = localStorage.getItem(key);

    if (!rawValue) return fallback;

    const parsedValue = JSON.parse(rawValue);

    return parsedValue ?? fallback;
  } catch {
    return fallback;
  }
}

export function getStoredComments(): CommentType[] {
  const comments = readStorage<CommentType[]>('comments', []);

  return Array.isArray(comments)
    ? comments.filter((comment) => Boolean(comment) && typeof comment === 'object')
    : [];
}

export function getStoredFavorites(): CommentType[] {
  const favorites = readStorage<CommentType[]>('favorite', []);

  return Array.isArray(favorites)
    ? favorites.filter((comment) => Boolean(comment) && typeof comment === 'object')
    : [];
}

export function normalizeStoredComments(): CommentType[] {
  const comments = getStoredComments();
  const usedIds = new Set<string>();
  let hasChanges = false;

  comments.forEach((comment) => {
    if (typeof comment.uuid !== 'string' || !comment.uuid || usedIds.has(comment.uuid)) {
      comment.uuid = createUuid();
      hasChanges = true;
    }

    usedIds.add(comment.uuid);

    if (!comment.date || Number.isNaN(new Date(comment.date).getTime())) {
      comment.date = new Date().toISOString();
      hasChanges = true;
    }

    if (typeof comment.favorite !== 'boolean') {
      comment.favorite = false;
      hasChanges = true;
    }

    if (!Number.isFinite(Number(comment.rating))) {
      comment.rating = 0;
      hasChanges = true;
    }
  });

  comments.forEach((comment) => {
    const mutableComment = comment as unknown as { parent?: string; uuid: string };

    if (
      mutableComment.parent &&
      (mutableComment.parent === mutableComment.uuid ||
        !usedIds.has(mutableComment.parent))
    ) {
      mutableComment.parent = undefined;
      hasChanges = true;
    }
  });

  if (hasChanges) {
    localStorage.setItem('comments', JSON.stringify(comments));
  }

  return comments;
}

function getDateTime(value: string): number {
  const time = new Date(value).getTime();

  return Number.isNaN(time) ? 0 : time;
}

export function sortBy(comments: CommentType[]): CommentType[] {
  const sortAttribute = localStorage.getItem('sort');
  const sortedComments = [...comments];

  switch (sortAttribute) {
    case 'date':
      return sortedComments.sort((a, b) => getDateTime(a.date) - getDateTime(b.date));

    case 'rating':
      return sortedComments.sort((a, b) => b.rating - a.rating);

    case 'replies': {
      const storedComments = getStoredComments();
      const commentsWithReplyCount = sortedComments.map((comment) => ({
        ...comment,
        replyCount: storedComments.filter((item) => item.parent === comment.uuid).length,
      }));

      return commentsWithReplyCount.sort((a, b) => b.replyCount - a.replyCount);
    }

    case 'relevance':
    default:
      return sortedComments.sort((a, b) => getDateTime(b.date) - getDateTime(a.date));
  }
}
