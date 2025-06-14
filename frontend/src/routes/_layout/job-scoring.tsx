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
import { JobsService } from "../../client"
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
  files: { id: number; name: string }[]
}

const JobScoring = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { jobId } = Route.useSearch()
  // Input states
  const [inputTitle, setInputTitle] = useState("")
  const [inputDescription, setInputDescription] = useState("")
  const [inputFiles, setInputFiles] = useState<{ id: number; name: string }[]>([])
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
              name: file
            }))
            setInputFiles(files)
            setDisplayFiles(files)
          }
        } catch (e) {
          console.error("Error parsing files:", e)
          // If parsing fails, try to handle it as a single file name
          const file = {
            id: 1,
            name: jobData.files
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
      const filesData = data.files.length > 0 ? JSON.stringify(data.files.map(f => f.name)) : null
      if (jobId) {
        // Update existing job
        return JobsService.updateJob({ 
          id: jobId,
          requestBody: { 
            title: data.title, 
            description: data.description,
            files: filesData
          } 
        })
      } else {
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
      showSuccessToast("Job saved successfully.")
      // Update display states
      setDisplayTitle(data.title)
      setDisplayDescription(data.description || "")
      if (data.files) {
        try {
          const parsedFiles = JSON.parse(data.files)
          if (Array.isArray(parsedFiles)) {
            const files = parsedFiles.map((file: string, index: number) => ({
              id: index + 1,
              name: file
            }))
            setDisplayFiles(files)
            setInputFiles(files) // Also update input files to keep them in sync
          }
        } catch (e) {
          console.error("Error parsing files:", e)
          const file = {
            id: 1,
            name: data.files
          }
          setDisplayFiles([file])
          setInputFiles([file]) // Also update input files to keep them in sync
        }
      } else {
        // If no files, clear both display and input files
        setDisplayFiles([])
        setInputFiles([])
      }
      setIsSaved(true)
      queryClient.invalidateQueries({ queryKey: ["job", jobId] })
    },
    onError: (error: ApiError) => {
      handleError(error)
    },
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (fileList) {
      const newFiles = Array.from(fileList).map((file, index) => ({
        id: inputFiles.length + index + 1,
        name: file.name,
      }))
      setInputFiles([...inputFiles, ...newFiles])
    }
  }

  const handleDeleteFile = (fileId: number) => {
    setInputFiles(inputFiles.filter(f => f.id !== fileId))
  }

  const handleSave = () => {
    const jobData: JobWithFiles = { 
      title: inputTitle, 
      description: inputDescription, 
      files: inputFiles 
    }
    mutation.mutate(jobData)
  }

  const handleEdit = () => {
    setInputTitle(displayTitle)
    setInputDescription(displayDescription)
    setInputFiles([...displayFiles])
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