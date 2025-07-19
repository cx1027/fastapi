import React, { useState, useEffect, Suspense } from "react"
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
import 'react-quill/dist/quill.snow.css'
import DOMPurify from 'dompurify'

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

const ReactQuill = React.lazy(() => import("react-quill").then(mod => ({ default: mod.default as unknown as React.ComponentType<any> })))

const JobEditing = () => {
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

  // Search/filter UI state
  const [showCandidateSearch, setShowCandidateSearch] = useState(false)
  const [candidateSearchFields, setCandidateSearchFields] = useState({
    name: "",
    contact: "",
    cv: "",
    created: "",
    score: "",
    summary: "",
  })
  const [appliedCandidateSearch, setAppliedCandidateSearch] = useState(candidateSearchFields)

  // Multi-select state for candidate deletion
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([])
  const handleSelectCandidate = (id: number, checked: boolean) => {
    setSelectedCandidateIds((prev) =>
      checked ? [...prev, id] : prev.filter((cid) => cid !== id)
    )
  }
  const handleSelectAllCandidates = (checked: boolean) => {
    if (checked) {
      setSelectedCandidateIds(filteredCandidates.map((c) => c.id))
    } else {
      setSelectedCandidateIds([])
    }
  }
  // Helper to persist candidate deletions
  const persistCandidateDeletion = (remainingCandidates: CandidateData[]) => {
    // Update job files in backend, preserving original ids and file names
    const newFiles = remainingCandidates.map((c) => ({ id: c.id, name: c.cv_filename }))
    const jobData: JobWithFiles = {
      title: displayTitle,
      description: displayDescription,
      files: newFiles,
    }
    mutation.mutate(jobData)
  }
  const handleDeleteSelectedCandidates = () => {
    // Remove selected candidates from candidates state and persist
    setCandidates((prev) => {
      const remaining = prev.filter((c) => !selectedCandidateIds.includes(c.id))
      persistCandidateDeletion(remaining)
      return remaining
    })
    setSelectedCandidateIds([])
  }
  const handleDeleteSingleCandidate = (candidateId: number) => {
    setCandidates((prev) => {
      const remaining = prev.filter((c) => c.id !== candidateId)
      persistCandidateDeletion(remaining)
      return remaining
    })
    setSelectedCandidateIds((prev) => prev.filter((id) => id !== candidateId))
  }

  const { data: jobData } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => (jobId ? JobsService.readJob({ id: jobId }) : null),
    enabled: !!jobId,
  })

  // Query to check if score analysis results exist for this job
  const { data: scoreAnalyses } = useQuery({
    queryKey: ["score-analysis", jobId],
    queryFn: () => (jobId ? ScoreService.getScoreAnalysisByJob({ jobId }) : []),
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
              const candidatePromises = files.map(async (file, index) => {
                try {
                  const candidateAnalysis =
                    await CandidateService.getCandidateAnalysisResult({
                      fileName: file.name,
                    })
                  if (candidateAnalysis && candidateAnalysis.analysis_result) {
                    const candidateData = JSON.parse(
                      candidateAnalysis.analysis_result,
                    )
                    console.log(`Analysis data for ${file.name}:`, candidateData)
                    
                    // Try to extract candidate information from various possible structures
                    let name = "Unknown"
                    let email = "N/A"
                    let phone = "N/A"
                    
                    // Check different possible locations for candidate info
                    if (candidateData.name) {
                      name = candidateData.name
                    } else if (candidateData.candidate_name) {
                      name = candidateData.candidate_name
                    } else if (candidateData.full_name) {
                      name = candidateData.full_name
                    } else if (candidateData.personal_info && candidateData.personal_info.name) {
                      name = candidateData.personal_info.name
                    }
                    
                    // If name is still "Unknown" or empty, set it to "Unnamed Candidate"
                    if (!name || name === "Unknown" || name === "N/A") {
                      name = "Unnamed Candidate"
                    }
                    
                    if (candidateData.email) {
                      email = candidateData.email
                    } else if (candidateData.contact_email) {
                      email = candidateData.contact_email
                    } else if (candidateData.personal_info && candidateData.personal_info.email) {
                      email = candidateData.personal_info.email
                    }
                    
                    if (candidateData.phone) {
                      phone = candidateData.phone
                    } else if (candidateData.phone_number) {
                      phone = candidateData.phone_number
                    } else if (candidateData.contact_phone) {
                      phone = candidateData.contact_phone
                    } else if (candidateData.personal_info && candidateData.personal_info.phone) {
                      phone = candidateData.personal_info.phone
                    }
                    
                    const parsedId = parseInt(candidateAnalysis.id, 10)
                    return {
                      id: Number.isNaN(parsedId) ? index + 1 : parsedId,
                      name: name,
                      email: email,
                      phone: phone,
                      cv_filename: file.name,
                      created_at: new Date(
                        candidateAnalysis.created_at,
                      ).toLocaleDateString(),
                    }
                  } else {
                    // Return candidate with basic info even when analysis is not available
                    return {
                      id: index + 1,
                      name: "Unnamed Candidate",
                      email: "N/A",
                      phone: "N/A",
                      cv_filename: file.name,
                      created_at: "N/A",
                    }
                  }
                } catch (error) {
                  console.error(
                    `Failed to fetch analysis for ${file.name}`,
                    error,
                  )
                  // Return candidate with basic info even when analysis fails
                  return {
                    id: index + 1,
                    name: "Unnamed Candidate",
                    email: "N/A",
                    phone: "N/A",
                    cv_filename: file.name,
                    created_at: "N/A",
                  }
                }
              })
              const resolvedCandidates = await Promise.all(candidatePromises)
              setCandidates(resolvedCandidates)
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

      // Only load saved score analysis results if the job is in saved state (not editing)
      if (scoreAnalyses && scoreAnalyses.length > 0) {
        const savedScoreResults = scoreAnalyses.reduce((acc, scoreAnalysis) => {
          try {
            const scoreData = JSON.parse(scoreAnalysis.score_result)
            acc[scoreAnalysis.candidate_file_name] = scoreData
          } catch (e) {
            console.error("Error parsing saved score result:", e)
          }
          return acc
        }, {} as Record<string, AnalysisResult>)
        
        setAnalysisScoreResult(savedScoreResults)
        setAnalysisRun(true) // This will show the 'Score' buttons
      }
      
      setIsSaved(true)
    }
  }, [jobData, scoreAnalyses])

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
              const jobAnalysisResult = jobData.analysis_result ? JSON.parse(jobData.analysis_result) : {};
              const scoreData = {
                job: jobAnalysisResult,
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
    mutationFn: async (analysisResult: Record<string, AnalysisResult>) => {
      if (!jobId) {
        throw new Error("Job ID not found")
      }
      
      // Save each score analysis result to the new ScoreAnalysis table
      const savePromises = Object.entries(analysisResult).map(async ([fileName, scoreResult]) => {
        return ScoreService.saveScoreAnalysis({
          jobId: jobId,
          candidateFileName: fileName,
          scoreResult: scoreResult,
        })
      })
      
      await Promise.all(savePromises)
      return { success: true }
    },
    onSuccess: () => {
      showSuccessToast("Analysis saved successfully.")
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

      // Always fetch latest candidate data after mutation
      if (files.length > 0) {
        const fetchCandidates = async () => {
          const candidatePromises = files.map(async (file, index) => {
            try {
              const candidateAnalysis =
                await CandidateService.getCandidateAnalysisResult({
                  fileName: file.name,
                })
              if (candidateAnalysis && candidateAnalysis.analysis_result) {
                const candidateData = JSON.parse(
                  candidateAnalysis.analysis_result,
                )
                console.log(`Analysis data for ${file.name}:`, candidateData)
                
                // Try to extract candidate information from various possible structures
                let name = "Unknown"
                let email = "N/A"
                let phone = "N/A"
                
                // Check different possible locations for candidate info
                if (candidateData.name) {
                  name = candidateData.name
                } else if (candidateData.candidate_name) {
                  name = candidateData.candidate_name
                } else if (candidateData.full_name) {
                  name = candidateData.full_name
                } else if (candidateData.personal_info && candidateData.personal_info.name) {
                  name = candidateData.personal_info.name
                }
                
                // If name is still "Unknown" or empty, set it to "Unnamed Candidate"
                if (!name || name === "Unknown" || name === "N/A") {
                  name = "Unnamed Candidate"
                }
                
                if (candidateData.email) {
                  email = candidateData.email
                } else if (candidateData.contact_email) {
                  email = candidateData.contact_email
                } else if (candidateData.personal_info && candidateData.personal_info.email) {
                  email = candidateData.personal_info.email
                }
                
                if (candidateData.phone) {
                  phone = candidateData.phone
                } else if (candidateData.phone_number) {
                  phone = candidateData.phone_number
                } else if (candidateData.contact_phone) {
                  phone = candidateData.contact_phone
                } else if (candidateData.personal_info && candidateData.personal_info.phone) {
                  phone = candidateData.personal_info.phone
                }
                
                const parsedId = parseInt(candidateAnalysis.id, 10)
                return {
                  id: Number.isNaN(parsedId) ? index + 1 : parsedId,
                  name: name,
                  email: email,
                  phone: phone,
                  cv_filename: file.name,
                  created_at: new Date(
                    candidateAnalysis.created_at,
                  ).toLocaleDateString(),
                }
              } else {
                // Return candidate with basic info even when analysis is not available
                return {
                  id: index + 1,
                  name: "Unnamed Candidate",
                  email: "N/A",
                  phone: "N/A",
                  cv_filename: file.name,
                  created_at: "N/A",
                }
              }
            } catch (error) {
              console.error(
                `Failed to fetch analysis for ${file.name}`,
                error,
              )
              // Return candidate with basic info even when analysis fails
              return {
                id: index + 1,
                name: "Unnamed Candidate",
                email: "N/A",
                phone: "N/A",
                cv_filename: file.name,
                created_at: "N/A",
              }
            }
          })
          const resolvedCandidates = await Promise.all(candidatePromises)
          setCandidates(resolvedCandidates)
        }
        fetchCandidates()
      }

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
    setAnalysisScoreResult({}) // Clear score analysis results when editing
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

  // Sort candidates by score (high to low) after analysisScoreResult is set
  const sortedCandidates = React.useMemo(() => {
    if (analysisRun && Object.keys(analysisScoreResult).length > 0) {
      return [...candidates].sort((a, b) => {
        const scoreA = analysisScoreResult[a.cv_filename]?.score ?? -Infinity
        const scoreB = analysisScoreResult[b.cv_filename]?.score ?? -Infinity
        return (typeof scoreB === 'number' ? scoreB : parseFloat(scoreB)) - (typeof scoreA === 'number' ? scoreA : parseFloat(scoreA))
      })
    }
    return candidates
  }, [candidates, analysisRun, analysisScoreResult])

  // Filter and sort candidates by search and score
  const filteredCandidates = React.useMemo(() => {
    let list = sortedCandidates
    const { name, contact, cv, created, score, summary } = appliedCandidateSearch
    // Parse score operator and value
    let scoreOp = null, scoreVal = null
    if (score) {
      const match = score.match(/^([><=]?)(\d+(?:\.\d+)?)$/)
      if (match) {
        scoreOp = match[1] || '='
        scoreVal = parseFloat(match[2])
      }
    }
    if (
      name || contact || cv || created || score || summary
    ) {
      list = list.filter((candidate) => {
        const candidateContact = `${candidate.email} / ${candidate.phone}`.toLowerCase()
        const candidateCV = candidate.cv_filename.toLowerCase()
        const candidateCreated = candidate.created_at.toLowerCase()
        const candidateName = candidate.name.toLowerCase()
        const candidateScoreRaw = analysisScoreResult[candidate.cv_filename]?.score ?? ""
        const candidateScore = typeof candidateScoreRaw === 'number' ? candidateScoreRaw : parseFloat(candidateScoreRaw)
        const candidateSummary = (analysisScoreResult[candidate.cv_filename]?.summary_comment ?? "").toLowerCase()
        let scoreMatch = true
        if (scoreOp && scoreVal !== null && !isNaN(candidateScore)) {
          if (scoreOp === '>') scoreMatch = candidateScore > scoreVal
          else if (scoreOp === '<') scoreMatch = candidateScore < scoreVal
          else scoreMatch = candidateScore === scoreVal
        } else if (score) {
          // fallback: substring match
          scoreMatch = candidateScoreRaw.toString().toLowerCase().includes(score.toLowerCase())
        }
        return (
          (!name || candidateName.includes(name.toLowerCase())) &&
          (!contact || candidateContact.includes(contact.toLowerCase())) &&
          (!cv || candidateCV.includes(cv.toLowerCase())) &&
          (!created || candidateCreated.includes(created.toLowerCase())) &&
          scoreMatch &&
          (!summary || candidateSummary.includes(summary.toLowerCase()))
        )
      })
    }
    return list
  }, [appliedCandidateSearch, sortedCandidates, analysisScoreResult])

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={8} align="stretch">
        {/* Header with Title and All Buttons */}
        <HStack justify="space-between">
          <Heading size="lg">Edit Job Score</Heading>
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
                <Box w="100%">
                  <Suspense fallback={<div>Loading editor...</div>}>
                    <ReactQuill
                      theme="snow"
                      value={inputDescription}
                      onChange={setInputDescription}
                      style={{ width: '100%', minHeight: 120 }}
                    />
                  </Suspense>
                </Box>
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
                <Box w="100%" maxW="100%">
                  <style>{`
                    .job-desc-html img { max-width: 100%; }
                    .job-desc-html ul, .job-desc-html ol { padding-left: 1.5em; }
                  `}</style>
                  <div
                    className="job-desc-html"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(displayDescription) }}
                  />
                </Box>
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
          <HStack justify="space-between" align="center">
            <Heading size="md">Candidates</Heading>
            <HStack gap={2}>
              <Button size="sm" colorScheme="blue" onClick={() => setShowCandidateSearch((v) => !v)}>
                Search Candidate
              </Button>
              <Button
                size="sm"
                colorScheme="red"
                onClick={handleDeleteSelectedCandidates}
                disabled={selectedCandidateIds.length === 0}
              >
                Delete Selected ({selectedCandidateIds.length})
              </Button>
            </HStack>
          </HStack>
          {showCandidateSearch && (
            <Box mb={4} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
              <VStack gap={2} align="stretch">
                <HStack>
                  <Input
                    placeholder="Candidate Name"
                    value={candidateSearchFields.name}
                    onChange={e => setCandidateSearchFields(f => ({ ...f, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Contact (email/phone)"
                    value={candidateSearchFields.contact}
                    onChange={e => setCandidateSearchFields(f => ({ ...f, contact: e.target.value }))}
                  />
                  <Input
                    placeholder="CV"
                    value={candidateSearchFields.cv}
                    onChange={e => setCandidateSearchFields(f => ({ ...f, cv: e.target.value }))}
                  />
                </HStack>
                <HStack>
                  <Input
                    placeholder="Candidate Created Date"
                    value={candidateSearchFields.created}
                    onChange={e => setCandidateSearchFields(f => ({ ...f, created: e.target.value }))}
                  />
                  <Input
                    placeholder="Score"
                    value={candidateSearchFields.score}
                    onChange={e => setCandidateSearchFields(f => ({ ...f, score: e.target.value }))}
                  />
                  <Input
                    placeholder="Summary"
                    value={candidateSearchFields.summary}
                    onChange={e => setCandidateSearchFields(f => ({ ...f, summary: e.target.value }))}
                  />
                </HStack>
                <Button size="sm" colorScheme="teal" alignSelf="end" onClick={() => setAppliedCandidateSearch(candidateSearchFields)}>
                  Apply
                </Button>
              </VStack>
            </Box>
          )}
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
                <Input type="file" onChange={handleFileUpload} multiple aria-label="Upload candidate CVs" />
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
                    <Table.ColumnHeader>
                      <input
                        type="checkbox"
                        checked={filteredCandidates.length > 0 && selectedCandidateIds.length === filteredCandidates.length}
                        onChange={e => handleSelectAllCandidates(e.target.checked)}
                      />
                    </Table.ColumnHeader>
                    <Table.ColumnHeader>ID</Table.ColumnHeader>
                    <Table.ColumnHeader>Candidate Name</Table.ColumnHeader>
                    <Table.ColumnHeader w="120px">Contact (Email & Number)</Table.ColumnHeader>
                    <Table.ColumnHeader w="100px">CV</Table.ColumnHeader>
                    <Table.ColumnHeader>
                      Candidate Created Date
                    </Table.ColumnHeader>
                    {analysisRun && Object.keys(analysisScoreResult).length > 0 && (
                      <>
                        <Table.ColumnHeader>Score</Table.ColumnHeader>
                        <Table.ColumnHeader>Summary</Table.ColumnHeader>
                      </>
                    )}
                    <Table.ColumnHeader>Details</Table.ColumnHeader>
                    <Table.ColumnHeader>Delete</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredCandidates.map((candidate) => (
                    <Table.Row key={candidate.id}>
                      <Table.Cell>
                        <input
                          type="checkbox"
                          checked={selectedCandidateIds.includes(candidate.id)}
                          onChange={e => handleSelectCandidate(candidate.id, e.target.checked)}
                        />
                      </Table.Cell>
                      <Table.Cell>{candidate.id}</Table.Cell>
                      <Table.Cell>{candidate.name}</Table.Cell>
                      <Table.Cell>
                        <VStack align="start" gap={1} maxW="120px">
                          <Text fontSize="sm" whiteSpace="normal" wordBreak="break-all">
                            {candidate.email}
                          </Text>
                          <Text fontSize="sm" whiteSpace="normal" wordBreak="break-all">
                            {candidate.phone}
                          </Text>
                        </VStack>
                      </Table.Cell>
                      <Table.Cell>
                        <Text maxW="100px" whiteSpace="normal" wordBreak="break-all">
                          {candidate.cv_filename}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>{candidate.created_at}</Table.Cell>
                      {analysisRun && Object.keys(analysisScoreResult).length > 0 && (
                        <>
                          <Table.Cell>
                            {analysisScoreResult[candidate.cv_filename] ? (
                              <Text fontWeight="bold" color="blue.600">
                                {typeof analysisScoreResult[candidate.cv_filename].score === 'number' 
                                  ? analysisScoreResult[candidate.cv_filename].score.toFixed(1)
                                  : analysisScoreResult[candidate.cv_filename].score}
                              </Text>
                            ) : (
                              <Text color="gray.500">N/A</Text>
                            )}
                          </Table.Cell>
                          <Table.Cell>
                            {analysisScoreResult[candidate.cv_filename]?.summary_comment ? (
                              <Text fontSize="sm" whiteSpace="pre-wrap">
                                {analysisScoreResult[candidate.cv_filename].summary_comment}
                              </Text>
                            ) : (
                              <Text color="gray.500" fontSize="sm">N/A</Text>
                            )}
                          </Table.Cell>
                        </>
                      )}
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
                            Candidate
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
                      <Table.Cell>
                        <Button
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleDeleteSingleCandidate(candidate.id)}
                        >
                          Delete
                        </Button>
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

export const Route = createFileRoute("/_layout/job-editing")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      jobId: search.jobId as string | undefined,
    }
  },
  component: JobEditing,
})

export default JobEditing 