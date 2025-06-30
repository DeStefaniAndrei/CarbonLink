"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card.js"
import { Button } from "@/ui/button.js"
import { Badge } from "@/ui/badge.js"
import { Progress } from "@/ui/progress.js"
import { useWeb3 } from "@/providers/web3-provider.js"
import { MapPin, CheckCircle, Shield, Coins, RotateCcw, Loader2, AlertCircle } from "lucide-react"
import { redirect, useRouter } from "next/navigation"
import { useProjectManagement, useCarbonProgress } from "../../hooks/use-carbonlink"

export function ProjectDetails({ projectId }) {
  const { isConnected, account } = useWeb3()
  const router = useRouter()
  const { getProjectDetails, mintTokens, loading: projectLoading, error: projectError } = useProjectManagement()
  const { progress, currentCarbon, canMint, threshold, loading: progressLoading, refreshProgress } = useCarbonProgress(projectId)
  
  const [project, setProject] = useState(null)
  const [carbonOffset, setCarbonOffset] = useState(null)
  const [verificationHistory, setVerificationHistory] = useState([])
  const [mintingLoading, setMintingLoading] = useState(false)

  useEffect(() => {
    if (!isConnected) {
      redirect("/")
    }
  }, [isConnected])

  useEffect(() => {
    loadProjectDetails()
  }, [projectId])

  const loadProjectDetails = async () => {
    try {
      const result = await getProjectDetails(projectId)
      setProject(result.project)
      setCarbonOffset(result.carbonOffset)
      setVerificationHistory(result.verificationHistory)
    } catch (error) {
      console.error("Failed to load project details:", error)
    }
  }

  const handleRefreshProgress = async () => {
    try {
      await refreshProgress()
      await loadProjectDetails() // Reload project details after refresh
    } catch (error) {
      console.error("Failed to refresh progress:", error)
    }
  }

  const handleMintTokens = async () => {
    if (!account || !canMint) return

    try {
      setMintingLoading(true)
      
      // Calculate available credits (85% of total, 15% buffer)
      const availableCredits = Math.floor(currentCarbon * 0.85)
      
      await mintTokens(projectId, account, availableCredits)
      
      alert("Tokens minted successfully!")
      
      // Refresh data after minting
      await handleRefreshProgress()
    } catch (error) {
      alert(`Failed to mint tokens: ${error.message}`)
    } finally {
      setMintingLoading(false)
    }
  }

  if (!isConnected) {
    return null
  }

  if (projectLoading) {
    return (
      <div className="container py-8 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading project details...</span>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container py-8">
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">Project not found</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
        <p className="text-muted-foreground">Detailed project information and verification history</p>
      </div>

      {/* Carbon Progress Bar */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Carbon Offset Progress</span>
            <Button 
              onClick={handleRefreshProgress}
              disabled={progressLoading}
              variant="outline"
              size="sm"
            >
              {progressLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Progress towards 1000 carbon tonnes threshold for token minting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Current: {currentCarbon.toFixed(0)} tonnes</span>
              <span>Threshold: {threshold} tonnes</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{progress.toFixed(1)}% complete</span>
              <span>{canMint ? "Ready to mint!" : `${(threshold - currentCarbon).toFixed(0)} tonnes remaining`}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Project Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Project Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Location:</span>
              <span className="text-sm font-medium">
                {project.location.lat}, {project.location.lng}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Area:</span>
              <span className="text-sm font-medium">{project.area} ha</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Start:</span>
              <span className="text-sm font-medium">{project.startDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                {project.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Carbon Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Carbon Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {carbonOffset && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Net Balance:</span>
                  <span className="text-sm font-medium">{carbonOffset.netBalance} tCO2e/ha/year</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Carbon:</span>
                  <span className="text-sm font-medium">{carbonOffset.totalProject} tCO2e</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Confidence:</span>
                  <span className="text-sm font-medium">{carbonOffset.confidence}%</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Threshold:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{threshold}</span>
                <Badge variant="secondary" className={`text-xs ${canMint ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {canMint ? 'Met' : 'Pending'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buffer Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Buffer Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Buffer:</span>
              <span className="text-sm font-medium">15%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Reserved:</span>
              <span className="text-sm font-medium">{Math.floor(currentCarbon * 0.15)} CCT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Available:</span>
              <span className="text-sm font-medium text-green-600">{Math.floor(currentCarbon * 0.85)} CCT</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8">
        <Button 
          variant="outline" 
          onClick={handleRefreshProgress}
          disabled={progressLoading}
        >
          {progressLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4 mr-2" />
              Request New Verification
            </>
          )}
        </Button>
        <Button 
          className="carbon-gradient text-white"
          onClick={handleMintTokens}
          disabled={!canMint || mintingLoading}
        >
          {mintingLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Minting...
            </>
          ) : (
            <>
              <Coins className="h-4 w-4 mr-2" />
              Mint Credits
            </>
          )}
        </Button>
      </div>

      {projectError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md mb-8">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{projectError.message}</span>
        </div>
      )}

      {/* Verification History */}
      <Card>
        <CardHeader>
          <CardTitle>Verification History</CardTitle>
          <CardDescription>Historical verification data and credit minting records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">NDVI</th>
                  <th className="text-left py-2">Carbon</th>
                  <th className="text-left py-2">Credits</th>
                  <th className="text-left py-2">Buffer</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {verificationHistory.map((record, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 text-sm">{record.date}</td>
                    <td className="py-3 text-sm">{record.ndvi}</td>
                    <td className="py-3 text-sm">{record.carbon}</td>
                    <td className="py-3 text-sm font-medium">{record.credits}</td>
                    <td className="py-3 text-sm">{record.buffer}</td>
                    <td className="py-3">
                      <Badge variant="secondary" className="text-xs">
                        {record.status}
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