(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ArenaEngine=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function advance(body,angle,target,speed,dt){const d=Math.atan2(Math.sin(target-angle),Math.cos(target-angle));angle+=clamp(d,-4.2*dt,4.2*dt);body[0].x+=Math.cos(angle)*speed*dt;body[0].y+=Math.sin(angle)*speed*dt;for(let i=1;i<body.length;i++){const a=body[i-1],b=body[i],dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy;if(d2>64){const k=8/Math.sqrt(d2);b.x=a.x+dx*k;b.y=a.y+dy*k;}}return angle;}
function sampleBody(before,after,alpha,out){out.length=after.length;for(let i=0;i<after.length;i++){const b=after[i],a=before[Math.min(i,before.length-1)]||b,p=out[i]||(out[i]={x:0,y:0});p.x=a.x+(b.x-a.x)*alpha;p.y=a.y+(b.y-a.y)*alpha;}return out;}
function extrapolate(player,seconds,out){sampleBody(player.body,player.body,1,out);let angle=player.angle;for(let remaining=clamp(seconds,0,.18);remaining>0;){const dt=Math.min(remaining,1/60);angle=advance(out,angle,angle,player.speed,dt);remaining-=dt;}return angle;}
return {clamp,advance,sampleBody,extrapolate};
});
