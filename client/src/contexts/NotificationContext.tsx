import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

// Type for individual notification
export type Notification = {
  id: number;
  type: string;
  title: string;
  content: string;
  status: 'unread' | 'read' | 'dismissed';
  createdAt: string;
  metadata?: Record<string, any>;
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  dismissAll: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(60000); // 1 minute
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch notifications from server
  const fetchNotifications = async () => {
    if (!user) {
      // Don't fetch for unauthenticated users
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiRequest('GET', '/api/retention/notifications/unread');
      const data = await response.json();

      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.length);
      }
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (id: number) => {
    try {
      await apiRequest('PATCH', `/api/retention/notifications/${id}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, status: 'read' } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast({
        title: 'Error',
        description: 'Failed to update notification status',
        variant: 'destructive',
      });
    }
  };

  // Dismiss all notifications
  const dismissAll = async () => {
    if (notifications.length === 0) return;

    try {
      // Mark all as read one by one
      // Ideally this would be a batch operation on the server
      for (const notification of notifications.filter(n => n.status === 'unread')) {
        await markAsRead(notification.id);
      }

      // Update local state
      setNotifications([]);
      setUnreadCount(0);
      
      toast({
        title: 'Success',
        description: 'All notifications dismissed',
      });
    } catch (err) {
      console.error('Error dismissing notifications:', err);
      toast({
        title: 'Error',
        description: 'Failed to dismiss notifications',
        variant: 'destructive',
      });
    }
  };

  // Initial fetch and periodic refresh
  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Set up periodic refresh
      const intervalId = setInterval(() => {
        fetchNotifications();
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [user, refreshInterval]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        dismissAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};