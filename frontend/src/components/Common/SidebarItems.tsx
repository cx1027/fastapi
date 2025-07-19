import { Box, Flex, Icon, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink, useMatchRoute } from "@tanstack/react-router"
import { FiBriefcase, FiFileText, FiHome, FiSettings, FiUsers, FiClipboard, FiEdit } from "react-icons/fi"
import type { IconType } from "react-icons/lib"
import { useSearch } from "@tanstack/react-router"
import { useRouter } from "@tanstack/react-router"
import { useSyncExternalStore } from "react"

import type { UserPublic } from "@/client"

export const sidebarItems = [
  { icon: FiHome, title: "Dashboard", path: "/" },
  { icon: FiFileText, title: "Job History", path: "/job-list" },
  { icon: FiClipboard, title: "New Job Score", path: "/job-scoring" },
  { icon: FiEdit, title: "Edit Job Score", path: "/job-editing-list" },
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

  const finalItems: Item[] = currentUser?.is_superuser
    ? [...sidebarItems, { icon: FiUsers, title: "Admin", path: "/admin" }]
    : sidebarItems

    const matchRoute = useMatchRoute();

    const listItems = finalItems.map(({ icon, title, path }) => {
    // Highlight Job List for /job-list and /job-edit
    let isActive = false;
    if (path === "/job-list") {
    isActive = !!matchRoute({ to: "/job-list", fuzzy: true }) || !!matchRoute({ to: "/job-edit", fuzzy: true });
    } else {
    isActive = !!matchRoute({ to: path, fuzzy: true });
    }
    return (
      <RouterLink key={title} to={path} onClick={onClose} style={{ display: 'block' }}>
        <Flex
          gap={compact ? 0 : 4}
          px={compact ? 0 : 4}
          py={2}
          justifyContent="center"
          alignItems="center"
          fontSize="xl"
          flexDirection="column"
          bg={isActive ? "gray.700" : undefined}
          color={isActive ? "white" : undefined}
          _hover={{
            background: isActive ? "gray.700" : "gray.subtle",
          }}
          borderRadius="md"
        >
          <Icon as={icon} alignSelf="center" boxSize={6} />
          {!compact && <Text ml={2} fontSize="sm">{title}</Text>}
        </Flex>
      </RouterLink>
    );
  });

  return (
    <>
      {!compact && (
        <Text fontSize="xs" px={4} py={2} fontWeight="bold">
          Menu
        </Text>
      )}
      <Box>{listItems}</Box>
    </>
  )
}

export default SidebarItems
