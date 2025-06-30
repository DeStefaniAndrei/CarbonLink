"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card.js"
import { Button } from "@/ui/button.js"
import { Input } from "@/ui/input.js"
import { Label } from "@/ui/label.js"
import { RadioGroup, RadioGroupItem } from "@/ui/radio-group.js"
import { useWeb3 } from "@/providers/web3-provider.js"
import { Upload, Info, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { redirect, useRouter } from "next/navigation"
import { useProjectManagement } from "../../hooks/use-carbonlink"

export function CreateProject() {
  const { isConnected, account } = useWeb3()
  const router = useRouter()
  const { createProject, loading: projectLoading, error: projectError } = useProjectManagement()
  
  const [formData, setFormData] = useState({
    name: "",
    latitude: "",
    longitude: "",
    area: "",
    projectType: "reforestation",
  })
  const [files, setFiles] = useState([])
  const [projectResult, setProjectResult] = useState(null)

  useEffect(() => {
    if (!isConnected) {
      redirect("/")
    }
  }, [isConnected])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Reset project result when form changes
    setProjectResult(null)
  }

  const handleFileUpload = (event) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!account) {
      alert("Please connect your wallet first")
      return
    }

    if (!formData.name || !formData.latitude || !formData.longitude || !formData.area) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const location = {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        elevation: 10
      }

      const projectData = {
        name: formData.name,
        location: `${location.latitude},${location.longitude}`,
        area: parseFloat(formData.area),
        projectType: formData.projectType,
        ownerAddress: account
      }

      const result = await createProject(projectData)
      setProjectResult(result.data)
      
      alert("Project created successfully! Redirecting to project details...")
      router.push(`/projects/${result.data.project.projectAddress || '1'}`)
    } catch (error) {
      // Log the error for debugging
      console.error('Project creation error:', error)
      // Show the most informative error message possible
      alert(`Failed to create project: ${error?.error || error?.message || JSON.stringify(error)}`)
    }
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Project</h1>
        <p className="text-muted-foreground">
          Submit your forest project for verification and carbon credit generation
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>Provide details about your carbon sequestration project</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter project name"
                required
              />
            </div>

            {/* Land Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Land Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange("latitude", e.target.value)}
                    placeholder="e.g., -2.5"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => handleInputChange("longitude", e.target.value)}
                    placeholder="e.g., -54.8"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Area (hectares)</Label>
                <Input
                  id="area"
                  type="number"
                  value={formData.area}
                  onChange={(e) => handleInputChange("area", e.target.value)}
                  placeholder="e.g., 10"
                  required
                />
              </div>
            </div>

            {/* Project Type */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Project Type</h3>
              <RadioGroup
                value={formData.projectType}
                onValueChange={(value) => handleInputChange("projectType", value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="reforestation" id="reforestation" />
                  <Label htmlFor="reforestation">Reforestation</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="afforestation" id="afforestation" />
                  <Label htmlFor="afforestation">Afforestation</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="forest-conservation" id="conservation" />
                  <Label htmlFor="conservation">Forest Conservation</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Documentation Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Documentation Upload</h3>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Drag & drop ownership documents here</p>
                  <p className="text-xs text-muted-foreground">Supported: PDF, JPG, PNG (Max 10MB)</p>
                  <Input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload">
                    <Button type="button" variant="outline" className="cursor-pointer bg-transparent">
                      Choose Files
                    </Button>
                  </Label>
                </div>
              </div>
              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selected files:</p>
                  {files.map((file, index) => (
                    <p key={index} className="text-sm text-muted-foreground">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="carbon-gradient text-white"
                disabled={projectLoading || !formData.name || !formData.latitude || !formData.longitude || !formData.area}
              >
                {projectLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>

            {projectError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{projectError.message}</span>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Verification Process</p>
              <p className="text-sm text-muted-foreground">
                Your project will be verified using satellite data, IoT sensors, and blockchain technology. 
                Carbon credits will be minted once the 1000 tonne threshold is reached.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 