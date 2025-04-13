import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Clock,
  MousePointer,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  User,
  Smartphone,
  Monitor,
  Loader2
} from 'lucide-react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Types for our metrics
interface UIPerformanceMetrics {
  overallScore: number;
  clickThroughRate: number;
  averageDwellTime: number;
  formErrorRate: number;
  bounceRate: number;
  userFlowCompletionRate: number;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  historyData: Array<{
    date: string;
    score: number;
    ctr: number;
    dwell: number;
    errors: number;
  }>;
  problemAreas: Array<{
    element: string;
    issue: string;
    severity: 'High' | 'Medium' | 'Low';
    impactScore: number;
  }>;
}

// Helper to format percentages
const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

// Helper to format time in seconds
const formatTime = (seconds: number) => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs.toFixed(0)}s`;
};

const calculateTrend = (current: number, previous: number) => {
  const percentChange = ((current - previous) / previous) * 100;
  return {
    direction: percentChange >= 0 ? 'up' : 'down',
    percent: Math.abs(percentChange).toFixed(1),
  };
};

// Metric card component
const MetricCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  description 
}: { 
  title: string,
  value: string | number,
  icon: React.ReactNode,
  trend?: { direction: 'up' | 'down', percent: string },
  description: string 
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-slate-100 rounded-md">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center ${
            trend.direction === 'up' ? 'text-green-500' : 'text-red-500'
          }`}>
            {trend.direction === 'up' ? 
              <TrendingUp className="h-3 w-3 mr-1" /> : 
              <TrendingDown className="h-3 w-3 mr-1" />
            }
            <span className="text-xs font-medium">{trend.percent}%</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold mt-2">{value}</div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="text-xs text-blue-500 mt-1 cursor-help">
            What's this?
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </CardContent>
  </Card>
);

const UIMetricsDisplay: React.FC = () => {
  // Fetch detailed UI metrics
  const { data, isLoading, error } = useQuery<UIPerformanceMetrics>({
    queryKey: ['/api/ux/detailed-metrics'],
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">Failed to load UI metrics data. Please try again.</p>
      </div>
    );
  }

  // Get trends from historical data (compare current to previous period)
  const historyLength = data.historyData.length;
  const trends = {
    score: historyLength > 1 ? calculateTrend(
      data.overallScore, 
      data.historyData[historyLength - 2].score
    ) : undefined,
    ctr: historyLength > 1 ? calculateTrend(
      data.clickThroughRate,
      data.historyData[historyLength - 2].ctr
    ) : undefined,
    dwell: historyLength > 1 ? calculateTrend(
      data.averageDwellTime,
      data.historyData[historyLength - 2].dwell
    ) : undefined,
    errors: historyLength > 1 ? calculateTrend(
      data.formErrorRate,
      data.historyData[historyLength - 2].errors
    ) : undefined,
  };

  return (
    <div className="space-y-8">
      {/* Top metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="UI Performance Score" 
          value={data.overallScore.toFixed(1)}
          icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
          trend={trends.score}
          description="Overall score calculated from UI interactions, form completions, and error rates. Higher is better."
        />
        <MetricCard 
          title="Click-Through Rate" 
          value={formatPercent(data.clickThroughRate)}
          icon={<MousePointer className="h-4 w-4 text-blue-600" />}
          trend={trends.ctr}
          description="Percentage of users who click on interactive elements. A higher CTR indicates more engaging interface elements."
        />
        <MetricCard 
          title="Average Dwell Time" 
          value={formatTime(data.averageDwellTime)}
          icon={<Clock className="h-4 w-4 text-blue-600" />}
          trend={trends.dwell}
          description="Average time users spend looking at or interacting with a specific UI element before moving on."
        />
        <MetricCard 
          title="Form Error Rate" 
          value={formatPercent(data.formErrorRate)}
          icon={<AlertCircle className="h-4 w-4 text-red-500" />}
          trend={trends.errors}
          description="Percentage of form submissions that contain errors. Lower is better."
        />
      </div>

      {/* Historical trend chart */}
      <Card>
        <CardHeader>
          <CardTitle>UI Performance Trends</CardTitle>
          <CardDescription>
            Performance metrics over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.historyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="score" 
                  name="UI Score" 
                  stroke="#3B5B9D" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="ctr" 
                  name="Click-Through Rate" 
                  stroke="#00D1D1" 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="dwell" 
                  name="Dwell Time (s)" 
                  stroke="#FF7043" 
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="errors" 
                  name="Error Rate" 
                  stroke="#FF3B30" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Device breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
            <CardDescription>
              User interactions by device type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { 
                      name: 'Desktop', 
                      value: data.deviceBreakdown.desktop, 
                      fill: '#3B5B9D'
                    },
                    { 
                      name: 'Mobile', 
                      value: data.deviceBreakdown.mobile, 
                      fill: '#00D1D1'
                    },
                    { 
                      name: 'Tablet', 
                      value: data.deviceBreakdown.tablet, 
                      fill: '#FF7043'
                    }
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Usage']} />
                  <Bar dataKey="value" name="Usage" legendType="none" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around mt-4">
              <div className="flex items-center">
                <Monitor className="h-4 w-4 mr-2 text-blue-600" />
                <span className="text-sm font-medium">Desktop</span>
              </div>
              <div className="flex items-center">
                <Smartphone className="h-4 w-4 mr-2 text-cyan-500" />
                <span className="text-sm font-medium">Mobile</span>
              </div>
              <div className="flex items-center">
                <Tablet className="h-4 w-4 mr-2 text-orange-500" />
                <span className="text-sm font-medium">Tablet</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Problem areas */}
        <Card>
          <CardHeader>
            <CardTitle>Problem Areas</CardTitle>
            <CardDescription>
              UI elements with potential issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.problemAreas.map((problem, index) => (
                <div 
                  key={index} 
                  className="flex items-start p-3 rounded-md bg-muted"
                >
                  <div className={`p-1.5 rounded-full mr-3 ${
                    problem.severity === 'High' ? 'bg-red-100' :
                    problem.severity === 'Medium' ? 'bg-amber-100' : 'bg-blue-100'
                  }`}>
                    <AlertCircle className={`h-4 w-4 ${
                      problem.severity === 'High' ? 'text-red-500' :
                      problem.severity === 'Medium' ? 'text-amber-500' : 'text-blue-500'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h4 className="font-medium text-sm">{problem.element}</h4>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        problem.severity === 'High' ? 'bg-red-100 text-red-700' :
                        problem.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {problem.severity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{problem.issue}</p>
                    <div className="mt-2 flex items-center">
                      <span className="text-xs mr-2">Impact Score:</span>
                      <div className="h-1.5 w-24 bg-gray-200 rounded-full">
                        <div 
                          className={`h-full rounded-full ${
                            problem.impactScore > 7 ? 'bg-red-500' :
                            problem.impactScore > 4 ? 'bg-amber-500' : 'bg-blue-500'
                          }`} 
                          style={{ width: `${(problem.impactScore / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs ml-2 font-medium">{problem.impactScore}/10</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UIMetricsDisplay;

// Helper component for Tablet icon since it's not in lucide-react
const Tablet = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12" y2="18" />
  </svg>
);