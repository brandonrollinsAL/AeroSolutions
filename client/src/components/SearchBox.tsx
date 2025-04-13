import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Loader2, LayoutGrid, BrainCircuit } from 'lucide-react';
import { debounce } from 'lodash';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SearchResult {
  id: number;
  type: string;
  title: string;
  content?: string;
  relevance_score?: number;
}

interface SearchResponse {
  ranked_results: SearchResult[];
  suggestions: string[];
  query_analyzed: string;
}

export default function SearchBox() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Create a debounced function to update the search query
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearchTerm(value);
    }, 500),
    []
  );

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Fetch search results when debouncedSearchTerm changes
  const { 
    data: searchResults, 
    isLoading, 
    error,
    isFetching 
  } = useQuery({
    queryKey: ['/api/search/content', debouncedSearchTerm],
    queryFn: () => fetch(`/api/search/content/${encodeURIComponent(debouncedSearchTerm)}`)
      .then(res => res.json())
      .then(data => data.data as SearchResponse),
    enabled: debouncedSearchTerm.length > 2, // Only search if at least 3 characters
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle search by clicking the search button
  const handleSearchClick = () => {
    if (searchTerm.length < 3) {
      toast({
        variant: 'destructive',
        title: 'Search term too short',
        description: 'Please enter at least 3 characters to search',
      });
      return;
    }
    setDebouncedSearchTerm(searchTerm);
  };

  // Handle pressing Enter in the search input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  // Reference to search input for focusing
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Focus search input on component mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Get suggested search terms
  const suggestions = searchResults?.suggestions || [];

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search for content, services, or marketplace items..."
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            className="pl-10"
            ref={searchInputRef}
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <Button onClick={handleSearchClick} disabled={isLoading || isFetching}>
          {(isLoading || isFetching) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Search
        </Button>
      </div>

      {/* Search suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Try searching for:</span>
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm(suggestion);
                setDebouncedSearchTerm(suggestion);
              }}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {(isLoading || isFetching) && debouncedSearchTerm.length > 2 && (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Search Error</CardTitle>
            <CardDescription>
              There was a problem with your search. Please try again later.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* No results */}
      {!isLoading && !isFetching && debouncedSearchTerm.length > 2 && searchResults?.ranked_results.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No results found</CardTitle>
            <CardDescription>
              We couldn't find any results for "{debouncedSearchTerm}". Try a different search term or check out our suggestions.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Search results */}
      {!isLoading && !isFetching && searchResults?.ranked_results && searchResults.ranked_results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">
                {searchResults.ranked_results.length} results for "{debouncedSearchTerm}"
              </h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs">
                      <BrainCircuit className="mr-1 h-3 w-3 text-primary" />
                      AI Powered
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Results ranked using xAI Grok technology for more accurate and relevant matches</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <LayoutGrid className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.ranked_results.map((result, index) => (
              <Card key={index} className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{result.title}</CardTitle>
                    <Badge variant={result.type === 'post' ? 'default' : 'secondary'}>
                      {result.type === 'post' ? 'Content' : 'Service'}
                    </Badge>
                  </div>
                  {result.relevance_score && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-full bg-secondary h-1.5 mt-2 rounded-full overflow-hidden cursor-help">
                            <div 
                              className="bg-primary h-full rounded-full" 
                              style={{ width: `${Math.round(result.relevance_score * 100)}%` }} 
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Relevance score: {Math.round(result.relevance_score * 100)}%</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {result.content || 'No description available'}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="ml-auto">
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}