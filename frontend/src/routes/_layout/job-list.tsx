import React, { useState, useEffect } from "react"
import {
  Container,
  Heading,
  Table,
  VStack,
  Text,
  Flex,
  Button,
} from "@chakra-ui/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiTrash, FiSearch } from "react-icons/fi"
import { z } from "zod"

import { JobsService } from "../../client"
import JobActionsMenu from "../../components/Common/JobActionsMenu"
import SearchJobs from "../../components/Jobs/SearchJobs"
import PendingJobs from "../../components/Pending/PendingJobs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "../../components/ui/pagination"
import useCustomToast from "@/hooks/useCustomToast"

const PER_PAGE = 5

const jobsSearchSchema = z.object({
  page: z.number().catch(1),
  title: z.string().optional(),
  description: z.string().optional(),
  created_date: z.string().optional(),
})

function getJobsQueryOptions({
  page,
  title,
  description,
  created_date,
}: {
  page: number
  title?: string
  description?: string
  created_date?: string
}) {
  return {
    queryFn: () =>
      JobsService.readJobs({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
        title,
        description,
        createdAt: created_date,
      }),
    queryKey: ["jobs", { page, title, description, created_date }],
  }
}

export const Route = createFileRoute("/_layout/job-list")({
  validateSearch: jobsSearchSchema,
  loaderDeps: ({ search: { page, title, description, created_date } }) => ({
    page,
    title,
    description,
    created_date,
  }),
  loader: ({ deps }) => getJobsQueryOptions(deps),
  component: JobList,
})

function JobList() {
  const navigate = useNavigate()
  const { page, title, description, created_date } = Route.useSearch()
  const { data: jobsData, isLoading } = useQuery(Route.useLoaderData())
  const [selectedJobs, setSelectedJobs] = useState<string[]>([])
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const handlePageChange = (details: { page: number }) => {
    navigate({
      search: { page: details.page },
    })
  }

  const deleteMutation = useMutation({
    mutationFn: async (jobIds: string[]) => {
      await Promise.all(
        jobIds.map((jobId) => JobsService.deleteJob({ id: jobId })),
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
      setSelectedJobs([])
      showSuccessToast("The selected jobs have been deleted.")
    },
    onError: (error) => {
      showErrorToast(error.message)
    },
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allJobIds = jobsData?.data?.map((job) => job.id) || []
      setSelectedJobs(allJobIds)
    } else {
      setSelectedJobs([])
    }
  }

  const handleSelectJob = (jobId: string, checked: boolean) => {
    setSelectedJobs((prev) =>
      checked
        ? [...prev, jobId]
        : prev.filter((id) => id !== jobId)
    )
  }

  useEffect(() => {
    setSelectedJobs([])
  }, [page])

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={8} align="stretch">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading size="lg">Job List</Heading>
          <Flex gap={2}>
            <SearchJobs />
            <Button
              colorScheme="red"
              onClick={() => deleteMutation.mutate(selectedJobs)}
              disabled={selectedJobs.length === 0 || deleteMutation.isPending}
              loading={deleteMutation.isPending}
            >
              <FiTrash />
              Delete Selected ({selectedJobs.length})
            </Button>
          </Flex>
        </Flex>
        <VStack align="stretch" gap={4}>
          {isLoading ? (
            <PendingJobs />
          ) : jobsData?.data?.length ? (
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>
                    <Checkbox
                      checked={
                        jobsData?.data?.length > 0 &&
                        selectedJobs.length === jobsData?.data?.length
                      }
                      onCheckedChange={({ checked }) => handleSelectAll(!!checked)}
                    />
                  </Table.ColumnHeader>
                  <Table.ColumnHeader>ID</Table.ColumnHeader>
                  <Table.ColumnHeader>Job Title</Table.ColumnHeader>
                  <Table.ColumnHeader>Job Description</Table.ColumnHeader>
                  <Table.ColumnHeader>Job Created Date</Table.ColumnHeader>
                  <Table.ColumnHeader>Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {jobsData.data.map((job) => (
                  <Table.Row key={job.id}>
                    <Table.Cell>
                      <Checkbox
                        checked={selectedJobs.includes(job.id)}
                        onCheckedChange={({ checked }) => handleSelectJob(job.id, !!checked)}
                      />
                    </Table.Cell>
                    <Table.Cell>{job.id}</Table.Cell>
                    <Table.Cell>{job.title}</Table.Cell>
                    <Table.Cell>
                      {job.description || "No description"}
                    </Table.Cell>
                    <Table.Cell>
                      {new Date(job.created_at).toLocaleDateString()}
                    </Table.Cell>
                    <Table.Cell>
                      <JobActionsMenu
                        job={{
                          id: job.id,
                          title: job.title,
                          description: job.description || null,
                          created_at: job.created_at,
                        }}
                      />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          ) : (
            <VStack align="center" py={10}>
              <FiSearch size={32} />
              <Text fontWeight="bold" fontSize="lg">No jobs found</Text>
              <Text color="gray.500">Add a job to get started.</Text>
            </VStack>
          )}

          {jobsData?.count ? (
            <Flex justifyContent="flex-end" mt={4}>
              <PaginationRoot
                count={jobsData.count}
                pageSize={PER_PAGE}
                page={page}
                onPageChange={handlePageChange}
              >
                <Flex>
                  <PaginationPrevTrigger />
                  <PaginationItems />
                  <PaginationNextTrigger />
                </Flex>
              </PaginationRoot>
            </Flex>
          ) : null}
        </VStack>
      </VStack>
    </Container>
  )
}

export default JobList 