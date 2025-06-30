"use client"

import React from "react"
import { Button } from "@/ui/button.js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card.js"
import { useWeb3 } from "@/providers/web3-provider.js"
import { ArrowRight, Shield, Zap, TreePine, BarChart3, Globe } from "lucide-react"
import Link from "next/link"

export function LandingPage() {
  const { isConnected, connect } = useWeb3()

  const features = [
    {
      icon: Zap,
      title: "Real-time Monitoring",
      description: "Continuous satellite and IoT sensor monitoring of forest projects",
    },
    {
      icon: Shield,
      title: "AI-Powered Verification",
      description: "Advanced AI algorithms verify carbon sequestration automatically",
    },
    {
      icon: TreePine,
      title: "Non-Perm Risk Mgmt",
      description: "Buffer pools protect against permanence risks like wildfires",
    },
    {
      icon: BarChart3,
      title: "Upgradeable Architecture",
      description: "Smart contracts designed for future improvements and scaling",
    },
  ]

  const stats = [
    { label: "Active Projects", value: "156" },
    { label: "Trees Monitored", value: "50,000+" },
    { label: "Credits Issued", value: "12,450" },
    { label: "Buffer Pool", value: "1,245" },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-10" />
        <div className="container relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">Revolutionizing Carbon Credit Verification</h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8">Through Blockchain & AI</p>
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <Globe className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Autonomous forest monitoring</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">IoT sensors</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Transparent</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isConnected ? (
                <Link href="/dashboard">
                  <Button size="lg" className="carbon-gradient text-white">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Button size="lg" onClick={connect} className="carbon-gradient text-white">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Key Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Advanced technology stack ensuring transparent and reliable carbon credit verification
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Environmental Impact Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Environmental Impact</h2>
            <p className="text-lg text-muted-foreground">
              Real-time metrics from our global network of verified projects
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to Start Your Carbon Journey?</h2>
          <p className="text-lg mb-8 opacity-90">Join the future of transparent carbon credit verification</p>
          {!isConnected && (
            <Button size="lg" variant="secondary" onClick={connect}>
              Connect Wallet to Begin
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </section>
    </div>
  )
} 