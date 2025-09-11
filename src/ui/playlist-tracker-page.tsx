import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlaylists } from '../store/usePlaylists';
import { Card, Button, cn } from './components';
import { ArrowLeft, ExternalLink, CheckSquare, Square, BookmarkPlus, Bookmark, Loader2, RefreshCcw, Play, CheckCircle2, Clock } from 'lucide-react';

export default function PlaylistTrackerPage() {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const { playlists, toggleVideoField, refetchPlaylist } = usePlaylists();
  const pl = playlistId ? playlists[playlistId] : undefined;
  const refreshingRef = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Memoized calculations to prevent unnecessary re-renders
  const stats = useMemo(() => {
    if (!pl) return { total: 0, done: 0, revisit: 0, percent: 0 };
    
    const total = pl.order.length;
    const done = pl.order.reduce((acc, vid) => acc + (pl.videos[vid]?.done ? 1 : 0), 0);
    const revisit = pl.order.reduce((acc, vid) => acc + (pl.videos[vid]?.revisit ? 1 : 0), 0);
    const percent = total ? Math.round((done / total) * 100) : 0;
    
    return { total, done, revisit, percent };
  }, [pl]);

  // Safe external link opener with error handling
  const openLink = useCallback((url) => {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to open link:', error);
      // Could show a toast notification here
    }
  }, []);

  // Improved refresh function with proper error handling and race condition prevention
  const handleRefresh = useCallback(async () => {
    if (!pl || refreshingRef.current) return;
    
    try {
      refreshingRef.current = true;
      
      // Store current progress before refresh
      const currentProgress = {};
      pl.order.forEach(vidId => {
        const video = pl.videos[vidId];
        if (video && (video.done || video.revisit)) {
          currentProgress[vidId] = {
            done: video.done,
            revisit: video.revisit
          };
        }
      });
      
      // Refresh playlist data
      await refetchPlaylist(pl.id);
      
      // Only restore progress if component is still mounted
      if (mountedRef.current) {
        // Use setTimeout to ensure state has updated
        setTimeout(() => {
          if (mountedRef.current) {
            Object.keys(currentProgress).forEach(vidId => {
              if (currentProgress[vidId].done) {
                toggleVideoField(pl.id, vidId, 'done', true);
              }
              if (currentProgress[vidId].revisit) {
                toggleVideoField(pl.id, vidId, 'revisit', true);
              }
            });
          }
        }, 100);
      }
    } catch (error) {
      console.error('Failed to refresh playlist:', error);
      // Could show error toast here
    } finally {
      refreshingRef.current = false;
    }
  }, [pl, refetchPlaylist, toggleVideoField]);

  // Safe video field toggle
  const handleToggleVideoField = useCallback((playlistId, videoId, field, value) => {
    try {
      toggleVideoField(playlistId, videoId, field, value);
    } catch (error) {
      console.error('Failed to toggle video field:', error);
    }
  }, [toggleVideoField]);

  if (!pl) return (
    <div className="w-full max-w-2xl mx-auto py-16 px-4">
      <Card className="p-8 text-center text-danger font-bold text-lg">Playlist not found.</Card>
      <div className="flex justify-center mt-6">
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="size-4 mr-2" /> Back
        </Button>
      </div>
    </div>
  );

  const { total, done, revisit, percent } = stats;

  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-[75%] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            title="Go back"
            className="hover:bg-muted/60 flex-shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-1 break-words">{pl.title}</h1>
            <p className="text-sm text-muted-foreground">YouTube Playlist Progress Tracker</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleRefresh}
              title="Refresh playlist data"
              disabled={pl.fetching || refreshingRef.current}
            >
              <RefreshCcw className={cn("size-4", (pl.fetching || refreshingRef.current) && "animate-spin")} />
              <span className="hidden sm:inline ml-2">
                {(pl.fetching || refreshingRef.current) ? 'Refreshing...' : 'Refresh'}
              </span>
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => openLink(pl.url)}
              title="Open playlist on YouTube"
            >
              <ExternalLink className="size-4" />
              <span className="hidden sm:inline ml-2">Open</span>
            </Button>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="p-6 lg:p-8 mb-6 bg-gradient-to-r from-background to-muted/20">
          <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-3 xl:col-span-2">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-full bg-success/10 border border-success/20">
                  <CheckCircle2 className="size-6 text-success" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Progress Overview</h3>
                  <p className="text-sm text-muted-foreground">{percent}% completed • {done} of {total} videos</p>
                </div>
              </div>
              <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-success/80 to-success transition-all duration-500 ease-out" 
                  style={{ width: percent + '%' }} 
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:col-span-2 xl:col-span-1">
              <div className="text-center p-3 sm:p-4 rounded-lg bg-success/5 border border-success/20">
                <div className="text-xl sm:text-2xl font-bold text-success">{done}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-lg bg-warning/5 border border-warning/20">
                <div className="text-xl sm:text-2xl font-bold text-warning">{revisit}</div>
                <div className="text-xs text-muted-foreground">To Revisit</div>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-lg bg-muted/20 border border-border">
                <div className="text-xl sm:text-2xl font-bold text-foreground">{total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Videos List */}
        <Card className="overflow-hidden mb-8">
          <div className="p-4 lg:p-6 border-b border-border/40 bg-muted/20">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Play className="size-5" />
              Videos ({total})
            </h3>
          </div>
          <div 
            className="max-h-[60vh] overflow-y-auto custom-scroll"
            role="region"
            aria-label="Video list"
            tabIndex={0}
          >
            {pl.order.map((vid, idx) => {
              const v = pl.videos[vid];
              if (!v) return null;
              
              return (
                <div 
                  key={vid} 
                  className={cn(
                    "p-4 lg:p-6 flex items-start sm:items-center gap-4 border-b border-border/20 hover:bg-muted/30 transition-all duration-200 group",
                    v.done && "bg-success/5"
                  )}
                >
                  {/* Video Number */}
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted/40 flex items-center justify-center text-sm sm:text-base font-mono text-muted-foreground">
                    {idx + 1}
                  </div>

                  {/* Thumbnail */}
                  <div className="flex-shrink-0 relative group">
                    {v.thumbnail ? (
                      <div 
                        className="relative cursor-pointer"
                        onClick={() => openLink(`https://www.youtube.com/watch?v=${v.id}&list=${pl.id}&index=${v.position+1}`)}
                        title="Click to open video on YouTube"
                      >
                        <img 
                          src={v.thumbnail} 
                          alt={`Thumbnail for ${v.title}`} 
                          className={cn(
                            "w-28 h-20 sm:w-32 sm:h-20 lg:w-36 lg:h-24 object-cover rounded-lg border-2 transition-all duration-200 group-hover:opacity-75",
                            v.done ? "border-success/40 opacity-60" : "border-border/40"
                          )}
                        />
                        {/* Hover overlay with redirect icon */}
                        <div className="absolute inset-0 bg-black/80 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                          <ExternalLink className="size-6 text-white transform scale-75 group-hover:scale-100 transition-transform duration-200" strokeWidth={2} />
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="w-28 h-20 sm:w-32 sm:h-20 lg:w-36 lg:h-24 rounded-lg bg-muted/40 flex items-center justify-center cursor-pointer hover:bg-muted/60 transition-all duration-200"
                        onClick={() => openLink(`https://www.youtube.com/watch?v=${v.id}&list=${pl.id}&index=${v.position+1}`)}
                        title="Click to open video on YouTube"
                      >
                        <Play className="size-6 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <h4 className={cn(
                      'font-medium text-sm sm:text-base leading-tight pr-2',
                      v.done ? 'line-through text-muted-foreground/60' : 'text-foreground'
                    )}>
                      {v.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground/80 truncate">
                      {v.channelTitle}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      {v.done && (
                        <span className="px-2 py-1 rounded-full bg-success/10 text-success font-medium">
                          Completed
                        </span>
                      )}
                      {v.revisit && (
                        <span className="px-2 py-1 rounded-full bg-warning/10 text-warning font-medium">
                          To Revisit
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
                    {/* Mark as Done */}
                    <button
                      onClick={() => handleToggleVideoField(pl.id, v.id, 'done')}
                      className={cn(
                        'p-2.5 rounded-lg transition-all hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-success/50',
                        v.done 
                          ? 'text-success hover:text-success/80 bg-success/10' 
                          : 'text-muted-foreground/60 hover:text-success'
                      )}
                      title={v.done ? "Mark as not completed" : "Mark as completed"}
                      aria-label={v.done ? "Mark as not completed" : "Mark as completed"}
                    >
                      {v.done ? <CheckSquare className="size-5" /> : <Square className="size-5" />}
                    </button>

                    {/* Mark for Revisit */}
                    <button
                      onClick={() => handleToggleVideoField(pl.id, v.id, 'revisit')}
                      className={cn(
                        'p-2.5 rounded-lg transition-all hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-warning/50',
                        v.revisit 
                          ? 'text-warning hover:text-warning/80 bg-warning/10' 
                          : 'text-muted-foreground/60 hover:text-warning'
                      )}
                      title={v.revisit ? "Remove from revisit list" : "Mark to revisit later"}
                      aria-label={v.revisit ? "Remove from revisit list" : "Mark to revisit later"}
                    >
                      {v.revisit ? <Bookmark className="size-5" /> : <BookmarkPlus className="size-5" />}
                    </button>

                    {/* Open Video */}
                    <button 
                      onClick={() => openLink(`https://www.youtube.com/watch?v=${v.id}&list=${pl.id}&index=${v.position+1}`)}
                      className="p-2.5 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
                      title="Open video on YouTube"
                      aria-label="Open video on YouTube"
                    >
                      <ExternalLink className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            
            {pl.fetching && (
              <div className="p-8 text-center">
                <div className="flex items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                  <span className="text-sm">Loading more videos...</span>
                </div>
              </div>
            )}

            {!pl.fetching && pl.order.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Clock className="size-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No videos found in this playlist.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}