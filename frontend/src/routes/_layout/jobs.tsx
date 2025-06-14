import React from "react"
import {
  Container,
  EmptyState,
  Flex,
  Heading,
  Table,
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
  component: Jobs,
  validateSearch: (search) => jobsSearchSchema.parse(search),
})

function JobsTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getJobsQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const setPage = (page: number) =>
    navigate({
      search: (prev: { [key: string]: string }) => ({ ...prev, page }),
    })

  const jobs = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return <PendingJobs />
  }

  if (jobs.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiSearch />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>You don't have any jobs yet</EmptyState.Title>
            <EmptyState.Description>
              Add a new job to get started
            </EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  return (
    <>
      <Table.Root size={{ base: "sm", md: "md" }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader w="sm">ID</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Title</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Description</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {jobs?.map((job) => (
            <Table.Row key={job.id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Table.Cell truncate maxW="sm">
                {job.id}
              </Table.Cell>
              <Table.Cell truncate maxW="sm">
                {job.title}
              </Table.Cell>
              <Table.Cell
                color={!job.description ? "gray" : "inherit"}
                truncate
                maxW="30%"
              >
                {job.description || "N/A"}
              </Table.Cell>
              <Table.Cell>
                <JobActionsMenu
                  job={{
                    id: Number(job.id),
                    title: job.title,
                    description: job.description || null,
                  }}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <Flex justifyContent="flex-end" mt={4}>
        <PaginationRoot
          count={count}
          pageSize={PER_PAGE}
          onPageChange={({ page }) => setPage(page)}
        >
          <Flex>
            <PaginationPrevTrigger />
            <PaginationItems />
            <PaginationNextTrigger />
          </Flex>
        </PaginationRoot>
      </Flex>
    </>
  )
}

function Jobs() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Jobs Management
      </Heading>
      <AddJob />
      <JobsTable />
    </Container>
  )
} 