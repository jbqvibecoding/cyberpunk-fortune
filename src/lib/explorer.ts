/**
 * Chain-aware block explorer helpers.
 *
 * Reads the active wagmi chain's `blockExplorers.default.url` so links
 * automatically point to the right explorer (Etherscan, Polygonscan,
 * Basescan, Arbiscan, …) when the user switches networks.
 */
import { useAccount } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import type { Chain } from 'viem';

const FALLBACK_URL = sepolia.blockExplorers!.default.url;
const FALLBACK_NAME = sepolia.blockExplorers!.default.name;

export interface ExplorerInfo {
  baseUrl: string;
  name: string;
  chainName: string;
  tx: (hash?: string | null) => string | null;
  address: (addr?: string | null) => string | null;
  readContract: (addr: string) => string;
}

export function explorerFor(chain?: Chain): ExplorerInfo {
  const ex = chain?.blockExplorers?.default;
  const baseUrl = (ex?.url ?? FALLBACK_URL).replace(/\/+$/, '');
  const name = ex?.name ?? FALLBACK_NAME;
  const chainName = chain?.name ?? 'Sepolia';
  return {
    baseUrl,
    name,
    chainName,
    tx: (hash) => (hash ? `${baseUrl}/tx/${hash}` : null),
    address: (addr) => (addr ? `${baseUrl}/address/${addr}` : null),
    readContract: (addr) => `${baseUrl}/address/${addr}#readContract`,
  };
}

/** Hook variant that follows the currently connected chain. */
export function useExplorer(): ExplorerInfo {
  const { chain } = useAccount();
  return explorerFor(chain);
}
