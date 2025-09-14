// checked
'use client';

import type React from 'react';
import {
  Search,
  Activity,
  BarChart3,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type USWiresMode = 'track-trace' | 'observability';

interface USWiresToggleContentProps {
  children: React.ReactNode;
  mode: USWiresMode;
  onModeChange: (mode: USWiresMode) => void;
}

export function USWiresToggleContent({
  children,
  mode,
  onModeChange,
}: USWiresToggleContentProps) {
  const renderTrackTraceContent = () => {
    return (
      <div className="flex h-full flex-col">
        <div className="border-border border-b bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            <h1 className="text-xl font-semibold">Track & Trace</h1>
            <Badge variant="outline" className="ml-2">
              Active Mode
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitor and trace wire transfer flows in real-time
          </p>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    );
  };

  const renderObservabilityContent = () => {
    return (
      <div className="flex h-full flex-col">
        <div className="border-border border-b bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <h1 className="text-xl font-semibold">Observability</h1>
            <Badge variant="outline" className="ml-2">
              Active Mode
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Real-time monitoring and system health insights
          </p>
        </div>

        <div className="flex-1 space-y-6 overflow-auto p-6">
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className="border-green-200 bg-green-50 text-green-700"
            >
              <CheckCircle className="mr-1 h-3 w-3" />
              All Systems Operational
            </Badge>
          </div>

          {/* System Health Overview */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  System Health
                </CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">99.9%</div>
                <p className="text-muted-foreground text-xs">Uptime last 24h</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Processing Speed
                </CardTitle>
                <Zap className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">1.2s</div>
                <p className="text-muted-foreground text-xs">
                  Avg response time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Alerts
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">2</div>
                <p className="text-muted-foreground text-xs">
                  Requires attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>
                Real-time system performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Transaction Throughput</span>
                    <span className="font-medium">1,247/min</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{ width: '78%' }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Error Rate</span>
                    <span className="font-medium text-green-600">0.02%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-green-600"
                      style={{ width: '2%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest system events and transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    time: '2 min ago',
                    event: 'High volume detected',
                    status: 'warning',
                  },
                  {
                    time: '5 min ago',
                    event: 'System health check completed',
                    status: 'success',
                  },
                  {
                    time: '12 min ago',
                    event: 'New connection established',
                    status: 'info',
                  },
                  {
                    time: '18 min ago',
                    event: 'Batch processing completed',
                    status: 'success',
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          item.status === 'success' && 'bg-green-500',
                          item.status === 'warning' && 'bg-orange-500',
                          item.status === 'info' && 'bg-blue-500'
                        )}
                      />
                      <span className="text-sm">{item.event}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      {mode === 'track-trace'
        ? renderTrackTraceContent()
        : renderObservabilityContent()}
    </div>
  );
}
