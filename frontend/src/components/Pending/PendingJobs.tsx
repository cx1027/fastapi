import React from "react"
import { Skeleton, Table } from "@chakra-ui/react"

const PER_PAGE = 5

const PendingJobs = () => {
  return (
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
        {Array.from({ length: PER_PAGE }).map((_, index) => (
          <Table.Row key={index}>
            <Table.Cell>
              <Skeleton height="20px" />
            </Table.Cell>
            <Table.Cell>
              <Skeleton height="20px" />
            </Table.Cell>
            <Table.Cell>
              <Skeleton height="20px" />
            </Table.Cell>
            <Table.Cell>
              <Skeleton height="20px" width="40px" />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}

export default PendingJobs 