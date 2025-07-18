import React, { Suspense } from "react"
import { Box, VStack, Input, Button } from "@chakra-ui/react"

const ReactQuill = React.lazy(() => import("react-quill").then(mod => ({ default: mod.default as unknown as React.ComponentType<any> })));

interface FileItem {
  id: number
  name: string
  file?: File
}

interface JobEditFormProps {
  inputTitle: string
  setInputTitle: (v: string) => void
  inputDescription: string
  setInputDescription: (v: string) => void
  inputFiles: FileItem[]
  setInputFiles: (v: FileItem[]) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDeleteFile: (id: number) => void
  onSave: () => void
  isSaving: boolean
  isEdit?: boolean
}

const JobEditForm: React.FC<JobEditFormProps> = ({
  inputTitle,
  setInputTitle,
  inputDescription,
  setInputDescription,
  inputFiles,
  setInputFiles,
  onFileUpload,
  onDeleteFile,
  onSave,
  isSaving,
  isEdit = false,
}) => {
  return (
    <Box p={4} borderWidth="1px" borderRadius="md" bg="white" shadow="md">
      <VStack gap={4} align="stretch">
        <Input
          placeholder="Enter job title"
          value={inputTitle}
          onChange={e => setInputTitle(e.target.value)}
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
        <Input type="file" onChange={onFileUpload} multiple aria-label="Upload candidate CVs" />
        {inputFiles.length > 0 && (
          <Box>
            {inputFiles.map(file => (
              <Box key={file.id} display="flex" alignItems="center" justifyContent="space-between" py={1}>
                <span>{file.name}</span>
                <Button size="sm" colorScheme="red" onClick={() => onDeleteFile(file.id)}>
                  Delete
                </Button>
              </Box>
            ))}
          </Box>
        )}
        <Button colorScheme="blue" onClick={onSave} loading={isSaving} alignSelf="end">
          {isEdit ? 'Save Changes' : 'Save'}
        </Button>
      </VStack>
    </Box>
  )
}

export default JobEditForm 