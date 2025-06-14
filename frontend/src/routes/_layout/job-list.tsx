import React from "react"
import {
  Container,
  Heading,
  Table,
  VStack,
  Text,
  Flex,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiSearch } from "react-icons/fi"
import { z } from "zod"

import { JobsService } from "../../client"
import JobActionsMenu from "../../components/Common/JobActionsMenu"
import PendingJobs from "../../components/Pending/PendingJobs"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "../../components/ui/pagination"

const PER_PAGE = 5

const jobsSearchSchema = z.object({
  page: z.number().catch(1),
})

function getJobsQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      JobsService.readJobs({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["jobs", { page }],
  }
}

export const Route = createFileRoute("/_layout/job-list")({
  validateSearch: jobsSearchSchema,
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: ({ deps: { page } }) => getJobsQueryOptions({ page }),
  component: JobList,
})

function JobList() {
  const navigate = useNavigate()
  const { page } = Route.useSearch()
  const { data: jobsData, isLoading } = useQuery(Route.useLoaderData())

  const handlePageChange = (details: { page: number }) => {
    navigate({
      search: { page: details.page },
    })
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={8} align="stretch">
        <Heading size="lg">Job List</Heading>
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