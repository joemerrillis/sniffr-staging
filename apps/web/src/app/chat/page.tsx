'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiClient, type Chat, type Message } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function ChatPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await apiClient.getChats();
        if (response.data) {
          setChats(response.data);
          if (response.data.length > 0) {
            setSelectedChat(response.data[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChats();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedChat) {
        try {
          const response = await apiClient.getMessages(selectedChat.id);
          if (response.data) {
            setMessages(response.data);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      }
    };
    fetchMessages();
  }, [selectedChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !newMessage.trim()) return;

    setIsSending(true);
    try {
      const response = await apiClient.sendMessage(selectedChat.id, {
        content: newMessage.trim(),
        message_type: 'text'
      });
      
      if (response.data) {
        setMessages(prev => [...prev, response.data!]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading messages...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">Communicate with clients and team</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              {chats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No conversations yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {chats.map((chat) => (
                    <div 
                      key={chat.id}
                      className={`p-3 rounded-lg cursor-pointer ${
                        selectedChat?.id === chat.id 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="font-medium">
                        {chat.name || `Chat ${chat.id.substring(0, 8)}...`}
                      </div>
                      <div className="text-sm text-gray-600">
                        {chat.participants.length} participants
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(chat.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedChat ? 
                  (selectedChat.name || `Chat ${selectedChat.id.substring(0, 8)}...`) : 
                  'Select a conversation'
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[500px]">
              {selectedChat ? (
                <>
                  <div className="flex-1 p-4 bg-gray-50 rounded-lg mb-4 overflow-y-auto">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div 
                            key={message.id} 
                            className={`flex ${
                              message.user_id === user?.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div className={`rounded-lg p-3 shadow-sm max-w-xs ${
                              message.user_id === user?.id 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                              <div className={`text-xs mt-1 ${
                                message.user_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {new Date(message.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isSending}
                    />
                    <button 
                      type="submit"
                      disabled={isSending || !newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSending ? 'Sending...' : 'Send'}
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Select a conversation to start messaging
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}