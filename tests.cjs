'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {WebSocket}=require('ws'),{once}=require('node:events');
const game=require('./server.cjs'),engine=require('./engine.js');
new vm.Script(fs.readFileSync(__dirname+'/client.js','utf8'));
function player(id,body,angle=0){return {id,name:id,body,angle,target:angle,length:body.length,alive:true,safe:0,score:0,seen:Date.now(),generation:1,color:'#a7f36b'};}
function setup(a,b){game.rooms.clear();const r=game.roomFor('test');r.food=[];r.players.set(a.id,a);r.players.set(b.id,b);game.simulate();return r;}
let a=player('a',[{x:100,y:100},{x:92,y:100}]),b=player('b',[{x:120,y:100},{x:128,y:100}],Math.PI);setup(a,b);assert.equal(a.alive,false);assert.equal(b.alive,false);assert.match(a.reason,/cabezas/);
a=player('a',[{x:100,y:100},{x:92,y:100}]);b=player('b',[{x:105,y:60},{x:105,y:68},{x:105,y:76},{x:105,y:84},{x:105,y:92},{x:105,y:100}],-Math.PI/2);setup(a,b);assert.equal(a.alive,false);assert.equal(b.alive,true);assert.match(a.reason,/cuerpo/);
a=player('a',[{x:100,y:100},{x:92,y:100}]);b=player('b',[{x:120,y:100},{x:128,y:100}],Math.PI);a.safe=Date.now()+2000;setup(a,b);assert.equal(a.alive,true);assert.equal(b.alive,true);
// Long bodies crossing cell boundaries must still register collisions.
a=player('a',[{x:143,y:100},{x:135,y:100}]);b=player('b',[{x:151,y:60},{x:151,y:68},{x:151,y:76},{x:151,y:84},{x:151,y:92},{x:151,y:100}],-Math.PI/2);setup(a,b);assert.equal(a.alive,false);
const mid=engine.sampleBody([{x:0,y:0}],[{x:10,y:20}],.5,[]);assert.deepEqual(mid,[{x:5,y:10}]);
function run(hz){const body=Array.from({length:25},(_,i)=>({x:500-i*8,y:500}));let angle=0;for(let i=0;i<hz;i++)angle=engine.advance(body,angle,0,110,1/hz);return body[0];}
assert.ok(Math.abs(run(60).x-run(144).x)<1e-8);assert.ok(Math.abs(run(60).x-610)<1e-8);
const p={body:[{x:100,y:100},{x:92,y:100}],angle:0,speed:110};assert.ok(engine.extrapolate(p,10,[])===0);const ext=[];engine.extrapolate(p,10,ext);assert.ok(ext[0].x<120);
const matcher=engine.createCodeMatcher('pepita');assert.deepEqual([...('PEPITA')].map((k,i)=>matcher.feed(k,i*100)),[false,false,false,false,false,true]);matcher.reset();matcher.feed('p',0);assert.equal(matcher.feed('e',3000),false);for(const [i,k] of [...'pita'].entries())assert.equal(matcher.feed(k,3100+i*100),false);matcher.reset();assert.equal([...'peXpepita'].some((k,i)=>matcher.feed(k,i*100)),true);
const bonusPlayer=player('bonus',Array.from({length:25},(_,i)=>({x:500-i*8,y:500})));assert.equal(game.redeemCode(bonusPlayer,'wrong'),false);assert.equal(game.redeemCode(bonusPlayer,'pepita'),true);assert.equal(bonusPlayer.score,100);assert.equal(bonusPlayer.length,125);assert.equal(bonusPlayer.body.length,125);assert.equal(game.redeemCode(bonusPlayer,'pepita'),true);assert.equal(bonusPlayer.score,200);assert.equal(bonusPlayer.length,225);assert.equal(bonusPlayer.body.length,225);bonusPlayer.alive=false;assert.equal(game.redeemCode(bonusPlayer,'pepita'),false);
console.log('PASS: secret keyboard sequence, case folding, timeout, exact +100 size/score, repeatable uses, no bonus while dead.');
console.log('PASS: PvP rules, spawn protection, grid boundary collision, interpolation midpoint, movement independent of FPS, bounded extrapolation.');
function connection(url){const ws=new WebSocket(url),messages=[];ws.on('message',raw=>messages.push(JSON.parse(raw)));return {ws,messages};}
async function waitFor(test,ms=3000){const end=Date.now()+ms;while(!test()){if(Date.now()>end)throw Error('Timed out');await new Promise(r=>setTimeout(r,10));}}
async function network(){game.rooms.clear();game.start(0);await once(game.server,'listening');const base='http://127.0.0.1:'+game.server.address().port,wsUrl=base.replace('http:','ws:')+'/live';const x=connection(wsUrl),y=connection(wsUrl),z=connection(wsUrl);
try{await Promise.all([once(x.ws,'open'),once(y.ws,'open'),once(z.ws,'open')]);x.ws.send(JSON.stringify({type:'join',name:'Ana',room:'test'}));y.ws.send(JSON.stringify({type:'join',name:'Beto',room:'test'}));z.ws.send(JSON.stringify({type:'join',name:'Otra',room:'other'}));
await waitFor(()=>x.messages.some(m=>m.type==='state'&&m.players.length===2)&&z.messages.some(m=>m.type==='state'));
const ids=[x,y,z].map(c=>c.messages.find(m=>m.type==='welcome').id);assert.equal(new Set(ids).size,3);assert.ok(z.messages.filter(m=>m.type==='state').every(m=>m.players.length===1));
x.ws.send(JSON.stringify({type:'input',angle:1,boost:true}));await waitFor(()=>game.rooms.get('test').players.get(ids[0]).target===1);
await waitFor(()=>x.messages.filter(m=>m.type==='state'&&!m.food).length>=3);
const r=game.rooms.get('test'),sameRoomState=x.messages.filter(m=>m.type==='state').at(-1);assert.deepEqual(sameRoomState.players.map(p=>p.name).sort(),['Ana','Beto']);assert.ok(sameRoomState.players.every(p=>Array.isArray(p.body[0])));
const dead=r.players.get(ids[0]);dead.alive=false;dead.reason='test';const gen=dead.generation;x.ws.send(JSON.stringify({type:'respawn'}));await waitFor(()=>dead.generation>gen);assert.equal(dead.alive,true);
const scoreBefore=dead.score,lengthBefore=dead.length;x.ws.send(JSON.stringify({type:'code',code:'pepita'}));await waitFor(()=>x.messages.some(m=>m.type==='bonus'));assert.equal(dead.score,scoreBefore+100);assert.equal(dead.length,lengthBefore+100);const bonusCount=x.messages.filter(m=>m.type==='bonus').length;x.ws.send(JSON.stringify({type:'code',code:'pepita'}));await waitFor(()=>x.messages.filter(m=>m.type==='bonus').length===bonusCount+1);assert.equal(dead.score,scoreBefore+200);assert.equal(dead.length,lengthBefore+200);
const before=x.messages.length;r.food.push({x:200,y:200,c:0});r.foodVersion++;await waitFor(()=>x.messages.slice(before).some(m=>m.food));
const health=await (await fetch(base+'/health')).json();assert.equal(health.version,2);assert.equal((await fetch(base+'/client.js')).status,200);assert.equal((await fetch(base+'/server.cjs')).status,404);
const oldBytes=Buffer.byteLength(JSON.stringify(game.snapshot(r,ids[0]))),newBytes=Buffer.byteLength(JSON.stringify(game.packet(r,false)));console.log('PASS: real WebSocket clients, room isolation, input, continuous push, food only on change, respawn, health, asset isolation.');console.log(JSON.stringify({legacyStateBytes:oldBytes,webSocketStateBytes:newBytes,reductionPercent:Math.round(100*(1-newBytes/oldBytes))}));
y.ws.close();await once(y.ws,'close');await waitFor(()=>!r.players.has(ids[1]));
}finally{x.ws.terminate();y.ws.terminate();z.ws.terminate();await game.stop();}}
network().catch(e=>{console.error(e);process.exit(1);});
