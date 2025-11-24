import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  status?: 'sending' | 'sent' | 'read';
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load chat history on mount
  useEffect(() => {
    if (!user || !isOpen) return;

    const loadChatHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from('chat_conversations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(50);

        if (error) throw error;

        if (data && data.length > 0) {
          setMessages(
            data.map((msg) => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              timestamp: new Date(msg.created_at),
              status: 'read' as const,
            }))
          );
        } else {
          // No history, show welcome message
          setMessages([
            {
              role: 'assistant',
              content:
                "Kumusta! 👋 I'm here to help you with KanggaXpress. Ask me anything about rides, deliveries, or how to use the app!",
              timestamp: new Date(),
              status: 'read',
            },
          ]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        // Show welcome message on error
        setMessages([
          {
            role: 'assistant',
            content:
              "Kumusta! 👋 I'm here to help you with KanggaXpress. Ask me anything about rides, deliveries, or how to use the app!",
            timestamp: new Date(),
            status: 'read',
          },
        ]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [user, isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Mark user messages as read when assistant responds
  useEffect(() => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.role === 'user' && msg.status !== 'read'
          ? { ...msg, status: 'read' as const }
          : msg
      )
    );
  }, [messages.filter((m) => m.role === 'assistant').length]);

  // Save message to database
  const saveMessageToDb = async (role: 'user' | 'assistant', content: string) => {
    if (!user) return;

    try {
      await supabase.from('chat_conversations').insert({
        user_id: user.id,
        role,
        content,
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const streamChat = async (userMessage: string) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot`;

    // Show typing indicator
    setIsTyping(true);

    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: [...messages, { role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok || !response.body) {
      setIsTyping(false);
      if (response.status === 429) {
        throw new Error('Too many requests. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('Service temporarily unavailable.');
      }
      throw new Error('Failed to get response');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let assistantContent = '';
    let streamDone = false;

    // Add empty assistant message to update
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '', timestamp: new Date(), status: 'read' },
    ]);
    setIsTyping(false);

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            // Update the last assistant message
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                role: 'assistant',
                content: assistantContent,
                timestamp: new Date(),
                status: 'read',
              };
              return newMessages;
            });
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    // Save assistant response to database
    if (assistantContent) {
      await saveMessageToDb('assistant', assistantContent);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user) {
      if (!user) {
        toast({
          title: 'Not Logged In',
          description: 'Please log in to use the chatbot',
          variant: 'destructive',
        });
      }
      return;
    }

    const userMessage = input.trim();
    setInput('');

    // Add user message with 'sending' status
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage, timestamp: new Date(), status: 'sending' },
    ]);

    // Save user message to database
    await saveMessageToDb('user', userMessage);

    // Update to 'sent' after a brief delay
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg, idx) =>
          idx === prev.length - 1 && msg.status === 'sending'
            ? { ...msg, status: 'sent' as const }
            : msg
        )
      );
    }, 300);

    setIsLoading(true);

    try {
      await streamChat(userMessage);
    } catch (error) {
      console.error('Chat error:', error);
      setIsTyping(false);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
      // Remove the empty assistant message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setMessages([
        {
          role: 'assistant',
          content:
            "Kumusta! 👋 I'm here to help you with KanggaXpress. Ask me anything about rides, deliveries, or how to use the app!",
          timestamp: new Date(),
          status: 'read',
        },
      ]);

      toast({
        title: 'Chat Cleared',
        description: 'Your chat history has been deleted.',
      });
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear chat history',
        variant: 'destructive',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
          size="icon"
        >
          <MessageCircle className="h-8 w-8" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col bg-background border-2 border-primary/20">
          {/* Header */}
          <div className="bg-primary p-4 flex items-center justify-between rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground">KanggaXpress Helper</h3>
                <p className="text-xs text-primary-foreground/80">Ask me anything!</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearHistory}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
                title="Clear chat history"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex gap-1">
                  <div
                    className="h-2 w-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className="h-2 w-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="h-2 w-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent text-accent-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === 'user' && message.status && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      {message.status === 'sending' && (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Sending...</span>
                        </>
                      )}
                      {message.status === 'sent' && (
                        <>
                          <CheckCheck className="h-3 w-3" />
                          <span>Sent</span>
                        </>
                      )}
                      {message.status === 'read' && (
                        <>
                          <CheckCheck className="h-3 w-3 text-primary" />
                          <span className="text-primary">Read</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex items-start">
                  <div className="bg-accent text-accent-foreground rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div
                          className="h-2 w-2 bg-current rounded-full animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        />
                        <div
                          className="h-2 w-2 bg-current rounded-full animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        />
                        <div
                          className="h-2 w-2 bg-current rounded-full animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">Typing...</span>
                    </div>
                  </div>
                </div>
              )}
              {isLoading && !isTyping && (
                <div className="flex justify-start">
                  <div className="bg-accent text-accent-foreground rounded-lg p-3">
                    <div className="flex gap-1">
                      <div
                        className="h-2 w-2 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <div
                        className="h-2 w-2 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <div
                        className="h-2 w-2 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || !user}
                size="icon"
                className="flex-shrink-0"
                title={!user ? 'Please log in to chat' : 'Send message'}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {!user ? 'Please log in to use the chatbot' : 'Available in English and Tagalog'}
            </p>
          </div>
        </Card>
      )}
    </>
  );
}
