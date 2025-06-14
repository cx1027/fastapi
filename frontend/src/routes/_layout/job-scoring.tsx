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
import { useMutation, useQuery } from "@tanstack/react-query"
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
  DialogTrigger,
} from "../../components/ui/dialog"

interface JobWithFiles {
  title: string
  description: string
  files: { id: number; name: string }[]
}

const JobScoring = () => {
  const navigate = useNavigate()
  const { jobId } = Route.useSearch()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [files, setFiles] = useState<{ id: number; name: string }[]>([])
  const [addedJobs, setAddedJobs] = useState<JobWithFiles[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const { data: jobData } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => jobId ? JobsService.readJob({ id: jobId }) : null,
    enabled: !!jobId,
  })

  useEffect(() => {
    if (jobData) {
      setTitle(jobData.title)
      setDescription(jobData.description || "")
      // If there are files in the job data, parse them and set them
      if (jobData.files) {
        try {
          const parsedFiles = JSON.parse(jobData.files)
          setFiles(parsedFiles.map((file: string, index: number) => ({
            id: index + 1,
            name: file
          })))
        } catch (e) {
          console.error("Error parsing files:", e)
        }
      }
    }
  }, [jobData])

  const mutation = useMutation({
    mutationFn: (data: JobWithFiles) => {
      if (!jobId) {
        throw new Error("Job ID is required")
      }
      return JobsService.updateJob({ 
        id: jobId,
        requestBody: { 
          title: data.title, 
          description: data.description,
          files: JSON.stringify(data.files.map(f => f.name))
        } 
      })
    },
    onSuccess: () => {
      setTitle("")
      setDescription("")
      setFiles([])
      setIsOpen(false)
      navigate({ to: "/job-list" })
    },
    onError: (error) => {
      console.error("Error updating job:", error)
    },
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (fileList) {
      const newFiles = Array.from(fileList).map((file, index) => ({
        id: files.length + index + 1,
        name: file.name,
      }))
      setFiles([...files, ...newFiles])
    }
  }

  const handleSave = () => {
    const jobData: JobWithFiles = { title, description, files }
    mutation.mutate(jobData)
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={8} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Job Scoring</Heading>
          <Button colorScheme="blue" onClick={() => setIsOpen(true)}>
            Edit Job
          </Button>
        </HStack>

        <HStack align="start" gap={8}>
          <VStack align="stretch" flex={1}>
            <VStack align="stretch" mt={4}>
              <Heading size="md">Job Details</Heading>
              <Box p={4} borderWidth="1px" borderRadius="md" bg="white" shadow="md">
                <Text fontWeight="bold">{title}</Text>
                <Text>{description}</Text>
              </Box>
            </VStack>
          </VStack>

          <VStack align="stretch" flex={1}>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>ID</Table.ColumnHeader>
                  <Table.ColumnHeader>File Name</Table.ColumnHeader>
                  <Table.ColumnHeader>Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {files.map((file) => (
                  <Table.Row key={file.id}>
                    <Table.Cell>{file.id}</Table.Cell>
                    <Table.Cell>{file.name}</Table.Cell>
                    <Table.Cell>
                      <Button 
                        size="sm" 
                        colorScheme="red"
                        onClick={() => setFiles(files.filter(f => f.id !== file.id))}
                      >
                        Delete
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </VStack>
        </HStack>

        <DialogRoot open={isOpen} onOpenChange={({ open }) => setIsOpen(open)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Job</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <VStack gap={4}>
                <Input
                  placeholder="Enter job title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Enter job description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <Input type="file" onChange={handleFileUpload} multiple />
                {files.length > 0 && (
                  <Text>Selected files: {files.length}</Text>
                )}
              </VStack>
            </DialogBody>
            <DialogFooter>
              <DialogCloseTrigger />
              <Button colorScheme="blue" onClick={handleSave}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>
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