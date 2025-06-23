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
import {
  JobsService,
  CandidateService,
  ScoreService,
  JobService,
} from "../../client"
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

interface CandidateData {
  id: number
  name: string
  email: string
  phone: string
  cv_filename: string
  created_at: string
}

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
  const [candidates, setCandidates] = useState<CandidateData[]>([])
  const [isSaved, setIsSaved] = useState(false)
  // Popup states
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false)
  const [isFileDetailsOpen, setIsFileDetailsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<{ id: number; name: string } | null>(null)
  const [jobAnalysisResult, setJobAnalysisResult] = useState<AnalysisResult | null>(null)
  const [fileAnalysisResult, setFileAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isLoadingJobAnalysis, setIsLoadingJobAnalysis] = useState(false)
  const [isLoadingFileAnalysis, setIsLoadingFileAnalysis] = useState(false)
  const [analysisRun, setAnalysisRun] = useState(false)
  const [analysisScoreResult, setAnalysisScoreResult] = useState<Record<string, AnalysisResult>>({})
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

            // Fetch candidate data for each file
            const fetchCandidates = async () => {
              const candidatePromises = files.map(async (file) => {
                try {
                  const candidateAnalysis =
                    await CandidateService.getCandidateAnalysisResult({
                      fileName: file.name,
                    })
                  if (candidateAnalysis && candidateAnalysis.analysis_result) {
                    const candidateData = JSON.parse(
                      candidateAnalysis.analysis_result,
                    )
                    return {
                      id: parseInt(candidateAnalysis.id, 10),
                      name: candidateData.name || "N/A",
                      email: candidateData.email || "N/A",
                      phone: candidateData.phone || "N/A",
                      cv_filename: file.name,
                      created_at: new Date(
                        candidateAnalysis.created_at,
                      ).toLocaleDateString(),
                    }
                  }
                } catch (error) {
                  console.error(
                    `Failed to fetch analysis for ${file.name}`,
                    error,
                  )
                }
                return null
              })
              const resolvedCandidates = await Promise.all(candidatePromises)
              setCandidates(
                resolvedCandidates.filter(
                  (c): c is CandidateData => c !== null,
                ),
              )
            }
            fetchCandidates()
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

      // If there's a saved analysis result, load it
      const jobWithAnalysis = jobData as any // To access analysis_result easily
      if (jobWithAnalysis.analysis_result) {
        try {
          const savedAnalysis = JSON.parse(jobWithAnalysis.analysis_result)
          setAnalysisScoreResult(savedAnalysis)
          setAnalysisRun(true) // This will show the 'Score' and 'Save Analysis' buttons
        } catch (e) {
          console.error("Error parsing saved analysis result:", e)
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

      const scoreResults = await Promise.all(
        displayFiles.map(async (file) => {
          try {
            const candidateAnalysis = await CandidateService.getCandidateAnalysisResult({ fileName: file.name });
            if (candidateAnalysis && candidateAnalysis.analysis_result) {
              const candidateData = JSON.parse(candidateAnalysis.analysis_result);
              const scoreData = {
                job: {
                  id: jobData.id,
                  title: jobData.title,
                  description: jobData.description,
                },
                candidate: candidateData,
              };
              const scoreResult = await ScoreService.analyseScore({ requestBody: scoreData });
              return { fileName: file.name, score: scoreResult };
            }
          } catch (error) {
            console.error(`Failed to analyze score for ${file.name}`, error);
          }
          return { fileName: file.name, score: null };
        })
      );

      return scoreResults.filter(result => result.score) as {fileName: string, score: AnalysisResult}[];
    },
    onSuccess: (data) => {
      const newScoreResults = data.reduce((acc, result) => {
        acc[result.fileName] = result.score;
        return acc;
      }, {} as Record<string, AnalysisResult>);

      setAnalysisScoreResult(newScoreResults);
      setAnalysisRun(true);
      showSuccessToast("Analysis run successfully for all candidates.");
    },
    onError: (error: ApiError) => {
      handleError(error as any)
    },
  })

  const saveAnalysisMutation = useMutation({
    mutationFn: (analysisResult: Record<string, AnalysisResult>) => {
      if (!jobId) {
        throw new Error("Job ID not found")
      }
      return JobsService.updateJob({
        id: jobId,
        requestBody: {
          analysis_result: JSON.stringify(analysisResult),
        },
      })
    },
    onSuccess: () => {
      showSuccessToast("Analysis saved successfully.")
      queryClient.invalidateQueries({ queryKey: ["job", jobId] })
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
      setIsAnalysisDetailsOpen(false) // Close the popup
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

      // After successfully saving the job, trigger the analysis
      const currentJobId = jobId || data.id
      // Always call analysis, even if owner_id is missing
      JobService.analyseJob({
        requestBody: {
          id: currentJobId,
          title: data.title,
          description: data.description,
          owner_id: jobData?.owner_id ?? null,
          files: data.files ?? "[]",
        },
      })
        .then(() => {
          showSuccessToast(
            "Job analysis initiated. Results will be available shortly.",
          )
          queryClient.invalidateQueries({ queryKey: ["job", currentJobId] })
        })
        .catch((error) => {
          handleError(error)
        })
    },
    onError: (error: ApiError) => {
      console.error("=== MUTATION: Error ===", error)
      handleError(error as ApiError)
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
      // Upload new files and get their names
      const uploadedFileTasks = inputFiles
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

      // Get list of files that were already on the server
      const existingFiles = inputFiles
        .filter((file) => !file.file)
        .map((f) => ({ id: f.id, name: f.name }))

      // Combine and pass to mutation
      const allFiles = [...existingFiles, ...uploadedFiles]
      const jobData: JobWithFiles = {
        title: inputTitle,
        description: inputDescription,
        files: allFiles,
      }
      mutation.mutate(jobData)
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
    setAnalysisRun(false)
    setAnalysisScoreResult({})
  }

  // Function to fetch job analysis result
  const fetchJobAnalysis = async () => {
    if (!jobId) return

    setIsLoadingJobAnalysis(true)
    try {
      const job = await JobsService.readJob({ id: jobId })
      const jobDetails = { ...job } as any

      if (jobDetails.analysis_result) {
        try {
          jobDetails.analysis_result = JSON.parse(jobDetails.analysis_result)
        } catch (e) {
          console.error("Error parsing job analysis_result:", e)
        }
      }

      if (jobDetails.files) {
        try {
          jobDetails.files = JSON.parse(jobDetails.files)
        } catch (e) {
          console.error("Error parsing job files:", e)
        }
      }

      setJobAnalysisResult(jobDetails)
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
            ) : typeof value === "object" && value !== null ? (
              "score" in value && "comment" in value ? (
                <VStack align="start" gap={1}>
                  <Text>score: {value.score}</Text>
                  <Text>comment: {value.comment}</Text>
                </VStack>
              ) : (
                <Text as="pre" whiteSpace="pre-wrap">
                  {JSON.stringify(value, null, 2)}
                </Text>
              )
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
                {analysisRun && Object.keys(analysisScoreResult).length > 0 && (
                  <Button
                    colorScheme="purple"
                    onClick={() => saveAnalysisMutation.mutate(analysisScoreResult)}
                    loading={saveAnalysisMutation.isPending}
                  >
                    Save Analysis
                  </Button>
                )}
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
                    <Table.ColumnHeader>Candidate Name</Table.ColumnHeader>
                    <Table.ColumnHeader>Email</Table.ColumnHeader>
                    <Table.ColumnHeader>Phone Number</Table.ColumnHeader>
                    <Table.ColumnHeader>CV</Table.ColumnHeader>
                    <Table.ColumnHeader>
                      Candidate Created Date
                    </Table.ColumnHeader>
                    <Table.ColumnHeader>Actions</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {candidates.map((candidate) => (
                    <Table.Row key={candidate.id}>
                      <Table.Cell>{candidate.id}</Table.Cell>
                      <Table.Cell>{candidate.name}</Table.Cell>
                      <Table.Cell>{candidate.email}</Table.Cell>
                      <Table.Cell>{candidate.phone}</Table.Cell>
                      <Table.Cell>{candidate.cv_filename}</Table.Cell>
                      <Table.Cell>{candidate.created_at}</Table.Cell>
                      <Table.Cell>
                        <HStack>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() =>
                              handleFileDetailsClick({
                                id: candidate.id,
                                name: candidate.cv_filename,
                              })
                            }
                            loading={
                              isLoadingFileAnalysis &&
                              selectedFile?.id === candidate.id
                            }
                          >
                            Details
                          </Button>
                          {analysisRun &&
                            analysisScoreResult[candidate.cv_filename] && (
                              <Button
                                size="sm"
                                colorScheme="teal"
                                onClick={() => {
                                  setSelectedFile({
                                    id: candidate.id,
                                    name: candidate.cv_filename,
                                  })
                                  setIsAnalysisDetailsOpen(true)
                                }}
                              >
                                Score
                              </Button>
                            )}
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
                renderAnalysisResult(jobAnalysisResult?.analysis_result ?? null)
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
                <Text>Running analysis for all candidates...</Text>
              ) : (
                renderAnalysisResult(selectedFile ? analysisScoreResult[selectedFile.name] : null)
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