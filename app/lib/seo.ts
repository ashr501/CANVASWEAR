/** descriptionHtmlなどのHTMLからmeta descriptionを作る。タグを除去し155字程度に丸める。 */
export function stripHtml(html: string, maxLength = 155): string {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}
