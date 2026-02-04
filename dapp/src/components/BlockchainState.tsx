import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  useColorModeValue,
  Divider,
  Progress,
  Code,
  Alert,
  AlertIcon,
  AlertDescription,
  Skeleton,
  Button,
} from "@chakra-ui/react";
import React, { useState, useEffect } from "react";

interface WalletInfo {
  address: string;
  balance: string;
  network: "mainnet" | "testnet";
  lastActivity?: string;
  isDemo?: boolean;
}

interface ContractInfo {
  address: string;
  type: string;
  state: "active" | "uninit" | "frozen";
  isDemo?: boolean;
}

interface Transaction {
  hash: string;
  type: "in" | "out";
  amount: string;
  status: "pending" | "confirmed" | "failed";
  timestamp: string;
  isDemo?: boolean;
}

interface BlockchainStateProps {
  sessionId?: string;
  wallet?: WalletInfo | null;
  transactions?: Transaction[];
  contracts?: ContractInfo[];
}

// Demo data - clearly marked
const DEMO_WALLET: WalletInfo = {
  address: "EQDemo...Address",
  balance: "1,234.56",
  network: "testnet",
  lastActivity: "Demo data",
  isDemo: true,
};

const DEMO_TRANSACTIONS: Transaction[] = [
  {
    hash: "demo-tx-001",
    type: "out",
    amount: "100 TON",
    status: "confirmed",
    timestamp: "Demo",
    isDemo: true,
  },
  {
    hash: "demo-tx-002",
    type: "in",
    amount: "523.4 USDT",
    status: "confirmed",
    timestamp: "Demo",
    isDemo: true,
  },
  {
    hash: "demo-tx-003",
    type: "out",
    amount: "50 TON",
    status: "pending",
    timestamp: "Demo",
    isDemo: true,
  },
];

const DEMO_CONTRACTS: ContractInfo[] = [
  { address: "EQDeDust...", type: "DEX Pool", state: "active", isDemo: true },
  { address: "EQSTON.fi...", type: "DEX Pool", state: "active", isDemo: true },
];

function WalletCard({ wallet, isLoading }: { wallet: WalletInfo | null; isLoading?: boolean }) {
  const bgColor = "rgba(30, 15, 25, 0.7)";
  const borderColor = "rgba(236, 72, 153, 0.2)";

  const shortenAddress = (addr: string) =>
    `${addr.slice(0, 8)}...${addr.slice(-6)}`;

  if (isLoading) {
    return (
      <Box bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={4}>
        <Skeleton height="20px" mb={3} />
        <Skeleton height="40px" mb={2} />
        <Skeleton height="20px" />
      </Box>
    );
  }

  if (!wallet) {
    return (
      <Box bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={4}>
        <Text color="gray.500" textAlign="center">No wallet connected</Text>
        <Text fontSize="sm" color="gray.400" textAlign="center" mt={2}>
          Use the MCP server to connect a wallet
        </Text>
      </Box>
    );
  }

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={wallet.isDemo ? "purple.200" : borderColor}
      borderRadius="lg"
      p={4}
    >
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="bold" color="pink.100">Wallet</Text>
        <HStack>
          {wallet.isDemo && (
            <Badge colorScheme="purple" variant="subtle">Demo</Badge>
          )}
          <Badge colorScheme={wallet.network === "mainnet" ? "blue" : "yellow"}>
            {wallet.network}
          </Badge>
        </HStack>
      </HStack>

      <VStack align="stretch" spacing={2}>
        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.500">
            Address
          </Text>
          <Code fontSize="sm">{shortenAddress(wallet.address)}</Code>
        </HStack>

        <Stat>
          <StatLabel>Balance</StatLabel>
          <StatNumber>{wallet.balance} TON</StatNumber>
          {wallet.lastActivity && (
            <StatHelpText>
              {wallet.isDemo ? (
                <Badge colorScheme="purple" variant="outline" size="sm">Demo Data</Badge>
              ) : (
                <>
                  <StatArrow type="increase" />
                  Last activity: {wallet.lastActivity}
                </>
              )}
            </StatHelpText>
          )}
        </Stat>
      </VStack>
    </Box>
  );
}

function TransactionList({ transactions, isLoading }: { transactions: Transaction[]; isLoading?: boolean }) {
  const bgColor = "rgba(30, 15, 25, 0.7)";
  const borderColor = "rgba(236, 72, 153, 0.2)";
  const itemBg = "rgba(20, 10, 15, 0.8)";

  const hasDemo = transactions.some(tx => tx.isDemo);

  if (isLoading) {
    return (
      <Box bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={4}>
        <Skeleton height="20px" mb={3} />
        <VStack spacing={2}>
          <Skeleton height="40px" />
          <Skeleton height="40px" />
          <Skeleton height="40px" />
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={hasDemo ? "purple.200" : borderColor}
      borderRadius="lg"
      p={4}
    >
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="bold" color="pink.100">Recent Transactions</Text>
        {hasDemo && <Badge colorScheme="purple" variant="subtle">Demo</Badge>}
      </HStack>

      {transactions.length === 0 ? (
        <Text color="gray.500" fontSize="sm">No transactions</Text>
      ) : (
        <VStack align="stretch" spacing={2}>
          {transactions.map((tx) => (
            <HStack
              key={tx.hash}
              justify="space-between"
              p={2}
              borderRadius="md"
              bg={itemBg}
              opacity={tx.isDemo ? 0.8 : 1}
            >
              <HStack>
                <Badge
                  colorScheme={tx.type === "in" ? "green" : "red"}
                  variant="subtle"
                >
                  {tx.type === "in" ? "↓ IN" : "↑ OUT"}
                </Badge>
                <Text fontSize="sm" color="gray.200">{tx.amount}</Text>
              </HStack>
              <HStack>
                <Badge
                  colorScheme={
                    tx.status === "confirmed"
                      ? "green"
                      : tx.status === "pending"
                      ? "yellow"
                      : "red"
                  }
                  variant="outline"
                >
                  {tx.status}
                </Badge>
                <Text fontSize="xs" color="gray.500">
                  {tx.timestamp}
                </Text>
              </HStack>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
}

function ContractStatus({ contracts, isLoading }: { contracts: ContractInfo[]; isLoading?: boolean }) {
  const bgColor = "rgba(30, 15, 25, 0.7)";
  const borderColor = "rgba(236, 72, 153, 0.2)";
  const itemBg = "rgba(20, 10, 15, 0.8)";

  const hasDemo = contracts.some(c => c.isDemo);

  const shortenAddress = (addr: string) =>
    `${addr.slice(0, 10)}...`;

  if (isLoading) {
    return (
      <Box bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={4}>
        <Skeleton height="20px" mb={3} />
        <VStack spacing={2}>
          <Skeleton height="40px" />
          <Skeleton height="40px" />
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={hasDemo ? "purple.200" : borderColor}
      borderRadius="lg"
      p={4}
    >
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="bold" color="pink.100">Monitored Contracts</Text>
        {hasDemo && <Badge colorScheme="purple" variant="subtle">Demo</Badge>}
      </HStack>

      {contracts.length === 0 ? (
        <Text color="gray.500" fontSize="sm">No contracts monitored</Text>
      ) : (
        <VStack align="stretch" spacing={2}>
          {contracts.map((contract) => (
            <HStack
              key={contract.address}
              justify="space-between"
              p={2}
              borderRadius="md"
              bg={itemBg}
              opacity={contract.isDemo ? 0.8 : 1}
            >
              <VStack align="start" spacing={0}>
                <Code fontSize="xs">{shortenAddress(contract.address)}</Code>
                <Text fontSize="sm" color="gray.400">
                  {contract.type}
                </Text>
              </VStack>
              <Badge
                colorScheme={
                  contract.state === "active"
                    ? "green"
                    : contract.state === "frozen"
                    ? "blue"
                    : "gray"
                }
              >
                {contract.state}
              </Badge>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
}

function NetworkHealth({ isDemo }: { isDemo?: boolean }) {
  const bgColor = "rgba(30, 15, 25, 0.7)";
  const borderColor = "rgba(236, 72, 153, 0.2)";

  // All values are simulated - no actual health checks implemented
  const statusBadge = isDemo ? (
    <Badge colorScheme="gray" variant="outline">Simulated</Badge>
  ) : (
    <Badge colorScheme="gray">Unknown</Badge>
  );

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={isDemo ? "orange.600" : borderColor}
      borderRadius="lg"
      p={4}
    >
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="bold" color="pink.100">Network Health</Text>
        <Badge colorScheme="orange" variant="subtle">No Live Data</Badge>
      </HStack>

      <VStack align="stretch" spacing={3}>
        <Box>
          <HStack justify="space-between" mb={1}>
            <Text fontSize="sm" color="gray.300">TON Network</Text>
            {statusBadge}
          </HStack>
          <Progress value={0} colorScheme="gray" size="sm" borderRadius="full" bg="gray.700" />
        </Box>

        <Box>
          <HStack justify="space-between" mb={1}>
            <Text fontSize="sm" color="gray.300">DeDust</Text>
            {statusBadge}
          </HStack>
          <Progress value={0} colorScheme="gray" size="sm" borderRadius="full" bg="gray.700" />
        </Box>

        <Box>
          <HStack justify="space-between" mb={1}>
            <Text fontSize="sm" color="gray.300">STON.fi</Text>
            {statusBadge}
          </HStack>
          <Progress value={0} colorScheme="gray" size="sm" borderRadius="full" bg="gray.700" />
        </Box>

        <Divider borderColor="gray.600" />

        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.500">
            Gas Price
          </Text>
          <Text fontSize="sm" color="gray.500">
            ---
          </Text>
        </HStack>

        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.500">
            Block Height
          </Text>
          <Text fontSize="sm" color="gray.500">
            ---
          </Text>
        </HStack>

        <Text fontSize="xs" color="gray.600" fontStyle="italic" mt={2}>
          Health monitoring not yet implemented
        </Text>
      </VStack>
    </Box>
  );
}

export function BlockchainState({
  sessionId,
  wallet: providedWallet,
  transactions: providedTransactions,
  contracts: providedContracts,
}: BlockchainStateProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [useDemoData, setUseDemoData] = useState(true);

  // Use provided data or fall back to demo data
  const wallet = providedWallet ?? (useDemoData ? DEMO_WALLET : null);
  const transactions = providedTransactions ?? (useDemoData ? DEMO_TRANSACTIONS : []);
  const contracts = providedContracts ?? (useDemoData ? DEMO_CONTRACTS : []);

  const isDemo = useDemoData && !providedWallet;

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Text fontWeight="bold" fontSize="lg" color="pink.200">
          Blockchain State
        </Text>
        {isDemo && (
          <Badge colorScheme="purple" variant="subtle">
            Demo Data
          </Badge>
        )}
      </HStack>

      {isDemo && (
        <Alert status="warning" mb={4} borderRadius="md" bg="rgba(236, 153, 72, 0.1)">
          <AlertIcon color="orange.400" />
          <AlertDescription fontSize="sm" color="gray.300">
            All data below is simulated. Real blockchain integration requires the MCP server with wallet tools.
          </AlertDescription>
        </Alert>
      )}

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
        <WalletCard wallet={wallet} isLoading={isLoading} />
        <NetworkHealth isDemo={isDemo} />
        <TransactionList transactions={transactions} isLoading={isLoading} />
        <ContractStatus contracts={contracts} isLoading={isLoading} />
      </SimpleGrid>
    </Box>
  );
}

export default BlockchainState;
