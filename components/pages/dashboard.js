"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card.js"
import { Button } from "@/ui/button.js"
import { Badge } from "@/ui/badge.js"
import { useWeb3 } from "@/providers/web3-provider.js"
import { Plus, ShoppingCart, Coins, RotateCcw, Bell, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export function Dashboard() {
  const { isConnected } = useWeb3()

  useEffect(() => {
    if (!isConnected) {
      redirect("/")
    }
  }, [isConnected])

  const portfolioData = {
    credits: 150,
    projects: 3,
    pending: 2,
  }

  const recentActivity = [
    {
      date: "Jun 24",
      action: "Verification",
      project: "Forest #1",
      amount: "+50 CCT",
      status: "Complete",
      statusColor: "bg-green-500",
    },
    {
      date: "Jun 23",
      action: "Buffer Used",
      project: "Forest #2",
      amount: "-5 CCT",
      status: "Applied",
      statusColor: "bg-yellow-500",
    },
    {
      date: "Jun 22",
      action: "Trade",
      project: "-",
      amount: "+25 CCT",
      status: "Complete",
      statusColor: "bg-green-500",
    },
  ]

  const notifications = [
    {
      message: "Verification Complete",
      type: "success",
      icon: TrendingUp,
    },
    {
      message: "Buffer Alert on Project #2",
      type: "warning",
      icon: AlertTriangle,
    },
  ]

  if (!isConnected) {
    return null
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome Back, User!</h1>
        <p className="text-muted-foreground">Manage your carbon credit portfolio and projects</p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Portfolio Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Your Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Credits:</span>
              <span className="font-semibold">{portfolioData.credits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Projects:</span>
              <span className="font-semibold">{portfolioData.projects}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pending:</span>
              <span className="font-semibold">{portfolioData.pending}</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/projects/create">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buy Credits
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Coins className="h-4 w-4 mr-2" />
                Sell Credits
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retire Credits
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((notification, index) => (
              <div key={index} className="flex items-start gap-3">
                <notification.icon
                  className={`h-4 w-4 mt-0.5 ${notification.type === "success" ? "text-green-500" : "text-yellow-500"}`}
                />
                <span className="text-sm">{notification.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest transactions and project updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Action</th>
                  <th className="text-left py-2">Project</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((activity, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 text-sm">{activity.date}</td>
                    <td className="py-3 text-sm">{activity.action}</td>
                    <td className="py-3 text-sm">{activity.project}</td>
                    <td className="py-3 text-sm font-medium">{activity.amount}</td>
                    <td className="py-3">
                      <Badge variant="secondary" className="text-xs">
                        {activity.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 