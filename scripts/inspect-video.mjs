import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const path=process.argv[2]||'/tmp/logo-grid-tests/construction.mp4';
const data=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_name,width,height,r_frame_rate,nb_frames,duration','-of','json',path],{encoding:'utf8'}));
const stream=data.streams[0];assert.equal(stream.codec_name,'h264');assert.equal(stream.width,1080);assert.equal(stream.height,1350);assert.equal(stream.r_frame_rate,'24/1');assert.equal(Number(stream.nb_frames),72);assert.ok(Math.abs(Number(stream.duration)-3)<.01);
const bytes=readFileSync(path);assert.ok(bytes.indexOf('moov')>0&&bytes.indexOf('moov')<bytes.indexOf('mdat'),'MP4 metadata must precede media for fast start');
execFileSync('ffmpeg',['-v','error','-i',path,'-f','null','-'],{stdio:'inherit'});
console.log('Verified: H.264, 1080×1350, 24 fps, 72 frames, 3 seconds, fast-start metadata, full decode.');
