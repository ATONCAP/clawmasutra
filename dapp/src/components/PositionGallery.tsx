import {
  Box,
  Grid,
  Heading,
  Text,
  Badge,
  VStack,
  HStack,
  Icon,
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
  status: "available" | "running" | "completed";
}

const POSITIONS: Position[] = [
  // Solo
  { name: "The Contemplator", category: "solo", description: "Deep-dive into blockchain data", agents: 1, status: "available" },
  { name: "The Wanderer", category: "solo", description: "Explore for opportunities", agents: 1, status: "available" },
  // Duet
  { name: "The Mirror", category: "duet", description: "Mutual verification", agents: 2, status: "available" },
  { name: "The Relay", category: "duet", description: "Sequential handoff", agents: 2, status: "available" },
  { name: "The Dance", category: "duet", description: "Negotiation pattern", agents: 2, status: "available" },
  { name: "The Embrace", category: "duet", description: "Shared wallet custody", agents: 2, status: "available" },
  // Group
  { name: "The Circle", category: "group", description: "Round-robin consensus", agents: 3, status: "available" },
  { name: "The Pyramid", category: "group", description: "Hierarchical coordination", agents: 4, status: "available" },
  { name: "The Swarm", category: "group", description: "Parallel scanning", agents: 5, status: "available" },
  { name: "The Tantric", category: "group", description: "Deliberate consensus", agents: 3, status: "available" },
  // Crypto
  { name: "The Arbitrageur", category: "crypto", description: "Cross-DEX arbitrage", agents: 2, status: "available" },
  { name: "The Oracle Choir", category: "crypto", description: "Aggregated price feeds", agents: 3, status: "available" },
  { name: "The Liquidity Lotus", category: "crypto", description: "LP management", agents: 2, status: "available" },
  // Healing
  { name: "Pattern Doctor", category: "healing", description: "Diagnose broken patterns", agents: 1, status: "available" },
  { name: "Recovery", category: "healing", description: "Graceful failure handling", agents: 1, status: "available" },
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
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <Card
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      cursor="pointer"
      transition="all 0.2s"
      _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
      onClick={() => onSelect(position)}
    >
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <HStack>
            <Text fontSize="xl">{categoryEmoji[position.category]}</Text>
            <Heading size="sm">{position.name}</Heading>
          </HStack>
          <Badge colorScheme={categoryColors[position.category]}>
            {position.category}
          </Badge>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <Text fontSize="sm" color="gray.600" mb={2}>
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
                : "gray"
            }
            variant="subtle"
          >
            {position.status}
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
      <Heading size="lg" mb={6} textAlign="center">
        Position Gallery
      </Heading>
      <Text textAlign="center" color="gray.600" mb={8}>
        Select a position to observe agent collaboration in action
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
              <Heading size="md" textTransform="capitalize">
                {category} Positions
              </Heading>
              <Badge colorScheme={categoryColors[category]}>
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
