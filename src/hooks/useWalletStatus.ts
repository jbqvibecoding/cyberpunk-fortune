import { useAccount, useChainId } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { CONTRACTS, ZERO_ADDRESS } from '@/lib/contracts/addresses';

/**
 * Shared hook that exposes wallet connection state + contract deployment status.
 * Components can use `isOnChain` to decide whether to call contracts or use simulation.
 */
export function useWalletStatus() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const isCorrectChain = chainId === sepolia.id;

  const isPowerballDeployed = CONTRACTS.SimpleLottery !== ZERO_ADDRESS;

  const isPokerDeployed = CONTRACTS.SimplePoker !== ZERO_ADDRESS;

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
