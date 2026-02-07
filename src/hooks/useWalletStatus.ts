import { useAccount, useChainId } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { CONTRACTS } from '@/lib/contracts/addresses';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Shared hook that exposes wallet connection state + contract deployment status.
 * Components can use `isOnChain` to decide whether to call contracts or use simulation.
 */
export function useWalletStatus() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const isCorrectChain = chainId === sepolia.id;

  const isPowerballDeployed =
    CONTRACTS.CyberPowerball !== ZERO_ADDRESS &&
    CONTRACTS.CyberPowerball !== ('0x0000000000000000000000000000000000000000' as `0x${string}`);

  const isPokerDeployed =
    CONTRACTS.TexasHoldemAIDuel !== ZERO_ADDRESS &&
    CONTRACTS.TexasHoldemAIDuel !== ('0x0000000000000000000000000000000000000000' as `0x${string}`);

  return {
    address,
    isConnected,
    isCorrectChain,
    isPowerballDeployed,
    isPokerDeployed,
    /** True when wallet is connected on Sepolia AND Powerball contract is deployed */
    canUsePowerball: isConnected && isCorrectChain && isPowerballDeployed,
    /** True when wallet is connected on Sepolia AND Poker contract is deployed */
    canUsePoker: isConnected && isCorrectChain && isPokerDeployed,
  };
}
