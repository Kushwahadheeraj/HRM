import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Users, User, Paperclip } from 'lucide-react';
import { useApp } from '../App';
import { chatAPI, channelAPI } from '../lib/api';
import { ChatMessage, Channel, User as UserType } from '../lib/types';
import { getInitials, getAvatarColor } from '../lib/data';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserType[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useApp();

  // Hide chat for super admin, HR, and Administration users
  const isSuperAdmin = currentUser?.email === 'dheeraj01072001@gmail.com' || currentUser?.role === 'super_admin';
  const isAdministrationUser = currentUser?.department === 'Administration';
  const isHrUser = currentUser?.role === 'hr_manager';
  if (isSuperAdmin || isAdministrationUser || isHrUser) return null;

  // Get display name for channel
  const getChannelDisplayName = (channel: Channel) => {
    if (channel.type === 'team') return 'Team Chat';
    // For direct messages, show the other user's name
    const otherUser = channel.participants?.find(
      (p) => p.id !== currentUser?.id && p._id?.toString() !== currentUser?.id
    );
    return otherUser?.name || 'Direct Chat';
  };

  // Fetch channels and team members
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [channelsRes, membersRes] = await Promise.all([
        channelAPI.getAll(),
        channelAPI.getTeamMembers(),
      ]);
      
      const loadedChannels = channelsRes.data || [];
      setChannels(loadedChannels);
      setTeamMembers((membersRes.data || []) as any);
      
      // Always select the team channel if available
      const teamChat = loadedChannels.find((c: Channel) => c.type === 'team');
      if (teamChat) {
        setSelectedChannel(teamChat);
      } else if (loadedChannels.length > 0) {
        setSelectedChannel(loadedChannels[0]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  // Load messages for selected channel
  const loadMessages = async (channelId: string) => {
    try {
      const res = await chatAPI.getChannelMessages(channelId);
      setMessages(res.data || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // Initial load
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Load messages when selected channel changes
  useEffect(() => {
    if (selectedChannel && selectedChannel.id && isOpen) {
      loadMessages(selectedChannel.id);
    }
  }, [selectedChannel, isOpen]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() && selectedFiles.length === 0) return;
    if (!selectedChannel) return;

    try {
      if (!selectedChannel.id) return;
      const res = await chatAPI.sendMessage({
        channelId: selectedChannel.id,
        content: messageInput.trim(),
        files: selectedFiles.length > 0 ? selectedFiles : undefined,
      });
      
      if (res.data) {
        setMessages(prev => [...prev, res.data].filter(Boolean) as ChatMessage[]);
      }
      
      setMessageInput('');
      setSelectedFiles([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle starting direct message with team member
  const handleStartDM = async (member: UserType) => {
    try {
      const res = await channelAPI.getOrCreateDirect(member.id || member._id?.toString() || '');
      if (res.data) {
        // Add the new DM to channels list if not already there
        setChannels(prev => {
          const exists = prev.some(c => c.id === res.data!.id);
          return exists ? prev : [res.data, ...prev].filter(Boolean) as Channel[];
        });
        setSelectedChannel(res.data);
      }
    } catch (error) {
      console.error('Failed to start DM:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Get team chat and DM channels separately
  const teamChannel = channels.find(c => c.type === 'team');
  const directChannels = channels.filter(c => c.type === 'direct');

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 z-50"
        style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
      >
        <MessageSquare size={24} />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[90vw] md:w-[600px] h-[450px] rounded-2xl shadow-2xl flex overflow-hidden z-40" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
          {/* Sidebar */}
          <div className="w-48 flex flex-col" style={{ background: 'var(--bg-primary)', borderRight: '1px solid var(--border-color)' }}>
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Chat</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="p-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="p-4 text-center">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{error}</p>
                  <button 
                    onClick={loadData}
                    className="mt-2 text-xs text-blue-500 hover:text-blue-400"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  {/* Team Chat Section */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider px-3 py-2" style={{ color: 'var(--text-muted)' }}>
                      Team
                    </h4>
                    {teamChannel && (
                      <button
                        key={teamChannel.id}
                        onClick={() => setSelectedChannel(teamChannel)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all mb-1 ${selectedChannel?.id === teamChannel.id ? 'text-white' : ''}`}
                        style={selectedChannel?.id === teamChannel.id ? { background: 'linear-gradient(135deg, #3B82F6, #2563EB)' } : { color: 'var(--text-primary)' }}
                      >
                        <Users size={16} />
                        <span className="text-sm font-medium">Team Chat</span>
                      </button>
                    )}
                  </div>

                  {/* Team Members Section for DMs */}
                  {teamMembers.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider px-3 py-2" style={{ color: 'var(--text-muted)' }}>
                        Team Members
                      </h4>
                      {teamMembers.map(member => {
                        // Check if there's already a DM with this member
                        const existingDM = directChannels.find(c => 
                          c.participants.some(p => (p.id === member.id || p._id?.toString() === member.id || p._id?.toString() === member._id?.toString()))
                        );
                        
                        return (
                          <button
                            key={member.id || member._id?.toString()}
                            onClick={() => existingDM ? setSelectedChannel(existingDM) : handleStartDM(member)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all mb-1 ${selectedChannel?.id === existingDM?.id ? 'text-white' : ''}`}
                            style={selectedChannel?.id === existingDM?.id ? { background: 'linear-gradient(135deg, #3B82F6, #2563EB)' } : { color: 'var(--text-primary)' }}
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                              style={{ background: getAvatarColor(member.name) }}
                            >
                              {getInitials(member.name)}
                            </div>
                            <span className="text-sm font-medium">{member.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3">
                {selectedChannel?.type === 'team' ? (
                  <Users size={20} style={{ color: 'var(--text-primary)' }} />
                ) : (
                  <User size={20} style={{ color: 'var(--text-primary)' }} />
                )}
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {selectedChannel ? getChannelDisplayName(selectedChannel) : 'Select a chat'}
                  </h3>
                  {selectedChannel?.type === 'team' && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Team group chat</p>
                  )}
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-opacity-50 transition-all" style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading chat...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{error}</p>
                  <button 
                    onClick={loadData}
                    className="mt-2 text-xs text-blue-500 hover:text-blue-400"
                  >
                    Try again
                  </button>
                </div>
              ) : !selectedChannel ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare size={48} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                  <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>Select a chat to start</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare size={48} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                  <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>No messages yet. Say hi!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const userName = typeof msg.userId === 'object' && msg.userId ? msg.userId.name : 'User';
                  return (
                  <div key={msg.id} className="flex gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                      style={{ background: getAvatarColor(userName) }}
                    >
                      {getInitials(userName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {userName}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                      {msg.content && (
                        <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                          {msg.content}
                        </p>
                      )}
                      {msg.files && msg.files.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {msg.files.map((file, i) => (
                            <a
                              key={i}
                              href={`https://hrm-traxale.onrender.com${file.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 rounded-lg"
                              style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}
                            >
                              <Paperclip size={14} style={{ color: 'var(--text-muted)' }} />
                              <span className="text-sm truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>
                                {file.name}
                              </span>
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                ({formatFileSize(file.size)})
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {selectedChannel && !loading && !error && (
              <div className="p-4 border-t" style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-color)' }}>
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                        <span className="text-sm truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>
                          {file.name}
                        </span>
                        <button onClick={() => removeFile(i)} style={{ color: 'var(--text-muted)' }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl transition-all hover:scale-105"
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                  >
                    <Paperclip size={18} />
                  </button>
                  <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-sm"
                      style={{ color: 'var(--text-primary)' }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!messageInput.trim() && selectedFiles.length === 0}
                    className="p-3 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
