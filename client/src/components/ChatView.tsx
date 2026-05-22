import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TelegramMessage } from "./TelegramMessage";
import { ParticipantManager } from "./ParticipantManager";
import { ExportPanel } from "./ExportPanel";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Users, Download } from "lucide-react";
import { MediaUpload } from "./MediaUpload";
import { useMediaUpload } from "@/hooks/useMediaUpload";

interface ChatViewProps {
  chatId: number;
  chatName: string;
}

interface EditingMessage {
  id: number;
  participantId: number;
  text?: string;
  timestamp: number;
}

export function ChatView({ chatId, chatName }: ChatViewProps) {
  const [editingMessage, setEditingMessage] = useState<EditingMessage | null>(null);
  const [isAddingMessage, setIsAddingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], refetch: refetchMessages } = trpc.chat.getChatMessages.useQuery({ chatId });
  const { data: participants = [], refetch: refetchParticipants } = trpc.chat.getChatParticipants.useQuery({ chatId });

  const updateMessageMutation = trpc.chat.updateMessage.useMutation({
    onSuccess: () => {
      refetchMessages();
      setEditingMessage(null);
      toast.success("Message updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update message");
    },
  });

  const deleteMessageMutation = trpc.chat.deleteMessage.useMutation({
    onSuccess: () => {
      refetchMessages();
      toast.success("Message deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete message");
    },
  });

  const { uploadMedia } = useMediaUpload();

  const createMessageMutation = trpc.chat.createMessage.useMutation({
    onSuccess: async (newMessage) => {
      // If there's selected media, upload it after message creation
      if (addMessageState.selectedMedia && addMessageState.mediaType) {
        try {
          await uploadMedia(
            newMessage.id,
            addMessageState.selectedMedia,
            addMessageState.mediaType
          );
        } catch (error) {
          console.error("Failed to upload media:", error);
        }
      }
      refetchMessages();
      setIsAddingMessage(false);
      setAddMessageState({ selectedMedia: null, mediaType: null });
      toast.success("Message added");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add message");
    },
  });

  const [addMessageState, setAddMessageState] = useState<{
    selectedMedia: File | null;
    mediaType: "photo" | "video" | "gif" | "sticker" | "document" | null;
  }>({
    selectedMedia: null,
    mediaType: null,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleEditMessage = (messageId: number) => {
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      setEditingMessage({
        id: messageId,
        participantId: message.participantId || 0,
        text: message.text || undefined,
        timestamp: message.timestamp,
      });
    }
  };

  const handleSaveEdit = () => {
    if (!editingMessage) return;

    updateMessageMutation.mutate({
      messageId: editingMessage.id,
      participantId: editingMessage.participantId,
      text: editingMessage.text,
      timestamp: editingMessage.timestamp,
    });
  };

  const handleDeleteMessage = (messageId: number) => {
    if (confirm("Are you sure you want to delete this message?")) {
      deleteMessageMutation.mutate({ messageId });
    }
  };

  const handleAddMessage = (formData: { participantId: number; text: string; timestamp: number }) => {
    createMessageMutation.mutate({
      chatId,
      participantId: formData.participantId,
      text: formData.text,
      timestamp: formData.timestamp,
    });
  };

  return (
    <Tabs defaultValue="messages" className="flex flex-col h-full bg-white">
      <TabsList className="w-full rounded-none border-b border-gray-200 bg-gray-50">
        <TabsTrigger value="messages">Messages</TabsTrigger>
        <TabsTrigger value="participants" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>Participants</span>
        </TabsTrigger>
        <TabsTrigger value="export" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          <span>Export</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="messages" className="flex-1 flex flex-col m-0">
        <div className="flex-1 overflow-y-auto border-b border-gray-200 bg-[#18222d]">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm">Add messages to get started</p>
              </div>
            </div>
          ) : (
            <div className="py-4">
              {messages.map((message) => {
                const participant = participants.find((p) => p.id === message.participantId);
                return (
                  <TelegramMessage
                    key={message.id}
                    id={message.id}
                    senderName={participant?.name || "Unknown"}
                    senderInitials={participant?.initials || "?"}
                    avatarColor={participant?.avatarColor || "userpic1"}
                    text={message.text || undefined}
                    timestamp={message.timestamp}
                    isServiceMessage={message.isServiceMessage}
                    media={(message as any).media}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={() => setIsAddingMessage(true)}
            className="w-full"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Message
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="participants" className="flex-1 overflow-y-auto m-0 p-4">
        <ParticipantManager
          chatId={chatId}
          participants={participants}
          onUpdate={() => {
            refetchParticipants();
            refetchMessages();
          }}
        />
      </TabsContent>

      <TabsContent value="export" className="flex-1 overflow-y-auto m-0 p-4">
        <ExportPanel chatId={chatId} chatName={chatName} />
      </TabsContent>

      <Dialog open={!!editingMessage} onOpenChange={(open) => !open && setEditingMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
          </DialogHeader>
          {editingMessage && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Sender</label>
                <Select
                  value={editingMessage.participantId.toString()}
                  onValueChange={(value) =>
                    setEditingMessage({ ...editingMessage, participantId: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {participants.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Message Text</label>
                <Textarea
                  value={editingMessage.text || ""}
                  onChange={(e) => setEditingMessage({ ...editingMessage, text: e.target.value })}
                  placeholder="Enter message text..."
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Timestamp</label>
                <Input
                  type="datetime-local"
                  value={new Date(editingMessage.timestamp).toISOString().slice(0, 16)}
                  onChange={(e) =>
                    setEditingMessage({
                      ...editingMessage,
                      timestamp: new Date(e.target.value).getTime(),
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMessage(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMessageMutation.isPending}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddMessageDialog
        open={isAddingMessage}
        onOpenChange={setIsAddingMessage}
        participants={participants}
        onAdd={handleAddMessage}
        isLoading={createMessageMutation.isPending}
        chatId={chatId}
        onMediaSelect={(file, type) => {
          setAddMessageState({ selectedMedia: file, mediaType: type });
        }}
        selectedMedia={addMessageState.selectedMedia}
        selectedMediaType={addMessageState.mediaType}
        onClearMedia={() => {
          setAddMessageState({ selectedMedia: null, mediaType: null });
        }}
      />
    </Tabs>
  );
}

interface AddMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: Array<{ id: number; name: string }>;
  onAdd: (data: { participantId: number; text: string; timestamp: number }) => void;
  isLoading: boolean;
  chatId: number;
  onMediaSelect?: (file: File, type: "photo" | "video" | "gif" | "sticker" | "document") => void;
  selectedMedia?: File | null;
  selectedMediaType?: "photo" | "video" | "gif" | "sticker" | "document" | null;
  onClearMedia?: () => void;
}

function AddMessageDialog({
  open,
  onOpenChange,
  participants,
  onAdd,
  isLoading,
  chatId,
  onMediaSelect,
  selectedMedia: propSelectedMedia,
  selectedMediaType: propSelectedMediaType,
  onClearMedia,
}: AddMessageDialogProps) {
  const [participantId, setParticipantId] = useState<string>(
    participants[0]?.id.toString() || ""
  );
  const [text, setText] = useState("");
  const [timestamp, setTimestamp] = useState(
    new Date().toISOString().slice(0, 16)
  );

  const selectedMedia = propSelectedMedia || null;
  const selectedMediaType = propSelectedMediaType || null;

  const handleMediaSelect = (file: File, type: "photo" | "video" | "gif" | "sticker" | "document") => {
    if (onMediaSelect) {
      onMediaSelect(file, type);
    }
    toast.success(`${type} selected: ${file.name}`);
  };

  const handleSubmit = () => {
    if (!participantId || !text) {
      toast.error("Please fill in all fields");
      return;
    }

    onAdd({
      participantId: parseInt(participantId),
      text,
      timestamp: new Date(timestamp).getTime(),
    });

    setText("");
    setTimestamp(new Date().toISOString().slice(0, 16));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Sender</label>
            <Select value={participantId} onValueChange={setParticipantId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {participants.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Message Text</label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter message text..."
              rows={4}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Timestamp</label>
            <Input
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Media (Optional)</label>
            <MediaUpload onMediaSelect={handleMediaSelect} />
            {selectedMedia && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                <p className="font-medium">Selected: {selectedMedia.name}</p>
                <p className="text-xs text-gray-600">Type: {selectedMediaType}</p>
                <button
                  onClick={() => {
                    if (onClearMedia) {
                      onClearMedia();
                    }
                  }}
                  className="text-xs text-blue-600 hover:underline mt-1"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            onOpenChange(false);
            if (onClearMedia) {
              onClearMedia();
            }
          }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            Add Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
