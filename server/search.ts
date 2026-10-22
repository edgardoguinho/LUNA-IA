// Módulo de Pesquisa Real na Web e YouTube para a Luna AI
// Utiliza feeds públicos oficiais, Wikipedia e YouTube sem necessidade de chaves pagas

export interface SearchResultItem {
  title: string;
  url: string;
  snippet?: string;
  source?: string;
  channel?: string;
  views?: string;
  published?: string;
  type: 'web' | 'youtube';
}

/**
 * Pesquisa notícias e artigos públicos na Web
 */
export async function searchWeb(query: string, maxResults = 5): Promise<SearchResultItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const results: SearchResultItem[] = [];

  // 1. Pesquisa de Notícias Reais e Atuais via Google News RSS PT-BR
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(cleanQuery)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(rssUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      const itemRegex =
        /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<source[^>]*>(.*?)<\/source>/g;
      let m: RegExpExecArray | null;
      while ((m = itemRegex.exec(text)) && results.length < maxResults) {
        const rawTitle = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'");
        const url = m[2].replace(/&amp;/g, '&').trim();
        const pubDate = m[3].trim();
        const sourceName = m[4].replace(/&amp;/g, '&').trim();

        results.push({
          title: rawTitle,
          url,
          snippet: `Publicado em: ${pubDate} por ${sourceName}`,
          source: sourceName,
          type: 'web',
        });
      }
    }
  } catch (err) {
    console.warn('[Luna Search] Falha ao consultar feed de notícias:', err);
  }

  // 2. Pesquisa Enciclopédica na Wikipédia PT para conceitos, história e tutoriais
  if (results.length < maxResults) {
    try {
      const wikiUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        cleanQuery
      )}&format=json&utf8=1`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(wikiUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        const searchItems = json?.query?.search || [];
        for (const item of searchItems) {
          if (results.length >= maxResults) break;
          const cleanSnippet = (item.snippet || '').replace(/<[^>]+>/g, '').trim();
          results.push({
            title: item.title,
            url: `https://pt.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, '_'))}`,
            snippet: cleanSnippet,
            source: 'Wikipédia',
            type: 'web',
          });
        }
      }
    } catch (wikiErr) {
      console.warn('[Luna Search] Falha ao consultar Wikipédia:', wikiErr);
    }
  }

  return results;
}

/**
 * Pesquisa vídeos reais no YouTube com títulos, canais, visualizações e links
 */
export async function searchYouTube(query: string, maxResults = 5): Promise<SearchResultItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const results: SearchResultItem[] = [];

  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQuery)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      const match =
        html.match(/var ytInitialData = ({.*?});<\/script>/s) ||
        html.match(/ytInitialData\s*=\s*({.+?});/);

      if (match) {
        const data = JSON.parse(match[1]);
        const contents =
          data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
            ?.contents?.[0]?.itemSectionRenderer?.contents || [];

        for (const item of contents) {
          if (results.length >= maxResults) break;
          const v = item.videoRenderer;
          if (v && v.videoId) {
            const title = v.title?.runs?.[0]?.text || '';
            const channel = v.ownerText?.runs?.[0]?.text || '';
            const views = v.viewCountText?.simpleText || '';
            const published = v.publishedTimeText?.simpleText || '';

            results.push({
              title,
              url: `https://www.youtube.com/watch?v=${v.videoId}`,
              snippet: `${channel} • ${views}${published ? ` • ${published}` : ''}`,
              channel,
              views,
              published,
              source: 'YouTube',
              type: 'youtube',
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Luna Search] Falha ao buscar no YouTube:', err);
  }

  return results;
}

/**
 * Executa pesquisa combinada (Web + YouTube se aplicável)
 */
export async function searchAll(
  query: string,
  preferredType: 'all' | 'web' | 'youtube' = 'all'
): Promise<SearchResultItem[]> {
  const isYouTubeIntent =
    preferredType === 'youtube' ||
    /(youtube|vídeo|videos|assistir|canal|playlist)/i.test(query);

  if (isYouTubeIntent) {
    const ytVideos = await searchYouTube(query, 5);
    if (ytVideos.length > 0 && preferredType === 'youtube') {
      return ytVideos;
    }
    const webDocs = await searchWeb(query, 3);
    return [...ytVideos, ...webDocs];
  }

  const webDocs = await searchWeb(query, 5);
  // Se houver poucos resultados web, complementa com vídeos do YouTube
  if (webDocs.length < 3) {
    const ytVideos = await searchYouTube(query, 3);
    return [...webDocs, ...ytVideos];
  }

  return webDocs;
}
