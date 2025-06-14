import React from "react"
import {
  Container,
  EmptyState,
  Flex,
  Grid,
  Heading,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiSearch } from "react-icons/fi"
import { z } from "zod"

import { JobsService } from "@/client"
import JobActionsMenu from "@/components/Common/JobActionsMenu"
import AddJob from "@/components/Jobs/AddJob"
import PendingJobs from "@/components/Pending/PendingJobs"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination"

const jobsSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 5

function getJobsQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      JobsService.readJobs({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["jobs", { page }],
  }
}

export const Route = createFileRoute("/_layout/jobs")({
  validateSearch: jobsSearchSchema,
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: ({ deps: { page } }) => getJobsQueryOptions({ page }),
  component: Jobs,
})

function Jobs() {
  const navigate = useNavigate()
  const { page } = Route.useSearch()
  const { data: jobsData, isLoading } = useQuery(Route.useLoaderData())

  const latestJob = jobsData?.data?.[jobsData.data.length - 1]

  const handlePageChange = (details: { page: number }) => {
    navigate({
      search: { page: details.page },
    })
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={8} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading size="lg">Jobs Management</Heading>
          <AddJob />
        </Flex>

        <Grid templateColumns="1fr 2fr" gap={8}>
          {/* Latest Job Details */}
          <VStack
            align="stretch"
            p={6}
            bg="white"
            borderRadius="lg"
            boxShadow="sm"
            borderWidth="1px"
            borderColor="gray.200"
          >
            <Heading size="md" mb={4}>
              Latest Job
            </Heading>
            {latestJob ? (
              <VStack align="stretch" gap={4}>
                <VStack align="start" gap={1}>
                  <Text fontWeight="medium" color="gray.600">
                    Title
                  </Text>
                  <Text>{latestJob.title}</Text>
                </VStack>
                <VStack align="start" gap={1}>
                  <Text fontWeight="medium" color="gray.600">
                    Description
                  </Text>
                  <Text>{latestJob.description || "No description"}</Text>
                </VStack>
              </VStack>
            ) : (
              <EmptyState.Root>
                <EmptyState.Content>
                  <EmptyState.Indicator>
                    <FiSearch />
                  </EmptyState.Indicator>
                  <VStack textAlign="center">
                    <EmptyState.Title>No jobs yet</EmptyState.Title>
                    <EmptyState.Description>
                      Add your first job to see it here.
                    </EmptyState.Description>
                  </VStack>
                </EmptyState.Content>
              </EmptyState.Root>
            )}
          </VStack>

          {/* Jobs List */}
          <VStack align="stretch" gap={4}>
            {isLoading ? (
              <PendingJobs />
            ) : jobsData?.data?.length ? (
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>ID</Table.ColumnHeader>
                    <Table.ColumnHeader>Title</Table.ColumnHeader>
                    <Table.ColumnHeader>Description</Table.ColumnHeader>
                    <Table.ColumnHeader>Actions</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {jobsData.data.map((job) => (
                    <Table.Row key={job.id}>
                      <Table.Cell>{job.id}</Table.Cell>
                      <Table.Cell>{job.title}</Table.Cell>
                      <Table.Cell>
                        {job.description || "No description"}
                      </Table.Cell>
                      <Table.Cell>
                        <JobActionsMenu
                          job={{
                            id: job.id,
                            title: job.title,
                            description: job.description || null,
                          }}
                        />
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            ) : (
              <EmptyState.Root>
                <EmptyState.Content>
                  <EmptyState.Indicator>
                    <FiSearch />
                  </EmptyState.Indicator>
                  <VStack textAlign="center">
                    <EmptyState.Title>No jobs found</EmptyState.Title>
                    <EmptyState.Description>
                      Add a job to get started.
                    </EmptyState.Description>
                  </VStack>
                </EmptyState.Content>
              </EmptyState.Root>
            )}

            {jobsData?.count ? (
              <PaginationRoot
                count={jobsData.count}
                pageSize={PER_PAGE}
                page={page}
                onPageChange={handlePageChange}
              >
                <Flex justify="space-between" align="center">
                  <PaginationItems />
                  <Flex gap={2}>
                    <PaginationPrevTrigger />
                    <PaginationNextTrigger />
                  </Flex>
                </Flex>
              </PaginationRoot>
            ) : null}
          </VStack>
        </Grid>
      </VStack>
    </Container>
  )
} 