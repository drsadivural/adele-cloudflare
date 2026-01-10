import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Settings,
  User,
  MessageSquare,
  AudioWaveform as Waveform,
  Languages,
  RefreshCw,
  Maximize2,
  Minimize2,
  Camera,
  Sparkles,
  Brain,
  Activity,
  Circle,
} from 'lucide-react';
import { ResponsiveLayout, PageContainer, PageHeader, Card } from '@/components/layout/ResponsiveLayout';
import { Button, Input, Select, Badge, Modal, Alert, Tabs, Switch, Slider } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface VoiceSettings {
  language: string;
  voiceId: string;
  speed: number;
  pitch: number;
  volume: number;
  autoDetectLanguage: boolean;
  noiseReduction: boolean;
  echoCancellation: boolean;
  wakeWord: boolean;
  wakeWordPhrase: string;
}

interface ConversationMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  timestamp: Date;
  language?: string;
  confidence?: number;
}

interface VoiceProfile {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  style: string;
  preview?: string;
}

const languageOptions = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
  { value: 'ko-KR', label: 'Korean' },
];

const voiceProfiles: VoiceProfile[] = [
  { id: 'adele-default', name: 'ADELE', language: 'en-US', gender: 'female', style: 'Professional' },
  { id: 'adele-friendly', name: 'ADELE Friendly', language: 'en-US', gender: 'female', style: 'Casual' },
  { id: 'adele-jp', name: 'ADELE Japanese', language: 'ja-JP', gender: 'female', style: 'Professional' },
  { id: 'assistant-male', name: 'Assistant', language: 'en-US', gender: 'male', style: 'Professional' },
];

export default function VoiceCommunication() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('conversation');
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);

  const [settings, setSettings] = useState<VoiceSettings>({
    language: 'en-US',
    voiceId: 'adele-default',
    speed: 1.0,
    pitch: 1.0,
    volume: 0.8,
    autoDetectLanguage: true,
    noiseReduction: true,
    echoCancellation: true,
    wakeWord: false,
    wakeWordPhrase: 'Hey ADELE',
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom of conversation
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  useEffect(() => {
    // Simulate audio level visualization when listening
    let interval: NodeJS.Timeout;
    if (isListening) {
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
    } else {
      setAudioLevel(0);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  const startCall = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      setIsCallActive(true);
      toast.success('Voice call started');

      // Add initial greeting
      const greeting: ConversationMessage = {
        id: Date.now(),
        role: 'assistant',
        content: `Hello${user?.name ? ` ${user.name}` : ''}! How can I help you today?`,
        timestamp: new Date(),
      };
      setConversation([greeting]);
      
      // Simulate speaking the greeting
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 2000);
    } catch (error) {
      console.error('Failed to start call:', error);
      toast.error('Failed to access microphone');
    }
  };

  const endCall = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsCallActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    toast.info('Voice call ended');
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast.info(isMuted ? 'Microphone unmuted' : 'Microphone muted');
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    toast.info(isSpeakerOn ? 'Speaker off' : 'Speaker on');
  };

  const startListening = async () => {
    if (!isCallActive || isMuted) return;
    
    setIsListening(true);
    setTranscript('');

    // Simulate speech recognition
    setTimeout(() => {
      const mockTranscripts = [
        'What is the weather like today?',
        'Can you help me write an email?',
        'Tell me about the latest project updates.',
        'Schedule a meeting for tomorrow.',
      ];
      const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      setTranscript(randomTranscript);
      handleUserMessage(randomTranscript);
    }, 2000);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const handleUserMessage = async (content: string) => {
    setIsListening(false);
    setIsProcessing(true);

    // Add user message
    const userMessage: ConversationMessage = {
      id: Date.now(),
      role: 'user',
      content,
      timestamp: new Date(),
      language: settings.language,
    };
    setConversation((prev) => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      setIsProcessing(false);
      setIsSpeaking(true);

      const responses = [
        "I'd be happy to help you with that! Let me look into it.",
        "That's a great question. Based on my analysis...",
        "I understand. Here's what I can do for you...",
        "Certainly! I'll take care of that right away.",
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const assistantMessage: ConversationMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date(),
      };
      setConversation((prev) => [...prev, assistantMessage]);

      // Simulate speaking duration
      setTimeout(() => setIsSpeaking(false), 3000);
    }, 1500);
  };

  const handleSaveSettings = async () => {
    try {
      await api.voice.updateSettings(settings);
      toast.success('Voice settings saved');
      setShowSettingsModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    }
  };

  const tabs = [
    { id: 'conversation', label: 'Conversation', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <Activity className="w-4 h-4" /> },
  ];

  // Avatar component
  const Avatar = () => (
    <div className={cn(
      'relative w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center transition-all duration-300',
      isSpeaking && 'animate-pulse ring-4 ring-blue-400/50',
      isListening && 'ring-4 ring-green-400/50'
    )}>
      <div className="absolute inset-2 rounded-full bg-zinc-900 flex items-center justify-center">
        <Brain className={cn(
          'w-16 h-16 sm:w-24 sm:h-24 text-blue-400 transition-all duration-300',
          isProcessing && 'animate-spin'
        )} />
      </div>
      
      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-blue-400 rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 20 + 10}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
      
      {/* Listening indicator */}
      {isListening && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-green-400 rounded-full"
              style={{
                height: `${(audioLevel / 100) * 20 + 5}px`,
                transition: 'height 0.1s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <ResponsiveLayout>
      <PageContainer>
        <PageHeader
          title="Voice Communication"
          description="Speech-to-speech conversation with ADELE"
          actions={
            <Button
              variant="ghost"
              onClick={() => setShowSettingsModal(true)}
              icon={<Settings className="w-4 h-4" />}
            >
              Settings
            </Button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Call Area */}
          <div className="lg:col-span-2">
            <Card className="h-full min-h-[500px] flex flex-col">
              {/* Call Status */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-3 h-3 rounded-full',
                    isCallActive ? 'bg-green-400 animate-pulse' : 'bg-zinc-600'
                  )} />
                  <span className="text-sm text-zinc-400">
                    {isCallActive ? 'Call Active' : 'Ready to Call'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={settings.autoDetectLanguage ? 'info' : 'default'}>
                    <Languages className="w-3 h-3 mr-1" />
                    {languageOptions.find((l) => l.value === settings.language)?.label}
                  </Badge>
                </div>
              </div>

              {/* Avatar Area */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <Avatar />
                
                {/* Status Text */}
                <div className="mt-6 text-center">
                  {isProcessing && (
                    <p className="text-blue-400 animate-pulse">Thinking...</p>
                  )}
                  {isSpeaking && (
                    <p className="text-blue-400">ADELE is speaking...</p>
                  )}
                  {isListening && (
                    <p className="text-green-400">Listening...</p>
                  )}
                  {!isCallActive && (
                    <p className="text-zinc-500">Click the call button to start</p>
                  )}
                </div>

                {/* Live Transcript */}
                {transcript && (
                  <div className="mt-4 p-4 bg-zinc-800/50 rounded-xl max-w-md">
                    <p className="text-sm text-zinc-400">You said:</p>
                    <p className="text-white">{transcript}</p>
                  </div>
                )}
              </div>

              {/* Call Controls */}
              <div className="flex items-center justify-center gap-4 pt-6 border-t border-zinc-800">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={toggleMute}
                  disabled={!isCallActive}
                  className={cn(
                    'rounded-full w-14 h-14',
                    isMuted && 'bg-red-500/20 text-red-400'
                  )}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </Button>

                {isCallActive ? (
                  <Button
                    variant="danger"
                    size="lg"
                    onClick={endCall}
                    className="rounded-full w-16 h-16"
                  >
                    <PhoneOff className="w-7 h-7" />
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={startCall}
                    className="rounded-full w-16 h-16 bg-green-600 hover:bg-green-700"
                  >
                    <Phone className="w-7 h-7" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="lg"
                  onClick={toggleSpeaker}
                  disabled={!isCallActive}
                  className={cn(
                    'rounded-full w-14 h-14',
                    !isSpeakerOn && 'bg-red-500/20 text-red-400'
                  )}
                >
                  {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </Button>
              </div>

              {/* Push to Talk */}
              {isCallActive && !isMuted && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onMouseDown={startListening}
                    onMouseUp={stopListening}
                    onTouchStart={startListening}
                    onTouchEnd={stopListening}
                    className={cn(
                      'px-8',
                      isListening && 'bg-green-500/20 border-green-500'
                    )}
                  >
                    {isListening ? 'Release to Send' : 'Hold to Speak'}
                  </Button>
                  <p className="text-xs text-zinc-500 mt-2">
                    Or just speak - ADELE will detect when you're done
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Conversation Panel */}
          <div className="lg:col-span-1">
            <Card className="h-full min-h-[500px] flex flex-col">
              <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

              {activeTab === 'conversation' && (
                <div className="flex-1 overflow-y-auto space-y-4">
                  {conversation.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                      <p className="text-zinc-500">Start a call to begin conversation</p>
                    </div>
                  ) : (
                    conversation.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          'p-3 rounded-xl max-w-[90%]',
                          message.role === 'user'
                            ? 'bg-blue-600/20 ml-auto'
                            : 'bg-zinc-800'
                        )}
                      >
                        <p className="text-sm text-white">{message.content}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                  )}
                  <div ref={conversationEndRef} />
                </div>
              )}

              {activeTab === 'history' && (
                <div className="flex-1 overflow-y-auto">
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-500">Previous conversations will appear here</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Settings Modal */}
        <Modal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          title="Voice Settings"
          size="lg"
        >
          <div className="space-y-6">
            {/* Language & Voice */}
            <div>
              <h4 className="font-medium text-white mb-4">Language & Voice</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Language"
                  options={languageOptions}
                  value={settings.language}
                  onChange={(value) => setSettings({ ...settings, language: value })}
                />
                <Select
                  label="Voice"
                  options={voiceProfiles.map((v) => ({
                    value: v.id,
                    label: `${v.name} (${v.style})`,
                  }))}
                  value={settings.voiceId}
                  onChange={(value) => setSettings({ ...settings, voiceId: value })}
                />
              </div>
              <Switch
                checked={settings.autoDetectLanguage}
                onChange={(checked) => setSettings({ ...settings, autoDetectLanguage: checked })}
                label="Auto-detect Language"
                description="Automatically detect and switch between English and Japanese"
                className="mt-4"
              />
            </div>

            {/* Voice Parameters */}
            <div>
              <h4 className="font-medium text-white mb-4">Voice Parameters</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Speed: {settings.speed.toFixed(1)}x
                  </label>
                  <Slider
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={settings.speed}
                    onChange={(value) => setSettings({ ...settings, speed: value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Pitch: {settings.pitch.toFixed(1)}
                  </label>
                  <Slider
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    value={settings.pitch}
                    onChange={(value) => setSettings({ ...settings, pitch: value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Volume: {Math.round(settings.volume * 100)}%
                  </label>
                  <Slider
                    min={0}
                    max={1}
                    step={0.1}
                    value={settings.volume}
                    onChange={(value) => setSettings({ ...settings, volume: value })}
                  />
                </div>
              </div>
            </div>

            {/* Audio Processing */}
            <div>
              <h4 className="font-medium text-white mb-4">Audio Processing</h4>
              <div className="space-y-3">
                <Switch
                  checked={settings.noiseReduction}
                  onChange={(checked) => setSettings({ ...settings, noiseReduction: checked })}
                  label="Noise Reduction"
                  description="Reduce background noise for clearer voice input"
                />
                <Switch
                  checked={settings.echoCancellation}
                  onChange={(checked) => setSettings({ ...settings, echoCancellation: checked })}
                  label="Echo Cancellation"
                  description="Prevent audio feedback loops"
                />
              </div>
            </div>

            {/* Wake Word */}
            <div>
              <h4 className="font-medium text-white mb-4">Wake Word</h4>
              <Switch
                checked={settings.wakeWord}
                onChange={(checked) => setSettings({ ...settings, wakeWord: checked })}
                label="Enable Wake Word"
                description="Activate ADELE by saying the wake phrase"
              />
              {settings.wakeWord && (
                <Input
                  label="Wake Phrase"
                  value={settings.wakeWordPhrase}
                  onChange={(e) => setSettings({ ...settings, wakeWordPhrase: e.target.value })}
                  placeholder="Hey ADELE"
                  className="mt-4"
                />
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSettings}>
                Save Settings
              </Button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </ResponsiveLayout>
  );
}
