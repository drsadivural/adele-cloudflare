import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { projects, Project } from '@/lib/api';
import { toast } from 'sonner';
import SettingsPanel from '@/components/SettingsPanel';
import ConnectorsModal from '@/components/ConnectorsModal';
import {
  Plus,
  Search,
  Settings,
  Mic,
  Send,
  MessageSquare,
  Globe,
  Smartphone,
  Palette,
  MoreHorizontal,
  Presentation,
  Link2,
  X,
  Loader2,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Shield,
} from 'lucide-react';

interface ChatHistory {
  id: number;
  title: string;
  lastMessage: string;
  timestamp: Date;
  projectId?: number;
}

interface Connector {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const connectedTools: Connector[] = [
  { id: 'browser', name: 'Browser', icon: '🌐', connected: true },
  { id: 'github', name: 'GitHub', icon: '🐙', connected: true },
];

const availableConnectors = [
  { icon: '📧', name: 'Gmail' },
  { icon: '📅', name: 'Calendar' },
  { icon: '📁', name: 'Drive' },
  { icon: '📨', name: 'Outlook' },
  { icon: '🐙', name: 'GitHub' },
  { icon: '💬', name: 'Slack' },
  { icon: '📝', name: 'Notion' },
  { icon: '⚡', name: 'Zapier' },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout, loading: authLoading } = useAuth();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('settings');
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showToolsPrompt, setShowToolsPrompt] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentChat, setCurrentChat] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/login');
    }
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await projects.list();
        const history: ChatHistory[] = response.projects.map((p: Project) => ({
          id: p.id,
          title: p.name || 'Untitled Project',
          lastMessage: p.description || 'No description',
          timestamp: new Date(p.updatedAt || p.createdAt),
          projectId: p.id,
        }));
        setChatHistory(history);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchProjects();
    }
  }, [user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentChat]);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    setCurrentChat(prev => [...prev, userMessage]);
    const userInput = message.trim();
    setMessage('');
    setIsSending(true);
    setIsProcessing(true);

    try {
      // Simulate AI response - in production, this would call your AI backend
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I understand you want to: "${userInput}"\n\nI'm analyzing your request and will help you build this. Let me break down the requirements and create a plan for you.\n\n**Next Steps:**\n1. Define the project structure\n2. Set up the necessary components\n3. Implement the core functionality\n4. Add styling and polish\n\nWould you like me to proceed with creating this project?`,
          timestamp: new Date(),
        };
        setCurrentChat(prev => [...prev, assistantMessage]);
        setIsProcessing(false);
        setIsSending(false);
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to process message');
      setIsProcessing(false);
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action: string) => {
    const prompts: Record<string, string> = {
      slides: 'Create a professional presentation about ',
      website: 'Build a modern website for ',
      apps: 'Develop a mobile/web application for ',
      design: 'Design a UI/UX for ',
    };
    setMessage(prompts[action] || '');
    inputRef.current?.focus();
  };

  const toggleVoiceRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast.info('Voice recording started...');
    } else {
      toast.info('Voice recording stopped');
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    setLocation('/');
  };

  const handleNewChat = () => {
    setCurrentChat([]);
    setMessage('');
    inputRef.current?.focus();
  };

  const filteredHistory = chatHistory.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex bg-zinc-950 text-white overflow-hidden">
      {/* Left Sidebar */}
      <div 
        className={`flex flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo & Collapse Button */}
        <div className={`p-4 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <img src="/adele-logo.png" alt="ADELE" className="w-8 h-8" />
              <span className="text-lg font-semibold">adele</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="w-5 h-5 text-zinc-400" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-zinc-400" />
            )}
          </button>
        </div>

        {/* New Chat Button */}
        <div className={`px-3 mb-2 ${sidebarCollapsed ? 'px-2' : ''}`}>
          <button
            onClick={handleNewChat}
            className={`flex items-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm font-medium ${
              sidebarCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full px-3 py-2.5'
            }`}
            title="New chat"
          >
            <Plus className="w-4 h-4" />
            {!sidebarCollapsed && 'New chat'}
          </button>
        </div>

        {/* Search - Hidden when collapsed */}
        {!sidebarCollapsed && (
          <div className="px-3 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-zinc-700 placeholder-zinc-500"
              />
            </div>
          </div>
        )}

        {/* Chat History */}
        <div className={`flex-1 overflow-y-auto ${sidebarCollapsed ? 'px-2' : 'px-2'}`}>
          {!sidebarCollapsed && (
            <div className="text-xs text-zinc-500 px-2 py-2 font-medium">Recent</div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            </div>
          ) : filteredHistory.length === 0 ? (
            !sidebarCollapsed && (
              <div className="text-center text-zinc-500 text-sm py-8 px-4">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-xs mt-1">Start a new chat to begin</p>
              </div>
            )
          ) : (
            <div className="space-y-1">
              {filteredHistory.map((chat) => (
                <Link
                  key={chat.id}
                  href={`/projects/${chat.projectId}`}
                  className={`flex items-center gap-2 rounded-xl hover:bg-zinc-800/50 transition-colors group ${
                    sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
                  }`}
                  title={sidebarCollapsed ? chat.title : undefined}
                >
                  <MessageSquare className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="text-sm truncate flex-1">{chat.title}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Delete functionality
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 rounded transition-all"
                      >
                        <Trash2 className="w-3 h-3 text-zinc-400" />
                      </button>
                    </>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Admin Link (if admin) */}
        {user?.role === 'admin' && (
          <div className={`border-t border-zinc-800 p-3 ${sidebarCollapsed ? 'px-2' : ''}`}>
            <Link
              href="/admin"
              className={`flex items-center gap-3 rounded-xl hover:bg-zinc-800 transition-colors ${
                sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
              }`}
              title={sidebarCollapsed ? 'Admin Panel' : undefined}
            >
              <Shield className="w-4 h-4 text-blue-500" />
              {!sidebarCollapsed && <span className="text-sm text-blue-500">Admin Panel</span>}
            </Link>
          </div>
        )}

        {/* Bottom Settings */}
        <div className={`border-t border-zinc-800 p-3 ${sidebarCollapsed ? 'px-2' : ''}`}>
          <button
            onClick={() => setShowSettings(true)}
            className={`flex items-center gap-3 rounded-xl hover:bg-zinc-800 transition-colors ${
              sidebarCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full px-3 py-2.5'
            }`}
            title={sidebarCollapsed ? user?.name || 'Settings' : undefined}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium truncate">{user?.name || 'User'}</div>
                  <div className="text-xs text-zinc-500 truncate">{user?.email}</div>
                </div>
                <Settings className="w-4 h-4 text-zinc-500" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Chat Area */}
        {currentChat.length > 0 ? (
          <>
            {/* Chat Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto px-4 py-8"
            >
              <div className="max-w-3xl mx-auto space-y-6">
                {currentChat.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-800 text-white'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-800 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-zinc-400">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Input (when in conversation) */}
            <div className="border-t border-zinc-800 p-4">
              <div className="max-w-3xl mx-auto">
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                  <div className="p-4">
                    <textarea
                      ref={inputRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Continue the conversation..."
                      rows={2}
                      className="w-full bg-transparent text-white placeholder-zinc-500 resize-none focus:outline-none text-base leading-relaxed"
                    />
                  </div>
                  <div className="px-4 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                        <Plus className="w-5 h-5 text-zinc-400" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleVoiceRecording}
                        className={`p-2.5 rounded-lg transition-all ${
                          isRecording
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'hover:bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || isSending}
                        className={`p-2.5 rounded-full transition-all ${
                          message.trim() && !isSending
                            ? 'bg-white text-zinc-900 hover:bg-zinc-200'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        {isSending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Initial State - No Chat */
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
            {/* Greeting */}
            <h1 className="text-4xl md:text-5xl font-light text-white mb-12 text-center tracking-tight">
              What can I do for you?
            </h1>

            {/* Chat Input Box */}
            <div className="w-full max-w-3xl">
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
                {/* Input Area */}
                <div className="p-4">
                  <textarea
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Assign a task or ask anything"
                    rows={3}
                    className="w-full bg-transparent text-white placeholder-zinc-500 resize-none focus:outline-none text-lg leading-relaxed"
                  />
                </div>

                {/* Bottom Bar */}
                <div className="px-4 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Add Attachment */}
                    <button className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                      <Plus className="w-5 h-5 text-zinc-400" />
                    </button>

                    {/* Connected Tools */}
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                      {connectedTools.map((tool) => (
                        <span key={tool.id} className="text-base" title={tool.name}>
                          {tool.icon}
                        </span>
                      ))}
                      <span className="text-xs text-zinc-500 ml-1">+{connectedTools.length}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Voice Input */}
                    <button
                      onClick={toggleVoiceRecording}
                      className={`p-2.5 rounded-lg transition-all ${
                        isRecording
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'hover:bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <Mic className="w-5 h-5" />
                    </button>

                    {/* Send Button */}
                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || isSending}
                      className={`p-2.5 rounded-full transition-all ${
                        message.trim() && !isSending
                          ? 'bg-white text-zinc-900 hover:bg-zinc-200'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      {isSending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Connect Tools Prompt */}
              {showToolsPrompt && (
                <button
                  onClick={() => setShowConnectors(true)}
                  className="mt-4 w-full flex items-center justify-between px-4 py-3 text-sm text-zinc-400 hover:text-zinc-300 transition-colors rounded-xl hover:bg-zinc-900/50 group"
                >
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    <span>Connect your tools to ADELE</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {availableConnectors.map((c, i) => (
                      <span key={i} className="text-base opacity-60 group-hover:opacity-100 transition-opacity">
                        {c.icon}
                      </span>
                    ))}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowToolsPrompt(false);
                      }}
                      className="ml-2 p-1 hover:bg-zinc-800 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </button>
              )}

              {/* Quick Actions */}
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => handleQuickAction('slides')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 transition-all text-sm font-medium"
                >
                  <Presentation className="w-4 h-4" />
                  Create slides
                </button>
                <button
                  onClick={() => handleQuickAction('website')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 transition-all text-sm font-medium"
                >
                  <Globe className="w-4 h-4" />
                  Build website
                </button>
                <button
                  onClick={() => handleQuickAction('apps')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 transition-all text-sm font-medium"
                >
                  <Smartphone className="w-4 h-4" />
                  Develop apps
                </button>
                <button
                  onClick={() => handleQuickAction('design')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 transition-all text-sm font-medium"
                >
                  <Palette className="w-4 h-4" />
                  Design
                </button>
                <Link
                  href="/templates"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 transition-all text-sm font-medium"
                >
                  <MoreHorizontal className="w-4 h-4" />
                  More
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        activeTab={activeSettingsTab}
        onTabChange={setActiveSettingsTab}
        user={user}
        onLogout={handleLogout}
      />

      {/* Connectors Modal */}
      <ConnectorsModal
        isOpen={showConnectors}
        onClose={() => setShowConnectors(false)}
        onConnect={(id) => {
          toast.success(`Connecting to ${id}...`);
        }}
      />
    </div>
  );
}
