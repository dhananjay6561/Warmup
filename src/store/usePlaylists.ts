import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface PlaylistVideo {
  id: string;             // videoId
  title: string;
  thumbnail?: string;
  channelTitle?: string;
  position: number;
  done: boolean;
  revisit: boolean;
}

export interface Playlist {
  id: string;            // playlistId
  url: string;           // original url
  title: string;
  createdAt: number;
  videos: Record<string, PlaylistVideo>;
  order: string[];       // ordered array of video ids
  fetching?: boolean;    // currently fetching (for incremental updates)
  error?: string;
  fetchedAt?: number;
}

interface PlaylistsState {
  playlists: Record<string, Playlist>;
  order: string[]; // playlist ordering
  addPlaylistByUrl: (url: string) => Promise<{ ok: boolean; error?: string }>; // extracts id and fetches data
  removePlaylist: (playlistId: string) => void;
  toggleVideoField: (playlistId: string, videoId: string, field: 'done' | 'revisit') => void;
  refetchPlaylist: (playlistId: string) => Promise<void>;
}

// Helpers
function extractPlaylistId(url: string): string | null {
  try {
    // Supports full URLs and direct IDs
    if (/^[A-Za-z0-9_-]{10,}$/.test(url) && !url.includes('http')) return url.trim();
    const u = new URL(url.trim());
    const list = u.searchParams.get('list');
    return list || null;
  } catch {
    return null;
  }
}

interface YTPlaylistItemsResponse {
  nextPageToken?: string;
  items: Array<{
    snippet: {
      title: string;
      playlistId: string;
      position: number;
      resourceId?: { videoId?: string };
      thumbnails?: Record<string, { url: string }>;
      channelTitle?: string;
    };
  }>;
}

async function fetchPlaylistMetadata(playlistId: string, apiKey: string): Promise<string | undefined> {
  try {
    const metaRes = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`);
    if (!metaRes.ok) return undefined;
    const data = await metaRes.json();
    return data?.items?.[0]?.snippet?.title as string | undefined;
  } catch {
    return undefined;
  }
}

function getApiKey(): string | undefined {
  // Expect user to set VITE_YT_API_KEY in .env (not exposed via UI)
  return (import.meta as any).env?.VITE_YT_API_KEY || undefined;
}

async function fetchAllPlaylistVideos(playlistId: string, apiKey: string | undefined, onBatch?: (videos: PlaylistVideo[]) => void): Promise<{ videos: PlaylistVideo[]; title?: string; error?: string }> {
  if (!apiKey) return { videos: [], error: 'API key required' };
  let pageToken: string | undefined = undefined;
  const all: PlaylistVideo[] = [];
  let title: string | undefined;
  try {
    // First fetch metadata in parallel (no need to wait for items)
    const titlePromise = fetchPlaylistMetadata(playlistId, apiKey).then(t => { title = t; });
    while (true) {
      const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('maxResults', '50');
      url.searchParams.set('playlistId', playlistId);
      url.searchParams.set('key', apiKey);
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const res = await fetch(url.toString());
      if (!res.ok) {
        const text = await res.text();
        return { videos: all, title, error: `Fetch failed: ${res.status} ${text}` };
      }
      const data: YTPlaylistItemsResponse = await res.json();
      const batch: PlaylistVideo[] = (data.items || []).map(it => {
        const vid = it.snippet.resourceId?.videoId || `${playlistId}-${it.snippet.position}`;
        return {
          id: vid,
            title: it.snippet.title,
            position: it.snippet.position,
            thumbnail: it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url,
            channelTitle: it.snippet.channelTitle,
            done: false,
            revisit: false,
        } as PlaylistVideo;
      });
      all.push(...batch);
      onBatch?.(batch);
      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    }
    await titlePromise;
    return { videos: all, title };
  } catch (e: any) {
    return { videos: all, title, error: e?.message || 'Unknown error' };
  }
}

export const usePlaylists = create<PlaylistsState>()(persist((set, get) => ({
  playlists: {},
  order: [],
  addPlaylistByUrl: async (url) => {
    const id = extractPlaylistId(url);
    if (!id) return { ok: false, error: 'Invalid playlist URL or ID' };
    const { playlists, order } = get();
    if (playlists[id]) return { ok: true }; // already exists
    // optimistic add
    set({ playlists: { ...playlists, [id]: { id, url, title: 'Loading...', createdAt: Date.now(), videos: {}, order: [], fetching: true } }, order: [...order, id] });
    const res = await fetchAllPlaylistVideos(id, getApiKey(), (batch) => {
      // incremental update
      set((s) => {
        const pl = s.playlists[id];
        if (!pl) return {} as any;
        const newVideos = { ...pl.videos };
        for (const v of batch) newVideos[v.id] = v;
        return { playlists: { ...s.playlists, [id]: { ...pl, videos: newVideos, order: [...pl.order, ...batch.map(b => b.id)] } } };
      });
    });
    set((s) => {
      const pl = s.playlists[id];
      if (!pl) return {} as any;
      return { playlists: { ...s.playlists, [id]: { ...pl, title: res.title || pl.title || 'Untitled Playlist', fetching: false, error: res.error, fetchedAt: Date.now() } } };
    });
    return { ok: !res.error, error: res.error };
  },
  removePlaylist: (playlistId) => set((s) => {
    const { [playlistId]: _, ...rest } = s.playlists;
    return { playlists: rest, order: s.order.filter(id => id !== playlistId) };
  }),
  toggleVideoField: (playlistId, videoId, field) => set((s) => {
    const pl = s.playlists[playlistId];
    if (!pl) return {} as any;
    const video = pl.videos[videoId];
    if (!video) return {} as any;
    return { playlists: { ...s.playlists, [playlistId]: { ...pl, videos: { ...pl.videos, [videoId]: { ...video, [field]: !video[field] } } } } };
  }),
  refetchPlaylist: async (playlistId) => {
    const { playlists } = get();
    const pl = playlists[playlistId];
    if (!pl) return;
    // reset
    set({ playlists: { ...playlists, [playlistId]: { ...pl, videos: {}, order: [], fetching: true, error: undefined } } });
    const res = await fetchAllPlaylistVideos(playlistId, getApiKey(), (batch) => {
      set((s) => {
        const cur = s.playlists[playlistId];
        if (!cur) return {} as any;
        const newVideos = { ...cur.videos };
        for (const v of batch) newVideos[v.id] = v;
        return { playlists: { ...s.playlists, [playlistId]: { ...cur, videos: newVideos, order: [...cur.order, ...batch.map(b => b.id)] } } };
      });
    });
    set((s) => {
      const cur = s.playlists[playlistId];
      if (!cur) return {} as any;
      return { playlists: { ...s.playlists, [playlistId]: { ...cur, fetching: false, error: res.error, title: res.title || cur.title, fetchedAt: Date.now() } } };
    });
  }
}), { name: 'playlist-storage-v1' }));
