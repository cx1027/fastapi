import React, { useState } from "react"
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
import { createFileRoute } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
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
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [files, setFiles] = useState<{ id: number; name: string }[]>([])
  const [addedJobs, setAddedJobs] = useState<JobWithFiles[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: (data: JobWithFiles) =>
      JobsService.createJob({ 
        requestBody: { 
          title: data.title, 
          description: data.description
        } 
      }),
    onSuccess: () => {
      setTitle("")
      setDescription("")
      setFiles([])
      setIsOpen(false)
    },
    onError: (error) => {
      console.error("Error submitting job scoring:", error)
    },
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (fileList) {
      const newFiles = Array.from(fileList).map((file, index) => ({
        id: index + 1,
        name: file.name,
      }))
      setFiles([...files, ...newFiles])
    }
  }

  const handleSave = () => {
    const jobData: JobWithFiles = { title, description, files }
    mutation.mutate(jobData)
    setAddedJobs([...addedJobs, jobData])
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={8} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Job Scoring</Heading>
          <DialogRoot open={isOpen} onOpenChange={({ open }) => setIsOpen(open)}>
            <DialogTrigger asChild>
              <Button colorScheme="blue">Add New Job</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Job</DialogTitle>
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
        </HStack>

        <HStack align="start" gap={8}>
          <VStack align="stretch" flex={1}>
            {addedJobs.length > 0 && (
              <VStack align="stretch" mt={4}>
                <Heading size="md">Added Jobs</Heading>
                {addedJobs.map((job, index) => (
                  <Box key={index} p={4} borderWidth="1px" borderRadius="md" bg="white" shadow="md">
                    <Text fontWeight="bold">{job.title}</Text>
                    <Text>{job.description}</Text>
                  </Box>
                ))}
              </VStack>
            )}
          </VStack>

          <VStack align="stretch" flex={1}>
            {addedJobs.length > 0 && (
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>ID</Table.ColumnHeader>
                    <Table.ColumnHeader>File Name</Table.ColumnHeader>
                    <Table.ColumnHeader>Actions</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {addedJobs.flatMap(job => job.files).map((file) => (
                    <Table.Row key={file.id}>
                      <Table.Cell>{file.id}</Table.Cell>
                      <Table.Cell>{file.name}</Table.Cell>
                      <Table.Cell>
                        <Button size="sm" colorScheme="red">
                          Delete
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}
          </VStack>
        </HStack>
      </VStack>
    </Container>
  )
}

export const Route = createFileRoute("/_layout/job-scoring")({
  component: JobScoring,
})

export default JobScoring 