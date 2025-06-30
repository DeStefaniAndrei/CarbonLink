import { ProjectDetails } from "@/pages/project-details.js"

export default function ProjectDetailsPage({ params }) {
  return <ProjectDetails projectId={params.id} />
} 