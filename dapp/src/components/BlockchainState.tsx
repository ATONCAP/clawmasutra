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
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

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
        <Text fontWeight="bold">Wallet</Text>
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
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const itemBg = useColorModeValue("gray.50", "gray.900");

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
        <Text fontWeight="bold">Recent Transactions</Text>
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
                <Text fontSize="sm">{tx.amount}</Text>
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
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const itemBg = useColorModeValue("gray.50", "gray.900");

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
        <Text fontWeight="bold">Monitored Contracts</Text>
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
                <Text fontSize="sm" color="gray.600">
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
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={isDemo ? "purple.200" : borderColor}
      borderRadius="lg"
      p={4}
    >
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="bold">Network Health</Text>
        {isDemo && <Badge colorScheme="purple" variant="subtle">Demo</Badge>}
      </HStack>

      <VStack align="stretch" spacing={3}>
        <Box>
          <HStack justify="space-between" mb={1}>
            <Text fontSize="sm">TON Network</Text>
            <Badge colorScheme="green">Healthy</Badge>
          </HStack>
          <Progress value={95} colorScheme="green" size="sm" borderRadius="full" />
        </Box>

        <Box>
          <HStack justify="space-between" mb={1}>
            <Text fontSize="sm">DeDust</Text>
            <Badge colorScheme="green">Online</Badge>
          </HStack>
          <Progress value={100} colorScheme="green" size="sm" borderRadius="full" />
        </Box>

        <Box>
          <HStack justify="space-between" mb={1}>
            <Text fontSize="sm">STON.fi</Text>
            <Badge colorScheme="green">Online</Badge>
          </HStack>
          <Progress value={98} colorScheme="green" size="sm" borderRadius="full" />
        </Box>

        <Divider />

        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.500">
            Gas Price
          </Text>
          <Text fontSize="sm" fontWeight="bold">
            {isDemo ? "~0.05 TON" : "0.05 TON"}
          </Text>
        </HStack>

        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.500">
            Block Height
          </Text>
          <Text fontSize="sm" fontWeight="bold">
            {isDemo ? "#42,156,789" : "#---"}
          </Text>
        </HStack>
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
        <Text fontWeight="bold" fontSize="lg">
          Blockchain State
        </Text>
        {isDemo && (
          <Badge colorScheme="purple" variant="subtle">
            Demo Data
          </Badge>
        )}
      </HStack>

      {isDemo && (
        <Alert status="info" mb={4} borderRadius="md">
          <AlertIcon />
          <AlertDescription fontSize="sm">
            Showing demo data. Connect a wallet via MCP server for real blockchain state.
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
