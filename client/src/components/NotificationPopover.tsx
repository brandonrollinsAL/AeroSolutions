import React from 'react';
import { Bell } from 'lucide-react';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/contexts/NotificationContext';
import { ScrollArea } from '@/components/ui/scroll-area';

const NotificationPopover = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    dismissAll,
  } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary"
              variant="default"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissAll}
              className="text-xs h-8"
            >
              Dismiss all
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              <span>Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mb-2 opacity-20" />
              <p>No new notifications</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors ${
                    notification.status === 'unread' ? 'bg-muted/30' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium">{notification.title}</h4>
                    {notification.status === 'unread' && (
                      <Badge variant="default" className="ml-2 bg-primary">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {notification.type === 'retention'
                        ? 'Retention Message'
                        : notification.type}
                    </span>
                    <span>
                      {format(
                        new Date(notification.createdAt),
                        'MMM d, h:mm a'
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPopover;