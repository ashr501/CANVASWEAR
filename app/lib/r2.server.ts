import {AwsClient} from 'aws4fetch';

/**
 * カスタムプリント用の入稿ファイルをCloudflare R2に保存する。
 *
 * OxygenもVercelもR2のバインディングは使えないため、R2のS3互換APIを
 * SigV4署名付きで直接呼ぶ（aws4fetchはWorkersランタイムでも動く）。
 */

/** 入稿を受け付けるファイル形式。昇華プリントの入稿を想定 */
const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
};

/** 1ファイルの上限。昇華プリントは高解像度データが多いので余裕を持たせる */
const MAX_BYTES = 20 * 1024 * 1024;

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** 公開読み取り用のベースURL（r2.devのサブドメイン、または独自ドメイン） */
  publicBaseUrl: string;
}

export function getR2Config(env: Env): R2Config | null {
  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET,
    R2_PUBLIC_BASE_URL,
  } = env;

  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET ||
    !R2_PUBLIC_BASE_URL
  ) {
    return null;
  }

  return {
    accountId: R2_ACCOUNT_ID,
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    bucket: R2_BUCKET,
    publicBaseUrl: R2_PUBLIC_BASE_URL.replace(/\/+$/, ''),
  };
}

export class UploadError extends Error {}

export interface UploadResult {
  url: string;
  key: string;
  fileName: string;
  size: number;
}

export async function uploadPrintFile(
  env: Env,
  file: File,
  prefix = 'print',
): Promise<UploadResult> {
  const config = getR2Config(env);
  if (!config) {
    throw new UploadError(
      'ファイルの保管先（R2）が未設定です。管理者にお問い合わせください。',
    );
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    throw new UploadError(
      'この形式のファイルは受け付けていません（PNG / JPEG）。',
    );
  }

  if (file.size === 0) {
    throw new UploadError('ファイルが空です。');
  }

  if (file.size > MAX_BYTES) {
    throw new UploadError(
      `ファイルサイズが大きすぎます（上限 ${MAX_BYTES / 1024 / 1024}MB）。`,
    );
  }

  const key = `${prefix}/${crypto.randomUUID()}.${extension}`;

  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: 's3',
    region: 'auto',
  });

  // SigV4はボディのハッシュを必要とするため、ストリームではなく実体を渡す
  const body = await file.arrayBuffer();

  const response = await client.fetch(
    `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`,
    {
      method: 'PUT',
      body,
      headers: {
        'content-type': file.type,
        'content-length': String(file.size),
      },
    },
  );

  if (!response.ok) {
    // R2からの詳細はそのまま出さず、ログにだけ残す
    // eslint-disable-next-line no-console
    console.error('R2 upload failed', response.status, await response.text());
    throw new UploadError(
      'アップロードに失敗しました。時間をおいて再度お試しください。',
    );
  }

  return {
    url: `${config.publicBaseUrl}/${key}`,
    key,
    fileName: file.name,
    size: file.size,
  };
}
