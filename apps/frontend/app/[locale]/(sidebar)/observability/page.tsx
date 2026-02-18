"use client";

import { useTranslations } from "@/hooks/useTranslations";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, AlertTriangle, CheckCircle, BarChart3, Search, DollarSign, Coins } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function ObservabilityPage() {
  const { t } = useTranslations();
  const { data: analytics } = trpc.frontend.analytics.getStats.useQuery();
  const { data: costStats } = trpc.frontend.analytics.getCostStats.useQuery();

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Observability
        </h1>
      </div>

      <Tabs defaultValue="dashboard" className="flex-1 flex flex-col">
        <TabsList className="w-fit">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="cost">Cost & Usage</TabsTrigger>
            <TabsTrigger value="inspector">Traffic Inspector</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="flex-1 overflow-y-auto mt-4 space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tool Calls</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.totalCalls || 0}</div>
                        <p className="text-xs text-muted-foreground">Lifetime tool executions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {analytics ? ((1 - analytics.errorRate) * 100).toFixed(1) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">Successful executions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                            {analytics ? (analytics.errorRate * 100).toFixed(1) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">Failed executions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${costStats?.totalCost.toFixed(4) || "0.0000"}</div>
                        <p className="text-xs text-muted-foreground">Estimated API costs</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Daily Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {analytics?.dailyUsage && analytics.dailyUsage.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.dailyUsage}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                        itemStyle={{ color: '#f3f4f6' }}
                                    />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No activity data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Top Tools</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {analytics?.topTools && analytics.topTools.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={analytics.topTools} margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={true} vertical={false} />
                                    <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={150}
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                        itemStyle={{ color: '#f3f4f6' }}
                                    />
                                    <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No usage data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="cost" className="flex-1 overflow-y-auto mt-4 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                        <Coins className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(costStats?.totalTokens || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Input + Output tokens</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${costStats?.totalCost.toFixed(4) || "0.0000"}</div>
                        <p className="text-xs text-muted-foreground">Based on OpenAI pricing</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">LLM Interactions</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{costStats?.count || 0}</div>
                        <p className="text-xs text-muted-foreground">Total API calls tracked</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Usage Breakdown</CardTitle>
                    <CardDescription>Token consumption by model and context (Placeholder - detailed breakdown coming soon)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground border rounded-md border-dashed">
                        Detailed charts for usage over time and model breakdown will be available in future updates.
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="inspector" className="flex-1 border rounded-lg overflow-hidden bg-background mt-4">
            <iframe
            src="http://localhost:9853"
            className="w-full h-full border-0"
            title="MCP Shark Dashboard"
            allow="clipboard-read; clipboard-write"
            />
        </TabsContent>
      </Tabs>
    </div>
  );
}
