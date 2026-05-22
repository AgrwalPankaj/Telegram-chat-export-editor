import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Upload, Trash2, FileText, Download } from "lucide-react";
import { ChatView } from "@/components/ChatView";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: chats = [], refetch: refetchChats } = trpc.chat.getUserChats.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Mutations
  const createChatMutation = trpc.chat.createChat.useMutation({
    onSuccess: (chat) => {
      refetchChats();
      setSelectedChatId(chat.id);
      setIsCreatingChat(false);
      setNewChatName("");
      toast.success("Chat created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create chat");
    },
  });

  const importChatMutation = trpc.chat.importTelegramExport.useMutation({
    onSuccess: (chat) => {
      refetchChats();
      setSelectedChatId(chat.id);
      toast.success("Chat imported successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to import chat");
    },
  });

  const deleteChatMutation = trpc.chat.deleteChat.useMutation({
    onSuccess: () => {
      refetchChats();
      setSelectedChatId(null);
      toast.success("Chat deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete chat");
    },
  });

  const handleCreateChat = () => {
    if (!newChatName.trim()) {
      toast.error("Please enter a chat name");
      return;
    }
    createChatMutation.mutate({ name: newChatName });
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.html')) {
      toast.error("Please upload an HTML file");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      importChatMutation.mutate({ htmlContent: content });
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDeleteChat = (chatId: number) => {
    if (confirm("Are you sure you want to delete this chat?")) {
      deleteChatMutation.mutate({ chatId });
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Telegram Chat Simulator</CardTitle>
            <CardDescription>Please sign in to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar - Chat List */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">Telegram Chat Simulator</h1>
          <p className="text-xs text-gray-500 mt-1">{user.name}</p>
        </div>

        {/* Action Buttons */}
        <div className="p-3 border-b border-gray-100 flex gap-2">
          <Button
            onClick={() => setIsCreatingChat(true)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Chat
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            <Upload className="w-4 h-4 mr-1" />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".html"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
              <FileText className="w-16 h-16 mb-3 opacity-30" />
              <p className="text-sm font-medium">No chats yet</p>
              <p className="text-xs mt-2 text-center">Create a new chat or import from Telegram export</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${
                    selectedChatId === chat.id 
                      ? "bg-blue-50 border-blue-500" 
                      : "border-transparent"
                  }`}
                  onClick={() => setSelectedChatId(chat.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{chat.name}</h3>
                      {chat.description && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{chat.description}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat.id);
                      }}
                      className="p-1 hover:bg-red-100 rounded text-red-600 opacity-0 hover:opacity-100 transition-opacity flex-shrink-0"
                      title="Delete chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedChat ? (
          <ChatView chatId={selectedChat.id} chatName={selectedChat.name} />
        ) : (
          /* Upload Area - Telegram Style */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex-1 flex flex-col items-center justify-center p-8 transition-all ${
              isDragging 
                ? "bg-blue-50 border-2 border-blue-400" 
                : "bg-gray-50"
            }`}
          >
            <div className="text-center max-w-md">
              {/* Icon */}
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100">
                  <Download className="w-10 h-10 text-blue-600" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isDragging ? "Drop your file here" : "Import Telegram Chat"}
              </h2>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-6">
                Drag and drop your Telegram HTML export file here, or click the button below to browse
              </p>

              {/* Upload Button */}
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-500 hover:bg-blue-600 text-white mb-4"
                size="lg"
              >
                <Upload className="w-5 h-5 mr-2" />
                Choose File
              </Button>

              {/* Instructions */}
              <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left">
                <p className="text-xs font-semibold text-gray-700 mb-2">How to export from Telegram:</p>
                <ol className="text-xs text-gray-600 space-y-1">
                  <li>1. Open Telegram Desktop</li>
                  <li>2. Right-click on a chat</li>
                  <li>3. Select "Export chat history"</li>
                  <li>4. Choose HTML format</li>
                  <li>5. Upload the file here</li>
                </ol>
              </div>

              {/* Or create new */}
              <div className="mt-8">
                <p className="text-gray-600 text-sm mb-3">Or start fresh:</p>
                <Button
                  onClick={() => setIsCreatingChat(true)}
                  variant="outline"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Chat
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Chat Dialog */}
      <Dialog open={isCreatingChat} onOpenChange={setIsCreatingChat}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Chat Name</label>
              <Input
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                placeholder="Enter chat name..."
                onKeyPress={(e) => e.key === "Enter" && handleCreateChat()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingChat(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateChat} disabled={createChatMutation.isPending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
