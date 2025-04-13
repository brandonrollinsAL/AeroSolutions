import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, CheckCircle, FileText, BarChart, PieChart, LineChart } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";

interface AnalyticsReportOptions {
  reportType: 'summary' | 'detailed' | 'executive';
  format: 'pdf' | 'csv' | 'excel';
  dataRange: 'all' | 'last7' | 'last30' | 'last90' | 'custom';
  startDate?: Date;
  endDate?: Date;
  includeSections: {
    heatmaps: boolean;
    recommendations: boolean;
    metrics: boolean;
    deviceAnalysis: boolean;
    timeSeriesData: boolean;
    problemElements: boolean;
  };
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  options: Partial<AnalyticsReportOptions>;
}

const UIAnalyticsExport: React.FC = () => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPreview, setCurrentPreview] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState({
    start: false,
    end: false
  });

  // Fetch saved report templates
  const { data: templates = [] } = useQuery<ReportTemplate[]>({
    queryKey: ['/api/ux/report-templates'],
    enabled: true,
  });

  // Form setup
  const form = useForm<AnalyticsReportOptions>({
    defaultValues: {
      reportType: 'summary',
      format: 'pdf',
      dataRange: 'last30',
      includeSections: {
        heatmaps: true,
        recommendations: true,
        metrics: true,
        deviceAnalysis: true,
        timeSeriesData: false,
        problemElements: true,
      }
    },
  });

  const watchReportType = form.watch('reportType');
  const watchDataRange = form.watch('dataRange');

  const handleExport = async (values: AnalyticsReportOptions) => {
    setIsExporting(true);
    
    toast({
      title: "Export started",
      description: "Your report is being generated...",
    });
    
    try {
      // In a real app, this would be an API call
      const response = await apiRequest('POST', '/api/ux/export-report', values);
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Export complete",
          description: "Your report has been generated successfully.",
        });
        
        // Download the file
        const downloadLink = document.createElement('a');
        downloadLink.href = data.downloadUrl;
        downloadLink.download = data.filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      } else {
        throw new Error(data.message || "Export failed");
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const loadTemplate = (template: ReportTemplate) => {
    const currentValues = form.getValues();
    form.reset({
      ...currentValues,
      ...template.options
    });
  };

  const reportTypes = [
    {
      value: 'summary',
      label: 'Summary Report',
      description: 'Key metrics and insights in a concise format'
    },
    {
      value: 'detailed',
      label: 'Detailed Analysis',
      description: 'Comprehensive data with all metrics and visualizations'
    },
    {
      value: 'executive',
      label: 'Executive Dashboard',
      description: 'Business impact focused with action recommendations'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export UI Analytics Reports</CardTitle>
          <CardDescription>
            Create custom reports from your UI/UX analytics data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleExport)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="reportType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a report type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {reportTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex flex-col">
                                  <span>{type.label}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {type.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Export Format</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pdf">PDF Document</SelectItem>
                            <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                            <SelectItem value="excel">Excel Workbook</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dataRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Range</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a date range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="last7">Last 7 Days</SelectItem>
                            <SelectItem value="last30">Last 30 Days</SelectItem>
                            <SelectItem value="last90">Last 90 Days</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {watchDataRange === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Start Date</FormLabel>
                            <Popover 
                              open={datePickerOpen.start} 
                              onOpenChange={(open) => setDatePickerOpen({...datePickerOpen, start: open})}
                            >
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className="pl-3 text-left font-normal"
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => {
                                    field.onChange(date);
                                    setDatePickerOpen({...datePickerOpen, start: false});
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>End Date</FormLabel>
                            <Popover 
                              open={datePickerOpen.end} 
                              onOpenChange={(open) => setDatePickerOpen({...datePickerOpen, end: open})}
                            >
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className="pl-3 text-left font-normal"
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => {
                                    field.onChange(date);
                                    setDatePickerOpen({...datePickerOpen, end: false});
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <FormLabel className="block mb-3">Include Sections</FormLabel>
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="includeSections.recommendations"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>AI Recommendations</FormLabel>
                            <FormDescription>
                              Include AI-generated improvement suggestions
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="includeSections.metrics"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Performance Metrics</FormLabel>
                            <FormDescription>
                              Key UI/UX performance indicators and scores
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="includeSections.heatmaps"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Interaction Heatmaps</FormLabel>
                            <FormDescription>
                              Visual representations of user clicks and interactions
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="includeSections.deviceAnalysis"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Device Breakdown</FormLabel>
                            <FormDescription>
                              Analysis of performance across different devices
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="includeSections.timeSeriesData"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Historical Trends</FormLabel>
                            <FormDescription>
                              Performance data trends over time
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="includeSections.problemElements"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Problem Areas</FormLabel>
                            <FormDescription>
                              Detailed analysis of UI elements with issues
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpenDialog(true)}
                >
                  Preview Report
                </Button>
                <Button type="submit" disabled={isExporting}>
                  {isExporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Report Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => loadTemplate(template)}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100">
                    {template.icon}
                  </div>
                </div>
                <CardDescription className="text-xs">{template.description}</CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  Use Template
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Preview Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Report Preview</DialogTitle>
            <DialogDescription>
              Preview of your {watchReportType} report
            </DialogDescription>
          </DialogHeader>
          <div className="h-[500px] overflow-auto bg-white rounded-md p-4 border">
            {currentPreview ? (
              <div className="flex items-center justify-center h-full">
                <img 
                  src={currentPreview} 
                  alt="Report Preview" 
                  className="max-w-full max-h-full object-contain" 
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <FileText className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-500">Report preview will be shown here</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => setCurrentPreview('/images/sample-report-preview.png')}
                >
                  Generate Preview
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UIAnalyticsExport;