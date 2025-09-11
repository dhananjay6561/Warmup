import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlaylists } from '../store/usePlaylists';
import { Card, Button, cn } from './components';
import { ArrowLeft, ExternalLink, CheckSquare, Square, Eye, EyeOff, Loader2, RefreshCcw } from 'lucide-react';

export default function PlaylistTrackerPage() {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const { playlists, toggleVideoField, refetchPlaylist } = usePlaylists();
  const pl = playlistId ? playlists[playlistId] : undefined;

  if (!pl) return (
    <div className="w-full max-w-2xl mx-auto py-16">
      <Card className="p-8 text-center text-danger font-bold text-lg">Playlist not found.</Card>
      <div className="flex justify-center mt-6">
        <Button onClick={() => navigate(-1)} variant="outline"><ArrowLeft className="size-4 mr-2" /> Back</Button>
      </div>
    </div>
  );

  const total = pl.order.length;
  const done = pl.order.reduce((acc, vid) => acc + (pl.videos[vid]?.done ? 1 : 0), 0);
  const revisit = pl.order.reduce((acc, vid) => acc + (pl.videos[vid]?.revisit ? 1 : 0), 0);
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="w-full max-w-3xl mx-auto py-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="size-4" /></Button>
        <h2 className="text-2xl font-bold flex-1 truncate">{pl.title}</h2>
        <Button size="sm" variant="ghost" onClick={() => refetchPlaylist(pl.id)} aria-label="Refetch"><RefreshCcw className="size-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => window.open(pl.url, '_blank')} aria-label="Open"><ExternalLink className="size-4" /></Button>
      </div>
      <div className="mb-4 flex gap-4 items-center">
        <div className="flex flex-col flex-1">
          <div className="flex gap-2 items-center text-sm">
            <span className="rounded-full bg-card/80 px-3 py-1 font-semibold text-foreground/90 border border-border">{done} done</span>
            <span className="rounded-full bg-card/80 px-3 py-1 font-semibold text-warning border border-border">{revisit} revisit</span>
            <span className="rounded-full bg-card/80 px-3 py-1 font-semibold text-muted-foreground border border-border">{total} total</span>
          </div>
          <div className="w-full h-3 bg-accent/30 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-success/70 transition-all" style={{ width: percent + '%' }} />
          </div>
        </div>
        {pl.fetching && <Loader2 className="size-6 animate-spin ml-2 text-muted-foreground" />}
      </div>
      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-border/40 max-h-[70vh] overflow-y-auto custom-scroll">
          {pl.order.map((vid, idx) => {
            const v = pl.videos[vid];
            if (!v) return null;
            return (
              <div key={vid} className="p-4 flex items-center gap-4 text-base hover:bg-card/40 transition group">
                <span className="text-xs font-mono opacity-50 w-8">{idx + 1}</span>
                {v.thumbnail ? (
                  <img src={v.thumbnail} alt="thumb" className="w-20 h-12 object-cover rounded-md border border-border/60" />
                ) : (
                  <div className="w-20 h-12 rounded-md bg-accent/30" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={cn('truncate font-medium', v.done && 'line-through text-muted-foreground/50')}>{v.title}</p>
                  <p className="text-xs text-muted-foreground/60 truncate">{v.channelTitle}</p>
                </div>
                <div className="flex items-center gap-4 pr-2">
                  <button
                    onClick={() => toggleVideoField(pl.id, v.id, 'done')}
                    className={cn('text-muted-foreground/60 hover:text-foreground transition', v.done && 'text-success')}
                    aria-label="Toggle Watched"
                  >
                    {v.done ? <CheckSquare className="size-6" /> : <Square className="size-6" />}
                  </button>
                  <button
                    onClick={() => toggleVideoField(pl.id, v.id, 'revisit')}
                    className={cn('text-muted-foreground/60 hover:text-foreground transition', v.revisit && 'text-warning')}
                    aria-label="Toggle Revisit"
                  >
                    {v.revisit ? <Eye className="size-6" /> : <EyeOff className="size-6" />}
                  </button>
                  <button onClick={() => window.open(`https://www.youtube.com/watch?v=${v.id}&list=${pl.id}&index=${v.position+1}`, '_blank')} className="text-muted-foreground/60 hover:text-foreground" aria-label="Open Video">
                    <ExternalLink className="size-5" />
                  </button>
                </div>
              </div>
            );
          })}
          {pl.fetching && (
            <div className="p-6 text-center text-xs text-muted-foreground/60 animate-pulse">Fetching more...</div>
          )}
        </div>
      </Card>
    </div>
  );
}