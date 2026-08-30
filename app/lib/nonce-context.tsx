import {createContext, useContext} from 'react';

/**
 * entry.server.tsx で生成したCSP nonceを、rootのApp/ErrorBoundaryまで
 * 届けるための最小限のContext。<Scripts nonce={...}> に渡さないと
 * インラインスクリプトがCSPでブロックされ、クライアント側が
 * ハイドレーションできなくなる（カート等の操作が固まる原因になる）。
 */
export const NonceContext = createContext<string>('');

export function useNonce() {
  return useContext(NonceContext);
}
