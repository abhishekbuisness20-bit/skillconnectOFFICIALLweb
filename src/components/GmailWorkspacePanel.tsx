import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  FileText,
  Inbox,
  Mail,
  MailOpen,
  PenSquare,
  Plus,
  RefreshCw,
  Reply,
  Search,
  Send,
  Star,
  Tag,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  createGmailDraft,
  createGmailLabel,
  deleteGmailMessagePermanently,
  fetchGmailLabels,
  fetchGmailProfile,
  GmailAuthExpiredError,
  GmailLabel,
  GmailProfile,
  listGmailMessages,
  modifyGmailMessageLabels,
  ParsedGmailMessage,
  sendGmailMessage,
  trashGmailMessage,
  validateRecipientList,
} from '../services/gmailApi';
import { GmailConfirmationRequest, GmailConfirmModal } from './GmailConfirmModal';
import { GoogleSignInButton } from './GoogleSignInButton';

export interface GmailComposePreset {
  to?: string;
  subject: string;
  body: string;
  nonce: number;
}

interface GmailWorkspacePanelProps {
  composePreset?: GmailComposePreset | null;
}

const FOLDER_FILTERS: { id: string; label: string }[] = [
  { id: 'INBOX', label: 'Inbox' },
  { id: 'STARRED', label: 'Starred' },
  { id: 'SENT', label: 'Sent' },
  { id: 'DRAFT', label: 'Drafts' },
  { id: 'ALL', label: 'All Mail' },
];

export function GmailWorkspacePanel({ composePreset }: GmailWorkspacePanelProps) {
  const { gmailAccessToken, connectGmailAccount, clearGmailAccessToken, authError } = useAuth();

  const [connecting, setConnecting] = useState(false);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [gmailError, setGmailError] = useState('');
  const [gmailNotice, setGmailNotice] = useState('');

  const [gmailProfile, setGmailProfile] = useState<GmailProfile | null>(null);
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [messages, setMessages] = useState<ParsedGmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ParsedGmailMessage | null>(null);

  const [activeLabel, setActiveLabel] = useState<string>('INBOX');
  const [searchInput, setSearchInput] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');

  // Compose / Reply State
  const [composerOpen, setComposerOpen] = useState(false);
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [replyMeta, setReplyMeta] = useState<{
    threadId?: string;
    inReplyTo?: string;
    references?: string;
  } | null>(null);

  // Label creation input
  const [newLabelName, setNewLabelName] = useState('');

  // Mandatory explicit confirmation state for all Gmail mutations
  const [pendingConfirm, setPendingConfirm] = useState<{
    request: GmailConfirmationRequest;
    execute: () => Promise<void>;
  } | null>(null);
  const [mutating, setMutating] = useState(false);

  const handleApiError = useCallback(
    (err: unknown, fallback: string) => {
      if (err instanceof GmailAuthExpiredError) {
        clearGmailAccessToken();
        setGmailError(err.message);
        return;
      }
      setGmailError(err instanceof Error ? err.message : fallback);
    },
    [clearGmailAccessToken]
  );

  const loadMailbox = useCallback(
    async (token: string, labelId = activeLabel, query = appliedQuery) => {
      setLoadingInbox(true);
      setGmailError('');
      try {
        const [profileRes, labelsRes, msgsRes] = await Promise.all([
          fetchGmailProfile(token),
          fetchGmailLabels(token),
          listGmailMessages(token, {
            labelId,
            q: query,
            maxResults: 15,
          }),
        ]);
        setGmailProfile(profileRes);
        setLabels(labelsRes);
        setMessages(msgsRes.messages);
        setSelectedMessage((prev) => {
          if (!prev) return msgsRes.messages[0] || null;
          return msgsRes.messages.find((m) => m.id === prev.id) || msgsRes.messages[0] || null;
        });
      } catch (err) {
        handleApiError(err, 'Unable to load Gmail messages.');
      } finally {
        setLoadingInbox(false);
      }
    },
    [activeLabel, appliedQuery, handleApiError]
  );

  useEffect(() => {
    if (gmailAccessToken) {
      void loadMailbox(gmailAccessToken, activeLabel, appliedQuery);
    } else {
      setGmailProfile(null);
      setMessages([]);
      setSelectedMessage(null);
    }
  }, [gmailAccessToken, activeLabel, appliedQuery, loadMailbox]);

  useEffect(() => {
    if (composePreset) {
      setComposerOpen(true);
      setToEmail(composePreset.to || '');
      setSubject(composePreset.subject);
      setBody(composePreset.body);
      setReplyMeta(null);
    }
  }, [composePreset]);

  const handleConnect = async () => {
    setConnecting(true);
    setGmailError('');
    try {
      await connectGmailAccount();
    } finally {
      setConnecting(false);
    }
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setAppliedQuery(searchInput.trim());
  };

  const openReplyComposer = (msg: ParsedGmailMessage) => {
    const emailMatch = msg.from.match(/<([^<>]+)>/);
    const replyAddress = emailMatch ? emailMatch[1].trim() : msg.from.trim();
    const cleanSubject = msg.subject.toLowerCase().startsWith('re:')
      ? msg.subject
      : `Re: ${msg.subject}`;
    setToEmail(replyAddress);
    setSubject(cleanSubject);
    setBody(`\n\n--- On ${msg.date || 'earlier'}, ${msg.from} wrote:\n${msg.bodyText.slice(0, 600)}`);
    setReplyMeta({
      threadId: msg.threadId,
      inReplyTo: msg.messageIdHeader || undefined,
      references: msg.referencesHeader || msg.messageIdHeader || undefined,
    });
    setComposerOpen(true);
  };

  const requestConfirmAndRun = (
    request: GmailConfirmationRequest,
    execute: () => Promise<void>
  ) => {
    setGmailError('');
    setGmailNotice('');
    setPendingConfirm({ request, execute });
  };

  const handleConfirmExecute = async () => {
    if (!pendingConfirm) return;
    setMutating(true);
    setGmailError('');
    try {
      await pendingConfirm.execute();
      setPendingConfirm(null);
    } catch (err) {
      setPendingConfirm(null);
      handleApiError(err, 'Gmail action failed.');
    } finally {
      setMutating(false);
    }
  };

  const handleSendSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!gmailAccessToken) return;
    const validation = validateRecipientList(toEmail);
    if (!validation.valid) {
      setGmailError(validation.error || 'Please enter a valid recipient email.');
      return;
    }

    requestConfirmAndRun(
      {
        title: 'Send Email via Gmail?',
        description:
          'This will immediately send the message below from your connected Google Gmail account.',
        confirmLabel: 'Confirm & Send Email',
        details: [
          { label: 'To', value: validation.cleaned },
          { label: 'Subject', value: subject.trim() || '(No subject)' },
          {
            label: 'Preview',
            value: body.trim().slice(0, 260) + (body.trim().length > 260 ? '...' : ''),
          },
        ],
      },
      async () => {
        await sendGmailMessage(gmailAccessToken, {
          to: validation.cleaned,
          subject: subject.trim(),
          body,
          threadId: replyMeta?.threadId,
          inReplyTo: replyMeta?.inReplyTo,
          references: replyMeta?.references,
        });
        setComposerOpen(false);
        setToEmail('');
        setSubject('');
        setBody('');
        setReplyMeta(null);
        setGmailNotice(`Email sent to ${validation.cleaned}.`);
        await loadMailbox(gmailAccessToken);
      }
    );
  };

  const handleSaveDraftClick = () => {
    if (!gmailAccessToken) return;
    const validation = validateRecipientList(toEmail);
    if (!validation.valid) {
      setGmailError(validation.error || 'Please enter a recipient email before saving a draft.');
      return;
    }

    requestConfirmAndRun(
      {
        title: 'Save Draft in Gmail?',
        description: 'This will create a new draft inside your Gmail Drafts folder.',
        confirmLabel: 'Confirm Save Draft',
        details: [
          { label: 'To', value: validation.cleaned },
          { label: 'Subject', value: subject.trim() || '(No subject)' },
        ],
      },
      async () => {
        await createGmailDraft(gmailAccessToken, {
          to: validation.cleaned,
          subject: subject.trim(),
          body,
          threadId: replyMeta?.threadId,
        });
        setComposerOpen(false);
        setGmailNotice(`Draft "${subject.trim() || '(No subject)'}" saved to Gmail Drafts.`);
        await loadMailbox(gmailAccessToken);
      }
    );
  };

  const handleToggleStar = (msg: ParsedGmailMessage) => {
    if (!gmailAccessToken) return;
    const willStar = !msg.isStarred;
    requestConfirmAndRun(
      {
        title: willStar ? 'Add Star to Email?' : 'Remove Star from Email?',
        description: willStar
          ? 'This will add the STARRED label to this message in your Gmail account.'
          : 'This will remove the STARRED label from this message in your Gmail account.',
        confirmLabel: willStar ? 'Confirm Star' : 'Confirm Unstar',
        details: [
          { label: 'From', value: msg.from },
          { label: 'Subject', value: msg.subject },
        ],
      },
      async () => {
        await modifyGmailMessageLabels(gmailAccessToken, msg.id, {
          addLabelIds: willStar ? ['STARRED'] : [],
          removeLabelIds: willStar ? [] : ['STARRED'],
        });
        setGmailNotice(willStar ? 'Message starred.' : 'Star removed.');
        await loadMailbox(gmailAccessToken);
      }
    );
  };

  const handleToggleRead = (msg: ParsedGmailMessage) => {
    if (!gmailAccessToken) return;
    const markAsRead = msg.isUnread;
    requestConfirmAndRun(
      {
        title: markAsRead ? 'Mark Email as Read?' : 'Mark Email as Unread?',
        description: markAsRead
          ? 'This will mark the selected Gmail message as read.'
          : 'This will mark the selected Gmail message as unread.',
        confirmLabel: markAsRead ? 'Mark Read' : 'Mark Unread',
        details: [
          { label: 'From', value: msg.from },
          { label: 'Subject', value: msg.subject },
        ],
      },
      async () => {
        await modifyGmailMessageLabels(gmailAccessToken, msg.id, {
          addLabelIds: markAsRead ? [] : ['UNREAD'],
          removeLabelIds: markAsRead ? ['UNREAD'] : [],
        });
        setGmailNotice(markAsRead ? 'Marked as read.' : 'Marked as unread.');
        await loadMailbox(gmailAccessToken);
      }
    );
  };

  const handleArchiveMessage = (msg: ParsedGmailMessage) => {
    if (!gmailAccessToken) return;
    requestConfirmAndRun(
      {
        title: 'Archive Email from Inbox?',
        description:
          'Archiving removes this message from INBOX while keeping it accessible under All Mail.',
        confirmLabel: 'Confirm Archive',
        details: [
          { label: 'From', value: msg.from },
          { label: 'Subject', value: msg.subject },
        ],
      },
      async () => {
        await modifyGmailMessageLabels(gmailAccessToken, msg.id, {
          removeLabelIds: ['INBOX'],
        });
        setGmailNotice('Message archived.');
        await loadMailbox(gmailAccessToken);
      }
    );
  };

  const handleTrashMessage = (msg: ParsedGmailMessage) => {
    if (!gmailAccessToken) return;
    requestConfirmAndRun(
      {
        title: 'Move Email to Gmail Trash?',
        description: 'This will move the selected message into your Gmail Trash folder.',
        confirmLabel: 'Move to Trash',
        destructive: true,
        details: [
          { label: 'From', value: msg.from },
          { label: 'Subject', value: msg.subject },
        ],
      },
      async () => {
        await trashGmailMessage(gmailAccessToken, msg.id);
        setGmailNotice('Message moved to Gmail Trash.');
        await loadMailbox(gmailAccessToken);
      }
    );
  };

  const handleDeleteForever = (msg: ParsedGmailMessage) => {
    if (!gmailAccessToken) return;
    requestConfirmAndRun(
      {
        title: 'Permanently Delete Email?',
        description:
          'This action immediately and permanently deletes this email from Gmail and cannot be undone.',
        confirmLabel: 'Delete Forever',
        destructive: true,
        details: [
          { label: 'From', value: msg.from },
          { label: 'Subject', value: msg.subject },
        ],
      },
      async () => {
        await deleteGmailMessagePermanently(gmailAccessToken, msg.id);
        setGmailNotice('Message permanently deleted.');
        await loadMailbox(gmailAccessToken);
      }
    );
  };

  const handleCreateLabel = (e: FormEvent) => {
    e.preventDefault();
    if (!gmailAccessToken || !newLabelName.trim()) return;
    const labelText = newLabelName.trim();
    requestConfirmAndRun(
      {
        title: 'Create Gmail Label?',
        description: `Create a new custom label "${labelText}" in your Gmail account.`,
        confirmLabel: 'Create Label',
        details: [{ label: 'Label Name', value: labelText }],
      },
      async () => {
        await createGmailLabel(gmailAccessToken, labelText);
        setNewLabelName('');
        setGmailNotice(`Created Gmail label "${labelText}".`);
        await loadMailbox(gmailAccessToken);
      }
    );
  };

  const handleApplyLabelToSelected = (labelId: string, labelName: string) => {
    if (!gmailAccessToken || !selectedMessage) return;
    const hasLabel = selectedMessage.labelIds.includes(labelId);
    requestConfirmAndRun(
      {
        title: hasLabel ? `Remove Label "${labelName}"?` : `Apply Label "${labelName}"?`,
        description: hasLabel
          ? 'Remove this custom label from the selected email.'
          : 'Add this custom label to the selected email.',
        confirmLabel: hasLabel ? 'Remove Label' : 'Apply Label',
        details: [
          { label: 'Subject', value: selectedMessage.subject },
          { label: 'Label', value: labelName },
        ],
      },
      async () => {
        await modifyGmailMessageLabels(gmailAccessToken, selectedMessage.id, {
          addLabelIds: hasLabel ? [] : [labelId],
          removeLabelIds: hasLabel ? [labelId] : [],
        });
        setGmailNotice(hasLabel ? `Removed "${labelName}".` : `Applied "${labelName}".`);
        await loadMailbox(gmailAccessToken);
      }
    );
  };

  const customUserLabels = labels.filter((lbl) => lbl.type === 'user');

  return (
    <section
      id="gmail-workspace"
      className="space-y-6 pt-6 border-t border-white/10"
      aria-labelledby="gmail-hub-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-cyan-400">
            <Mail className="w-4 h-4" />
            <span>Gmail Business Inbox &amp; Client Outreach</span>
          </div>
          <h2 id="gmail-hub-heading" className="text-xl sm:text-2xl font-bold text-white">
            Connected Gmail Communications
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Read client inquiries, reply to service leads, manage labels, save drafts, and send outreach emails directly with your permission.
          </p>
        </div>

        {gmailAccessToken && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setReplyMeta(null);
                setComposerOpen((prev) => !prev);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors cursor-pointer"
            >
              <PenSquare className="w-3.5 h-3.5" />
              <span>{composerOpen ? 'Close Composer' : 'Compose Email'}</span>
            </button>
            <button
              type="button"
              onClick={() => void loadMailbox(gmailAccessToken)}
              disabled={loadingInbox}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/15 text-xs font-medium text-slate-200 hover:bg-white/5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingInbox ? 'animate-spin' : ''}`} />
              <span>Sync Inbox</span>
            </button>
          </div>
        )}
      </div>

      {(gmailError || authError) && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-xs text-rose-200">
          {gmailError || authError}
        </div>
      )}

      {gmailNotice && (
        <div className="rounded-xl border border-lime-500/30 bg-lime-950/30 px-4 py-3 flex items-center gap-2 text-xs text-lime-200">
          <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
          <span>{gmailNotice}</span>
        </div>
      )}

      {!gmailAccessToken ? (
        <div className="rounded-2xl border border-white/10 bg-[#090F22] p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-base font-bold text-white">Authorize Gmail Access for This Session</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Your Gmail access permission stays strictly in browser memory for security and is cleared automatically when you sign out or reload. Sign in with Google below whenever you want to read, compose, label, or send emails.
            </p>
          </div>
          <div className="shrink-0">
            <GoogleSignInButton
              onClick={() => void handleConnect()}
              disabled={connecting}
              label={connecting ? 'Connecting Gmail...' : 'Sign in with Google'}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Account Bar + Search + Folder Filters */}
          <div className="rounded-2xl border border-white/10 bg-[#090F22] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="font-semibold text-white">
                  {gmailProfile?.emailAddress || 'Connected Gmail Account'}
                </span>
                {gmailProfile && (
                  <span className="text-slate-400">
                    {gmailProfile.messagesTotal.toLocaleString('en-IN')} total messages ·{' '}
                    {gmailProfile.threadsTotal.toLocaleString('en-IN')} threads
                  </span>
                )}
              </div>

              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search Gmail (e.g. from:client, invoice)"
                    className="w-full rounded-lg border border-white/15 bg-[#050814] pl-9 pr-3 py-2 text-xs text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg border border-white/15 bg-white/5 text-xs font-medium text-white hover:bg-white/10 cursor-pointer"
                >
                  Search
                </button>
              </form>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                {FOLDER_FILTERS.map((folder) => {
                  const active = activeLabel === folder.id;
                  return (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => setActiveLabel(folder.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        active
                          ? 'bg-cyan-500 text-slate-950 font-semibold'
                          : 'bg-[#050814] text-slate-300 border border-white/10 hover:text-white'
                      }`}
                    >
                      {folder.label}
                    </button>
                  );
                })}
                {customUserLabels.slice(0, 6).map((lbl) => {
                  const active = activeLabel === lbl.id;
                  return (
                    <button
                      key={lbl.id}
                      type="button"
                      onClick={() => setActiveLabel(lbl.id)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        active
                          ? 'bg-lime-400 text-slate-950 font-semibold'
                          : 'bg-[#050814] text-slate-300 border border-white/10 hover:text-white'
                      }`}
                    >
                      <Tag className="w-3 h-3" />
                      <span>{lbl.name}</span>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleCreateLabel} className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={50}
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="New label name"
                  className="rounded-lg border border-white/15 bg-[#050814] px-3 py-1.5 text-xs text-white w-36"
                />
                <button
                  type="submit"
                  disabled={!newLabelName.trim()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/15 text-xs font-medium text-slate-200 hover:bg-white/5 cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Label</span>
                </button>
              </form>
            </div>
          </div>

          {/* Email Composer / Reply Card */}
          {composerOpen && (
            <form
              onSubmit={handleSendSubmit}
              className="rounded-2xl border border-cyan-500/30 bg-[#090F22] p-6 space-y-4"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-bold text-white">
                  {replyMeta ? 'Reply via Gmail' : 'Compose New Email'}
                </h3>
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="gmail-to" className="block text-xs text-slate-400 mb-1">
                    Recipient Email (To)
                  </label>
                  <input
                    id="gmail-to"
                    type="text"
                    required
                    placeholder="client@company.in"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label htmlFor="gmail-subject" className="block text-xs text-slate-400 mb-1">
                    Subject
                  </label>
                  <input
                    id="gmail-subject"
                    type="text"
                    required
                    placeholder="SkillConnect Service Proposal / Follow-up"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="gmail-body" className="block text-xs text-slate-400 mb-1">
                  Message
                </label>
                <textarea
                  id="gmail-body"
                  required
                  rows={5}
                  placeholder="Write your email message..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#050814] px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraftClick}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/15 text-xs font-semibold text-slate-200 hover:bg-white/5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Save Draft</span>
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Review &amp; Send Email</span>
                </button>
              </div>
            </form>
          )}

          {/* Split Mailbox List + Reader */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-[#090F22] divide-y divide-white/10 overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between text-xs text-slate-400 bg-[#070D1D]">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-200">
                  <Inbox className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Messages ({messages.length})</span>
                </span>
                {appliedQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      setAppliedQuery('');
                    }}
                    className="text-cyan-400 hover:underline cursor-pointer"
                  >
                    Clear search
                  </button>
                )}
              </div>

              {loadingInbox ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading Gmail messages...</div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No messages matched this folder or search query.
                </div>
              ) : (
                <div className="max-h-[540px] overflow-y-auto divide-y divide-white/10">
                  {messages.map((msg) => {
                    const isSelected = selectedMessage?.id === msg.id;
                    return (
                      <button
                        key={msg.id}
                        type="button"
                        onClick={() => setSelectedMessage(msg)}
                        className={`w-full text-left p-4 space-y-1 transition-colors cursor-pointer ${
                          isSelected ? 'bg-cyan-500/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs truncate ${
                              msg.isUnread ? 'font-bold text-white' : 'font-medium text-slate-300'
                            }`}
                          >
                            {msg.from.replace(/<[^>]+>/, '').trim() || msg.from}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {msg.isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                            {msg.isUnread && (
                              <span className="text-[10px] font-semibold text-cyan-400">Unread</span>
                            )}
                          </div>
                        </div>
                        <p
                          className={`text-xs truncate ${
                            msg.isUnread ? 'font-semibold text-slate-100' : 'text-slate-300'
                          }`}
                        >
                          {msg.subject}
                        </p>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{msg.snippet}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Email Reader */}
            <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#090F22] p-6 min-h-[360px] flex flex-col justify-between space-y-5">
              {!selectedMessage ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16 space-y-2">
                  <MailOpen className="w-8 h-8 text-slate-500" />
                  <p className="text-sm font-medium text-slate-300">Select an email to read</p>
                  <p className="text-xs text-slate-500">
                    Choose a message on the left or compose a new email above.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-white/10">
                      <div className="space-y-1">
                        <h3 className="text-base sm:text-lg font-bold text-white">
                          {selectedMessage.subject}
                        </h3>
                        <p className="text-xs text-slate-300">
                          <span className="text-slate-500">From:</span> {selectedMessage.from}
                        </p>
                        {selectedMessage.to && (
                          <p className="text-xs text-slate-400">
                            <span className="text-slate-500">To:</span> {selectedMessage.to}
                          </p>
                        )}
                        {selectedMessage.date && (
                          <p className="text-[11px] text-slate-500">{selectedMessage.date}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openReplyComposer(selectedMessage)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 cursor-pointer"
                        >
                          <Reply className="w-3.5 h-3.5" />
                          <span>Reply</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStar(selectedMessage)}
                          aria-label={selectedMessage.isStarred ? 'Unstar message' : 'Star message'}
                          className="p-2 rounded-lg border border-white/15 text-slate-200 hover:bg-white/5 cursor-pointer"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              selectedMessage.isStarred ? 'text-amber-400 fill-amber-400' : ''
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleRead(selectedMessage)}
                          className="px-2.5 py-1.5 rounded-lg border border-white/15 text-[11px] font-medium text-slate-200 hover:bg-white/5 cursor-pointer"
                        >
                          {selectedMessage.isUnread ? 'Mark Read' : 'Mark Unread'}
                        </button>
                        {selectedMessage.labelIds.includes('INBOX') && (
                          <button
                            type="button"
                            onClick={() => handleArchiveMessage(selectedMessage)}
                            title="Archive from Inbox"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/15 text-[11px] font-medium text-slate-200 hover:bg-white/5 cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            <span>Archive</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleTrashMessage(selectedMessage)}
                          title="Move to Gmail Trash"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-500/30 text-[11px] font-medium text-rose-300 hover:bg-rose-950/40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Trash</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteForever(selectedMessage)}
                          className="px-2.5 py-1.5 rounded-lg border border-rose-500/40 bg-rose-950/20 text-[11px] font-medium text-rose-300 hover:bg-rose-950/50 cursor-pointer"
                        >
                          Delete Forever
                        </button>
                      </div>
                    </div>

                    {customUserLabels.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="text-slate-500">Labels:</span>
                        {customUserLabels.slice(0, 6).map((lbl) => {
                          const applied = selectedMessage.labelIds.includes(lbl.id);
                          return (
                            <button
                              key={lbl.id}
                              type="button"
                              onClick={() => handleApplyLabelToSelected(lbl.id, lbl.name)}
                              className={`px-2 py-1 rounded border cursor-pointer transition-colors ${
                                applied
                                  ? 'border-lime-400/50 bg-lime-500/15 text-lime-300'
                                  : 'border-white/10 bg-[#050814] text-slate-400 hover:text-white'
                              }`}
                            >
                              {applied ? `✓ ${lbl.name}` : `+ ${lbl.name}`}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="rounded-xl border border-white/10 bg-[#050814] p-4 max-h-[340px] overflow-y-auto">
                      <pre className="whitespace-pre-wrap break-words font-sans text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {selectedMessage.bodyText || 'No message body content.'}
                      </pre>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <GmailConfirmModal
        request={pendingConfirm?.request || null}
        busy={mutating}
        onCancel={() => {
          if (!mutating) setPendingConfirm(null);
        }}
        onConfirm={() => void handleConfirmExecute()}
      />
    </section>
  );
}
