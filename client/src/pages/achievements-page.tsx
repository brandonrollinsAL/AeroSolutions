import React from 'react';
import { Helmet } from 'react-helmet';
import { Star, Trophy, Award } from 'lucide-react';
import AchievementDisplay from '@/components/AchievementDisplay';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AchievementsPage = () => {
  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl">
      <Helmet>
        <title>Your Achievements | Elevion</title>
        <meta name="description" content="View your achievements, milestones, and rewards earned on the Elevion platform." />
      </Helmet>

      {/* Breadcrumb navigation */}
      <Breadcrumb className="mb-6" separator="/">
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Achievements</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Your Achievements</h1>
        <p className="mt-2 text-muted-foreground">
          Track your milestones and rewards as you engage with the Elevion platform.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {/* Total achievements card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Achievements</CardTitle>
            <CardDescription>All achievements earned</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-primary mr-3" />
              <span className="text-3xl font-bold">12</span>
            </div>
          </CardContent>
        </Card>

        {/* Points earned card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Points Earned</CardTitle>
            <CardDescription>Loyalty points collected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Star className="w-8 h-8 text-amber-500 mr-3" />
              <span className="text-3xl font-bold">350</span>
            </div>
          </CardContent>
        </Card>

        {/* Ranking card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Your Rank</CardTitle>
            <CardDescription>Based on achievement points</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Award className="w-8 h-8 text-cyan-500 mr-3" />
              <span className="text-3xl font-bold">Silver</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievement categories */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Achievement Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Platform Milestones', count: 4, icon: <Trophy className="h-5 w-5" /> },
            { name: 'Engagement', count: 3, icon: <Star className="h-5 w-5" /> },
            { name: 'Profile Completion', count: 2, icon: <Award className="h-5 w-5" /> },
            { name: 'Special Days', count: 3, icon: <Star className="h-5 w-5" /> }
          ].map((category, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center p-4 bg-card border rounded-lg hover:bg-accent/20 cursor-pointer"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                {category.icon}
              </div>
              <h3 className="font-medium text-sm">{category.name}</h3>
              <p className="text-xs text-muted-foreground">{category.count} achievements</p>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement list */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Achievements</h2>
        <AchievementDisplay />
      </div>
    </div>
  );
};

export default AchievementsPage;