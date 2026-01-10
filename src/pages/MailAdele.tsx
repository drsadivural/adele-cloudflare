import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Mail,
  Inbox,
  Send,
  Star,
  Trash2,
  Archive,
  Search,
  Plus,
  Settings,
  RefreshCw,
  Paperclip,
  Clock,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Reply,
  Forward,
  AlertTriangle,
  Check,
  X,
  Link2,
  Bot,
} from 'lucide-react';
import { ResponsiveLayout, PageContainer, PageHeader, Card } from '@/components/layout/ResponsiveLayout';
import { Button, Input, Textarea, Select, Badge, Modal, Alert, Tabs, Switch, Avatar } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/lib/responsive';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface EmailConnection {
  id: number;
  provider: 'gmail' | 'outlook' | 'imap';
  email: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSyncAt?: Date;
}

interface Email {
  id: number;
  from: { name: string; email: string };
  to: string[];
  subject: string;
  preview: string;
  body: string;
  date: Date;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  folder: string;
  threadId?: string;
}

interface Draft {
  id?: number;
  to: string;
  cc: string;
  subject: string;
  body: string;
  scheduledAt?: Date;
}

const folders = [
  { id: 'inbox', label: 'Inbox', icon: Inbox, count: 12 },
  { id: 'sent', label: 'Sent', icon: Send, count: 0 },
  { id: 'starred', label: 'Starred', icon: Star, count: 3 },
  { id: 'archive', label: 'Archive', icon: Archive, count: 0 },
  { id: 'trash', label: 'Trash', icon: Trash2, count: 0 },
];

const providerOptions = [
  { value: 'gmail', label: 'Gmail (OAuth)' },
  { value: 'outlook', label: 'Outlook (OAuth)' },
  { value: 'imap', label: 'IMAP/SMTP (Manual)' },
];

export default function MailAdele() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<EmailConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null);
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showConfirmSend, setShowConfirmSend] = useState(false);
  const [draft, setDraft] = useState<Draft>({ to: '', cc: '', subject: '', body: '' });
  const [agentSuggestion, setAgentSuggestion] = useState<string | null>(null);

  // IMAP config state
  const [imapConfig, setImapConfig] = useState({
    provider: 'gmail',
    email: '',
    imapHost: '',
    imapPort: '993',
    smtpHost: '',
    smtpPort: '587',
    password: '',
  });

  useEffect(() => {
    loadConnections();
  }, []);

  useEffect(() => {
    if (selectedConnection) {
      loadEmails();
    }
  }, [selectedConnection, activeFolder]);

  const loadConnections = async () => {
    try {
      // Mock connections
      setConnections([
        {
          id: 1,
          provider: 'gmail',
          email: 'user@gmail.com',
          status: 'connected',
          lastSyncAt: new Date(),
        },
      ]);
      setSelectedConnection(1);
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
  };

  const loadEmails = async () => {
    setLoading(true);
    try {
      // Mock emails
      setEmails([
        {
          id: 1,
          from: { name: 'John Doe', email: 'john@example.com' },
          to: ['user@gmail.com'],
          subject: 'Project Update - Q4 Review',
          preview: 'Hi, I wanted to share the latest updates on our Q4 project...',
          body: `Hi,

I wanted to share the latest updates on our Q4 project. We've made significant progress on the following items:

1. Completed the initial design phase
2. Started development of core features
3. Set up the CI/CD pipeline

Let me know if you have any questions.

Best regards,
John`,
          date: new Date(Date.now() - 3600000),
          isRead: false,
          isStarred: true,
          hasAttachments: true,
          folder: 'inbox',
        },
        {
          id: 2,
          from: { name: 'Jane Smith', email: 'jane@company.com' },
          to: ['user@gmail.com'],
          subject: 'Meeting Tomorrow',
          preview: 'Just a reminder about our meeting tomorrow at 2 PM...',
          body: `Hi,

Just a reminder about our meeting tomorrow at 2 PM. We'll be discussing the roadmap for next quarter.

Please come prepared with your team's priorities.

Thanks,
Jane`,
          date: new Date(Date.now() - 86400000),
          isRead: true,
          isStarred: false,
          hasAttachments: false,
          folder: 'inbox',
        },
        {
          id: 3,
          from: { name: 'Support Team', email: 'support@service.com' },
          to: ['user@gmail.com'],
          subject: 'Your ticket has been resolved',
          preview: 'Your support ticket #12345 has been resolved...',
          body: `Hello,

Your support ticket #12345 has been resolved. If you have any further questions, please don't hesitate to reach out.

Best,
Support Team`,
          date: new Date(Date.now() - 172800000),
          isRead: true,
          isStarred: false,
          hasAttachments: false,
          folder: 'inbox',
        },
      ]);
    } catch (error) {
      console.error('Failed to load emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (imapConfig.provider === 'gmail' || imapConfig.provider === 'outlook') {
        // OAuth flow
        const response = await api.email.initiateOAuth(imapConfig.provider);
        if (response.authUrl) {
          window.location.href = response.authUrl;
        }
      } else {
        // IMAP/SMTP manual config
        await api.email.connect({
          provider: 'imap',
          email: imapConfig.email,
          config: {
            imapHost: imapConfig.imapHost,
            imapPort: parseInt(imapConfig.imapPort),
            smtpHost: imapConfig.smtpHost,
            smtpPort: parseInt(imapConfig.smtpPort),
            password: imapConfig.password,
          },
        });
        toast.success('Email connected successfully');
        setShowConnectModal(false);
        loadConnections();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect email');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!draft.to || !draft.subject) {
      toast.error('Please fill in recipient and subject');
      return;
    }
    setShowConfirmSend(true);
  };

  const handleConfirmSend = async () => {
    setLoading(true);
    try {
      await api.email.send({
        connectionId: selectedConnection!,
        to: draft.to.split(',').map((e) => e.trim()),
        cc: draft.cc ? draft.cc.split(',').map((e) => e.trim()) : [],
        subject: draft.subject,
        body: draft.body,
      });
      toast.success('Email sent successfully');
      setShowCompose(false);
      setShowConfirmSend(false);
      setDraft({ to: '', cc: '', subject: '', body: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSend = async () => {
    if (!draft.scheduledAt) {
      toast.error('Please select a time to schedule');
      return;
    }
    setLoading(true);
    try {
      await api.email.schedule({
        connectionId: selectedConnection!,
        to: draft.to.split(',').map((e) => e.trim()),
        cc: draft.cc ? draft.cc.split(',').map((e) => e.trim()) : [],
        subject: draft.subject,
        body: draft.body,
        scheduledAt: draft.scheduledAt,
      });
      toast.success('Email scheduled successfully');
      setShowScheduleModal(false);
      setShowCompose(false);
      setDraft({ to: '', cc: '', subject: '', body: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule email');
    } finally {
      setLoading(false);
    }
  };

  const handleAgentDraft = async () => {
    if (!selectedEmail) return;
    setLoading(true);
    try {
      const response = await api.email.generateReply({
        emailId: selectedEmail.id,
        connectionId: selectedConnection!,
      });
      setAgentSuggestion(response.draft);
      setDraft({
        to: selectedEmail.from.email,
        cc: '',
        subject: `Re: ${selectedEmail.subject}`,
        body: response.draft,
      });
      setShowCompose(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate reply');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStar = async (emailId: number) => {
    setEmails(
      emails.map((e) =>
        e.id === emailId ? { ...e, isStarred: !e.isStarred } : e
      )
    );
  };

  const handleMarkAsRead = async (emailId: number) => {
    setEmails(
      emails.map((e) =>
        e.id === emailId ? { ...e, isRead: true } : e
      )
    );
  };

  const filteredEmails = emails.filter(
    (email) =>
      email.folder === activeFolder &&
      (searchQuery === '' ||
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.from.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (connections.length === 0) {
    return (
      <ResponsiveLayout>
        <PageContainer>
          <PageHeader
            title="Mail ADELE"
            description="Connect your email to let ADELE help manage your inbox"
          />
          <Card className="text-center py-12">
            <Mail className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Connect Your Email</h3>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              Connect your email account to view, compose, and let ADELE help you manage your inbox with AI-powered assistance.
            </p>
            <Button onClick={() => setShowConnectModal(true)} icon={<Link2 className="w-4 h-4" />}>
              Connect Email Account
            </Button>
          </Card>

          {/* Connect Modal */}
          <Modal
            isOpen={showConnectModal}
            onClose={() => setShowConnectModal(false)}
            title="Connect Email Account"
            size="lg"
          >
            <form onSubmit={handleConnect} className="space-y-4">
              <Select
                label="Email Provider"
                options={providerOptions}
                value={imapConfig.provider}
                onChange={(value) => setImapConfig({ ...imapConfig, provider: value })}
              />

              {imapConfig.provider === 'imap' && (
                <>
                  <Input
                    label="Email Address"
                    type="email"
                    value={imapConfig.email}
                    onChange={(e) => setImapConfig({ ...imapConfig, email: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="IMAP Host"
                      value={imapConfig.imapHost}
                      onChange={(e) => setImapConfig({ ...imapConfig, imapHost: e.target.value })}
                      placeholder="imap.example.com"
                      required
                    />
                    <Input
                      label="IMAP Port"
                      value={imapConfig.imapPort}
                      onChange={(e) => setImapConfig({ ...imapConfig, imapPort: e.target.value })}
                      placeholder="993"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="SMTP Host"
                      value={imapConfig.smtpHost}
                      onChange={(e) => setImapConfig({ ...imapConfig, smtpHost: e.target.value })}
                      placeholder="smtp.example.com"
                      required
                    />
                    <Input
                      label="SMTP Port"
                      value={imapConfig.smtpPort}
                      onChange={(e) => setImapConfig({ ...imapConfig, smtpPort: e.target.value })}
                      placeholder="587"
                      required
                    />
                  </div>
                  <Input
                    label="Password / App Password"
                    type="password"
                    value={imapConfig.password}
                    onChange={(e) => setImapConfig({ ...imapConfig, password: e.target.value })}
                    hint="For Gmail, use an App Password"
                    required
                  />
                </>
              )}

              <Alert variant="info">
                {imapConfig.provider === 'imap'
                  ? 'Your credentials are encrypted and stored securely.'
                  : `You'll be redirected to ${imapConfig.provider === 'gmail' ? 'Google' : 'Microsoft'} to authorize access.`}
              </Alert>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowConnectModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  {imapConfig.provider === 'imap' ? 'Connect' : 'Continue with OAuth'}
                </Button>
              </div>
            </form>
          </Modal>
        </PageContainer>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-white">Mail ADELE</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadEmails}
                icon={<RefreshCw className="w-4 h-4" />}
              />
              <Button
                onClick={() => setShowCompose(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Compose
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Folders */}
          {!isMobile && (
            <div className="w-48 border-r border-zinc-800 p-2">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolder(folder.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                    activeFolder === folder.id
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <folder.icon className="w-4 h-4" />
                    <span>{folder.label}</span>
                  </div>
                  {folder.count > 0 && (
                    <Badge size="sm">{folder.count}</Badge>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Email List */}
          <div className={cn('flex-1 flex', isMobile && selectedEmail ? 'hidden' : '')}>
            <div className="w-full lg:w-96 border-r border-zinc-800 overflow-y-auto">
              {filteredEmails.length === 0 ? (
                <div className="p-8 text-center">
                  <Inbox className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400">No emails in this folder</p>
                </div>
              ) : (
                filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => {
                      setSelectedEmail(email);
                      handleMarkAsRead(email.id);
                    }}
                    className={cn(
                      'p-4 border-b border-zinc-800 cursor-pointer transition-colors',
                      selectedEmail?.id === email.id ? 'bg-zinc-800' : 'hover:bg-zinc-800/50',
                      !email.isRead && 'bg-zinc-900'
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Avatar name={email.from.name} size="sm" />
                        <span className={cn('text-sm', !email.isRead ? 'font-semibold text-white' : 'text-zinc-300')}>
                          {email.from.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {email.hasAttachments && <Paperclip className="w-3 h-3 text-zinc-500" />}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStar(email.id);
                          }}
                          className="p-1"
                        >
                          <Star
                            className={cn(
                              'w-4 h-4',
                              email.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-500'
                            )}
                          />
                        </button>
                      </div>
                    </div>
                    <h4 className={cn('text-sm mb-1 truncate', !email.isRead ? 'font-medium text-white' : 'text-zinc-300')}>
                      {email.subject}
                    </h4>
                    <p className="text-xs text-zinc-500 truncate">{email.preview}</p>
                    <p className="text-xs text-zinc-600 mt-1">
                      {email.date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Email Detail */}
            {!isMobile && (
              <div className="flex-1 overflow-y-auto">
                {selectedEmail ? (
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-semibold text-white mb-2">{selectedEmail.subject}</h2>
                        <div className="flex items-center gap-3">
                          <Avatar name={selectedEmail.from.name} />
                          <div>
                            <p className="font-medium text-white">{selectedEmail.from.name}</p>
                            <p className="text-sm text-zinc-400">{selectedEmail.from.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAgentDraft}
                          icon={<Bot className="w-4 h-4" />}
                        >
                          AI Reply
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDraft({
                              to: selectedEmail.from.email,
                              cc: '',
                              subject: `Re: ${selectedEmail.subject}`,
                              body: '',
                            });
                            setShowCompose(true);
                          }}
                          icon={<Reply className="w-4 h-4" />}
                        >
                          Reply
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Forward className="w-4 h-4" />}
                        >
                          Forward
                        </Button>
                      </div>
                    </div>
                    <div className="prose prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-zinc-300 bg-transparent p-0">
                        {selectedEmail.body}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Mail className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                      <p className="text-zinc-500">Select an email to read</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Email Detail */}
          {isMobile && selectedEmail && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 border-b border-zinc-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEmail(null)}
                  icon={<ChevronLeft className="w-4 h-4" />}
                >
                  Back
                </Button>
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold text-white mb-4">{selectedEmail.subject}</h2>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={selectedEmail.from.name} />
                  <div>
                    <p className="font-medium text-white">{selectedEmail.from.name}</p>
                    <p className="text-sm text-zinc-400">{selectedEmail.from.email}</p>
                  </div>
                </div>
                <div className="flex gap-2 mb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAgentDraft}
                    icon={<Bot className="w-4 h-4" />}
                  >
                    AI Reply
                  </Button>
                  <Button variant="outline" size="sm" icon={<Reply className="w-4 h-4" />}>
                    Reply
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-zinc-300">
                  {selectedEmail.body}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Compose Modal */}
        <Modal
          isOpen={showCompose}
          onClose={() => setShowCompose(false)}
          title="Compose Email"
          size="lg"
        >
          <div className="space-y-4">
            {agentSuggestion && (
              <Alert variant="info" onClose={() => setAgentSuggestion(null)}>
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  <span>AI-generated draft. Review before sending.</span>
                </div>
              </Alert>
            )}

            <Input
              label="To"
              value={draft.to}
              onChange={(e) => setDraft({ ...draft, to: e.target.value })}
              placeholder="recipient@example.com"
              required
            />
            <Input
              label="Cc"
              value={draft.cc}
              onChange={(e) => setDraft({ ...draft, cc: e.target.value })}
              placeholder="cc@example.com"
            />
            <Input
              label="Subject"
              value={draft.subject}
              onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              required
            />
            <Textarea
              label="Message"
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              className="min-h-[200px]"
            />

            <div className="flex justify-between pt-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowScheduleModal(true)}
                  icon={<Clock className="w-4 h-4" />}
                >
                  Schedule
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCompose(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendEmail} icon={<Send className="w-4 h-4" />}>
                  Send
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Confirm Send Modal */}
        <Modal
          isOpen={showConfirmSend}
          onClose={() => setShowConfirmSend(false)}
          title="Confirm Send"
          description="Please confirm you want to send this email"
        >
          <div className="space-y-4">
            <Alert variant="warning">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Agent actions require explicit confirmation before sending.</span>
              </div>
            </Alert>

            <div className="bg-zinc-800 rounded-xl p-4 space-y-2">
              <p className="text-sm"><span className="text-zinc-400">To:</span> <span className="text-white">{draft.to}</span></p>
              <p className="text-sm"><span className="text-zinc-400">Subject:</span> <span className="text-white">{draft.subject}</span></p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowConfirmSend(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmSend} loading={loading} icon={<Check className="w-4 h-4" />}>
                Confirm & Send
              </Button>
            </div>
          </div>
        </Modal>

        {/* Schedule Modal */}
        <Modal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          title="Schedule Email"
        >
          <div className="space-y-4">
            <Input
              label="Schedule Date & Time"
              type="datetime-local"
              value={draft.scheduledAt?.toISOString().slice(0, 16) || ''}
              onChange={(e) => setDraft({ ...draft, scheduledAt: new Date(e.target.value) })}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleScheduleSend} loading={loading} icon={<Clock className="w-4 h-4" />}>
                Schedule Send
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </ResponsiveLayout>
  );
}
