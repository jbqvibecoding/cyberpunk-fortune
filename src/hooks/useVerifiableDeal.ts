/**
 * useVerifiableDeal — drives on-chain commit-reveal on SimplePoker.
 *
 * Flow:
 *   idle → starting → started → committing → committed → revealing → revealed → ready
 *
 * The frontend should only render cards once `phase === 'ready'`,
 * using `record.dealSeed` (keccak256(clientSeed ‖ resultHash)) as the
 * deterministic shuffle seed. Anyone can call `getGameInfo(gameId)` on
 * Sepolia and recompute the same seed to verify the deal.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { keccak256, parseEther, encodePacked, type Hex } from 'viem';
import { CONTRACTS, ZERO_ADDRESS } from '@/lib/contracts/addresses';
import { SimplePokerABI } from '@/lib/contracts/SimplePokerABI';

export type DealPhase =
  | 'idle' | 'starting' | 'started'
  | 'committing' | 'committed'
  | 'revealing' | 'revealed'
  | 'ready' | 'error';

export interface VerifiableDealRecord {
  gameId: bigint | null;
  clientSeed: Hex | null;
  commitHash: Hex | null;
  resultHash: Hex | null;
  dealSeed: Hex | null;
  startTx: Hex | null;
  commitTx: Hex | null;
  revealTx: Hex | null;
  playerWonOnChain: boolean | null;
  handDescriptionOnChain: string | null;
}

const EMPTY: VerifiableDealRecord = {
  gameId: null, clientSeed: null, commitHash: null, resultHash: null, dealSeed: null,
  startTx: null, commitTx: null, revealTx: null,
  playerWonOnChain: null, handDescriptionOnChain: null,
};

function randomSeed(): Hex {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return ('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')) as Hex;
}

export function useVerifiableDeal() {
  const { address, isConnected, chain } = useAccount();
  const publicClient = usePublicClient();
  const isDeployed = CONTRACTS.SimplePoker !== ZERO_ADDRESS;
  const onSepolia = chain?.id === 11155111;
  const isAvailable = isConnected && isDeployed && onSepolia;

  const [phase, setPhase] = useState<DealPhase>('idle');
  const [record, setRecord] = useState<VerifiableDealRecord>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pendingTx, setPendingTx] = useState<Hex | undefined>();
  const stage = useRef<'start' | 'commit' | 'reveal' | null>(null);

  const { writeContractAsync } = useWriteContract();
  const { data: receipt, isSuccess: receiptSuccess } = useWaitForTransactionReceipt({
    hash: pendingTx,
    query: { enabled: !!pendingTx },
  });

  // Tx receipt → advance state machine
  useEffect(() => {
    if (!receipt || !receiptSuccess) return;
    const which = stage.current;
    if (which === 'start') {
      const log = receipt.logs.find(
        l => l.address.toLowerCase() === CONTRACTS.SimplePoker.toLowerCase()
      );
      let gameId: bigint | null = null;
      if (log && log.topics[1]) gameId = BigInt(log.topics[1]);
      setRecord(r => ({ ...r, gameId, startTx: receipt.transactionHash }));
      setPhase('started');
    } else if (which === 'commit') {
      setRecord(r => ({ ...r, commitTx: receipt.transactionHash }));
      setPhase('committed');
    } else if (which === 'reveal') {
      setRecord(r => ({ ...r, revealTx: receipt.transactionHash }));
      setPhase('revealed');
    }
    stage.current = null;
    setPendingTx(undefined);
  }, [receipt, receiptSuccess]);

  // After reveal → read on-chain result, derive dealSeed
  useEffect(() => {
    if (phase !== 'revealed' || !publicClient || !record.gameId || !record.clientSeed) return;
    let cancelled = false;
    (async () => {
      try {
        const info: any = await (publicClient as any).readContract({
          address: CONTRACTS.SimplePoker,
          abi: SimplePokerABI,
          functionName: 'getGameInfo',
          args: [record.gameId!],
        });
        const playerWon = info[4] as boolean;
        const handDescription = info[6] as string;
        const resultHash = info[7] as Hex;
        const dealSeed = keccak256(
          encodePacked(['bytes32', 'bytes32'], [record.clientSeed!, resultHash])
        );
        if (cancelled) return;
        setRecord(r => ({
          ...r,
          resultHash, dealSeed,
          playerWonOnChain: playerWon,
          handDescriptionOnChain: handDescription,
        }));
        setPhase('ready');
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.shortMessage ?? e?.message ?? '读取链上结果失败');
        setPhase('error');
      }
    })();
    return () => { cancelled = true; };
  }, [phase, publicClient, record.gameId, record.clientSeed]);

  // started → committing
  useEffect(() => {
    if (phase !== 'started') return;
    (async () => {
      try {
        const clientSeed = randomSeed();
        const commitHash = keccak256(encodePacked(['bytes32'], [clientSeed]));
        setRecord(r => ({ ...r, clientSeed, commitHash }));
        setPhase('committing');
        stage.current = 'commit';
        const tx = await (writeContractAsync as any)({
          address: CONTRACTS.SimplePoker,
          abi: SimplePokerABI,
          functionName: 'commitAction',
          args: [commitHash],
        });
        setPendingTx(tx);
      } catch (e: any) {
        stage.current = null;
        setError(e?.shortMessage ?? e?.message ?? '提交承诺失败');
        setPhase('error');
      }
    })();
  }, [phase, writeContractAsync]);

  // committed → revealing
  useEffect(() => {
    if (phase !== 'committed' || !record.clientSeed) return;
    (async () => {
      try {
        setPhase('revealing');
        stage.current = 'reveal';
        const tx = await (writeContractAsync as any)({
          address: CONTRACTS.SimplePoker,
          abi: SimplePokerABI,
          functionName: 'revealAction',
          args: [record.clientSeed!],
        });
        setPendingTx(tx);
      } catch (e: any) {
        stage.current = null;
        setError(e?.shortMessage ?? e?.message ?? '揭示失败');
        setPhase('error');
      }
    })();
  }, [phase, record.clientSeed, writeContractAsync]);

  const startDeal = useCallback(async (buyInEth: string = '0.001') => {
    if (!isAvailable || !address) {
      setError('请连接钱包并切换到 Sepolia 测试网');
      setPhase('error');
      return;
    }
    setError(null);
    setRecord(EMPTY);
    try {
      setPhase('starting');
      stage.current = 'start';
      const tx = await (writeContractAsync as any)({
        address: CONTRACTS.SimplePoker,
        abi: SimplePokerABI,
        functionName: 'startGame',
        value: parseEther(buyInEth),
      });
      setPendingTx(tx);
    } catch (e: any) {
      stage.current = null;
      setError(e?.shortMessage ?? e?.message ?? '启动牌局失败');
      setPhase('error');
    }
  }, [isAvailable, address, writeContractAsync]);

  const reset = useCallback(() => {
    setPhase('idle');
    setRecord(EMPTY);
    setError(null);
    setPendingTx(undefined);
    stage.current = null;
  }, []);

  return { phase, record, error, isAvailable, startDeal, reset };
}
