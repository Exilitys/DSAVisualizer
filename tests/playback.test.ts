import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayback} from '../src/components/playback.ts';
import type {PlaybackSpeed} from '../src/components/playback.ts';
import {createPlayer,startCommand,seek} from '../src/core/player.ts';
import {heapEngine,createPreset} from '../src/lessons/heap/engine.ts';

function setup() {
  let player=startCommand(createPlayer(heapEngine,createPreset()),heapEngine,{type:'insert',value:1});
  const jobs:{delay:number;callback:()=>void;cancelled:boolean}[]=[];
  const playback=createPlayback({
    read:()=>({run:player.steps,ordinal:player.ordinal,lastOrdinal:player.steps ? player.steps.length-1 : 0}),
    advance:ordinal=>{player=seek(player,ordinal);},
    schedule:(delay,callback)=>{const job={delay,callback,cancelled:false};jobs.push(job);return()=>{job.cancelled=true;};},
    changed:()=>{},
  });
  return {playback,jobs,read:()=>player,write:(next:typeof player)=>{player=next;},
    fire:(index=jobs.length-1)=>{jobs[index].cancelled=true;jobs[index].callback();}};
}

test('a cancelled tick cannot move a manual cursor or replacement run',()=>{
  const s=setup();s.playback.play();assert.equal(s.playback.status().playing,true);const old=s.jobs[0];
  s.playback.pause();s.write(seek(s.read(),4));old.callback();
  assert.equal(s.read().ordinal,4);
  s.playback.play();const previousRun=s.jobs.at(-1)!;
  s.playback.pause();
  const replacement=startCommand(seek(s.read(),0),heapEngine,{type:'extract'});
  s.write(replacement);previousRun.callback();
  assert.equal(s.read().steps,replacement.steps);
  assert.equal(s.read().ordinal,1);
});

test('speed reschedules and only the new tick advances once',()=>{
  const s=setup();s.playback.play();assert.equal(s.playback.status().playing,true);
  assert.equal(s.jobs[0].delay,1000);
  s.playback.setSpeed(2);assert.equal(s.jobs.at(-1)!.delay,500);
  s.jobs[0].callback();assert.equal(s.read().ordinal,1);
  s.fire();assert.equal(s.read().ordinal,2);
  s.playback.setSpeed(.5);assert.equal(s.jobs.at(-1)!.delay,2000);
  assert.equal(s.jobs.filter(j=>!j.cancelled).length,1);
});

test('play ignores absent and completed runs and does not start another operation',()=>{
  const s=setup();s.write(createPlayer(heapEngine,createPreset()));s.playback.play();
  assert.equal(s.playback.status().playing,false);
  assert.equal(s.jobs.length,0);
  const run=startCommand(s.read(),heapEngine,{type:'insert',value:1});
  const complete=seek(run,8);s.write(complete);s.playback.play();
  assert.equal(s.playback.status().playing,false);
  assert.equal(s.read().steps,complete.steps);
  assert.equal(s.jobs.length,0);
});

test('replay advances every ordinal once and stops at completion',()=>{
  const s=setup();s.write(seek(s.read(),0));s.playback.play();
  assert.equal(s.playback.status().playing,true);
  const ordinals:number[]=[];
  for(let i=0;i<8;i++){s.fire();ordinals.push(s.read().ordinal);}
  assert.deepEqual(ordinals,[1,2,3,4,5,6,7,8]);
  assert.equal(s.playback.status().playing,false);
  assert.equal(s.jobs.filter(j=>!j.cancelled).length,0);
});

test('repeated play produces one live advancing schedule',()=>{
  const s=setup();s.playback.play();assert.equal(s.playback.status().playing,true);s.playback.play();
  assert.equal(s.jobs.filter(j=>!j.cancelled).length,1);
  s.fire();assert.equal(s.read().ordinal,2);
  assert.equal(s.jobs.filter(j=>!j.cancelled).length,1);
});

test('an independently replaced run or cursor stops the old schedule',()=>{
  const s=setup();s.playback.play();assert.equal(s.playback.status().playing,true);
  const old=s.jobs[0];s.write(seek(s.read(),4));old.callback();
  assert.equal(s.read().ordinal,4);assert.equal(s.playback.status().playing,false);
  s.playback.play();const next=s.jobs.at(-1)!;
  const replacement=startCommand(seek(s.read(),0),heapEngine,{type:'extract'});
  s.write(replacement);next.callback();
  assert.equal(s.read().steps,replacement.steps);
  assert.equal(s.read().ordinal,1);assert.equal(s.playback.status().playing,false);
});

test('invalid speeds preserve playback and disposal invalidates callbacks but allows new setup',()=>{
  const s=setup();s.playback.play();assert.equal(s.playback.status().playing,true);
  for(const speed of [0,3,NaN])s.playback.setSpeed(speed as PlaybackSpeed);
  assert.deepEqual(s.playback.status(),{playing:true,speed:1});
  const old=s.jobs[0];s.playback.dispose();old.callback();
  assert.equal(s.read().ordinal,1);assert.equal(s.playback.status().playing,false);
  s.playback.play();assert.equal(s.playback.status().playing,true);s.fire();
  assert.equal(s.read().ordinal,2);
});
