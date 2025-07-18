import React, { useEffect, useState } from "react"
import { useNavigate, createFileRoute } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Container, Heading, Spinner, VStack, Text } from "@chakra-ui/react"
import { JobsService, CandidateService } from "../../client"
import type { ApiError } from "../../client/core/ApiError"
import useCustomToast from "../../hooks/useCustomToast"
import JobEditForm from "../../components/Jobs/JobEditForm"

interface FileItem {
  id: number
  name: string
  file?: File
}

export const Route = createFileRoute("/_layout/job-edit")({
  validateSearch: (search: Record<string, unknown>) => ({
    jobId: search.jobId as string,
  }),
  component: JobEditPage,
})

function JobEditPage() {
  const { jobId } = Route.useSearch();
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const { data: jobData, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => JobsService.readJob({ id: jobId as string }),
    enabled: !!jobId,
  })

  const [inputTitle, setInputTitle] = useState("")
  const [inputDescription, setInputDescription] = useState("")
  const [inputFiles, setInputFiles] = useState<FileItem[]>([])

  useEffect(() => {
    if (jobData && typeof jobData === 'object' && 'title' in jobData) {
      setInputTitle((jobData as any).title)
      setInputDescription((jobData as any).description || "")
      if ((jobData as any).files) {
        try {
          const parsedFiles = JSON.parse((jobData as any).files)
          if (Array.isArray(parsedFiles)) {
            setInputFiles(parsedFiles.map((file: string, index: number) => ({ id: index + 1, name: file })))
          } else if (typeof parsedFiles === "string") {
            setInputFiles([{ id: 1, name: parsedFiles }])
          }
        } catch {
          setInputFiles([{ id: 1, name: (jobData as any).files }])
        }
      } else {
        setInputFiles([])
      }
    }
  }, [jobData])

  const mutation = useMutation({
    mutationFn: async (data: { title: string; description: string; files: FileItem[] }) => {
      // Upload new files and get their names
      const uploadedFileTasks = data.files
        .filter((file) => file.file)
        .map(async (file) => {
          if (file.file) {
            const response = await CandidateService.analyseCandidateCv({
              formData: { file: file.file },
            })
            const fileName = (response as any)?.file_name || file.name
            return { id: file.id, name: fileName }
          }
          return file
        })
      const uploadedFiles = await Promise.all(uploadedFileTasks)
      const existingFiles = data.files.filter((file) => !file.file).map((f) => ({ id: f.id, name: f.name }))
      const allFiles = [...existingFiles, ...uploadedFiles]
      return JobsService.updateJob({
        id: jobId,
        requestBody: {
          title: data.title,
          description: data.description,
          files: JSON.stringify(allFiles.map(f => f.name)),
        },
      })
    },
    onSuccess: () => {
      showSuccessToast("Job updated successfully.")
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
      queryClient.invalidateQueries({ queryKey: ["job", jobId] })
      navigate({ to: "/job-list" })
    },
    onError: (err: ApiError) => {
      showErrorToast(err.message)
    },
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (fileList) {
      const newFiles = Array.from(fileList).map((file, index) => ({
        id: inputFiles.length + index + 1,
        name: file.name,
        file: file,
      }))
      setInputFiles([...inputFiles, ...newFiles])
    }
  }

  const handleDeleteFile = (fileId: number) => {
    setInputFiles(inputFiles.filter((f) => f.id !== fileId))
  }

  const handleSave = () => {
    mutation.mutate({
      title: inputTitle,
      description: inputDescription,
      files: inputFiles,
    })
  }

  if (isLoading) {
    return <Spinner />
  }

  if (!jobData || typeof jobData !== 'object' || !('title' in jobData)) {
    return <Text>Job not found.</Text>
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack gap={8} align="stretch">
        <Heading size="lg">Edit Job</Heading>
        <JobEditForm
          inputTitle={inputTitle}
          setInputTitle={setInputTitle}
          inputDescription={inputDescription}
          setInputDescription={setInputDescription}
          inputFiles={inputFiles}
          setInputFiles={setInputFiles}
          onFileUpload={handleFileUpload}
          onDeleteFile={handleDeleteFile}
          onSave={handleSave}
          isSaving={mutation.isPending}
          isEdit
        />
      </VStack>
    </Container>
  )
}

export default JobEditPage 