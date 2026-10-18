import {createContext} from 'react-router';

/** Oxygenの環境変数（ローカルでは .env）をミドルウェア・ローダーに渡すためのコンテキスト */
export const envContext = createContext<Env>();
