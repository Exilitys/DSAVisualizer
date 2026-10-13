export type PlaybackSpeed=.5|1|2;
export type PlaybackStatus={playing:boolean;speed:PlaybackSpeed};
export type PlaybackCursor={run:object|null;ordinal:number;lastOrdinal:number};
export type Schedule=(delayMs:number,callback:()=>void)=>()=>void;
type Options={read():PlaybackCursor;advance(ordinal:number):void;
  schedule:Schedule;changed(status:PlaybackStatus):void};

export function createPlayback(options:Options) {
  let playing=false, speed:PlaybackSpeed=1, generation=0;
  let cancel:(()=>void)|null=null;
  const status=():PlaybackStatus=>({playing,speed});
  const notify=()=>options.changed(status());
  const invalidate=()=>{generation++;cancel?.();cancel=null;};
  const pause=()=>{playing=false;invalidate();notify();};
  const arm=()=>{
    if(!playing) return;
    const scheduled=options.read();
    if(!scheduled.run || scheduled.ordinal>=scheduled.lastOrdinal){pause();return;}
    const token=generation;
    cancel=options.schedule(1000/speed,()=>{
      if(!playing || token!==generation) return;
      cancel=null;
      const current=options.read();
      if(current.run!==scheduled.run || current.ordinal!==scheduled.ordinal){pause();return;}
      const next=current.ordinal+1;
      options.advance(next);
      if(!playing || token!==generation) return;
      if(next>=current.lastOrdinal) pause(); else arm();
    });
  };
  return {
    status,
    play(){
      const cursor=options.read();
      if(playing || !cursor.run || cursor.ordinal>=cursor.lastOrdinal) return;
      playing=true;invalidate();notify();arm();
    },
    pause,
    setSpeed(next:PlaybackSpeed){
      if(![.5,1,2].includes(next)) return;
      invalidate();speed=next;notify();if(playing) arm();
    },
    dispose(){playing=false;invalidate();},
  };
}
