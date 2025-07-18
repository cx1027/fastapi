import React, { useEffect, useState } from "react"
import { useNavigate, createFileRoute } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Container, Heading, Spinner, VStack, Text, Box } from "@chakra-ui/react"
import { JobsService, CandidateService, ScoreService } from "../../client"
import type { ApiError } from "../../client/core/ApiError"

interface CandidateData {
  id: number
  name: string
  email: string
  phone: string
  cv_filename: string
  created_at: string
}

interface AnalysisResult {
  [key: string]: any
}

export const Route = createFileRoute("/_layout/job-edit")({
  validateSearch: (search: Record<string, unknown>) => ({
    jobId: search.jobId as string,
  }),
  component: JobEditPage,
})

function JobEditPage() {
  const { jobId } = Route.useSearch();
  const [displayTitle, setDisplayTitle] = useState("");
  const [displayDescription, setDisplayDescription] = useState("");
  const [displayFiles, setDisplayFiles] = useState<{ id: number; name: string }[]>([]);
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [analysisScoreResult, setAnalysisScoreResult] = useState<Record<string, AnalysisResult>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        // Fetch job details
        const jobData = await JobsService.readJob({ id: jobId as string });
        setDisplayTitle(jobData.title);
        setDisplayDescription(jobData.description || "");
        let files: { id: number; name: string }[] = [];
        if (jobData.files) {
          try {
            const parsedFiles = JSON.parse(jobData.files);
            if (Array.isArray(parsedFiles)) {
              files = parsedFiles.map((file: string, index: number) => ({ id: index + 1, name: file }));
            } else if (typeof parsedFiles === "string") {
              files = [{ id: 1, name: parsedFiles }];
            }
          } catch {
            files = [{ id: 1, name: jobData.files }];
          }
        }
        setDisplayFiles(files);

        // Fetch candidates
        const candidatePromises = files.map(async (file, index) => {
          try {
            const candidateAnalysis = await CandidateService.getCandidateAnalysisResult({ fileName: file.name });
            if (candidateAnalysis && candidateAnalysis.analysis_result) {
              const candidateData = JSON.parse(candidateAnalysis.analysis_result);
              const parsedId = parseInt(candidateAnalysis.id, 10);
              return {
                id: Number.isNaN(parsedId) ? index + 1 : parsedId,
                name: candidateData.name || "N/A",
                email: candidateData.email || "N/A",
                phone: candidateData.phone || "N/A",
                cv_filename: file.name,
                created_at: new Date(candidateAnalysis.created_at).toLocaleDateString(),
              };
            }
          } catch (error) {
            // ignore
          }
          return null;
        });
        const resolvedCandidates = (await Promise.all(candidatePromises)).filter((c): c is CandidateData => c !== null);
        setCandidates(resolvedCandidates);

        // Fetch score analysis results
        const scoreAnalyses = await ScoreService.getScoreAnalysisByJob({ jobId: jobId as string });
        const savedScoreResults = (scoreAnalyses || []).reduce((acc: Record<string, AnalysisResult>, scoreAnalysis: any) => {
          try {
            const scoreData = JSON.parse(scoreAnalysis.score_result);
            acc[scoreAnalysis.candidate_file_name] = scoreData;
          } catch {}
          return acc;
        }, {});
        setAnalysisScoreResult(savedScoreResults);
      } finally {
        setIsLoading(false);
      }
    };
    if (jobId) fetchAll();
  }, [jobId]);

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={8} align="stretch">
        <Heading size="lg">Job Details</Heading>
        {/* Job Details Summary */}
        <Box p={4} borderWidth="1px" borderRadius="md" bg="white" shadow="md">
          <VStack align="start" gap={3}>
            <Text fontWeight="bold">{displayTitle}</Text>
            <Box w="100%" maxW="100%">
              <style>{`
                .job-desc-html img { max-width: 100%; }
                .job-desc-html ul, .job-desc-html ol { padding-left: 1.5em; }
              `}</style>
              <div
                className="job-desc-html"
                dangerouslySetInnerHTML={{ __html: displayDescription }}
              />
            </Box>
          </VStack>
        </Box>
        {/* Candidates Table */}
        <VStack align="stretch">
          <Heading size="md">Candidates</Heading>
          <Box p={4} borderWidth="1px" borderRadius="md" bg="white" shadow="md">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <caption>Candidate Scores</caption>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Candidate Name</th>
                  <th style={{ width: '120px' }}>Contact (Email & Number)</th>
                  <th style={{ width: '100px' }}>CV</th>
                  <th>Candidate Created Date</th>
                  <th>Score</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={candidate.id}>
                    <td>{candidate.id}</td>
                    <td>{candidate.name}</td>
                    <td>
                      <Text maxW="120px" whiteSpace="normal" wordBreak="break-all">
                        {candidate.email} / {candidate.phone}
                      </Text>
                    </td>
                    <td>
                      <Text maxW="100px" whiteSpace="normal" wordBreak="break-all">
                        {candidate.cv_filename}
                      </Text>
                    </td>
                    <td>{candidate.created_at}</td>
                    <td>
                      {analysisScoreResult[candidate.cv_filename] ? (
                        <Text fontWeight="bold" color="blue.600">
                          {typeof analysisScoreResult[candidate.cv_filename].score === 'number'
                            ? analysisScoreResult[candidate.cv_filename].score.toFixed(1)
                            : analysisScoreResult[candidate.cv_filename].score}
                        </Text>
                      ) : (
                        <Text color="gray.500">N/A</Text>
                      )}
                    </td>
                    <td>
                      {analysisScoreResult[candidate.cv_filename]?.summary_comment ? (
                        <Text fontSize="sm" whiteSpace="pre-wrap">
                          {analysisScoreResult[candidate.cv_filename].summary_comment}
                        </Text>
                      ) : (
                        <Text color="gray.500" fontSize="sm">N/A</Text>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </VStack>
      </VStack>
    </Container>
  );
}

export default JobEditPage 