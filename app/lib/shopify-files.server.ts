/**
 * カスタムプリント用の入稿ファイルをShopifyのファイル（コンテンツ→ファイル）に保存する。
 *
 * 当初はCloudflare R2に置く実装だったが、R2はアカウントで有効化されておらず
 * 入稿が一切できない状態だった。Shopifyのファイルなら新たな契約なしに使え、
 * 管理画面から入稿データをそのまま確認できる。
 *
 * Admin APIは client_credentials でトークンを取り、24時間ほど有効。
 * 同じisolate内では取り直さずに使い回す。
 */

/** 入稿を受け付けるファイル形式。昇華プリントの入稿を想定 */
const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
};

/** 1ファイルの上限。昇華プリントは高解像度データが多いので余裕を持たせる */
const MAX_BYTES = 20 * 1024 * 1024;

const API_VERSION = '2024-07';

export class UploadError extends Error {}

export interface UploadResult {
  url: string;
  fileName: string;
  size: number;
}

interface AdminConfig {
  shopDomain: string;
  clientId: string;
  clientSecret: string;
}

function getAdminConfig(env: Env): AdminConfig | null {
  const shopDomain = env.BRAND4_STORE_DOMAIN;
  const clientId = env.ALOLORE_ADMIN_CLIENT_ID;
  const clientSecret = env.ALOLORE_ADMIN_CLIENT_SECRET;
  if (!shopDomain || !clientId || !clientSecret) return null;
  return {shopDomain, clientId, clientSecret};
}

/** 取得したトークンの使い回し。失効の少し手前で取り直す。 */
let cachedToken: {value: string; expiresAt: number} | null = null;

async function getAdminToken(config: AdminConfig): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const response = await fetch(
    `https://${config.shopDomain}/admin/oauth/access_token`,
    {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'client_credentials',
      }),
    },
  );

  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error('admin token request failed', response.status);
    throw new UploadError(
      'アップロードに失敗しました。時間をおいて再度お試しください。',
    );
  }

  const data: any = await response.json();
  if (!data?.access_token) {
    throw new UploadError(
      'アップロードに失敗しました。時間をおいて再度お試しください。',
    );
  }

  // expires_in は秒。5分の余裕を持たせて使い回す。
  const ttl = Number(data.expires_in ?? 86400) * 1000;
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + Math.max(ttl - 5 * 60 * 1000, 60 * 1000),
  };
  return cachedToken.value;
}

async function adminGraphql(
  config: AdminConfig,
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<any> {
  const response = await fetch(
    `https://${config.shopDomain}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({query, variables}),
    },
  );

  const data: any = await response.json();
  if (!response.ok || data?.errors) {
    // eslint-disable-next-line no-console
    console.error('admin graphql failed', response.status, JSON.stringify(data?.errors));
    throw new UploadError(
      'アップロードに失敗しました。時間をおいて再度お試しください。',
    );
  }
  return data.data;
}

const STAGED_UPLOAD = `#graphql
  mutation StagedUpload($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets { url resourceUrl parameters { name value } }
      userErrors { message }
    }
  }
`;

const FILE_CREATE = `#graphql
  mutation FileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files { id fileStatus ... on MediaImage { image { url } } }
      userErrors { message }
    }
  }
`;

const FILE_STATUS = `#graphql
  query FileStatus($id: ID!) {
    node(id: $id) {
      ... on MediaImage { fileStatus image { url } }
    }
  }
`;

export async function uploadPrintFile(
  env: Env,
  file: File,
): Promise<UploadResult> {
  const config = getAdminConfig(env);
  if (!config) {
    throw new UploadError(
      'ファイルの保管先が未設定です。管理者にお問い合わせください。',
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

  const token = await getAdminToken(config);

  // 同名ファイルが上書きされないよう、保存名は一意にする
  const safeName = file.name.replace(/[^\w.\-]/g, '_').slice(-60);
  const storedName = `print-${crypto.randomUUID()}-${safeName || `data.${extension}`}`;

  const staged = await adminGraphql(config, token, STAGED_UPLOAD, {
    input: [
      {
        filename: storedName,
        mimeType: file.type,
        resource: 'FILE',
        fileSize: String(file.size),
        httpMethod: 'POST',
      },
    ],
  });

  const stagedErrors = staged?.stagedUploadsCreate?.userErrors ?? [];
  if (stagedErrors.length) {
    // eslint-disable-next-line no-console
    console.error('stagedUploadsCreate failed', JSON.stringify(stagedErrors));
    throw new UploadError(
      'アップロードに失敗しました。時間をおいて再度お試しください。',
    );
  }

  const target = staged.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const {name, value} of target.parameters) {
    form.append(name, value);
  }
  form.append('file', file, storedName);

  const putResponse = await fetch(target.url, {method: 'POST', body: form});
  if (!putResponse.ok) {
    // eslint-disable-next-line no-console
    console.error('staged upload PUT failed', putResponse.status);
    throw new UploadError(
      'アップロードに失敗しました。時間をおいて再度お試しください。',
    );
  }

  const created = await adminGraphql(config, token, FILE_CREATE, {
    files: [
      {
        originalSource: target.resourceUrl,
        contentType: 'IMAGE',
        alt: `入稿データ: ${file.name}`,
      },
    ],
  });

  const createErrors = created?.fileCreate?.userErrors ?? [];
  if (createErrors.length) {
    // eslint-disable-next-line no-console
    console.error('fileCreate failed', JSON.stringify(createErrors));
    throw new UploadError(
      'アップロードに失敗しました。時間をおいて再度お試しください。',
    );
  }

  const created0 = created.fileCreate.files[0];
  let url: string | undefined = created0?.image?.url;

  // Shopifyは画像を非同期で処理する。URLが返るまで少しだけ待つ。
  if (!url) {
    for (let i = 0; i < 8; i++) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const status = await adminGraphql(config, token, FILE_STATUS, {
        id: created0.id,
      });
      url = status?.node?.image?.url;
      if (url) break;
    }
  }

  if (!url) {
    // ここまで来たらファイル自体は保存できている。注文に紐づけられないと
    // 製作できないので、失敗として扱い入稿し直してもらう。
    // eslint-disable-next-line no-console
    console.error('file processed but url not ready', created0?.id);
    throw new UploadError(
      'アップロードに時間がかかっています。もう一度お試しください。',
    );
  }

  return {url, fileName: file.name, size: file.size};
}
