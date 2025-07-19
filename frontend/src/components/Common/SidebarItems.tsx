import { Box, Flex, Icon, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import { FiBriefcase, FiFileText, FiHome, FiSettings, FiUsers, FiClipboard, FiEdit } from "react-icons/fi"
import type { IconType } from "react-icons/lib"
import { useSearch } from "@tanstack/react-router"
import { useRouter } from "@tanstack/react-router"
import { useSyncExternalStore } from "react"

import type { UserPublic } from "@/client"

export const sidebarItems = [
  { icon: FiHome, title: "Dashboard", path: "/" },
  { icon: FiFileText, title: "Job List", path: "/job-list" },
  { icon: FiClipboard, title: "New Job Score", path: "/job-scoring" },
  { icon: FiEdit, title: "Edit Job Score", path: "/job-editing" },
  { icon: FiSettings, title: "User Settings", path: "/settings" },
]

interface SidebarItemsProps {
  onClose?: () => void
  compact?: boolean
}

interface Item {
  icon: IconType
  title: string
  path: string
}

const SidebarItems = ({ onClose, compact = false }: SidebarItemsProps) => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const router = useRouter()
  // Use useSyncExternalStore to subscribe to router state changes
  const currentPath = useSyncExternalStore(
    (cb) => router.subscribe(() => cb()),
    () => router.state.location.pathname,
    () => "/"
  )

  const finalItems: Item[] = currentUser?.is_superuser
    ? [...sidebarItems, { icon: FiUsers, title: "Admin", path: "/admin" }]
    : sidebarItems

  const listItems = finalItems.map(({ icon, title, path }) => {
    const isActive =
      path === "/"
        ? currentPath === "/"
        : currentPath === path || currentPath.startsWith(path + "/") || currentPath.startsWith(path + "?")
    return (
      <RouterLink key={title} to={path} onClick={onClose} style={{ display: 'block' }}>
        <Flex
          gap={compact ? 0 : 4}
          px={compact ? 0 : 4}
          py={2}
          justifyContent="center"
          _hover={{
            background: "gray.subtle",
          }}
          alignItems="center"
          fontSize="xl"
          flexDirection="column"
          bg={isActive ? "blue.100" : undefined}
          fontWeight={isActive ? "bold" : undefined}
        >
          <Icon as={icon} alignSelf="center" boxSize={6} />
          {!compact && <Text ml={2} fontSize="sm">{title}</Text>}
        </Flex>
      </RouterLink>
    )
  })

  return (
    <>
      {!compact && (
        <Text fontSize="xs" px={4} py={2} fontWeight="bold">
          Menu
        </Text>
      )}
      <Box key={currentPath}>{listItems}</Box>
    </>
  )
}

export default SidebarItems
