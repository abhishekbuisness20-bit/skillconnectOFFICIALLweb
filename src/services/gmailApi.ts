const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

export class GmailAuthExpiredError extends Error {
  constructor(message = 'Your Google authorization session expired. Please sign in with Google again.') {
    super(message);
    this.name = 'GmailAuthExpiredError';
  }
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId?: string;
}

export interface GmailLabel {
  id: string;
  name: string;
  type?: 'system' | 'user' | string;
  messagesTotal?: number;
  messagesUnread?: number;
}

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessagePart {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: {
    size?: number;
    data?: string;
    attachmentId?: string;
  };
  parts?: GmailMessagePart[];
}

export interface GmailRawMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  payload?: GmailMessagePart;
}

export interface ParsedGmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  messageIdHeader: string;
  referencesHeader: string;
  isUnread: boolean;
  isStarred: boolean;
  bodyText: string;
  internalDateMs: number;
}

function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

export function validateRecipientList(rawTo: string): { valid: boolean; cleaned: string; error?: string } {
  const cleaned = sanitizeHeaderValue(rawTo);
  if (!cleaned) {
    return { valid: false, cleaned: '', error: 'Please provide at least one recipient email address.' };
  }
  const parts = cleaned
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return { valid: false, cleaned: '', error: 'Please provide a valid recipient email address.' };
  }
  const emailRegex = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
  for (const part of parts) {
    const bracketMatch = part.match(/<([^<>]+)>$/);
    const addr = bracketMatch ? bracketMatch[1].trim() : part;
    if (!emailRegex.test(addr)) {
      return {
        valid: false,
        cleaned,
        error: `Invalid recipient email address: "${part}".`,
      };
    }
  }
  return { valid: true, cleaned: parts.join(', ') };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function encodeBase64UrlUtf8(input: string): string {
  const bytes = new TextEncoder().encode(input);
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64UrlUtf8(data?: string): string {
  if (!data) return '';
  try {
    const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + '='.repeat(padLength);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return '';
  }
}

function htmlToSafePlainText(html: string): string {
  if (!html) return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    doc.querySelectorAll('script, style, noscript').forEach((el) => el.remove());
    return (doc.body?.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
  } catch {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

function findPartData(part: GmailMessagePart | undefined, mimeType: string): string {
  if (!part) return '';
  if (part.mimeType === mimeType && part.body?.data) {
    return decodeBase64UrlUtf8(part.body.data);
  }
  if (Array.isArray(part.parts)) {
    for (const child of part.parts) {
      const found = findPartData(child, mimeType);
      if (found) return found;
    }
  }
  return '';
}

function decodeEntities(text: string): string {
  if (!text) return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    return doc.body?.textContent || text;
  } catch {
    return text;
  }
}

function getHeader(headers: GmailHeader[] | undefined, name: string): string {
  if (!headers) return '';
  const lower = name.toLowerCase();
  const match = headers.find((h) => h.name.toLowerCase() === lower);
  return match?.value || '';
}

export function parseGmailMessage(raw: GmailRawMessage): ParsedGmailMessage {
  const headers = raw.payload?.headers;
  const labelIds = Array.isArray(raw.labelIds) ? raw.labelIds : [];
  const plainBody = findPartData(raw.payload, 'text/plain');
  const htmlBody = plainBody ? '' : findPartData(raw.payload, 'text/html');
  const fallbackDirect =
    !plainBody && !htmlBody && raw.payload?.body?.data
      ? decodeBase64UrlUtf8(raw.payload.body.data)
      : '';

  const bodyText =
    plainBody.trim() ||
    htmlToSafePlainText(htmlBody) ||
    fallbackDirect.trim() ||
    decodeEntities(raw.snippet || '');

  return {
    id: raw.id,
    threadId: raw.threadId,
    labelIds,
    snippet: decodeEntities(raw.snippet || ''),
    subject: getHeader(headers, 'Subject') || '(No subject)',
    from: getHeader(headers, 'From') || 'Unknown sender',
    to: getHeader(headers, 'To') || '',
    date: getHeader(headers, 'Date') || '',
    messageIdHeader: getHeader(headers, 'Message-ID'),
    referencesHeader: getHeader(headers, 'References'),
    isUnread: labelIds.includes('UNREAD'),
    isStarred: labelIds.includes('STARRED'),
    bodyText,
    internalDateMs: Number(raw.internalDate || 0),
  };
}

async function gmailFetch<T>(
  accessToken: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${GMAIL_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });

  if (res.status === 401 || res.status === 403) {
    const errPayload = await res.json().catch(() => ({}));
    const msg =
      errPayload?.error?.message ||
      'Google authorization expired or missing Gmail permissions. Please reconnect Google Sign-In.';
    if (res.status === 401) {
      throw new GmailAuthExpiredError(msg);
    }
    throw new Error(msg);
  }

  if (res.status === 204) {
    return {} as T;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Gmail API error (${res.status}).`);
  }
  return data as T;
}

export async function fetchGmailProfile(accessToken: string): Promise<GmailProfile> {
  return gmailFetch<GmailProfile>(accessToken, '/profile');
}

export async function fetchGmailLabels(accessToken: string): Promise<GmailLabel[]> {
  const data = await gmailFetch<{ labels?: GmailLabel[] }>(accessToken, '/labels');
  return Array.isArray(data.labels) ? data.labels : [];
}

export async function createGmailLabel(accessToken: string, name: string): Promise<GmailLabel> {
  const cleanName = sanitizeHeaderValue(name).slice(0, 60);
  if (!cleanName) {
    throw new Error('Label name cannot be empty.');
  }
  return gmailFetch<GmailLabel>(accessToken, '/labels', {
    method: 'POST',
    body: JSON.stringify({
      name: cleanName,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show',
    }),
  });
}

export async function getGmailMessage(
  accessToken: string,
  messageId: string
): Promise<ParsedGmailMessage> {
  const raw = await gmailFetch<GmailRawMessage>(
    accessToken,
    `/messages/${encodeURIComponent(messageId)}?format=full`
  );
  return parseGmailMessage(raw);
}

export async function listGmailMessages(
  accessToken: string,
  options: {
    q?: string;
    labelId?: string;
    maxResults?: number;
    pageToken?: string;
  } = {}
): Promise<{ messages: ParsedGmailMessage[]; nextPageToken?: string }> {
  const params = new URLSearchParams();
  params.set('maxResults', String(options.maxResults ?? 15));
  if (options.q?.trim()) {
    params.set('q', options.q.trim());
  }
  if (options.labelId && options.labelId !== 'ALL') {
    params.set('labelIds', options.labelId);
  }
  if (options.pageToken) {
    params.set('pageToken', options.pageToken);
  }

  const listData = await gmailFetch<{
    messages?: { id: string; threadId: string }[];
    nextPageToken?: string;
  }>(accessToken, `/messages?${params.toString()}`);

  const stubs = Array.isArray(listData.messages) ? listData.messages : [];
  if (stubs.length === 0) {
    return { messages: [], nextPageToken: listData.nextPageToken };
  }

  const loaded = await Promise.all(
    stubs.slice(0, 15).map((stub) => getGmailMessage(accessToken, stub.id))
  );

  return {
    messages: loaded,
    nextPageToken: listData.nextPageToken,
  };
}

function buildEncodedMimeMessage(input: {
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string;
}): string {
  const { valid, cleaned, error } = validateRecipientList(input.to);
  if (!valid) {
    throw new Error(error || 'Invalid recipient email address.');
  }

  const safeSubject = sanitizeHeaderValue(input.subject).slice(0, 240) || '(No subject)';
  const encodedSubject = bytesToBase64(new TextEncoder().encode(safeSubject));
  const lines = [
    `To: ${cleaned}`,
    `Subject: =?UTF-8?B?${encodedSubject}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
  ];

  if (input.inReplyTo) {
    lines.push(`In-Reply-To: ${sanitizeHeaderValue(input.inReplyTo)}`);
  }
  if (input.references) {
    lines.push(`References: ${sanitizeHeaderValue(input.references)}`);
  }

  lines.push('', input.body.replace(/\r?\n/g, '\r\n'));
  return encodeBase64UrlUtf8(lines.join('\r\n'));
}

export async function sendGmailMessage(
  accessToken: string,
  input: {
    to: string;
    subject: string;
    body: string;
    threadId?: string;
    inReplyTo?: string;
    references?: string;
  }
): Promise<GmailRawMessage> {
  const raw = buildEncodedMimeMessage(input);
  return gmailFetch<GmailRawMessage>(accessToken, '/messages/send', {
    method: 'POST',
    body: JSON.stringify({
      raw,
      ...(input.threadId ? { threadId: input.threadId } : {}),
    }),
  });
}

export async function createGmailDraft(
  accessToken: string,
  input: {
    to: string;
    subject: string;
    body: string;
    threadId?: string;
  }
): Promise<{ id: string }> {
  const raw = buildEncodedMimeMessage(input);
  return gmailFetch<{ id: string }>(accessToken, '/drafts', {
    method: 'POST',
    body: JSON.stringify({
      message: {
        raw,
        ...(input.threadId ? { threadId: input.threadId } : {}),
      },
    }),
  });
}

export async function modifyGmailMessageLabels(
  accessToken: string,
  messageId: string,
  updates: { addLabelIds?: string[]; removeLabelIds?: string[] }
): Promise<GmailRawMessage> {
  return gmailFetch<GmailRawMessage>(
    accessToken,
    `/messages/${encodeURIComponent(messageId)}/modify`,
    {
      method: 'POST',
      body: JSON.stringify({
        addLabelIds: updates.addLabelIds || [],
        removeLabelIds: updates.removeLabelIds || [],
      }),
    }
  );
}

export async function trashGmailMessage(
  accessToken: string,
  messageId: string
): Promise<GmailRawMessage> {
  return gmailFetch<GmailRawMessage>(
    accessToken,
    `/messages/${encodeURIComponent(messageId)}/trash`,
    {
      method: 'POST',
    }
  );
}

export async function deleteGmailMessagePermanently(
  accessToken: string,
  messageId: string
): Promise<void> {
  await gmailFetch<Record<string, never>>(
    accessToken,
    `/messages/${encodeURIComponent(messageId)}`,
    {
      method: 'DELETE',
    }
  );
}
