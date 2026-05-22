import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Download, Shuffle } from "lucide-react";

interface ExportPanelProps {
  chatId: number;
  chatName: string;
}

export function ExportPanel({ chatId, chatName }: ExportPanelProps) {
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const exportChatQuery = trpc.chat.exportChat.useQuery({ chatId });
  const randomizeTimestampsMutation = trpc.chat.randomizeTimestamps.useMutation({
    onSuccess: () => {
      setIsRandomizing(false);
      toast.success("Timestamps randomized successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to randomize timestamps");
    },
  });

  const handleExport = () => {
    if (!exportChatQuery.data?.htmlContent) {
      toast.error("Failed to generate export");
      return;
    }

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/html;charset=utf-8," + encodeURIComponent(exportChatQuery.data.htmlContent));
    element.setAttribute("download", `${chatName}.html`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Chat exported successfully");
  };

  const handleRandomize = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    randomizeTimestampsMutation.mutate({
      chatId,
      startDate: new Date(startDate).getTime(),
      endDate: new Date(endDate).getTime(),
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Chat
          </CardTitle>
          <CardDescription>Download the chat as a Telegram-style HTML file</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleExport}
            disabled={exportChatQuery.isLoading}
            className="w-full"
          >
            {exportChatQuery.isLoading ? "Generating..." : "Export as HTML"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shuffle className="w-5 h-5" />
            Randomize Timestamps
          </CardTitle>
          <CardDescription>Distribute messages across a date range with realistic patterns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleRandomize}
            disabled={randomizeTimestampsMutation.isPending}
            className="w-full"
          >
            {randomizeTimestampsMutation.isPending ? "Randomizing..." : "Randomize Timestamps"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
