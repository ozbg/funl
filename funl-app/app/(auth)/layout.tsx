import { Flex, Box } from '@/styled-system/jsx'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Flex minHeight="100vh" align="center" justify="center" bg="bg.muted">
      <Box w="full" maxW="md">
        {children}
      </Box>
    </Flex>
  )
}