import {
  Box,
  Grid,
  Heading,
  Text,
  Badge,
  HStack,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
} from "@chakra-ui/react";
import React from "react";

interface Position {
  name: string;
  category: "solo" | "duet" | "group" | "crypto" | "healing";
  description: string;
  agents: number;
  status: "demo" | "running" | "completed";
}

const POSITIONS: Position[] = [
  // Solo
  { name: "The Contemplator", category: "solo", description: "Deep-dive into blockchain data", agents: 1, status: "demo" },
  { name: "The Wanderer", category: "solo", description: "Explore for opportunities", agents: 1, status: "demo" },
  // Duet
  { name: "The Mirror", category: "duet", description: "Mutual verification", agents: 2, status: "demo" },
  { name: "The Relay", category: "duet", description: "Sequential handoff", agents: 2, status: "demo" },
  { name: "The Dance", category: "duet", description: "Negotiation pattern", agents: 2, status: "demo" },
  { name: "The Embrace", category: "duet", description: "Shared wallet custody", agents: 2, status: "demo" },
  // Group
  { name: "The Circle", category: "group", description: "Round-robin consensus", agents: 3, status: "demo" },
  { name: "The Pyramid", category: "group", description: "Hierarchical coordination", agents: 4, status: "demo" },
  { name: "The Swarm", category: "group", description: "Parallel scanning", agents: 5, status: "demo" },
  { name: "The Tantric", category: "group", description: "Deliberate consensus", agents: 3, status: "demo" },
  // Crypto
  { name: "The Arbitrageur", category: "crypto", description: "Cross-DEX arbitrage", agents: 2, status: "demo" },
  { name: "The Oracle Choir", category: "crypto", description: "Aggregated price feeds", agents: 3, status: "demo" },
  { name: "The Liquidity Lotus", category: "crypto", description: "LP management", agents: 2, status: "demo" },
  { name: "The DAO Dance", category: "crypto", description: "Coordinated governance", agents: 3, status: "demo" },
  // Healing
  { name: "Pattern Doctor", category: "healing", description: "Diagnose broken patterns", agents: 1, status: "demo" },
  { name: "Recovery", category: "healing", description: "Graceful failure handling", agents: 1, status: "demo" },
];

const categoryColors: Record<string, string> = {
  solo: "purple",
  duet: "pink",
  group: "blue",
  crypto: "green",
  healing: "orange",
};

const categoryEmoji: Record<string, string> = {
  solo: "🧘",
  duet: "💃",
  group: "🎭",
  crypto: "💎",
  healing: "🏥",
};

interface PositionCardProps {
  position: Position;
  onSelect: (position: Position) => void;
}

function PositionCard({ position, onSelect }: PositionCardProps) {
  return (
    <Card
      bg="rgba(30, 15, 25, 0.7)"
      borderWidth="1px"
      borderColor="rgba(236, 72, 153, 0.2)"
      borderRadius="xl"
      cursor="pointer"
      transition="all 0.3s ease"
      backdropFilter="blur(10px)"
      _hover={{
        transform: "translateY(-4px)",
        boxShadow: "0 8px 30px rgba(236, 72, 153, 0.2)",
        borderColor: "rgba(236, 72, 153, 0.5)",
        bg: "rgba(40, 20, 35, 0.8)",
      }}
      onClick={() => onSelect(position)}
    >
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <HStack>
            <Text fontSize="xl">{categoryEmoji[position.category]}</Text>
            <Heading size="sm" color="pink.100" fontWeight="500">
              {position.name}
            </Heading>
          </HStack>
          <Badge
            colorScheme={categoryColors[position.category]}
            variant="subtle"
            fontSize="xs"
          >
            {position.category}
          </Badge>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <Text fontSize="sm" color="gray.400" mb={2}>
          {position.description}
        </Text>
        <HStack justify="space-between">
          <Text fontSize="xs" color="gray.500">
            {position.agents} agent{position.agents > 1 ? "s" : ""}
          </Text>
          <Badge
            colorScheme={
              position.status === "running"
                ? "green"
                : position.status === "completed"
                ? "blue"
                : "orange"
            }
            variant="outline"
            fontSize="xs"
          >
            {position.status === "demo" ? "demo only" : position.status}
          </Badge>
        </HStack>
      </CardBody>
    </Card>
  );
}

interface PositionGalleryProps {
  onPositionSelect: (position: Position) => void;
  filter?: string;
}

export function PositionGallery({ onPositionSelect, filter }: PositionGalleryProps) {
  const filteredPositions = filter
    ? POSITIONS.filter((p) => p.category === filter)
    : POSITIONS;

  const categories = ["solo", "duet", "group", "crypto", "healing"];

  return (
    <Box>
      <Heading
        size="lg"
        mb={4}
        textAlign="center"
        fontFamily="'Playfair Display', Georgia, serif"
        color="pink.200"
      >
        Position Gallery
      </Heading>
      <Text textAlign="center" color="gray.500" mb={8} fontStyle="italic">
        Agent collaboration patterns (demo mode - real execution not yet implemented)
      </Text>

      {categories.map((category) => {
        const categoryPositions = filteredPositions.filter(
          (p) => p.category === category
        );
        if (categoryPositions.length === 0) return null;

        return (
          <Box key={category} mb={8}>
            <HStack mb={4}>
              <Text fontSize="2xl">{categoryEmoji[category]}</Text>
              <Heading size="md" textTransform="capitalize" color="gray.200">
                {category} Positions
              </Heading>
              <Badge colorScheme={categoryColors[category]} variant="subtle">
                {categoryPositions.length}
              </Badge>
            </HStack>
            <Grid
              templateColumns={{
                base: "1fr",
                md: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              }}
              gap={4}
            >
              {categoryPositions.map((position) => (
                <PositionCard
                  key={position.name}
                  position={position}
                  onSelect={onPositionSelect}
                />
              ))}
            </Grid>
          </Box>
        );
      })}
    </Box>
  );
}

export default PositionGallery;
export type { Position };
