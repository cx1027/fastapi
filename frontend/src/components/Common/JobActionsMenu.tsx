import React, { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"

import DeleteJob from "@/components/Jobs/DeleteJob"
import EditJob from "@/components/Jobs/EditJob"

interface JobActionsMenuProps {
  job: {
    id: string
    title: string
    description: string | null
  }
}

const JobActionsMenu = ({ job }: JobActionsMenuProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const queryClient = useQueryClient()

  const handleClose = () => {
    setIsEditOpen(false)
    setIsDeleteOpen(false)
  }

  return (
    <>
      <MenuRoot>
        <MenuTrigger asChild>
          <IconButton variant="ghost" color="inherit">
            <BsThreeDotsVertical />
          </IconButton>
        </MenuTrigger>
        <MenuContent>
          {isEditOpen ? (
            <EditJob
              jobId={job.id}
              initialData={{
                title: job.title,
                description: job.description,
              }}
              onClose={handleClose}
            />
          ) : (
            <IconButton
              variant="ghost"
              color="inherit"
              onClick={() => setIsEditOpen(true)}
            >
              Edit
            </IconButton>
          )}
          {isDeleteOpen ? (
            <DeleteJob jobId={job.id} onClose={handleClose} />
          ) : (
            <IconButton
              variant="ghost"
              color="inherit"
              onClick={() => setIsDeleteOpen(true)}
            >
              Delete
            </IconButton>
          )}
        </MenuContent>
      </MenuRoot>
    </>
  )
}

export default JobActionsMenu 