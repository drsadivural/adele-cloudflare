import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { projects, chat, Project, ChatMessage, GeneratedFile } from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  Mic,
  MicOff,
  Code2,
  FileCode,
  FolderTree,
  Play,
  Download,
  Loader2,
  Bot,
  User,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  GitBranch,
  ExternalLink,
} from "lucide-react";

export default function ProjectBuilder() {
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "code" | "preview">("chat");
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    async function fetchProject() {
      if (!projectId) return;

      try {
        const [projectResponse, messagesResponse] = await Promise.all([
          projects.get(projectId),
          chat.getMessages(projectId),
        ]);
        setProject(projectResponse.project);
        setFiles(projectResponse.files);
        setMessages(messagesResponse.messages);
      } catch (error) {
        console.error("Failed to fetch project:", error);
        toast.error("Failed to load project");
        setLocation("/projects");
      } finally {
        setLoading(false);
      }
    }

    if (user && projectId) {
      fetchProject();
    }
  }, [user, projectId, setLocation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    // Optimistically add user message
    const tempUserMessage: ChatMessage = {
      id: Date.now(),
      projectId,
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await chat.sendMessage(projectId, userMessage);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMessage.id),
        response.userMessage,
        response.assistantMessage,
      ]);

      // Refresh files after AI response
      const projectResponse = await projects.get(projectId);
      setFiles(projectResponse.files);
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Stop recording logic
    } else {
      setIsRecording(true);
      // Start recording logic
      toast.info("Voice recording started");
    }
  };

  const copyCode = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Code copied to clipboard");
    }
  };

  const handleDownload = async () => {
    try {
      const response = await projects.download(projectId);
      // Create a zip file (simplified - in production use JSZip)
      const content = response.files
        .map((f) => `// ${f.path}\n${f.content}`)
        .join("\n\n");
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${response.project.name}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Project downloaded");
    } catch (error) {
      toast.error("Failed to download project");
    }
  };

  // Build file tree structure
  const buildFileTree = (files: GeneratedFile[]) => {
    const tree: Record<string, any> = {};
    files.forEach((file) => {
      const parts = file.path.split("/");
      let current = tree;
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          current[part] = file;
        } else {
          current[part] = current[part] || {};
          current = current[part];
        }
      });
    });
    return tree;
  };

  const renderFileTree = (tree: Record<string, any>, path = "") => {
    return Object.entries(tree).map(([name, value]) => {
      const fullPath = path ? `${path}/${name}` : name;
      const isFile = value.id !== undefined;

      if (isFile) {
        return (
          <button
            key={fullPath}
            onClick={() => {
              setSelectedFile(value);
              setActiveTab("code");
            }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-muted transition text-left ${
              selectedFile?.id === value.id ? "bg-muted" : ""
            }`}
          >
            <FileCode className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{name}</span>
          </button>
        );
      }

      const isExpanded = expandedFolders.has(fullPath);
      return (
        <div key={fullPath}>
          <button
            onClick={() => {
              const newExpanded = new Set(expandedFolders);
              if (isExpanded) {
                newExpanded.delete(fullPath);
              } else {
                newExpanded.add(fullPath);
              }
              setExpandedFolders(newExpanded);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-muted transition"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <FolderTree className="h-4 w-4 text-primary" />
            <span>{name}</span>
          </button>
          {isExpanded && (
            <div className="ml-4">{renderFileTree(value, fullPath)}</div>
          )}
        </div>
      );
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !project) {
    return null;
  }

  const fileTree = buildFileTree(files);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/projects" className="p-2 hover:bg-muted rounded-lg transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-semibold">{project.name}</h1>
            <p className="text-xs text-muted-foreground">{project.type}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
          <Link
            href={`/projects/${projectId}/versions`}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition"
          >
            <GitBranch className="h-4 w-4" />
            Versions
          </Link>
          {project.deploymentUrl && (
            <a
              href={project.deploymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg"
            >
              <ExternalLink className="h-4 w-4" />
              View Live
            </a>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - File Tree */}
        <div className="w-64 border-r bg-card flex-shrink-0 flex flex-col">
          <div className="p-3 border-b">
            <h2 className="font-medium text-sm">Files</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {files.length > 0 ? (
              renderFileTree(fileTree)
            ) : (
              <p className="text-sm text-muted-foreground p-3">
                No files generated yet. Start chatting to build your app!
              </p>
            )}
          </div>
        </div>

        {/* Main Panel */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="border-b px-4 flex gap-4">
            {[
              { id: "chat", label: "Chat", icon: Bot },
              { id: "code", label: "Code", icon: Code2 },
              { id: "preview", label: "Preview", icon: Play },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "chat" && (
              <div className="h-full flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Start Building</h3>
                        <p className="text-muted-foreground max-w-md">
                          Describe what you want to build and I'll help you create it.
                          Try something like "Build me an e-commerce platform with
                          product listings and a shopping cart."
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === "user" ? "justify-end" : ""
                        }`}
                      >
                        {message.role !== "user" && (
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.role === "user" && (
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  {sending && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t p-4">
                  <div className="flex items-end gap-2">
                    <button
                      onClick={toggleRecording}
                      className={`p-3 rounded-xl transition ${
                        isRecording
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {isRecording ? (
                        <MicOff className="h-5 w-5" />
                      ) : (
                        <Mic className="h-5 w-5" />
                      )}
                    </button>
                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe what you want to build..."
                        rows={1}
                        className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        style={{ minHeight: "48px", maxHeight: "200px" }}
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!input.trim() || sending}
                      className="p-3 bg-primary text-primary-foreground rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "code" && (
              <div className="h-full flex flex-col">
                {selectedFile ? (
                  <>
                    <div className="border-b px-4 py-2 flex items-center justify-between">
                      <span className="text-sm font-medium">{selectedFile.path}</span>
                      <button
                        onClick={copyCode}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-muted transition"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <pre className="p-4 text-sm">
                        <code>{selectedFile.content}</code>
                      </pre>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Code2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Select a File</h3>
                      <p className="text-muted-foreground">
                        Choose a file from the sidebar to view its code
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "preview" && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Preview Coming Soon</h3>
                  <p className="text-muted-foreground max-w-md">
                    Live preview will be available once your application is deployed.
                    {project.deploymentUrl && (
                      <a
                        href={project.deploymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-4 text-primary hover:underline"
                      >
                        View deployed application →
                      </a>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
