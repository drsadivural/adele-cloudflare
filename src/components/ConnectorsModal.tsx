import { useState } from 'react';
import { X, Search, Check, ExternalLink, Globe, Plus } from 'lucide-react';

interface Connector {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  category: 'apps' | 'api' | 'mcp';
}

const defaultConnectors: Connector[] = [
  { id: 'browser', name: 'My Browser', description: 'Access the web on your own browser', icon: '🌐', connected: false, category: 'apps' },
  { id: 'gmail', name: 'Gmail', description: 'Draft replies, search your inbox, and summarize email threads instantly', icon: '📧', connected: false, category: 'apps' },
  { id: 'gcalendar', name: 'Google Calendar', description: 'Understand your schedule, manage events, and optimize your time effectively', icon: '📅', connected: false, category: 'apps' },
  { id: 'gdrive', name: 'Google Drive', description: 'Access your files, search instantly, and let ADELE help you manage documents intelligently', icon: '📁', connected: false, category: 'apps' },
  { id: 'outlook', name: 'Outlook Mail', description: 'Write, search and manage your Outlook emails seamlessly within ADELE', icon: '📨', connected: false, category: 'apps' },
  { id: 'outlook-cal', name: 'Outlook Calendar', description: 'Schedule, view, and manage your Outlook events just with a prompt', icon: '🗓️', connected: false, category: 'apps' },
  { id: 'github', name: 'GitHub', description: 'Manage repositories, track code changes, and collaborate on team projects', icon: '🐙', connected: false, category: 'apps' },
  { id: 'slack', name: 'Slack', description: 'Stay on top of conversations, track key messages, and let ADELE help follow team activity', icon: '💬', connected: false, category: 'apps' },
  { id: 'notion', name: 'Notion', description: 'Search workspace content, update notes, and automate workflows in Notion', icon: '📝', connected: false, category: 'apps' },
  { id: 'zapier', name: 'Zapier', description: 'Connect ADELE and automate workflows across thousands of apps', icon: '⚡', connected: false, category: 'apps' },
  { id: 'linear', name: 'Linear', description: 'Manage issues, track progress, and streamline your development workflow', icon: '📊', connected: false, category: 'apps' },
  { id: 'figma', name: 'Figma', description: 'Access designs, export assets, and collaborate on UI/UX projects', icon: '🎨', connected: false, category: 'apps' },
  { id: 'jira', name: 'Jira', description: 'Track issues, manage sprints, and coordinate with your team', icon: '🎯', connected: false, category: 'apps' },
  { id: 'asana', name: 'Asana', description: 'Manage tasks, track projects, and collaborate with your team', icon: '✅', connected: false, category: 'apps' },
  { id: 'trello', name: 'Trello', description: 'Organize boards, manage cards, and track project progress', icon: '📋', connected: false, category: 'apps' },
  { id: 'dropbox', name: 'Dropbox', description: 'Access and manage your files stored in Dropbox', icon: '📦', connected: false, category: 'apps' },
];

interface ConnectorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectors?: Connector[];
  onConnect?: (connectorId: string) => void;
}

export default function ConnectorsModal({
  isOpen,
  onClose,
  connectors = defaultConnectors,
  onConnect
}: ConnectorsModalProps) {
  const [activeTab, setActiveTab] = useState<'apps' | 'api' | 'mcp'>('apps');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredConnectors = connectors.filter(
    (c) =>
      c.category === activeTab &&
      (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleConnect = (connectorId: string) => {
    if (onConnect) {
      onConnect(connectorId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Connectors</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Browser Connector Highlight */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">My Browser</h3>
                <p className="text-sm text-zinc-400">
                  Let ADELE access your personalized context and perform tasks directly in your browser.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleConnect('browser')}
              className="px-5 py-2.5 bg-white text-zinc-900 rounded-lg font-medium hover:bg-zinc-100 transition-colors"
            >
              Connect
            </button>
          </div>
        </div>

        {/* Tabs and Search */}
        <div className="px-6 pt-4 flex items-center justify-between">
          <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
            {[
              { id: 'apps', label: 'Apps' },
              { id: 'api', label: 'Custom API' },
              { id: 'mcp', label: 'Custom MCP' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'apps' | 'api' | 'mcp')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search connectors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Connectors Grid */}
        <div className="p-6 max-h-[400px] overflow-y-auto">
          {activeTab === 'apps' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredConnectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => handleConnect(connector.id)}
                  className="flex items-start gap-4 p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-zinc-700 flex items-center justify-center text-2xl flex-shrink-0">
                    {connector.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{connector.name}</span>
                      {connector.connected && (
                        <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" />
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400 line-clamp-2 mt-1">
                      {connector.description}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0 mt-1" />
                </button>
              ))}
            </div>
          )}

          {activeTab === 'api' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                <Plus className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Add Custom API</h3>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                Connect any REST API to ADELE. Provide the endpoint URL and authentication details.
              </p>
              <button className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
                + Add API Connection
              </button>
            </div>
          )}

          {activeTab === 'mcp' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                <Plus className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Add MCP Server</h3>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                Connect a Model Context Protocol (MCP) server to extend ADELE's capabilities.
              </p>
              <button className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
                + Add MCP Server
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {connectors.filter((c) => c.connected).length} connected
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
