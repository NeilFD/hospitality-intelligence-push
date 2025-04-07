
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TavernLogo } from '@/components/TavernLogo';
import { getUserConversations, deleteConversation, Conversation, updateConversationSharedStatus } from '@/services/conversation-service';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Trash2, Share2, ArrowLeft, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ConversationHistory() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getUserConversations();
        console.log("Fetched conversations:", data);
        setConversations(data);
      } catch (error) {
        toast.error("Failed to load conversation history");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteConversation(id);
      setConversations(conversations.filter(conv => conv.id !== id));
      toast.success("Conversation deleted");
    } catch (error) {
      toast.error("Failed to delete conversation");
      console.error(error);
    }
  };

  const toggleShared = async (id: string, currentValue: boolean) => {
    try {
      await updateConversationSharedStatus(id, !currentValue);
      setConversations(conversations.map(conv => 
        conv.id === id ? { ...conv, shared: !currentValue } : conv
      ));
      toast.success(currentValue ? "Conversation unshared" : "Conversation shared");
    } catch (error) {
      toast.error("Failed to update sharing status");
      console.error(error);
    }
  };

  // Function to share message via email
  const shareViaEmail = (message: string) => {
    const subject = encodeURIComponent("Insights from Cleo - Tavern Kitchen Assistant");
    const body = encodeURIComponent(message);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    toast.success("Email client opened");
  };
  
  // Function to share message via WhatsApp
  const shareViaWhatsApp = (message: string) => {
    const text = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${text}`);
    toast.success("WhatsApp sharing initiated");
  };

  return (
    <div className="container max-w-7xl py-6 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <Link to="/performance/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-tavern-blue">Conversation History</h1>
        </div>
        <TavernLogo size="3xl" className="hidden md:block" />
      </div>

      <Card className="overflow-hidden border-none shadow-lg rounded-xl bg-gradient-to-br from-white to-gray-50">
        <CardHeader>
          <CardTitle>Your conversations with Cleo</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="flex gap-1">
                <span className="w-3 h-3 bg-tavern-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-3 h-3 bg-tavern-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-3 h-3 bg-tavern-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No conversations found. Start chatting with Cleo to see your history here.</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {conversations.map((conversation) => (
                  <div 
                    key={conversation.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 mr-4">
                        <p className="font-medium text-tavern-blue-dark mb-1">{conversation.query}</p>
                        <p className="text-sm text-gray-600 mb-3">{conversation.response}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(conversation.timestamp), { addSuffix: true })}
                          </p>
                          <div className="flex items-center gap-1 text-xs">
                            <span className={`w-2 h-2 rounded-full ${conversation.shared ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                            <span className={conversation.shared ? 'text-green-600' : 'text-gray-500'}>
                              {conversation.shared ? 'Shared' : 'Private'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => shareViaWhatsApp(conversation.response)}>
                              Share via WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => shareViaEmail(conversation.response)}>
                              Share via Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleShared(conversation.id, conversation.shared)}>
                              {conversation.shared ? (
                                <span className="flex items-center gap-1">
                                  <X className="h-4 w-4" /> Make Private
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Check className="h-4 w-4" /> Mark as Shared
                                </span>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => handleDelete(conversation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
