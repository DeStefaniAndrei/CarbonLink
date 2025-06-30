"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card.js"
import { useWeb3 } from "@/providers/web3-provider.js"
import { BarChart3, TrendingUp, Shield, Brain, Activity, AlertTriangle } from "lucide-react"
import { redirect } from "next/navigation"

export function Analytics() {
  const { isConnected } = useWeb3()

  useEffect(() => {
    if (!isConnected) {
      redirect("/")
    }
  }, [isConnected])

  const platformStats = {
    totalProjects: 156,
    co2Removed: "50k tonnes",
  }

  const userPerformance = {
    roi: "+15.3%",
    creditsPerMonth: 45,
    rank: "Top 5%",
  }

  const aiInsights = {
    riskScore: "Low (0.2)",
    forecast: "+120 CCT",
  }

  const priceData = [
    { date: "Jun 1", price: 8 },
    { date: "Jun 8", price: 10 },
    { date: "Jun 15", price: 12 },
    { date: "Jun 22", price: 11 },
    { date: "Jun 29", price: 15 },
  ]

  const bufferAnalysis = {
    totalReserved: "1,850 CCT",
    percentage: "12.3%",
    riskEvents: 2,
    protectionRate: "99.8%",
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics & Insights</h1>
        <p className="text-muted-foreground">Comprehensive platform and portfolio analytics</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Platform Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Platform Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Total Projects</div>
              <div className="text-2xl font-bold">{platformStats.totalProjects} active</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">CO2 Removed</div>
              <div className="text-2xl font-bold">{platformStats.co2Removed}</div>
            </div>
          </CardContent>
        </Card>

        {/* Your Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">ROI</div>
              <div className="text-2xl font-bold text-green-600">{userPerformance.roi}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Credits/mo</div>
              <div className="text-2xl font-bold">{userPerformance.creditsPerMonth} avg</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Rank</div>
              <div className="text-lg font-bold">{userPerformance.rank}</div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Risk Score</div>
              <div className="text-lg font-bold text-green-600">{aiInsights.riskScore}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Forecast</div>
              <div className="text-lg font-bold">{aiInsights.forecast}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Carbon Credit Price Trends
          </CardTitle>
          <CardDescription>Price movement over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2 p-4 bg-muted/20 rounded-lg">
            {priceData.map((point, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <div
                  className="bg-primary rounded-t-sm w-8 transition-all hover:bg-primary/80"
                  style={{ height: `${(point.price / 15) * 200}px` }}
                />
                <div className="text-xs text-muted-foreground transform -rotate-45 origin-center">{point.date}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-muted-foreground mt-4">
            <span>$8</span>
            <span>$15</span>
          </div>
        </CardContent>
      </Card>

      {/* Buffer Pool Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Buffer Pool Analysis
          </CardTitle>
          <CardDescription>Risk management and buffer pool performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Total Reserved</div>
              <div className="text-lg font-bold">{bufferAnalysis.totalReserved}</div>
              <div className="text-xs text-muted-foreground">({bufferAnalysis.percentage} of all credits)</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Risk Events</div>
              <div className="text-lg font-bold flex items-center gap-2">
                {bufferAnalysis.riskEvents}
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="text-xs text-muted-foreground">this year</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Protection Rate</div>
              <div className="text-lg font-bold text-green-600">{bufferAnalysis.protectionRate}</div>
              <div className="text-xs text-muted-foreground">effective coverage</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Coverage</div>
              <div className="text-lg font-bold">Wildfire</div>
              <div className="text-xs text-muted-foreground">activated</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 