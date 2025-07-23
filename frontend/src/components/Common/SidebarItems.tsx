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
  // { icon: FiHome, title: "Dashboard", path: "/" },
  // Add a sublink for Dashboard that routes to the same page
  { icon: FiHome, title: "Dashboard", path: "/dashboard" },
  { icon: FiEdit, title: "Job History", path: "/job-editing-list" },
  // Always navigate to /job-scoring with no jobId for a new job score
  { icon: FiClipboard, title: "New Job Score", path: "/job-scoring" },
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
    // Highlight Job History for /job-editing-list and /job-editing
    let isActive = false;
    if (path === "/job-editing-list") {
      isActive = !!matchRoute({ to: "/job-editing-list", fuzzy: true }) || !!matchRoute({ to: "/job-editing", fuzzy: true });
    } else {
      isActive = !!matchRoute({ to: path, fuzzy: true });
    }
    if (path === "/job-scoring") {
      return (
        <Flex
          key={title}
          as="button"
          onClick={() => {
            router.navigate({ to: "/job-scoring", search: {} }) // force clear jobId
            if (onClose) onClose()
          }}
          gap={compact ? 0 : 4}
          px={compact ? 0 : 4}
          py={2}
          justifyContent="center"
          alignItems="center"
          fontSize="xl"
          flexDirection="column"
          bg={isActive ? "gray.100" : undefined}
          color={isActive ? "black" : undefined}
          _hover={{
            background: isActive ? "gray.100" : "gray.subtle",
          }}
          borderRadius="md"
        >
          <Icon as={icon} alignSelf="center" boxSize={6} />
          {!compact && (
            <Text ml={2} fontSize="sm" fontWeight={isActive ? "bold" : undefined}>
              {title}
            </Text>
          )}
        </Flex>
      )
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
          bg={isActive ? "gray.100" : undefined}
          color={isActive ? "black" : undefined}
          _hover={{
            background: isActive ? "gray.100" : "gray.subtle",
          }}
          borderRadius="md"
        >
          <Icon as={icon} alignSelf="center" boxSize={6} />
          {!compact && (
            <Text ml={2} fontSize="sm" fontWeight={isActive ? "bold" : undefined}>
              {title}
            </Text>
          )}
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
