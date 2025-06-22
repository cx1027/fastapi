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
  Badge,
} from "@chakra-ui/react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { JobsService, CandidateService, ScoreService } from "../../client"
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

interface AnalysisResult {
  [key: string]: any
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
  // Popup states
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false)
  const [isFileDetailsOpen, setIsFileDetailsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<{ id: number; name: string } | null>(null)
  const [jobAnalysisResult, setJobAnalysisResult] = useState<AnalysisResult | null>(null)
  const [fileAnalysisResult, setFileAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isLoadingJobAnalysis, setIsLoadingJobAnalysis] = useState(false)
  const [isLoadingFileAnalysis, setIsLoadingFileAnalysis] = useState(false)
  const [analysisScoreResult, setAnalysisScoreResult] = useState<AnalysisResult | null>(null)
  const [isAnalysisDetailsOpen, setIsAnalysisDetailsOpen] = useState(false)
  const { showSuccessToast } = useCustomToast()

  const { data: jobData } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => (jobId ? JobsService.readJob({ id: jobId }) : null),
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
              file: file.endsWith(".pdf") ? new File([], file) : undefined,
            }))
            setInputFiles(files)
            setDisplayFiles(files.map((f) => ({ id: f.id, name: f.name })))
          }
        } catch (e) {
          console.error("Error parsing files:", e)
          // If parsing fails, try to handle it as a single file name
          const file = {
            id: 1,
            name: jobData.files,
            file: jobData.files.endsWith(".pdf")
              ? new File([], jobData.files)
              : undefined,
          }
          setInputFiles([file])
          setDisplayFiles([file])
        }
      }
      setIsSaved(true)
    }
  }, [jobData])

  const runAnalysisMutation = useMutation({
    mutationFn: async () => {
      if (!jobId || !jobData || !displayFiles.length) {
        throw new Error("Job data or files not available for analysis.")
      }

      // Fetch analysis for all candidate files
      const candidateAnalyses = await Promise.all(
        displayFiles.map((file) =>
          CandidateService.getCandidateAnalysisResult({ fileName: file.name }),
        ),
      )

      // Assuming we analyze with the first candidate for now, as the backend endpoint seems to take one.
      // This could be extended to loop or batch if the backend supports it.
      if (candidateAnalyses.length > 0 && candidateAnalyses[0].analysis_result) {
        const candidateData = JSON.parse(candidateAnalyses[0].analysis_result)

        const scoreData = {
          job: {
            id: jobData.id,
            title: jobData.title,
            description: jobData.description,
          },
          candidate: candidateData,
        }

        return ScoreService.analyseScore({ requestBody: scoreData })
      } else {
        throw new Error(
          "No candidate analysis result found for the first candidate.",
        )
      }
    },
    onSuccess: (data) => {
      setAnalysisScoreResult(data as AnalysisResult)
      setIsAnalysisDetailsOpen(true)
      showSuccessToast("Analysis run successfully.")
      queryClient.invalidateQueries({ queryKey: ["job", jobId] })
    },
    onError: (error: ApiError) => {
      handleError(error)
    },
  })

  const mutation = useMutation({
    mutationFn: (data: JobWithFiles) => {
      console.log("=== MUTATION: received data ===", data)
      // Send the complete file data including names
      const filesData = JSON.stringify(
        data.files.filter((f) => f && f.name).map((f) => f.name), // Only keep files that are not null/undefined and have a name
      )
      console.log("=== MUTATION: Sending files data ===", filesData)

      if (jobId) {
        console.log("=== MUTATION: Updating existing job ===", jobId)
        // Update existing job - send all fields explicitly
        return JobsService.updateJob({
          id: jobId,
          requestBody: {
            title: data.title,
            description: data.description,
            files: filesData,
          },
        })
      } else {
        console.log("=== MUTATION: Creating new job ===")
        // Create new job
        return JobsService.createJob({
          requestBody: {
            title: data.title,
            description: data.description,
            files: filesData,
          },
        })
      }
    },
    onSuccess: (data) => {
      console.log("=== MUTATION: Success response ===", data)
      showSuccessToast("Job saved successfully.")

      // Handle files first
      let files: { id: number; name: string }[] = []
      if (data.files) {
        try {
          const parsedFiles = JSON.parse(data.files)
          console.log("=== MUTATION: Parsed files ===", parsedFiles)
          if (Array.isArray(parsedFiles)) {
            files = parsedFiles.map((file: string, index: number) => ({
              id: index + 1,
              name: file,
            }))
          }
        } catch (e) {
          console.error("=== MUTATION: Error parsing files ===", e)
          files = [
            {
              id: 1,
              name: data.files,
            },
          ]
        }
      }

      console.log("=== MUTATION: Final files array ===", files)

      // Update all states at once to ensure consistency
      setDisplayTitle(data.title)
      setDisplayDescription(data.description || "")
      setDisplayFiles(files)
      setInputFiles(
        files.map((f) => ({
          ...f,
          file: f.name.endsWith(".pdf") ? new File([], f.name) : undefined,
        })),
      )
      setIsSaved(true)

      // If this was a new job, update the URL with the new job ID
      if (!jobId && data.id) {
        navigate({
          to: "/job-scoring",
          search: { jobId: data.id },
        })
      }

      // Invalidate both the specific job query and the jobs list
      queryClient.invalidateQueries({ queryKey: ["job", jobId || data.id] })
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: (error: ApiError) => {
      console.error("=== MUTATION: Error ===", error)
      handleError(error)
    },
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (fileList) {
      const newFiles = Array.from(fileList).map((file, index) => ({
        id: inputFiles.length + index + 1,
        name: file.name,
        file: file, // Store the actual File object
      }))
      console.log("=== FILE UPLOAD: New files ===", newFiles)
      setInputFiles([...inputFiles, ...newFiles])
    }
  }

  const handleDeleteFile = (fileId: number) => {
    console.log("=== DELETE FILE: Before deletion ===", inputFiles)
    const updatedFiles = inputFiles.filter((f) => f.id !== fileId)
    console.log("=== DELETE FILE: After deletion ===", updatedFiles)
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
            // If we have the actual File object, it's a new file to upload
            const response = await CandidateService.analyseCandidateCv({
              formData: { file: file.file },
            })
            // The actual filename is in response.file_name, but the API spec says `unknown` return.
            // Assuming the actual API returns a filename. If not, this needs adjustment.
            const fileName = (response as any)?.file_name || file.name
            return {
              id: file.id,
              name: fileName,
            }
          }
          // If there's no file object, it's an existing file; just return its info
          return {
            id: file.id,
            name: file.name,
          }
        }),
      )

      console.log("=== SAVE: Uploaded files ===", uploadedFiles)

      const jobData: JobWithFiles = {
        title: inputTitle,
        description: inputDescription,
        files: uploadedFiles,
      }
      console.log("=== SAVE: Job data being sent ===", jobData)
      mutation.mutate(jobData)
      console.log("=== mutation: mutation data being sent ===", jobData)
    } catch (error) {
      console.error("Error saving job:", error)
      handleError(error as ApiError)
    }
  }

  const handleEdit = () => {
    console.log("=== EDIT: Current display files ===", displayFiles)
    setInputTitle(displayTitle)
    setInputDescription(displayDescription)
    setInputFiles([
      ...displayFiles.map(
        (f) =>
          ({ ...f, file: undefined }) as {
            id: number
            name: string
            file?: File
          },
      ),
    ])
    setIsSaved(false)
  }

  // Function to fetch job analysis result
  const fetchJobAnalysis = async () => {
    if (!jobId) return

    setIsLoadingJobAnalysis(true)
    try {
      const job = await JobsService.readJob({ id: jobId })
      // Use type assertion since analysis_result exists in backend but not in generated types
      const jobWithAnalysis = job as any
      if (jobWithAnalysis.analysis_result) {
        const analysis = JSON.parse(jobWithAnalysis.analysis_result)
        setJobAnalysisResult(analysis)
      }
    } catch (error) {
      console.error("Error fetching job analysis:", error)
      handleError(error as ApiError)
    } finally {
      setIsLoadingJobAnalysis(false)
    }
  }

  // Function to fetch file analysis result
  const fetchFileAnalysis = async (fileName: string) => {
    setIsLoadingFileAnalysis(true)
    try {
      // Try to fetch analysis result from the database
      const response = await CandidateService.getCandidateAnalysisResult({
        fileName,
      })
      if (response && response.analysis_result) {
        const analysis = JSON.parse(response.analysis_result)
        setFileAnalysisResult(analysis)
      } else {
        setFileAnalysisResult({
          message: "Analysis result not available for this file",
          note: "The analysis result could not be retrieved from the database.",
          fileName: fileName,
        })
      }
    } catch (error) {
      console.error("Error fetching file analysis:", error)
      // Show user-friendly message if analysis result not found
      setFileAnalysisResult({
        message: "Analysis result not available for this file",
        note: "This file may not have been analyzed yet or the analysis result is not stored in the database.",
        fileName: fileName,
      })
    } finally {
      setIsLoadingFileAnalysis(false)
    }
  }

  // Function to handle job details button click
  const handleJobDetailsClick = () => {
    fetchJobAnalysis()
    setIsJobDetailsOpen(true)
  }

  // Function to handle file details button click
  const handleFileDetailsClick = (file: { id: number; name: string }) => {
    setSelectedFile(file)
    fetchFileAnalysis(file.name)
    setIsFileDetailsOpen(true)
  }

  // Function to render analysis result as formatted text
  const renderAnalysisResult = (result: AnalysisResult | null) => {
    if (!result) return <Text>No analysis result available</Text>

    // Special case for file analysis message
    if (result.message && result.message.includes("not available")) {
      return (
        <VStack align="stretch" gap={3}>
          <Box
            p={3}
            borderWidth="1px"
            borderRadius="md"
            bg="orange.50"
            borderColor="orange.200"
          >
            <Text fontWeight="bold" color="orange.800" mb={2}>
              {result.message}
            </Text>
            <Text color="orange.700" fontSize="sm">
              {result.note}
            </Text>
            <Text color="gray.600" fontSize="sm" mt={2}>
              File: {result.fileName}
            </Text>
          </Box>
        </VStack>
      )
    }

    return (
      <VStack align="stretch" gap={3}>
        {Object.entries(result).map(([key, value]) => (
          <Box key={key} p={3} borderWidth="1px" borderRadius="md">
            <Text fontWeight="bold" mb={2} textTransform="capitalize">
              {key.replace(/_/g, " ")}
            </Text>
            {Array.isArray(value) ? (
              <VStack align="start" gap={1}>
                {value.map((item, index) => (
                  <Badge key={index} colorScheme="blue" variant="subtle">
                    {item}
                  </Badge>
                ))}
              </VStack>
            ) : typeof value === "object" ? (
              <Text>{JSON.stringify(value, null, 2)}</Text>
            ) : (
              <Text>{String(value)}</Text>
            )}
          </Box>
        ))}
      </VStack>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={8} align="stretch">
        {/* Header with Title and All Buttons */}
        <HStack justify="space-between">
          <Heading size="lg">Job Scoring</Heading>
          <HStack gap={2}>
            {isSaved ? (
              <>
                <Button colorScheme="blue" onClick={handleEdit}>
                  Edit
                </Button>
                <Button
                  colorScheme="green"
                  onClick={() => runAnalysisMutation.mutate()}
                  loading={runAnalysisMutation.isPending}
                >
                  Run Analysis
                </Button>
              </>
            ) : (
              <Button
                colorScheme="blue"
                onClick={handleSave}
                loading={mutation.isPending}
              >
                Save
              </Button>
            )}
          </HStack>
        </HStack>

        {/* Job Details Section */}
        <VStack align="stretch">
          <Heading size="md">Job Details</Heading>
          {!isSaved ? (
            // Input Form for Job Details
            <Box
              p={4}
              borderWidth="1px"
              borderRadius="md"
              bg="white"
              shadow="md"
            >
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
          ) : (
            // Display View for Job Details
            <Box
              p={4}
              borderWidth="1px"
              borderRadius="md"
              bg="white"
              shadow="md"
            >
              <VStack align="start" gap={3}>
                <Text fontWeight="bold">{displayTitle}</Text>
                <Text>{displayDescription}</Text>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={handleJobDetailsClick}
                  loading={isLoadingJobAnalysis}
                >
                  Details
                </Button>
              </VStack>
            </Box>
          )}
        </VStack>

        {/* Files Section */}
        <VStack align="stretch">
          <Heading size="md">Files</Heading>
          {!isSaved ? (
            // Input Form for Files
            <Box
              p={4}
              borderWidth="1px"
              borderRadius="md"
              bg="white"
              shadow="md"
            >
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
          ) : (
            // Display View for Files
            <Box
              p={4}
              borderWidth="1px"
              borderRadius="md"
              bg="white"
              shadow="md"
            >
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>ID</Table.ColumnHeader>
                    <Table.ColumnHeader>File Name</Table.ColumnHeader>
                    <Table.ColumnHeader>Actions</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {displayFiles.map((file) => (
                    <Table.Row key={file.id}>
                      <Table.Cell>{file.id}</Table.Cell>
                      <Table.Cell>{file.name}</Table.Cell>
                      <Table.Cell>
                        <HStack gap={2}>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() => handleFileDetailsClick(file)}
                            loading={
                              isLoadingFileAnalysis &&
                              selectedFile?.id === file.id
                            }
                          >
                            Details
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="teal"
                            onClick={() => {
                              // Maybe open a specific analysis view or pass file-specific data
                              setIsAnalysisDetailsOpen(true)
                            }}
                          >
                            Score
                          </Button>
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          )}
        </VStack>

        {/* Job Analysis Details Popup */}
        <DialogRoot
          open={isJobDetailsOpen}
          onOpenChange={({ open }) => setIsJobDetailsOpen(open)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Job Analysis Details</DialogTitle>
            </DialogHeader>
            <DialogBody>
              {isLoadingJobAnalysis ? (
                <Text>Loading analysis results...</Text>
              ) : (
                renderAnalysisResult(jobAnalysisResult)
              )}
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="subtle" colorPalette="gray">
                  Close
                </Button>
              </DialogActionTrigger>
            </DialogFooter>
            <DialogCloseTrigger />
          </DialogContent>
        </DialogRoot>

        {/* File Analysis Details Popup */}
        <DialogRoot
          open={isFileDetailsOpen}
          onOpenChange={({ open }) => setIsFileDetailsOpen(open)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                File Analysis Details - {selectedFile?.name}
              </DialogTitle>
            </DialogHeader>
            <DialogBody>
              {isLoadingFileAnalysis ? (
                <Text>Loading analysis results...</Text>
              ) : (
                renderAnalysisResult(fileAnalysisResult)
              )}
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="subtle" colorPalette="gray">
                  Close
                </Button>
              </DialogActionTrigger>
            </DialogFooter>
            <DialogCloseTrigger />
          </DialogContent>
        </DialogRoot>

        {/* Score Analysis Details Popup */}
        <DialogRoot
          open={isAnalysisDetailsOpen}
          onOpenChange={({ open }) => setIsAnalysisDetailsOpen(open)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Score Analysis Details</DialogTitle>
            </DialogHeader>
            <DialogBody>
              {runAnalysisMutation.isPending ? (
                <Text>Loading analysis results...</Text>
              ) : (
                renderAnalysisResult(analysisScoreResult)
              )}
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="subtle" colorPalette="gray">
                  Close
                </Button>
              </DialogActionTrigger>
            </DialogFooter>
            <DialogCloseTrigger />
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