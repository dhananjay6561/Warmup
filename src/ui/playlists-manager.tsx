import React, { useState } from 'react';
import { usePlaylists } from '../store/usePlaylists';
import { Card, Button, Input, cn } from './components';
import { Youtube, Plus, Trash2, RefreshCcw, ExternalLink, Loader2, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PlaylistsManager() {
  const { playlists, order, addPlaylistByUrl, removePlaylist, refetchPlaylist } = usePlaylists();
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleAdd() {
    if (!url.trim()) return;
    setAdding(true);
    setErrorMsg(null);
    const res = await addPlaylistByUrl(url.trim());
    if (!res.ok) setErrorMsg(res.error || 'Failed');
    setAdding(false);
    if (res.ok) {
      setUrl('');
    }
  }

  const empty = order.length === 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-24">
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-foreground/90 font-semibold text-lg"><Youtube className="size-5 text-red-500" /> Playlist Study Boards</div>
        <p className="text-sm text-muted-foreground/70 leading-relaxed">Paste a YouTube playlist URL (or ID). Videos will turn into a trackable list with two checkboxes: <strong className="text-foreground/80">Watched</strong> and <strong className="text-foreground/80">Revisit</strong>.</p>
        <div className="flex flex-col gap-3 max-w-xl">
          <Input placeholder="YouTube Playlist URL or ID" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key==='Enter' && handleAdd()} />
          {errorMsg && <p className="text-xs text-danger">{errorMsg}</p>}
          <Button disabled={!url.trim() || adding} onClick={handleAdd} className="gap-2 w-fit" size="sm">
            {adding && <Loader2 className="size-4 animate-spin" />} <Plus className="size-4" /> Add Playlist
          </Button>
         
        </div>
      </Card>

      {empty && (
        <Card className="p-12 text-center flex flex-col items-center gap-4">
          <p className="text-muted-foreground/70">No playlists yet. Paste one above to get started.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {order.map(pid => {
          const pl = playlists[pid];
          const total = pl.order.length;
          const done = pl.order.reduce((acc, vid) => acc + (pl.videos[vid]?.done ? 1 : 0), 0);
          const revisit = pl.order.reduce((acc, vid) => acc + (pl.videos[vid]?.revisit ? 1 : 0), 0);
          const percent = total ? Math.round((done / total) * 100) : 0;
          return (
            <Card key={pid} className="p-0 overflow-hidden group hover:shadow-glow transition cursor-pointer relative" onClick={() => navigate(`/playlists/${pid}`)}>
              <div className="p-5 flex flex-col gap-3 h-full">
                <div className="flex items-center gap-3">
                  <span className="inline-block w-2 h-2 rounded-full bg-success/70" />
                  <span className="font-semibold text-lg truncate flex-1">{pl.title}</span>
                  {pl.fetching && <Loader2 className="inline size-4 animate-spin ml-1" />}
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-muted-foreground/60">
                  <span className="px-2 py-1 rounded-full bg-card/60 border border-border/60">{done}/{total} Done</span>
                  <span className="px-2 py-1 rounded-full bg-card/60 border border-border/60">{revisit} Revisit</span>
                  {pl.error && <span className="px-2 py-1 rounded-full bg-red-500/20 text-danger border border-red-500/40">Error</span>}
                </div>
                <div className="w-full h-2 bg-accent/30 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-success/70 transition-all" style={{ width: percent + '%' }} />
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); refetchPlaylist(pid); }} aria-label="Refetch" className="h-8 w-8 p-0"><RefreshCcw className="size-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); window.open(pl.url, '_blank'); }} aria-label="Open" className="h-8 w-8 p-0"><ExternalLink className="size-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); removePlaylist(pid); }} aria-label="Delete" className="h-8 w-8 p-0 text-danger hover:text-danger"><Trash2 className="size-4" /></Button>
                </div>
              </div>
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-success/30 pointer-events-none transition-all duration-200" />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default PlaylistsManager;