import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  Globe,
  Plus,
  Trash2,
  RefreshCw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Home,
  Lock,
  Unlock,
  Camera,
  Download,
  Copy,
  ExternalLink,
  Clock,
  Monitor,
  Smartphone,
  Tablet,
  Play,
  Pause,
  Square,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ResponsiveLayout, PageContainer, PageHeader, Card } from '@/components/layout/ResponsiveLayout';
import { Button, Input, Select, Badge, Modal, Alert, Tabs, Switch } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface BrowserSession {
  id: number;
  name: string;
  url: string;
  status: 'running' | 'paused' | 'stopped';
  viewport: 'desktop' | 'tablet' | 'mobile';
  createdAt: Date;
  lastActiveAt: Date;
  screenshotUrl?: string;
}

interface BrowserProfile {
  id: number;
  name: string;
  userAgent: string;
  viewport: { width: number; height: number };
  proxy?: string;
  cookies?: string;
}

const viewportOptions = [
  { value: 'desktop', label: 'Desktop (1920x1080)', icon: Monitor },
  { value: 'tablet', label: 'Tablet (768x1024)', icon: Tablet },
  { value: 'mobile', label: 'Mobile (375x812)', icon: Smartphone },
];

const viewportSizes = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
};

export default function CloudBrowser() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('sessions');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<BrowserSession[]>([]);
  const [profiles, setProfiles] = useState<BrowserProfile[]>([]);
  const [selectedSession, setSelectedSession] = useState<BrowserSession | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [newSession, setNewSession] = useState({
    name: '',
    url: 'https://google.com',
    viewport: 'desktop',
    profileId: '',
  });

  const [newProfile, setNewProfile] = useState({
    name: '',
    userAgent: '',
    width: 1920,
    height: 1080,
    proxy: '',
  });

  useEffect(() => {
    loadSessions();
    loadProfiles();
  }, []);

  const loadSessions = async () => {
    try {
      // Mock sessions
      setSessions([
        {
          id: 1,
          name: 'Research Session',
          url: 'https://google.com',
          status: 'running',
          viewport: 'desktop',
          createdAt: new Date(Date.now() - 3600000),
          lastActiveAt: new Date(),
          screenshotUrl: '/api/placeholder/400/300',
        },
        {
          id: 2,
          name: 'Testing Mobile',
          url: 'https://example.com',
          status: 'paused',
          viewport: 'mobile',
          createdAt: new Date(Date.now() - 86400000),
          lastActiveAt: new Date(Date.now() - 3600000),
          screenshotUrl: '/api/placeholder/400/300',
        },
      ]);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadProfiles = async () => {
    try {
      setProfiles([
        {
          id: 1,
          name: 'Default Chrome',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          viewport: { width: 1920, height: 1080 },
        },
        {
          id: 2,
          name: 'Mobile Safari',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
          viewport: { width: 375, height: 812 },
        },
      ]);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.name || !newSession.url) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      await api.browser.createSession({
        name: newSession.name,
        url: newSession.url,
        viewport: newSession.viewport,
        profileId: newSession.profileId ? parseInt(newSession.profileId) : undefined,
      });
      toast.success('Browser session created');
      setShowCreateModal(false);
      setNewSession({ name: '', url: 'https://google.com', viewport: 'desktop', profileId: '' });
      loadSessions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    try {
      await api.browser.deleteSession(sessionId);
      setSessions(sessions.filter((s) => s.id !== sessionId));
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
      toast.success('Session deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete session');
    }
  };

  const handleToggleSession = async (session: BrowserSession) => {
    try {
      const newStatus = session.status === 'running' ? 'paused' : 'running';
      await api.browser.updateSession(session.id, { status: newStatus });
      setSessions(
        sessions.map((s) => (s.id === session.id ? { ...s, status: newStatus } : s))
      );
      toast.success(`Session ${newStatus === 'running' ? 'resumed' : 'paused'}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update session');
    }
  };

  const handleNavigate = async (url: string) => {
    if (!selectedSession) return;
    try {
      await api.browser.navigate(selectedSession.id, url);
      setCurrentUrl(url);
      setSessions(
        sessions.map((s) => (s.id === selectedSession.id ? { ...s, url } : s))
      );
    } catch (error: any) {
      toast.error(error.message || 'Failed to navigate');
    }
  };

  const handleGoBack = async () => {
    if (!selectedSession) return;
    try {
      await api.browser.goBack(selectedSession.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to go back');
    }
  };

  const handleGoForward = async () => {
    if (!selectedSession) return;
    try {
      await api.browser.goForward(selectedSession.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to go forward');
    }
  };

  const handleRefresh = async () => {
    if (!selectedSession) return;
    try {
      await api.browser.refresh(selectedSession.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to refresh');
    }
  };

  const handleScreenshot = async () => {
    if (!selectedSession) return;
    try {
      const response = await api.browser.screenshot(selectedSession.id);
      // Download screenshot
      const a = document.createElement('a');
      a.href = response.url;
      a.download = `screenshot-${selectedSession.name}-${Date.now()}.png`;
      a.click();
      toast.success('Screenshot saved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to take screenshot');
    }
  };

  const handleStartRecording = async () => {
    if (!selectedSession) return;
    try {
      await api.browser.startRecording(selectedSession.id);
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    if (!selectedSession) return;
    try {
      const response = await api.browser.stopRecording(selectedSession.id);
      setIsRecording(false);
      // Download recording
      const a = document.createElement('a');
      a.href = response.url;
      a.download = `recording-${selectedSession.name}-${Date.now()}.webm`;
      a.click();
      toast.success('Recording saved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to stop recording');
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.browser.createProfile({
        name: newProfile.name,
        userAgent: newProfile.userAgent,
        viewport: { width: newProfile.width, height: newProfile.height },
        proxy: newProfile.proxy || undefined,
      });
      toast.success('Profile created');
      setShowProfileModal(false);
      setNewProfile({ name: '', userAgent: '', width: 1920, height: 1080, proxy: '' });
      loadProfiles();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'sessions', label: 'Sessions', icon: <Globe className="w-4 h-4" /> },
    { id: 'profiles', label: 'Profiles', icon: <Settings className="w-4 h-4" /> },
  ];

  // If a session is selected, show the browser view
  if (selectedSession && !isFullscreen) {
    return (
      <ResponsiveLayout>
        <div className="h-full flex flex-col">
          {/* Browser Toolbar */}
          <div className="p-2 border-b border-zinc-800 bg-zinc-900">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSession(null)}
                icon={<ChevronLeft className="w-4 h-4" />}
              />
              <Button variant="ghost" size="sm" onClick={handleGoBack} icon={<ChevronLeft className="w-4 h-4" />} />
              <Button variant="ghost" size="sm" onClick={handleGoForward} icon={<ChevronRight className="w-4 h-4" />} />
              <Button variant="ghost" size="sm" onClick={handleRefresh} icon={<RefreshCw className="w-4 h-4" />} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigate('https://google.com')}
                icon={<Home className="w-4 h-4" />}
              />

              <div className="flex-1 flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg flex-1">
                  <Lock className="w-4 h-4 text-green-400" />
                  <input
                    type="text"
                    value={currentUrl || selectedSession.url}
                    onChange={(e) => setCurrentUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleNavigate(currentUrl);
                      }
                    }}
                    className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={handleScreenshot} icon={<Camera className="w-4 h-4" />} />
                {isRecording ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStopRecording}
                    icon={<Square className="w-4 h-4 text-red-400" />}
                  />
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStartRecording}
                    icon={<Play className="w-4 h-4" />}
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullscreen(true)}
                  icon={<Maximize2 className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>

          {/* Browser Content */}
          <div className="flex-1 bg-white relative">
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
              <div className="text-center">
                <Globe className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400 mb-2">Cloud Browser Session</p>
                <p className="text-sm text-zinc-500">{selectedSession.url}</p>
                <Badge variant="success" className="mt-4">
                  {selectedSession.status}
                </Badge>
              </div>
            </div>
            {/* In production, this would be a real browser stream */}
            {/* <iframe
              ref={iframeRef}
              src={`/api/browser/${selectedSession.id}/stream`}
              className="w-full h-full border-0"
            /> */}
          </div>

          {/* Status Bar */}
          <div className="p-2 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-4">
              <span>{selectedSession.name}</span>
              <span>Viewport: {selectedSession.viewport}</span>
            </div>
            <div className="flex items-center gap-4">
              {isRecording && (
                <span className="flex items-center gap-1 text-red-400">
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  Recording
                </span>
              )}
              <span>Last active: {selectedSession.lastActiveAt.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <PageContainer>
        <PageHeader
          title="Cloud Browser"
          description="Remote browser sessions for web automation and research"
          actions={
            <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="w-4 h-4" />}>
              New Session
            </Button>
          }
        />

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            {sessions.length === 0 ? (
              <Card className="text-center py-12">
                <Globe className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Browser Sessions</h3>
                <p className="text-zinc-400 mb-6">
                  Create a cloud browser session to browse the web remotely
                </p>
                <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="w-4 h-4" />}>
                  New Session
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.map((session) => (
                  <Card key={session.id} className="overflow-hidden">
                    {/* Screenshot Preview */}
                    <div
                      className="h-40 bg-zinc-800 relative cursor-pointer group"
                      onClick={() => {
                        setSelectedSession(session);
                        setCurrentUrl(session.url);
                      }}
                    >
                      {session.screenshotUrl ? (
                        <img
                          src={session.screenshotUrl}
                          alt={session.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Globe className="w-12 h-12 text-zinc-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="primary" size="sm">
                          Open Session
                        </Button>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant={
                            session.status === 'running'
                              ? 'success'
                              : session.status === 'paused'
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {session.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Session Info */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-white truncate">{session.name}</h3>
                        <div className="flex items-center gap-1">
                          {viewportOptions.find((v) => v.value === session.viewport)?.icon && (
                            <span className="text-zinc-500">
                              {React.createElement(
                                viewportOptions.find((v) => v.value === session.viewport)!.icon,
                                { className: 'w-4 h-4' }
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-zinc-400 truncate mb-3">{session.url}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500">
                          {session.lastActiveAt.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleSession(session)}
                            icon={
                              session.status === 'running' ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSession(session.id)}
                            icon={<Trash2 className="w-4 h-4 text-red-400" />}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profiles Tab */}
        {activeTab === 'profiles' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Browser Profiles</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Configure custom browser profiles with different user agents and viewports
                  </p>
                </div>
                <Button onClick={() => setShowProfileModal(true)} icon={<Plus className="w-4 h-4" />}>
                  New Profile
                </Button>
              </div>

              <div className="space-y-4">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl"
                  >
                    <div>
                      <h4 className="font-medium text-white">{profile.name}</h4>
                      <p className="text-sm text-zinc-400 truncate max-w-md">{profile.userAgent}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                        <span>
                          {profile.viewport.width}x{profile.viewport.height}
                        </span>
                        {profile.proxy && <span>Proxy: {profile.proxy}</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4 text-red-400" />} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Create Session Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="New Browser Session"
        >
          <form onSubmit={handleCreateSession} className="space-y-4">
            <Input
              label="Session Name"
              value={newSession.name}
              onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
              placeholder="Research Session"
              required
            />
            <Input
              label="Starting URL"
              value={newSession.url}
              onChange={(e) => setNewSession({ ...newSession, url: e.target.value })}
              placeholder="https://google.com"
              required
            />
            <Select
              label="Viewport"
              options={viewportOptions.map((v) => ({ value: v.value, label: v.label }))}
              value={newSession.viewport}
              onChange={(value) => setNewSession({ ...newSession, viewport: value })}
            />
            <Select
              label="Browser Profile (Optional)"
              options={[
                { value: '', label: 'Default' },
                ...profiles.map((p) => ({ value: p.id.toString(), label: p.name })),
              ]}
              value={newSession.profileId}
              onChange={(value) => setNewSession({ ...newSession, profileId: value })}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Create Session
              </Button>
            </div>
          </form>
        </Modal>

        {/* Create Profile Modal */}
        <Modal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          title="New Browser Profile"
          size="lg"
        >
          <form onSubmit={handleCreateProfile} className="space-y-4">
            <Input
              label="Profile Name"
              value={newProfile.name}
              onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
              placeholder="Custom Chrome"
              required
            />
            <Input
              label="User Agent"
              value={newProfile.userAgent}
              onChange={(e) => setNewProfile({ ...newProfile, userAgent: e.target.value })}
              placeholder="Mozilla/5.0 ..."
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Viewport Width"
                type="number"
                value={newProfile.width}
                onChange={(e) => setNewProfile({ ...newProfile, width: parseInt(e.target.value) })}
              />
              <Input
                label="Viewport Height"
                type="number"
                value={newProfile.height}
                onChange={(e) => setNewProfile({ ...newProfile, height: parseInt(e.target.value) })}
              />
            </div>
            <Input
              label="Proxy (Optional)"
              value={newProfile.proxy}
              onChange={(e) => setNewProfile({ ...newProfile, proxy: e.target.value })}
              placeholder="http://proxy:port"
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowProfileModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Create Profile
              </Button>
            </div>
          </form>
        </Modal>
      </PageContainer>
    </ResponsiveLayout>
  );
}
