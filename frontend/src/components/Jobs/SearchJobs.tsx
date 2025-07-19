import React, { useState, useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { FaSearch } from "react-icons/fa"
import { useNavigate, useSearch } from "@tanstack/react-router"

import { Button, Input, VStack } from "@chakra-ui/react"
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"

interface SearchForm {
  title?: string
  description?: string
  created_date?: string
}

interface SearchJobsProps {
  route?: string
}

const SearchJobs = ({ route = "/_layout/job-editing-list" }: SearchJobsProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate({ from: route })
  const search = useSearch({
    from: route,
  })
  const { page, title, description, created_date } = search

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<SearchForm>({
    defaultValues: {
      title: title || "",
      description: description || "",
      created_date: created_date || "",
    },
  })

  useEffect(() => {
    reset({
      title: title || "",
      description: description || "",
      created_date: created_date || "",
    })
  }, [isOpen, title, description, created_date, reset])

  const onSubmit: SubmitHandler<SearchForm> = (data) => {
    const searchData: Partial<SearchForm> = { ...data }

    if (searchData.created_date === "") {
      delete searchData.created_date
    }

    navigate({
      search: (prev: any) => ({ ...prev, ...searchData, page: 1 }),
    })
    setIsOpen(false)
  }

  const onClear = () => {
    navigate({
      search: (prev: any) => ({
        ...prev,
        title: undefined,
        description: undefined,
        created_date: undefined,
      }),
    })
    setIsOpen(false)
  }

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button>
          <FaSearch fontSize="16px" />
          Search
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Search Jobs</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <VStack gap={4}>
              <Field label="Job Title">
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="e.g. Software Engineer"
                  type="text"
                />
              </Field>

              <Field label="Job Description">
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="e.g. Python, React"
                  type="text"
                />
              </Field>

              <Field label="Job Created Date">
                <Input
                  id="created_date"
                  {...register("created_date")}
                  placeholder="YYYY-MM-DD"
                  type="date"
                />
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <Button
              variant="subtle"
              colorPalette="gray"
              onClick={onClear}
              disabled={isSubmitting}
            >
              Clear
            </Button>
            <Button
              variant="solid"
              type="submit"
              loading={isSubmitting}
            >
              Search
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default SearchJobs 