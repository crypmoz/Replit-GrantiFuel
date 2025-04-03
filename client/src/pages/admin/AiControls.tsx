import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BrainCircuit, 
  RefreshCw, 
  AlertCircle,
  CheckCircle2, 
  CogIcon,
  AlertTriangle,
  Database,
  ShieldAlert,
  Cpu
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

// Define interface for AI status response
interface AIStatusResponse {
  status: string;
  message: string;
  provider: string;
  model: string;
  hasApiKey: boolean;
  circuitBreakerState: {
    state: string;
    failures: number;
    age: number;
  };
  cacheStats: {
    keys: number;
    hits: number;
    misses: number;
  };
}

export default function AiControls() {
  const { toast } = useToast();
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [detailedStatus, setDetailedStatus] = useState<AIStatusResponse | null>(null);
  
  // Query for getting AI system status (auto-fetch on page load)
  const { 
    data: aiStatus, 
    isLoading: isStatusLoading,
    isError: isStatusError,
    refetch: refetchStatus
  } = useQuery<AIStatusResponse>({
    queryKey: ['/api/admin/ai/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Update detailed status when data changes
  useEffect(() => {
    if (aiStatus) {
      setDetailedStatus(aiStatus);
    }
  }, [aiStatus]);

  // Mutation for clearing AI cache
  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      setActionInProgress('clearCache');
      const res = await apiRequest('POST', '/api/admin/ai/clear-cache');
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Cache Cleared',
        description: data.message || 'AI cache has been successfully cleared.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Cache Clear Failed',
        description: error.message || 'Failed to clear AI cache. Please try again.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setActionInProgress(null);
    }
  });

  // Mutation for resetting the circuit breaker
  const resetCircuitBreakerMutation = useMutation({
    mutationFn: async () => {
      setActionInProgress('resetCircuitBreaker');
      const res = await apiRequest('POST', '/api/admin/ai/reset-circuit-breaker');
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Circuit Breaker Reset',
        description: data.message || 'AI circuit breaker has been successfully reset.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Circuit Breaker Reset Failed',
        description: error.message || 'Failed to reset AI circuit breaker. Please try again.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setActionInProgress(null);
    }
  });

  // Manual refresh of status
  const manualRefreshStatus = () => {
    setActionInProgress('refreshStatus');
    refetchStatus().finally(() => {
      setActionInProgress(null);
    });
  };

  // Get circuit breaker state badge
  const getCircuitBreakerBadge = (state: string) => {
    switch (state?.toUpperCase()) {
      case 'CLOSED':
        return <Badge className="bg-green-100 text-green-800">OPERATIONAL</Badge>;
      case 'OPEN':
        return <Badge variant="destructive">TRIPPED</Badge>;
      case 'HALF_OPEN':
        return <Badge className="bg-yellow-100 text-yellow-800">RECOVERING</Badge>;
      default:
        return <Badge variant="outline">UNKNOWN</Badge>;
    }
  };

  // Calculate cache hit rate percentage
  const calculateHitRate = (hits: number, misses: number) => {
    if (hits + misses === 0) return 0;
    return Math.round((hits / (hits + misses)) * 100);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">AI System Controls</h1>
        <p className="text-muted-foreground mt-2">
          Manage and troubleshoot the AI integration for the GrantiFuel platform.
        </p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important Information</AlertTitle>
        <AlertDescription>
          These controls are designed for troubleshooting AI functionality. Use with caution as they may affect
          user experience temporarily. Clearing the cache will force new AI responses to be generated for all users.
        </AlertDescription>
      </Alert>

      {/* Status Dashboard */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            AI System Status Dashboard
          </CardTitle>
          <CardDescription>
            Real-time monitoring of the AI system components
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isStatusLoading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isStatusError ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error loading status</AlertTitle>
              <AlertDescription>
                Could not retrieve AI system status information. Please try refreshing.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Provider Status */}
                <Card>
                  <CardHeader className="py-4 px-5">
                    <CardTitle className="text-sm font-medium">AI Provider</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">{detailedStatus?.provider || 'Unknown'}</span>
                      {detailedStatus?.hasApiKey ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          API Key Set
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          No API Key
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Model: {detailedStatus?.model || 'Unknown'}
                    </p>
                  </CardContent>
                </Card>

                {/* Circuit Breaker Status */}
                <Card>
                  <CardHeader className="py-4 px-5">
                    <CardTitle className="text-sm font-medium">Circuit Breaker</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">Status</span>
                      {getCircuitBreakerBadge(detailedStatus?.circuitBreakerState?.state || 'Unknown')}
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-muted-foreground">Failures: {detailedStatus?.circuitBreakerState?.failures || 0}</span>
                      <span className="text-muted-foreground">Age: {Math.floor((detailedStatus?.circuitBreakerState?.age || 0) / 1000)}s</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Cache Status */}
                <Card>
                  <CardHeader className="py-4 px-5">
                    <CardTitle className="text-sm font-medium">Cache Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">Hit Rate</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Database className="h-3 w-3 mr-1" />
                        {detailedStatus?.cacheStats?.keys || 0} Keys
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <Progress 
                        value={calculateHitRate(
                          detailedStatus?.cacheStats?.hits || 0, 
                          detailedStatus?.cacheStats?.misses || 0
                        )} 
                        className="h-2 w-full" 
                      />
                      <div className="flex justify-between items-center text-xs mt-1">
                        <span className="text-muted-foreground">
                          Hits: {detailedStatus?.cacheStats?.hits || 0}
                        </span>
                        <span className="text-muted-foreground">
                          {calculateHitRate(
                            detailedStatus?.cacheStats?.hits || 0, 
                            detailedStatus?.cacheStats?.misses || 0
                          )}%
                        </span>
                        <span className="text-muted-foreground">
                          Misses: {detailedStatus?.cacheStats?.misses || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={manualRefreshStatus}
                  disabled={actionInProgress !== null}
                >
                  {actionInProgress === 'refreshStatus' ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Refresh Status
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Cards */}
      <h2 className="text-xl font-semibold mb-4">Management Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Clear AI Cache
            </CardTitle>
            <CardDescription>
              Flush the cached AI responses to force regeneration of all AI outputs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use this when AI responses are stale or when you've made significant
              changes to the knowledge base or document corpus that require refreshed AI responses.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => clearCacheMutation.mutate()} 
              disabled={actionInProgress !== null}
              className="w-full"
              variant="default"
            >
              {actionInProgress === 'clearCache' ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Clear Cache
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5" />
              Reset Circuit Breaker
            </CardTitle>
            <CardDescription>
              Reset the AI service circuit breaker if it's in a tripped state.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If the AI service has detected too many errors and stopped accepting
              requests, use this to reset it and allow new AI requests to be processed.
            </p>
            {detailedStatus?.circuitBreakerState?.state?.toUpperCase() === 'OPEN' && (
              <Alert className="mt-2 bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Circuit Breaker is OPEN</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  The circuit breaker is currently tripped. Reset recommended.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => resetCircuitBreakerMutation.mutate()} 
              disabled={actionInProgress !== null}
              className="w-full"
              variant={detailedStatus?.circuitBreakerState?.state?.toUpperCase() === 'OPEN' ? 'destructive' : 'default'}
            >
              {actionInProgress === 'resetCircuitBreaker' ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Reset Circuit Breaker
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}