import {
  Box,
  ChakraProvider,
  Flex,
  Spacer,
  Container,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  HStack,
  Badge,
  extendTheme,
  VStack,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { ConnectButton } from "./components/ConnectButton";
import NetworkBadge from "./components/NetBadge";
import PositionGallery, { Position } from "./components/PositionGallery";
import AgentStream from "./components/AgentStream";
import BlockchainState from "./components/BlockchainState";

// Custom theme for Clawmasutra
const theme = extendTheme({
  colors: {
    brand: {
      50: "#fdf2f8",
      100: "#fce7f3",
      200: "#fbcfe8",
      300: "#f9a8d4",
      400: "#f472b6",
      500: "#ec4899",
      600: "#db2777",
      700: "#be185d",
      800: "#9d174d",
      900: "#831843",
    },
  },
  fonts: {
    heading: "Inter, system-ui, sans-serif",
    body: "Inter, system-ui, sans-serif",
  },
});

function Header() {
  return (
    <Box
      bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      color="white"
      py={6}
      px={8}
      borderRadius="lg"
      mb={6}
    >
      <Flex align="center">
        <VStack align="start" spacing={1}>
          <Heading size="xl">Clawmasutra</Heading>
          <Text opacity={0.9}>
            Agent-to-Agent MCP Collaboration with TON Blockchain
          </Text>
        </VStack>
        <Spacer />
        <HStack spacing={4}>
          <Badge
            colorScheme="whiteAlpha"
            px={3}
            py={1}
            borderRadius="full"
            fontSize="sm"
          >
            MCP-First
          </Badge>
          <ConnectButton />
        </HStack>
      </Flex>
    </Box>
  );
}

function PositionDetailModal({
  position,
  isOpen,
  onClose,
}: {
  position: Position | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!position) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Text>{position.name}</Text>
            <Badge colorScheme="purple">{position.category}</Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={4}>
            <Text>{position.description}</Text>
            <HStack>
              <Text fontWeight="bold">Agents required:</Text>
              <Badge>{position.agents}</Badge>
            </HStack>
            <Button
              colorScheme="purple"
              onClick={() => {
                // In production, this would invoke the position
                alert(`Invoking ${position.name}...`);
                onClose();
              }}
            >
              Start Position
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function App() {
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handlePositionSelect = (position: Position) => {
    setSelectedPosition(position);
    onOpen();
  };

  return (
    <ChakraProvider theme={theme}>
      <NetworkBadge />
      <Box
        minH="100vh"
        bg="gray.50"
        py={6}
        px={{ base: 4, md: 8 }}
      >
        <Container maxW="container.xl">
          <Header />

          <Tabs colorScheme="purple" variant="enclosed">
            <TabList>
              <Tab>Gallery</Tab>
              <Tab>
                Agent Stream
                {activeSession && (
                  <Badge ml={2} colorScheme="green" variant="subtle">
                    Live
                  </Badge>
                )}
              </Tab>
              <Tab>Blockchain</Tab>
              <Tab>Philosophy</Tab>
            </TabList>

            <TabPanels>
              {/* Gallery Tab */}
              <TabPanel>
                <PositionGallery onPositionSelect={handlePositionSelect} />
              </TabPanel>

              {/* Agent Stream Tab */}
              <TabPanel>
                <AgentStream sessionId={activeSession || undefined} />
              </TabPanel>

              {/* Blockchain Tab */}
              <TabPanel>
                <BlockchainState sessionId={activeSession || undefined} />
              </TabPanel>

              {/* Philosophy Tab */}
              <TabPanel>
                <VStack
                  spacing={8}
                  align="stretch"
                  maxW="800px"
                  mx="auto"
                  py={8}
                >
                  <Box>
                    <Heading size="lg" mb={4}>
                      The Philosophy of Clawmasutra
                    </Heading>
                    <Text color="gray.600" fontSize="lg" lineHeight="tall">
                      Just as the Kama Sutra cataloged the art of human connection,
                      Clawmasutra catalogs the art of agent collaboration. Each
                      position represents not just a technical pattern, but a
                      philosophy of how autonomous agents can work together with
                      trust, elegance, and purpose.
                    </Text>
                  </Box>

                  <Box>
                    <Heading size="md" mb={3}>
                      Core Principles
                    </Heading>
                    <VStack align="stretch" spacing={4}>
                      <Box p={4} bg="white" borderRadius="md" shadow="sm">
                        <Heading size="sm" mb={2}>
                          Autonomy with Boundaries
                        </Heading>
                        <Text color="gray.600">
                          Each agent operates independently, yet within agreed-upon
                          protocols. Freedom within structure creates harmony.
                        </Text>
                      </Box>
                      <Box p={4} bg="white" borderRadius="md" shadow="sm">
                        <Heading size="sm" mb={2}>
                          Trust Through Verification
                        </Heading>
                        <Text color="gray.600">
                          The Mirror position teaches us that trust is built through
                          reflection. What one agent sees, another must confirm.
                        </Text>
                      </Box>
                      <Box p={4} bg="white" borderRadius="md" shadow="sm">
                        <Heading size="sm" mb={2}>
                          Communication as Intimacy
                        </Heading>
                        <Text color="gray.600">
                          Agent-to-agent messaging via sessions_send is not mere
                          data transfer - it is the foundation of all collaboration.
                        </Text>
                      </Box>
                      <Box p={4} bg="white" borderRadius="md" shadow="sm">
                        <Heading size="sm" mb={2}>
                          Graceful in Failure
                        </Heading>
                        <Text color="gray.600">
                          The Healing Arts remind us that failure is not the end.
                          Recovery and resilience are part of every mature system.
                        </Text>
                      </Box>
                    </VStack>
                  </Box>

                  <Box>
                    <Heading size="md" mb={3}>
                      The Metaphor
                    </Heading>
                    <Box
                      p={4}
                      bg="purple.50"
                      borderRadius="md"
                      borderLeft="4px solid"
                      borderColor="purple.400"
                    >
                      <Text fontStyle="italic" color="purple.800">
                        "In the original text, positions bring partners together in
                        physical harmony. In Clawmasutra, positions bring agents
                        together in computational harmony. Both seek the same thing:
                        meaningful connection through structured interaction."
                      </Text>
                    </Box>
                  </Box>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Container>
      </Box>

      <PositionDetailModal
        position={selectedPosition}
        isOpen={isOpen}
        onClose={onClose}
      />
    </ChakraProvider>
  );
}

export default App;
