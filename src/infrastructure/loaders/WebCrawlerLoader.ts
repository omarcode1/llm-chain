import * as cheerio from 'cheerio';
import { Document } from '@langchain/core/documents';

/**
 * Simple web crawler that fetches a URL and extracts readable text via Cheerio.
 */
export class WebCrawlerLoader {
  constructor(private readonly url: string) {}

  /**
   * Fetches and parses the page body text into a LangChain Document.
   */
  async load(): Promise<Document[]> {
    const response = await fetch(this.url, {
      headers: { 'User-Agent': 'llmchain-pr-agent/1.0' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${this.url} (${response.status})`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    $('script, style, nav, footer').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();

    return [
      new Document({
        pageContent: text.slice(0, 20000),
        metadata: {
          source: 'web',
          url: this.url,
          type: 'parent',
          parentId: this.url,
        },
      }),
    ];
  }
}
