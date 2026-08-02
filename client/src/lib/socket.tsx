import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useApp } from '../App';
import { employeesAPI } from './api';

// Types for messages and chat
export interface Message {
  _id: string;
  from: string | { _id: string; name: string };
  to: string | { _id: string; name: string };
  content: string;
  read: boolean;
  isGroup: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SocketContextType {
  socket: Socket | null;
  messages: Message[];
  unreadCount: number;
  sendPersonalMessage: (to: string, content: string) => Promise<void>;
  sendGroupMessage: (roomId: string, content: string) => Promise<void>;
  markMessagesAsRead: (messageIds: string[]) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { currentUser } = useApp();
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Initialize socket when user is available
  useEffect(() => {
    if (!currentUser?._id) return;

    // console.log('🔌 Initializing socket for user:', currentUser);
    
    // Connect to socket server
    socketRef.current = io('https://hrm-traxale.onrender.com', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current.on('connect', () => {
      // console.log('✅ Socket.IO connected successfully!', socketRef.current?.id);
    });

    socketRef.current.on('disconnect', (reason) => {
      // console.log('❌ Socket.IO disconnected:', reason);
    });

    socketRef.current.on('connect_error', (err) => {
      // console.log('❌ Socket.IO connection error:', err.message);
    });

    // Find user's manager name
    const fetchManagerName = async () => {
      let managerName = '';
      if (currentUser.role === 'employee') {
        try {
          const allEmployeesRes = await employeesAPI.getAll();
          const allEmployees = allEmployeesRes.data || [];
          const emp = allEmployees.find((e: any) => e._id === currentUser._id || e.employeeId === currentUser.employeeId);
          if (emp?.manager) managerName = emp.manager;
        } catch (error) {
          // console.error('❌ Failed to fetch manager name:', error);
        }
      }
      
      // Emit user online
      socketRef.current?.emit('userOnline', {
        userId: currentUser._id,
        role: currentUser.role,
        managerName: managerName,
        name: currentUser.name
      });
    };
    
    fetchManagerName();

    // Listen for new messages
    socketRef.current.on('receiveMessage', (newMessage: Message) => {
      // console.log('📨 Received message:', newMessage);
      
      // Only add if it doesn't already exist
      setMessages(prev => {
        const exists = prev.some(m => m._id === newMessage._id);
        if (!exists) {
          return [...prev, newMessage];
        }
        return prev;
      });
      
      // Update unread count
      const toId = typeof newMessage.to === 'string' ? newMessage.to : newMessage.to?._id;
      if (toId === currentUser._id && !newMessage.read) {
        setUnreadCount(prev => prev + 1);
      }
    });

    // Listen for messages marked as read
    socketRef.current.on('messagesRead', ({ messageIds }) => {
      setMessages(prev =>
        prev.map(msg =>
          messageIds.includes(msg._id) ? { ...msg, read: true } : msg
        )
      );
      setUnreadCount(0);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [currentUser?._id]);

  // Send personal message
  const sendPersonalMessage = async (to: string, content: string) => {
    if (!socketRef.current || !currentUser?._id) return;
    socketRef.current.emit('sendPersonalMessage', {
      from: currentUser._id,
      to: to,
      content: content
    });
  };

  // Send group message
  const sendGroupMessage = async (roomId: string, content: string) => {
    if (!socketRef.current || !currentUser?._id) return;
    socketRef.current.emit('sendGroupMessage', {
      from: currentUser._id,
      roomId: roomId,
      content: content
    });
  };

  // Mark messages as read
  const markMessagesAsRead = async (messageIds: string[]) => {
    if (!socketRef.current || !currentUser?._id) return;
    socketRef.current.emit('markAsRead', {
      messageIds: messageIds,
      userId: currentUser._id
    });
    setUnreadCount(0);
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        messages,
        unreadCount,
        sendPersonalMessage,
        sendGroupMessage,
        markMessagesAsRead,
        setMessages
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
