import {type ActionFunctionArgs} from 'react-router';
import {uploadPrintFile, UploadError} from '~/lib/r2.server';

/**
 * カスタムプリントの入稿ファイル受け口。
 * 商品ページのファイル選択から multipart/form-data で POST される。
 * 保存先URLを返し、そのURLをカートの明細属性として注文に紐づける。
 */
export async function action({request, context}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({error: '許可されていないメソッドです'}, {status: 405});
  }

  let file: unknown;
  try {
    const formData = await request.formData();
    file = formData.get('file');
  } catch {
    return Response.json({error: 'ファイルを読み取れませんでした'}, {status: 400});
  }

  if (!(file instanceof File)) {
    return Response.json({error: 'ファイルが選択されていません'}, {status: 400});
  }

  try {
    const result = await uploadPrintFile(context.env, file);
    return Response.json({
      url: result.url,
      fileName: result.fileName,
      size: result.size,
    });
  } catch (error) {
    if (error instanceof UploadError) {
      return Response.json({error: error.message}, {status: 400});
    }
    // eslint-disable-next-line no-console
    console.error(error);
    return Response.json({error: 'アップロードに失敗しました'}, {status: 500});
  }
}

// このルートは画面を持たない（POST専用）
export const loader = () => Response.json({error: 'Not found'}, {status: 404});
