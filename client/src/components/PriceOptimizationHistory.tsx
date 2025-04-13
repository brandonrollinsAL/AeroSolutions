import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PieChart, TrendingUp, TrendingDown, Info } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PriceHistoryEntry {
  id: number;
  planId: number;
  planName: string;
  previousPrice: string;
  newPrice: string;
  changeReason: string;
  percentChange: string;
  effectiveDate: string;
  appliedAt: string;
  aiAnalysis: {
    marketFactors: string[];
    competitiveAnalysis: string;
    userBehavior: string;
    conversionImpact: string;
  };
}

const formatPrice = (price: string): string => {
  return `$${parseFloat(price).toFixed(2)}`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const calculatePercentChange = (previous: string, current: string): number => {
  const prev = parseFloat(previous);
  const curr = parseFloat(current);
  return ((curr - prev) / prev) * 100;
};

const PriceOptimizationHistory: React.FC = () => {
  // Fetch price history data
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/price-optimization/history'],
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-2" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <h3 className="text-xl font-bold text-red-500">Error Loading Price History</h3>
        <p className="mt-2">Failed to fetch price optimization history. Please try again later.</p>
      </div>
    );
  }

  const priceHistory: PriceHistoryEntry[] = data?.data || [];

  if (priceHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price Optimization History</CardTitle>
          <CardDescription>
            Track historical subscription price changes and their reasoning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">No price changes have been recorded yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <PieChart className="mr-2 h-5 w-5 text-primary" />
          Price Optimization History
        </CardTitle>
        <CardDescription>
          Track historical subscription price changes and their reasoning
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Previous</TableHead>
              <TableHead>New</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Effective Date</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {priceHistory.map((entry) => {
              const percentChange = calculatePercentChange(entry.previousPrice, entry.newPrice);
              const isIncrease = percentChange > 0;
              
              return (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.planName}</TableCell>
                  <TableCell>{formatPrice(entry.previousPrice)}</TableCell>
                  <TableCell>{formatPrice(entry.newPrice)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={isIncrease ? "default" : "outline"} 
                      className={`
                        flex items-center gap-1 
                        ${isIncrease ? 'bg-amber-500 hover:bg-amber-600' : 'text-green-600 border-green-200 bg-green-50'}
                      `}
                    >
                      {isIncrease ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(percentChange).toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(entry.effectiveDate)}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-sm">
                          <p className="font-medium mb-1">Reason for change:</p>
                          <p className="text-sm">{entry.changeReason}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="mt-6">
          <Accordion type="single" collapsible className="w-full">
            {priceHistory.map((entry) => (
              <AccordionItem key={entry.id} value={`item-${entry.id}`}>
                <AccordionTrigger className="text-sm">
                  AI Analysis for {entry.planName} ({formatDate(entry.effectiveDate)})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 p-3 bg-slate-50 rounded-md text-sm">
                    <div>
                      <h4 className="font-medium mb-1">Market Factors</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {entry.aiAnalysis.marketFactors.map((factor, idx) => (
                          <li key={idx}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-1">Competitive Analysis</h4>
                      <p className="text-muted-foreground">{entry.aiAnalysis.competitiveAnalysis}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-1">User Behavior</h4>
                      <p className="text-muted-foreground">{entry.aiAnalysis.userBehavior}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-1">Conversion Impact</h4>
                      <p className="text-muted-foreground">{entry.aiAnalysis.conversionImpact}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceOptimizationHistory;