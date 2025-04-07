import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getUserConversations, sendWebhookRequest } from '@/services/conversation-service';
import { TavernLogo } from '@/components/TavernLogo';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function ConversationDebug() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayload, setSelectedPayload] = useState<any>(null);
  // Set the webhook URL explicitly
  const [webhookUrl, setWebhookUrl] = useState('https://neilfd.app.n8n.cloud/webhook/8ba16b2c-84dc-4a7c-b1cd-7c018d4042ee');
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getUserConversations();
        setConversations(data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast.error('Failed to load conversation history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversations();
  }, []);

  const handleTestWebhook = async (payload: any) => {
    if (!webhookUrl) {
      toast.error('Please enter a webhook URL');
      return;
    }

    setSendingTest(true);
    setSelectedPayload(payload);
    
    try {
      const response = await sendWebhookRequest(webhookUrl, payload);
      
      if (response.success) {
        toast.success('Webhook test sent successfully');
        const updatedConversations = await getUserConversations();
        setConversations(updatedConversations);
      } else {
        toast.error(`Webhook test failed: ${response.status || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending test webhook:', error);
      toast.error('Failed to send webhook test');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="container max-w-7xl py-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild className="mr-2">
            <Link to="/performance/conversation-history">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-tavern-blue">Webhook Debugging</h1>
        </div>
        <TavernLogo size="md" className="hidden md:block" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Webhook URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="flex-1 p-2 border rounded"
                  placeholder="Enter webhook URL"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversation Payloads</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tavern-blue"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No conversation history found</div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => (
                <Card key={conversation.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">{conversation.query}</CardTitle>
                      <span className="text-xs text-gray-500">
                        {new Date(conversation.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="mb-4">
                      <h4 className="font-semibold mb-1">Response:</h4>
                      <p className="text-sm bg-gray-50 p-3 rounded">{conversation.response}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Payload:</h4>
                      <ScrollArea className="h-32 border rounded p-2 bg-gray-50">
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(conversation.payload, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 py-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleTestWebhook(conversation.payload)}
                      disabled={sendingTest && selectedPayload === conversation.payload}
                      className="ml-auto"
                    >
                      {sendingTest && selectedPayload === conversation.payload ? (
                        <div className="flex items-center gap-2">
                          <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-tavern-blue"></span>
                          <span>Sending...</span>
                        </div>
                      ) : (
                        <>
                          <Send className="h-3 w-3 mr-1" /> Test Webhook
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
