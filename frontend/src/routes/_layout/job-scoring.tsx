import React, { useState, useEffect } from "react"
import {
  Container,
  Heading,
  VStack,
  HStack,
  Input,
  Textarea,
  Button,
  Table,
  Text,
  Box,
} from "@chakra-ui/react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { JobsService, CandidatesService } from "../../client"
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "../../components/ui/dialog"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import type { ApiError } from "@/client/core/ApiError"

interface JobWithFiles {
  title: string
  description: string
  files: { id: number; name: string; file?: File }[]
}

const JobScoring = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { jobId } = Route.useSearch()
  // Input states
  const [inputTitle, setInputTitle] = useState("")
  const [inputDescription, setInputDescription] = useState("")
  const [inputFiles, setInputFiles] = useState<{ id: number; name: string; file?: File }[]>([])
  // Display states
  const [displayTitle, setDisplayTitle] = useState("")
  const [displayDescription, setDisplayDescription] = useState("")
  const [displayFiles, setDisplayFiles] = useState<{ id: number; name: string }[]>([])
  const [isSaved, setIsSaved] = useState(false)
  const { showSuccessToast } = useCustomToast()

  const { data: jobData } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => jobId ? JobsService.readJob({ id: jobId }) : null,
    enabled: !!jobId,
  })

  useEffect(() => {
    if (jobData) {
      setInputTitle(jobData.title)
      setInputDescription(jobData.description || "")
      setDisplayTitle(jobData.title)
      setDisplayDescription(jobData.description || "")
      // If there are files in the job data, parse them and set them
      if (jobData.files) {
        try {
          const parsedFiles = JSON.parse(jobData.files)
          if (Array.isArray(parsedFiles)) {
            const files = parsedFiles.map((file: string, index: number) => ({
              id: index + 1,
              name: file,
              file: file.endsWith('.pdf') ? new File([], file) : undefined
            }))
            setInputFiles(files)
            setDisplayFiles(files.map(f => ({ id: f.id, name: f.name })))
          }
        } catch (e) {
          console.error("Error parsing files:", e)
          // If parsing fails, try to handle it as a single file name
          const file = {
            id: 1,
            name: jobData.files,
            file: jobData.files.endsWith('.pdf') ? new File([], jobData.files) : undefined
          }
          setInputFiles([file])
          setDisplayFiles([file])
        }
      }
      setIsSaved(true)
    }
  }, [jobData])

  const mutation = useMutation({
    mutationFn: (data: JobWithFiles) => {
      // Send the complete file data including names
      const filesData = JSON.stringify(data.files.map(f => f.name))
      console.log('=== MUTATION: Sending files data ===', filesData)
      
      if (jobId) {
        console.log('=== MUTATION: Updating existing job ===', jobId)
        // Update existing job - send all fields explicitly
        return JobsService.updateJob({ 
          id: jobId,
          requestBody: { 
            title: data.title, 
            description: data.description,
            files: filesData
          } 
        })
      } else {
        console.log('=== MUTATION: Creating new job ===')
        // Create new job
        return JobsService.createJob({
          requestBody: {
            title: data.title,
            description: data.description,
            files: filesData
          }
        })
      }
    },
    onSuccess: (data) => {
      console.log('=== MUTATION: Success response ===', data)
      showSuccessToast("Job saved successfully.")
      
      // Handle files first
      let files: { id: number; name: string }[] = []
      if (data.files) {
        try {
          const parsedFiles = JSON.parse(data.files)
          console.log('=== MUTATION: Parsed files ===', parsedFiles)
          if (Array.isArray(parsedFiles)) {
            files = parsedFiles.map((file: string, index: number) => ({
              id: index + 1,
              name: file
            }))
          }
        } catch (e) {
          console.error('=== MUTATION: Error parsing files ===', e)
          files = [{
            id: 1,
            name: data.files
          }]
        }
      }
      
      console.log('=== MUTATION: Final files array ===', files)
      
      // Update all states at once to ensure consistency
      setDisplayTitle(data.title)
      setDisplayDescription(data.description || "")
      setDisplayFiles(files)
      setInputFiles(files.map(f => ({ ...f, file: f.name.endsWith('.pdf') ? new File([], f.name) : undefined })))
      setIsSaved(true)

      // If this was a new job, update the URL with the new job ID
      if (!jobId && data.id) {
        navigate({
          to: "/job-scoring",
          search: { jobId: data.id }
        })
      }
      
      // Invalidate both the specific job query and the jobs list
      queryClient.invalidateQueries({ queryKey: ["job", jobId || data.id] })
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: (error: ApiError) => {
      console.error('=== MUTATION: Error ===', error)
      handleError(error)
    },
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (fileList) {
      const newFiles = Array.from(fileList).map((file, index) => ({
        id: inputFiles.length + index + 1,
        name: file.name,
        file: file // Store the actual File object
      }))
      console.log('=== FILE UPLOAD: New files ===', newFiles)
      setInputFiles([...inputFiles, ...newFiles])
    }
  }

  const handleDeleteFile = (fileId: number) => {
    console.log('=== DELETE FILE: Before deletion ===', inputFiles)
    const updatedFiles = inputFiles.filter(f => f.id !== fileId)
    console.log('=== DELETE FILE: After deletion ===', updatedFiles)
    setInputFiles(updatedFiles)
  }

  const handleSave = async () => {
    if (!inputTitle.trim()) {
      showSuccessToast("Please enter a job title")
      return
    }

    try {
      // First, upload all files
      const uploadedFiles = await Promise.all(
        inputFiles.map(async (file) => {
          if (file.file) {
            // If we have the actual File object, use it
            const response = await CandidatesService.saveCvCandidate({ file: file.file })
            return {
              id: file.id,
              name: response.file_name
            }
          } else {
            // If we only have the name, create a new File object
            const fileObj = new File([new Blob()], file.name, { type: 'application/octet-stream' })
            const response = await CandidatesService.saveCvCandidate({ file: fileObj })
            return {
              id: file.id,
              name: response.file_name
            }
          }
        })
      )

      console.log('=== SAVE: Uploaded files ===', uploadedFiles)
      
      const jobData: JobWithFiles = { 
        title: inputTitle, 
        description: inputDescription, 
        files: uploadedFiles 
      }
      console.log('=== SAVE: Job data being sent ===', jobData)
      mutation.mutate(jobData)
    } catch (error) {
      console.error('Error saving job:', error)
      handleError(error as ApiError)
    }
  }

  const handleEdit = () => {
    console.log('=== EDIT: Current display files ===', displayFiles)
    setInputTitle(displayTitle)
    setInputDescription(displayDescription)
    setInputFiles([...displayFiles.map(f => ({ ...f, file: undefined } as { id: number; name: string; file?: File }))])
    setIsSaved(false)
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={8} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Job Scoring</Heading>
          {isSaved && (
            <Button colorScheme="blue" onClick={handleEdit}>
              Edit
            </Button>
          )}
        </HStack>

        {!isSaved ? (
          // Input Form
          <HStack align="start" gap={8}>
            <VStack align="stretch" flex={1}>
              <VStack align="stretch" mt={4}>
                <Heading size="md">Job Details</Heading>
                <Box p={4} borderWidth="1px" borderRadius="md" bg="white" shadow="md">
                  <VStack gap={4}>
                    <Input
                      placeholder="Enter job title"
                      value={inputTitle}
                      onChange={(e) => setInputTitle(e.target.value)}
                    />
                    <Textarea
                      placeholder="Enter job description"
                      value={inputDescription}
                      onChange={(e) => setInputDescription(e.target.value)}
                    />
                  </VStack>
                </Box>
              </VStack>
            </VStack>

            <VStack align="stretch" flex={1}>
              <Heading size="md">Files</Heading>
              <Box p={4} borderWidth="1px" borderRadius="md" bg="white" shadow="md">
                <VStack gap={4}>
                  <Input type="file" onChange={handleFileUpload} multiple />
                  {inputFiles.length > 0 && (
                    <Table.Root>
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeader>ID</Table.ColumnHeader>
                          <Table.ColumnHeader>File Name</Table.ColumnHeader>
                          <Table.ColumnHeader>Actions</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {inputFiles.map((file) => (
                          <Table.Row key={file.id}>
                            <Table.Cell>{file.id}</Table.Cell>
                            <Table.Cell>{file.name}</Table.Cell>
                            <Table.Cell>
                              <Button 
                                size="sm" 
                                colorScheme="red"
                                onClick={() => handleDeleteFile(file.id)}
                              >
                                Delete
                              </Button>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  )}
                </VStack>
              </Box>
            </VStack>
          </HStack>
        ) : (
          // Display View
          <HStack align="start" gap={8}>
            <VStack align="stretch" flex={1}>
              <VStack align="stretch" mt={4}>
                <Heading size="md">Job Details</Heading>
                <Box p={4} borderWidth="1px" borderRadius="md" bg="white" shadow="md">
                  <Text fontWeight="bold">{displayTitle}</Text>
                  <Text>{displayDescription}</Text>
                </Box>
              </VStack>
            </VStack>

            <VStack align="stretch" flex={1}>
              <Heading size="md">Files</Heading>
              <Box p={4} borderWidth="1px" borderRadius="md" bg="white" shadow="md">
                <Table.Root>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>ID</Table.ColumnHeader>
                      <Table.ColumnHeader>File Name</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {displayFiles.map((file) => (
                      <Table.Row key={file.id}>
                        <Table.Cell>{file.id}</Table.Cell>
                        <Table.Cell>{file.name}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            </VStack>
          </HStack>
        )}

        {!isSaved && (
          <Button
            colorScheme="blue"
            onClick={handleSave}
            loading={mutation.isPending}
            alignSelf="flex-end"
          >
            Save
          </Button>
        )}
      </VStack>
    </Container>
  )
}

export const Route = createFileRoute("/_layout/job-scoring")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      jobId: search.jobId as string | undefined,
    }
  },
  component: JobScoring,
})

export default JobScoring 