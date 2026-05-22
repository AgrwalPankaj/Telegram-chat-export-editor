import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Edit2, Trash2 } from "lucide-react";

interface ParticipantManagerProps {
  chatId: number;
  participants: Array<{ id: number; name: string; initials: string | null; avatarColor: string }>;
  onUpdate?: () => void;
}

const AVATAR_COLORS = [
  { value: "userpic1", label: "Blue", color: "bg-blue-500" },
  { value: "userpic2", label: "Green", color: "bg-green-500" },
  { value: "userpic3", label: "Purple", color: "bg-purple-500" },
  { value: "userpic4", label: "Orange", color: "bg-orange-500" },
  { value: "userpic5", label: "Red", color: "bg-red-500" },
];

export function ParticipantManager({
  chatId,
  participants,
  onUpdate,
}: ParticipantManagerProps) {
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<{
    id: number;
    name: string;
    initials: string | null;
    avatarColor: string;
  } | null>(null);

  const createParticipantMutation = trpc.chat.createParticipant.useMutation({
    onSuccess: () => {
      setIsAddingParticipant(false);
      onUpdate?.();
      toast.success("Participant added");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add participant");
    },
  });

  const updateParticipantMutation = trpc.chat.updateParticipant.useMutation({
    onSuccess: () => {
      setEditingParticipant(null);
      onUpdate?.();
      toast.success("Participant updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update participant");
    },
  });

  const deleteParticipantMutation = trpc.chat.deleteParticipant.useMutation({
    onSuccess: () => {
      onUpdate?.();
      toast.success("Participant deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete participant");
    },
  });

  const handleDeleteParticipant = (participantId: number) => {
    if (confirm("Are you sure you want to delete this participant?")) {
      deleteParticipantMutation.mutate({ participantId });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Participants</h3>
        <Button
          onClick={() => setIsAddingParticipant(true)}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {participants.map((participant) => {
          const colorConfig = AVATAR_COLORS.find((c) => c.value === participant.avatarColor);
          return (
            <Card key={participant.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full ${colorConfig?.color || "bg-blue-500"} flex items-center justify-center text-white text-xs font-semibold`}
                    >
                      {participant.initials}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{participant.name}</p>
                      <p className="text-xs text-gray-500">{participant.initials}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingParticipant(participant)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteParticipant(participant.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AddParticipantDialog
        open={isAddingParticipant}
        onOpenChange={setIsAddingParticipant}
        onAdd={(data) => {
          createParticipantMutation.mutate({
            chatId,
            ...data,
          });
        }}
        isLoading={createParticipantMutation.isPending}
      />

      {editingParticipant && (
        <EditParticipantDialog
          open={!!editingParticipant}
          onOpenChange={(open) => !open && setEditingParticipant(null)}
          participant={editingParticipant}
          onSave={(data) => {
            updateParticipantMutation.mutate({
              participantId: editingParticipant.id,
              ...data,
            });
          }}
          isLoading={updateParticipantMutation.isPending}
        />
      )}
    </div>
  );
}

interface AddParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: { name: string; initials?: string; avatarColor?: string }) => void;
  isLoading: boolean;
}

function AddParticipantDialog({
  open,
  onOpenChange,
  onAdd,
  isLoading,
}: AddParticipantDialogProps) {
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");
  const [avatarColor, setAvatarColor] = useState("userpic1");

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    onAdd({
      name,
      initials: initials || undefined,
      avatarColor,
    });

    setName("");
    setInitials("");
    setAvatarColor("userpic1");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Participant</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter participant name..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Initials (optional)</label>
            <Input
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="E.g., AB"
              maxLength={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Avatar Color</label>
            <Select value={avatarColor} onValueChange={setAvatarColor}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVATAR_COLORS.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${color.color}`} />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            Add Participant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface EditParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participant: { id: number; name: string; initials: string | null; avatarColor: string };
  onSave: (data: { name?: string; initials?: string; avatarColor?: string }) => void;
  isLoading: boolean;
}

function EditParticipantDialog({
  open,
  onOpenChange,
  participant,
  onSave,
  isLoading,
}: EditParticipantDialogProps) {
  const [name, setName] = useState(participant.name);
  const [initials, setInitials] = useState(participant.initials);
  const [avatarColor, setAvatarColor] = useState(participant.avatarColor);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    onSave({
      name,
      initials: initials || undefined,
      avatarColor,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Participant</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter participant name..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Initials</label>
            <Input
              value={initials || ""}
              onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="E.g., AB"
              maxLength={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Avatar Color</label>
            <Select value={avatarColor} onValueChange={setAvatarColor}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVATAR_COLORS.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${color.color}`} />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
