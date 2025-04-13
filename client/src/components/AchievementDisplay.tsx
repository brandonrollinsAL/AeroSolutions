import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Award, Sparkles, X, Check } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';

interface Achievement {
  id: number;
  userId: number;
  type: string;
  title: string;
  content: string;
  status: 'unread' | 'read' | 'dismissed';
  metadata: {
    achievementType: string;
    icon: string;
    points: number;
    timestamp: string;
  };
  createdAt: string;
  readAt?: string;
}

/**
 * AchievementDisplay - Component for displaying user achievements
 */
export function AchievementDisplay() {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  
  // Fetch user's achievements
  const { data: achievements = [], isLoading, error } = useQuery({
    queryKey: ['/api/achievements/user'],
    queryFn: async () => {
      const response = await fetch('/api/achievements/user');
      if (!response.ok) {
        throw new Error('Failed to load achievements');
      }
      return response.json();
    }
  });

  // Mark achievement as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/achievements/${id}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/achievements/user'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to mark achievement as read: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Dismiss achievement
  const dismissAchievementMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/achievements/${id}/dismiss`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/achievements/user'] });
      setSelectedAchievement(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to dismiss achievement: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Handle viewing an achievement
  const handleViewAchievement = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    if (achievement.status === 'unread') {
      markAsReadMutation.mutate(achievement.id);
    }
  };

  // Get the icon for an achievement
  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'award':
        return <Award className="h-6 w-6 text-yellow-500" />;
      case 'sparkles':
        return <Sparkles className="h-6 w-6 text-blue-400" />;
      default:
        return <Award className="h-6 w-6 text-gray-500" />;
    }
  };

  // Get unread achievements count
  const unreadCount = achievements.filter((a: Achievement) => a.status === 'unread').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        Failed to load achievements
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {unreadCount > 0 && (
          <div className="mb-4 rounded-lg bg-blue-50 p-4 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
            <p className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span className="font-medium">You have {unreadCount} new achievement{unreadCount !== 1 ? 's' : ''}!</span>
            </p>
          </div>
        )}

        {achievements.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Award className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium">No achievements yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Continue using Elevion to earn achievements and rewards!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {achievements.map((achievement: Achievement) => (
              <Card 
                key={achievement.id} 
                className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 ${achievement.status === 'unread' ? 'border-blue-300 dark:border-blue-800' : ''}`}
                onClick={() => handleViewAchievement(achievement)}
              >
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900">
                    {getAchievementIcon(achievement.metadata.icon)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{achievement.title}</CardTitle>
                    <CardDescription>
                      {new Date(achievement.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {achievement.status === 'unread' && (
                    <Badge variant="secondary" className="ml-auto">New</Badge>
                  )}
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                    {achievement.content.substring(0, 120)}...
                  </p>
                </CardContent>
                <CardFooter>
                  <div className="flex w-full items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-amber-500">
                      <Sparkles className="h-4 w-4" /> {achievement.metadata.points} points
                    </span>
                    <span className="text-gray-500">
                      {achievement.status === 'read' ? 'Read' : achievement.status === 'unread' ? 'Unread' : 'Dismissed'}
                    </span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Achievement Detail Dialog */}
      <Dialog open={!!selectedAchievement} onOpenChange={(open) => !open && setSelectedAchievement(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedAchievement && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900">
                    {getAchievementIcon(selectedAchievement.metadata.icon)}
                  </div>
                  <DialogTitle>{selectedAchievement.title}</DialogTitle>
                </div>
                <DialogDescription>
                  Earned on {new Date(selectedAchievement.createdAt).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p>{selectedAchievement.content}</p>
                <Separator />
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="flex items-center gap-1 text-amber-500">
                    <Sparkles className="h-4 w-4" /> {selectedAchievement.metadata.points} points awarded
                  </Badge>
                  <Badge variant="secondary">
                    {selectedAchievement.metadata.achievementType}
                  </Badge>
                </div>
              </div>
              <DialogFooter className="flex flex-row justify-between sm:justify-between">
                <Button
                  variant="outline"
                  onClick={() => dismissAchievementMutation.mutate(selectedAchievement.id)}
                  disabled={dismissAchievementMutation.isPending}
                >
                  <X className="mr-2 h-4 w-4" />
                  Dismiss
                </Button>
                <Button onClick={() => setSelectedAchievement(null)}>
                  <Check className="mr-2 h-4 w-4" />
                  Got it
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AchievementDisplay;