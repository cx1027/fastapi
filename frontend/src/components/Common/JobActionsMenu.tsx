import React, { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import { useNavigate } from "@tanstack/react-router"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"

import DeleteJob from "@/components/Jobs/DeleteJob"

interface JobActionsMenuProps {
  job: {
    id: string
    title: string
    description: string | null
    created_at: string
  }
}

const JobActionsMenu = ({ job }: JobActionsMenuProps) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const handleClose = () => {
    setIsDeleteOpen(false)
  }

  const handleEdit = () => {
    navigate({
      to: "/job-editing",
      search: { jobId: job.id }
    })
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
          <IconButton
            variant="ghost"
            color="inherit"
            onClick={handleEdit}
          >
            View
          </IconButton>
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