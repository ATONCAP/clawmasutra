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
  useToast,
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

// Custom sultry dark theme for Clawmasutra
const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
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
    heading: "'Playfair Display', Georgia, serif",
    body: "Inter, system-ui, sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: "linear-gradient(180deg, #0d0d0d 0%, #1a0a14 50%, #0d0d0d 100%)",
        color: "gray.100",
        minHeight: "100vh",
      },
    },
  },
  components: {
    Card: {
      baseStyle: {
        container: {
          bg: "rgba(30, 15, 25, 0.8)",
          borderColor: "rgba(236, 72, 153, 0.2)",
          backdropFilter: "blur(10px)",
        },
      },
    },
    Tabs: {
      variants: {
        enclosed: {
          tab: {
            color: "gray.400",
            _selected: {
              color: "pink.300",
              bg: "rgba(236, 72, 153, 0.15)",
              borderColor: "pink.500",
              borderBottomColor: "transparent",
            },
            _hover: {
              color: "pink.200",
            },
          },
          tablist: {
            borderColor: "rgba(236, 72, 153, 0.3)",
          },
          tabpanel: {
            bg: "rgba(20, 10, 15, 0.6)",
            borderRadius: "lg",
            mt: -1,
            borderWidth: "1px",
            borderTopWidth: 0,
            borderColor: "rgba(236, 72, 153, 0.3)",
          },
        },
      },
    },
    Badge: {
      baseStyle: {
        textTransform: "lowercase",
        fontWeight: "medium",
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: "rgba(20, 10, 15, 0.95)",
          borderWidth: "1px",
          borderColor: "rgba(236, 72, 153, 0.3)",
        },
      },
    },
  },
});

function Header() {
  return (
    <Box
      bg="linear-gradient(135deg, rgba(139, 30, 63, 0.9) 0%, rgba(45, 15, 35, 0.95) 50%, rgba(20, 10, 25, 0.98) 100%)"
      color="white"
      py={8}
      px={8}
      borderRadius="xl"
      mb={6}
      borderWidth="1px"
      borderColor="rgba(236, 72, 153, 0.3)"
      boxShadow="0 4px 30px rgba(236, 72, 153, 0.15)"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bg: "radial-gradient(ellipse at top right, rgba(236, 72, 153, 0.1) 0%, transparent 50%)",
        pointerEvents: "none",
      }}
    >
      <Flex align="center" position="relative" zIndex={1}>
        <VStack align="start" spacing={2}>
          <Heading
            size="xl"
            fontFamily="'Playfair Display', Georgia, serif"
            fontWeight="600"
            letterSpacing="wide"
            bgGradient="linear(to-r, pink.200, pink.400, purple.300)"
            bgClip="text"
          >
            Clawmasutra
          </Heading>
          <Text opacity={0.7} fontStyle="italic" fontSize="md">
            Where agents learn to move together
          </Text>
        </VStack>
        <Spacer />
        <HStack spacing={4}>
          <Badge
            bg="rgba(236, 72, 153, 0.2)"
            color="pink.200"
            px={3}
            py={1}
            borderRadius="full"
            fontSize="sm"
            borderWidth="1px"
            borderColor="rgba(236, 72, 153, 0.4)"
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
  onInvoke,
}: {
  position: Position | null;
  isOpen: boolean;
  onClose: () => void;
  onInvoke: (position: Position) => void;
}) {
  if (!position) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(8px)" />
      <ModalContent
        bg="rgba(20, 10, 15, 0.95)"
        borderWidth="1px"
        borderColor="rgba(236, 72, 153, 0.3)"
        boxShadow="0 8px 40px rgba(236, 72, 153, 0.2)"
      >
        <ModalHeader>
          <HStack>
            <Text color="pink.100" fontFamily="'Playfair Display', Georgia, serif">
              {position.name}
            </Text>
            <Badge colorScheme="pink" variant="subtle">{position.category}</Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="gray.400" />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={4}>
            <Text color="gray.300">{position.description}</Text>
            <HStack>
              <Text fontWeight="bold" color="gray.400">Agents required:</Text>
              <Badge colorScheme="pink" variant="outline">{position.agents}</Badge>
            </HStack>
            <Button
              colorScheme="pink"
              bg="rgba(236, 72, 153, 0.3)"
              borderWidth="1px"
              borderColor="pink.500"
              _hover={{
                bg: "rgba(236, 72, 153, 0.5)",
              }}
              onClick={() => {
                onInvoke(position);
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
  const toast = useToast();

  const handlePositionSelect = (position: Position) => {
    setSelectedPosition(position);
    onOpen();
  };

  const handlePositionInvoke = (position: Position) => {
    // Generate a session ID
    const sessionId = `${position.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    setActiveSession(sessionId);
    toast({
      title: `Starting ${position.name}`,
      description: `Session ID: ${sessionId}`,
      status: "info",
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <ChakraProvider theme={theme}>
      <NetworkBadge />
      <Box
        minH="100vh"
        bg="transparent"
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
                    <Heading
                      size="lg"
                      mb={4}
                      fontFamily="'Playfair Display', Georgia, serif"
                      color="pink.200"
                    >
                      The Philosophy of Clawmasutra
                    </Heading>
                    <Text color="gray.400" fontSize="lg" lineHeight="tall">
                      Just as the Kama Sutra cataloged the art of human connection,
                      Clawmasutra catalogs the art of agent collaboration. Each
                      position represents not just a technical pattern, but a
                      philosophy of how autonomous agents can work together with
                      trust, elegance, and purpose.
                    </Text>
                  </Box>

                  <Box>
                    <Heading size="md" mb={3} color="pink.300">
                      Core Principles
                    </Heading>
                    <VStack align="stretch" spacing={4}>
                      <Box
                        p={4}
                        bg="rgba(30, 15, 25, 0.8)"
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="rgba(236, 72, 153, 0.2)"
                      >
                        <Heading size="sm" mb={2} color="pink.200">
                          Autonomy with Boundaries
                        </Heading>
                        <Text color="gray.400">
                          Each agent operates independently, yet within agreed-upon
                          protocols. Freedom within structure creates harmony.
                        </Text>
                      </Box>
                      <Box
                        p={4}
                        bg="rgba(30, 15, 25, 0.8)"
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="rgba(236, 72, 153, 0.2)"
                      >
                        <Heading size="sm" mb={2} color="pink.200">
                          Trust Through Verification
                        </Heading>
                        <Text color="gray.400">
                          The Mirror position teaches us that trust is built through
                          reflection. What one agent sees, another must confirm.
                        </Text>
                      </Box>
                      <Box
                        p={4}
                        bg="rgba(30, 15, 25, 0.8)"
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="rgba(236, 72, 153, 0.2)"
                      >
                        <Heading size="sm" mb={2} color="pink.200">
                          Communication as Intimacy
                        </Heading>
                        <Text color="gray.400">
                          Agent-to-agent messaging via sessions_send is not mere
                          data transfer — it is the foundation of all collaboration.
                        </Text>
                      </Box>
                      <Box
                        p={4}
                        bg="rgba(30, 15, 25, 0.8)"
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="rgba(236, 72, 153, 0.2)"
                      >
                        <Heading size="sm" mb={2} color="pink.200">
                          Graceful in Failure
                        </Heading>
                        <Text color="gray.400">
                          The Healing Arts remind us that failure is not the end.
                          Recovery and resilience are part of every mature system.
                        </Text>
                      </Box>
                    </VStack>
                  </Box>

                  <Box>
                    <Heading size="md" mb={3} color="pink.300">
                      The Metaphor
                    </Heading>
                    <Box
                      p={5}
                      bg="rgba(139, 30, 63, 0.2)"
                      borderRadius="md"
                      borderLeft="4px solid"
                      borderColor="pink.500"
                    >
                      <Text fontStyle="italic" color="pink.100" fontSize="lg">
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
        onInvoke={handlePositionInvoke}
      />
    </ChakraProvider>
  );
}

export default App;
