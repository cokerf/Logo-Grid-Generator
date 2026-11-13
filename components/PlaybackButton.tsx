import React from "react";
export function PlaybackButton({playing,progress,onClick}:{playing:boolean;progress:number;onClick:()=>void}) {
  return <button className="playback group relative inline-flex shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2" aria-label={playing?"Pause construction":"Play construction"} aria-pressed={playing} onClick={onClick}>
    <svg className="playback-ring" viewBox="0 0 44 44" aria-hidden="true"><rect x="2" y="2" width="40" height="40"/><rect className="playback-progress" x="2" y="2" width="40" height="40" pathLength="100" strokeDasharray={`${Math.max(0,Math.min(1,progress))*100} 100`}/></svg>
    <span className={`playback-glyph ${playing?'is-playing':''}`} aria-hidden="true"><span/><span/></span>
  </button>;
}
