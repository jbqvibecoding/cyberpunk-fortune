import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

/**
 * Wagmi + RainbowKit configuration
 *
 * SETUP: Replace the projectId below with your own WalletConnect Cloud project ID.
 *   1. Go to https://cloud.walletconnect.com/
 *   2. Create a project and copy the Project ID
 *   3. Paste it here
 *
 * For local development / demo you can use the placeholder below,
 * but production deployments MUST use a real project ID.
 */
export const WALLETCONNECT_PROJECT_ID =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID';

export const config = getDefaultConfig({
  appName: 'Pioneer',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [sepolia],
  ssr: false,
});
