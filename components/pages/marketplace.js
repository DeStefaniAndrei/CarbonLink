"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card.js"
import { Button } from "@/ui/button.js"
import { Input } from "@/ui/input.js"
import { Label } from "@/ui/label.js"
import { Textarea } from "@/ui/textarea.js"
import { useWeb3 } from "@/providers/web3-provider.js"
import { Coins, TrendingUp, ShoppingCart, RotateCcw, Info } from "lucide-react"
import { redirect } from "next/navigation"

export function Marketplace() {
  const { isConnected } = useWeb3()
  const [buyAmount, setBuyAmount] = useState("")
  const [retireAmount, setRetireAmount] = useState("")
  const [retireReason, setRetireReason] = useState("")

  useEffect(() => {
    if (!isConnected) {
      redirect("/")
    }
  }, [isConnected])

  const marketData = {
    cctBalance: 150,
    ethBalance: 2.5,
    currentPrice: 12.5,
    priceChange: 2.3,
  }

  const handleBuyCredits = () => {
    console.log("Buying credits:", buyAmount)
    alert(`Would buy ${buyAmount} CCT for $${(Number.parseFloat(buyAmount) * marketData.currentPrice).toFixed(2)}`)
  }

  const handleRetireCredits = () => {
    console.log("Retiring credits:", retireAmount, retireReason)
    alert(`Would retire ${retireAmount} CCT for: ${retireReason}`)
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Carbon Credits Marketplace</h1>
        <p className="text-muted-foreground">Buy, sell, and retire carbon credits on the decentralized marketplace</p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Your Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Your Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">CCT:</span>
              <span className="font-semibold">{marketData.cctBalance}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">ETH:</span>
              <span className="font-semibold">{marketData.ethBalance}</span>
            </div>
          </CardContent>
        </Card>

        {/* Market Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Market Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start carbon-gradient text-white">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Buy Credits
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <Coins className="h-4 w-4 mr-2" />
              Sell Credits
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retire Credits
            </Button>
          </CardContent>
        </Card>

        {/* Current Price */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Current Price
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold">${marketData.currentPrice}/CCT</div>
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">+{marketData.priceChange}% (24h)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trading Options */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Trading Options</CardTitle>
          <CardDescription>Execute trades directly on the decentralized marketplace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Buy Credits Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Buy Carbon Credits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="buy-amount">Amount (CCT)</Label>
                <Input
                  id="buy-amount"
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div className="space-y-2">
                <Label>Price per CCT</Label>
                <div className="text-lg font-semibold">${marketData.currentPrice}</div>
              </div>
              <div className="space-y-2">
                <Label>Total Cost</Label>
                <div className="text-lg font-semibold">
                  ${buyAmount ? (Number.parseFloat(buyAmount) * marketData.currentPrice).toFixed(2) : "0.00"}
                </div>
              </div>
            </div>
            <Button onClick={handleBuyCredits} disabled={!buyAmount} className="carbon-gradient text-white">
              Buy via Uniswap
            </Button>
          </div>

          <hr className="border-muted" />

          {/* Retire Credits Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Retire Credits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retire-amount">Amount (CCT)</Label>
                <Input
                  id="retire-amount"
                  type="number"
                  value={retireAmount}
                  onChange={(e) => setRetireAmount(e.target.value)}
                  placeholder="Enter amount to retire"
                  max={marketData.cctBalance}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retire-reason">Reason for Retirement</Label>
                <Textarea
                  id="retire-reason"
                  value={retireReason}
                  onChange={(e) => setRetireReason(e.target.value)}
                  placeholder="e.g., Corporate carbon offsetting for Q4 2024"
                  rows={3}
                />
              </div>
            </div>
            <Button onClick={handleRetireCredits} disabled={!retireAmount || !retireReason} variant="destructive">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retire Credits
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">About Credit Retirement</p>
              <p className="text-sm text-muted-foreground">
                Retiring credits permanently removes them from circulation for offsetting purposes. This action cannot
                be undone and provides proof of your carbon offset commitment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 