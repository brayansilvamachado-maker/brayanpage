const W=320,H=184,PX=12,PY=12,PW=296,PH=160,PR=PX+PW,PB=PY+PH,CY=PY+PH/2,GH=44,K=1.3,SP=62;
const cv=document.getElementById('c'),g=cv.getContext('2d');g.imageSmoothingEnabled=false;
const $=i=>document.getElementById(i),menu=$('menu'),gl=$('gl');

const LV={
    facil:{n:'FÁCIL',spd:.72,react:.55,err:.4,tk:.2,press:1,pred:0,lane:0,pass:.3,gk:.4},
    medio:{n:'MÉDIO',spd:.88,react:.3,err:.16,tk:.4,press:1,pred:.5,lane:.5,pass:.6,gk:.75},
    dificil:{n:'DIFÍCIL',spd:1,react:.12,err:.04,tk:.6,press:2,pred:1,lane:1,pass:.85,gk:1}
};

let AP=LV.medio,state='menu',score=[0,0],time=120,ctrl=null,gt=0,pk=0,DT=.016,T=[[],[]],all=[];
const keys={},act={},mouse={x:PR-40,y:CY},ball={x:0,y:0,vx:0,vy:0,owner:null,tgt:null,last:null};
const FM=[['gk',.03,.5],['d',.24,.3],['d',.24,.7],['a',.5,.28],['a',.5,.72]];

const cl=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),prm=p=>p.team?AP:LV.medio;

function build(){
    T=[[],[]];
    FM.forEach((f,i)=>{
        for(let t=0;t<2;t++) {
            T[t].push({team:t,i,role:f[0],hf:f[1],hy:f[2],x:0,y:0,vx:0,vy:0,dvx:0,dvy:0,fx:t?-1:1,fy:0,cd:0,tk:0,bo:0,dc:0,th:0,hold:0,tx:0,ty:0,an:Math.random()*9});
        }
    });
    all=T[0].concat(T[1]);
}

function home(p,ns){
    let x=p.team?PX+PW*(1-p.hf):PX+PW*p.hf,y=PY+PH*p.hy;
    if(!ns&&p.role!=='gk'){x+=(ball.x-(PX+PR)/2)*.4;y+=(ball.y-CY)*.25}
    return{x:cl(x,PX+4,PR-4),y:cl(y,PY+4,PB-4)};
}

function take(p){ball.owner=p;ball.tgt=null;ball.last=p;p.hold=0;if(p.team===0&&p.role!=='gk')ctrl=p}

function reset(kt){
    act.pass=act.shot=false;
    all.forEach(p=>{const h=home(p,true);p.x=h.x;p.y=h.y;p.vx=p.vy=p.dvx=p.dvy=0;p.cd=p.tk=0;p.hold=0;p.fx=p.team?-1:1;p.fy=0});
    ball.x=(PX+PR)/2;ball.y=CY;ball.vx=ball.vy=0;ball.tgt=null;ball.owner=null;
    const k=T[kt][3];k.x=ball.x-(kt?-6:6);k.y=CY;take(k);
}

function kick(p,x,y,s,e){
    const a=Math.atan2(y-p.y,x-p.x)+(Math.random()-.5)*2*e;
    ball.owner=null;ball.tgt=null;ball.last=p;ball.vx=Math.cos(a)*s;ball.vy=Math.sin(a)*s;
    ball.x=p.x+Math.cos(a)*6;ball.y=p.y+Math.sin(a)*6;p.cd=.35;
}

function doPass(p,t,e){
    const lx=t.x+t.vx*.35,ly=t.y+t.vy*.35,d=Math.hypot(lx-p.x,ly-p.y);
    kick(p,lx,ly,cl(d*K+45,95,230),e);ball.tgt=t;
}

function sd(a,b,o){
    const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy||1,u=cl(((o.x-a.x)*dx+(o.y-a.y)*dy)/l,0,1);
    return Math.hypot(a.x+dx*u-o.x,a.y+dy*u-o.y);
}
const clear=(a,b,os,r)=>os.every(o=>sd(a,b,o)>r);

function move(p,x,y,s){
    const dx=x-p.x,dy=y-p.y,l=Math.hypot(dx,dy);
    p.dvx=l>1.5?dx/l*s:0;p.dvy=l>1.5?dy/l*s:0;
}

function carrier(p,A,d,opp){
    const gx=d>0?PR:PX,fo=opp.filter(o=>o.role!=='gk'),dg=Math.hypot(gx-p.x,CY-p.y);
    let ax=0,ay=0;for(const o of opp){const dx=p.x-o.x,dy=p.y-o.y,l=Math.hypot(dx,dy);if(l<26&&l>0){ax+=dx/l*(26-l);ay+=dy/l*(26-l)}}
    let dx=gx-p.x,dy=CY-p.y;const l=Math.hypot(dx,dy)||1;dx=dx/l+ax*.05;dy=dy/l+ay*.05;
    p.th-=DT;
    if(p.th<=0){p.th=A.react*(.6+Math.random()*.8);
    const kp=T[1-p.team][0],ty=kp.y<CY?CY+GH/2-5:CY-GH/2+5;
    if(dg<100&&clear(p,{x:gx,y:ty},fo,5)){kick(p,gx,ty,250,A.err);return}
    const press=opp.some(o=>dist(o,p)<22);let best=null,bs=0;
    for(const t of T[p.team]){if(t===p||t.role==='gk')continue;const td=dist(t,p);
    if(td<28||td>140||!clear(p,t,opp,6))continue;
    const open=Math.min(...opp.map(o=>dist(o,t))),s=(t.x-p.x)*d+open*.8;
    if(open>14&&s>bs){bs=s;best=t}}
    if(best&&((press&&Math.random()<A.pass+.2)||(bs>45&&Math.random()<A.pass*.6))){doPass(p,best,A.err*.5);return}}
    move(p,p.x+dx*40,p.y+dy*40,SP*A.spd*.93);
}

function support(p,A,d,opp){
    const o=ball.owner,h=home(p);
    if(p.role==='d'||A.lane<.3){move(p,h.x,h.y,SP*A.spd*.9);return}
    p.th-=DT;
    if(p.th<=0){p.th=.45;let bs=-9e9;
    for(let k=0;k<7;k++){const c={x:cl(o.x+d*(14+Math.random()*50),PX+6,PR-6),y:PY+8+Math.random()*(PH-16)};
    const op=Math.min(...opp.map(q=>dist(q,c))),
    s=Math.min(op,40)+(clear(o,c,opp,6)?25:0)+(c.x-o.x)*d*.3-dist(c,p)*.15-(T[p.team].some(m=>m!==p&&dist(m,c)<24)?30:0);
    if(s>bs){bs=s;p.tx=c.x;p.ty=c.y}}}
    move(p,p.tx,p.ty,SP*A.spd*.95);
}

function defend(p,A,d,opp){
    const c=ball.owner,og={x:d>0?PX:PR,y:CY},mine=T[p.team].filter(q=>q.role!=='gk'&&q!==ctrl).sort((a,b)=>dist(a,c)-dist(b,c)),r=mine.indexOf(p);
    if(r>=0&&r<A.press){const l=Math.hypot(og.x-c.x,og.y-c.y)||1,k=A.pred?7:0;
    move(p,c.x+c.vx*.2*A.pred+(og.x-c.x)/l*k,c.y+c.vy*.2*A.pred+(og.y-c.y)/l*k,SP*A.spd*(r?.95:1.03));return}
    const h=home(p);if(A.lane<.3){move(p,h.x,h.y,SP*A.spd*.9);return}
    const ops=opp.filter(o=>o!==c&&o.role!=='gk'),m=ops[p.i%ops.length],ll=Math.hypot(og.x-m.x,og.y-m.y)||1,
    gs={x:m.x+(og.x-m.x)/ll*12,y:m.y+(og.y-m.y)/ll*12},ln={x:m.x+(c.x-m.x)*.35,y:m.y+(c.y-m.y)*.35},w=A.lane>.8?.6:0;
    move(p,gs.x+(ln.x-gs.x)*w,gs.y+(ln.y-gs.y)*w,SP*A.spd*.95);
}

function loose(p,A){
    const tm=T[p.team].filter(q=>q.role!=='gk'&&q!==ctrl),b=ball;
    let ch=tm.reduce((a,q)=>dist(q,b)<dist(a,b)?q:a);
    if(b.tgt&&b.tgt.team===p.team&&b.tgt!==ctrl)ch=b.tgt;
    if(p===ch){const t=dist(p,b)/(SP*A.spd),f=(1-Math.exp(-K*t))/K;
    move(p,cl(b.x+b.vx*f*A.pred,PX,PR),cl(b.y+b.vy*f*A.pred,PY,PB),SP*A.spd*1.02);return}
    const h=home(p);move(p,h.x,h.y,SP*A.spd*.9);
}

function keeper(p,A,d){
    const b=ball,hx=(d>0?PX:PR)+d*7;
    if(b.owner===p){p.hold+=DT;
    if(p.hold>.8){const t=T[p.team].filter(q=>q.role!=='gk'&&clear(p,q,T[1-p.team],6)).sort((a,c)=>Math.abs(a.y-p.y)-Math.abs(c.y-p.y))[0]||T[p.team][1];doPass(p,t,.05)}
    move(p,hx,p.y,0);return}
    p.th-=DT;
    if(p.th<=0){p.th=A.react*.5;let y=CY+(b.y-CY)*.35;
    if(b.vx*d<-40){const t=(hx-b.x)/b.vx;if(t>0)y=b.y+b.vy*t}
    p.ty=cl(y+(Math.random()-.5)*(1-A.gk)*30,CY-GH/2+2,CY+GH/2-2)}
    let tx=hx,ty=p.ty||CY;
    if(!b.owner&&A.gk>.5&&Math.abs(b.x-hx)<30&&Math.abs(b.y-CY)<GH&&Math.hypot(b.vx,b.vy)<70){tx=b.x;ty=b.y}
    move(p,tx,ty,SP*A.spd);
}

function bestT(p){
    const a=Math.atan2(mouse.y-p.y,mouse.x-p.x);let r=null,bs=9;
    for(const t of T[0]){if(t===p||t.role==='gk')continue;const d=dist(t,p);if(d<12)continue;
    const ta=Math.atan2(t.y-p.y,t.x-p.x)-a,da=Math.abs(Math.atan2(Math.sin(ta),Math.cos(ta))),s=da+d*.0015;
    if(da<.45&&s<bs){bs=s;r=t}}return r;
}
function userPass(p){const t=bestT(p);if(t){doPass(p,t,0);ctrl=t}else kick(p,mouse.x,mouse.y,150,0)}
function goal(t){score[t]++;state='goal';gt=1.8;pk=1-t;gl.textContent=t?'GOL DO ROBÔ!':'GOOOL!';gl.hidden=false;}
function endGame(){state='end';$('mt').textContent=score[0]>score[1]?'VOCÊ VENCEU!':score[0]<score[1]?'O ROBÔ VENCEU':'EMPATE';$('mm').textContent=score[0]+' x '+score[1]+' — Escolha o nível para jogar novamente';menu.hidden=false}

function step(dt){
    DT=dt;const b=ball,o=b.owner;
    if(o&&o.team===0&&o.role!=='gk')ctrl=o;
    else if(!o&&b.tgt&&b.tgt.team===0)ctrl=b.tgt;
    else{const fs=T[0].filter(q=>q.role!=='gk'),n=fs.reduce((a,q)=>dist(q,b)<dist(a,b)?q:a);if(!ctrl||dist(ctrl,b)>dist(n,b)+10)ctrl=n}
    
    if(act.pass){act.pass=false;if(b.owner===ctrl)userPass(ctrl);else if(ctrl.dc<=0){ctrl.bo=.3;ctrl.dc=1.1}}
    if(act.shot){act.shot=false;if(b.owner===ctrl)kick(ctrl,mouse.x,mouse.y,265,0)}
    
    for(const p of all){
        p.cd-=dt;p.tk-=dt;p.bo-=dt;p.dc-=dt;const d=p.team?-1:1;
        if(p===ctrl){
            const x=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),y=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0),l=Math.hypot(x,y),
            s=SP*(p.bo>0?1.9:1)*(b.owner===p?.94:1);p.dvx=l?x/l*s:0;p.dvy=l?y/l*s:0;
        }else{
            const A=prm(p),ow=b.owner;
            if(p.role==='gk')keeper(p,A,d);else if(ow===p)carrier(p,A,d,T[1-p.team]);
            else if(ow&&ow.team===p.team)support(p,A,d,T[1-p.team]);
            else if(ow)defend(p,A,d,T[1-p.team]);else loose(p,A);
        }
    }
    
    for(const p of all){
        p.vx+=(p.dvx-p.vx)*Math.min(1,dt*9);p.vy+=(p.dvy-p.vy)*Math.min(1,dt*9);
        p.x=cl(p.x+p.vx*dt,PX+3,PR-3);p.y=cl(p.y+p.vy*dt,PY+4,PB-1);
        const s=Math.hypot(p.vx,p.vy);if(s>8){p.fx=p.vx/s;p.fy=p.vy/s;p.an+=dt*s*.2}
    }
    
    for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){
        const a=all[i],c=all[j],dx=c.x-a.x,dy=c.y-a.y,l=Math.hypot(dx,dy);
        if(l<6&&l>0){const u=(6-l)/2/l;a.x-=dx*u;a.y-=dy*u;c.x+=dx*u;c.y+=dy*u}
    }
    
    if(b.owner){
        const w=b.owner;b.x=w.x+w.fx*5;b.y=w.y+w.fy*5;b.vx=w.vx;b.vy=w.vy;
        for(const q of T[1-w.team]){
            if(q.tk>0||q.cd>0||q.role==='gk')continue;
            if(Math.hypot(q.x-b.x,q.y-b.y)<7){
                q.tk=.7;const c=q.team===1?AP.tk:(q===ctrl?(q.bo>0?.75:.5):.3);
                if(Math.random()<c){take(q);break;}
            }
        }
    }else{
        b.vx*=Math.exp(-.8*dt);b.vy*=Math.exp(-.8*dt);b.x+=b.vx*dt;b.y+=b.vy*dt;
        for(const p of all){if(p.cd<=0&&Math.hypot(p.x-b.x,p.y-b.y)<6){take(p);break;}}
        if(b.y>CY-GH/2&&b.y<CY+GH/2){
            if(b.x<PX){goal(1)}else if(b.x > PR){goal(0)}
        }else{
            if(b.x<PX){b.x=PX;b.vx*=-0.5}if(b.x>PR){b.x=PR;b.vx*=-0.5}
        }
        if(b.y<PY){b.y=PY;b.vy*=-0.5}if(b.y>PB){b.y=PB;b.vy*=-0.5}
    }
}

/* ===== ADICIONE ESTE FINAL COMPLETO NO SEU ARQUIVO SCRIPT.JS ===== */

function draw(){
    g.fillStyle='#2e7d32';g.fillRect(0,0,W,H);
    g.strokeStyle='rgba(255,255,255,0.4)';g.lineWidth=1;
    g.strokeRect(PX,PY,PW,PH);g.beginPath();g.moveTo(PX+PW/2,PY);g.lineTo(PX+PW/2,PB);g.stroke();
    g.beginPath();g.arc(PX+PW/2,CY,25,0,Math.PI*2);g.stroke();
    g.fillStyle='#1b5e20';g.fillRect(PX-4,CY-GH/2,4,GH);g.fillRect(PR,CY-GH/2,4,GH);
    
    all.forEach(p=>{
        g.fillStyle=p.team?'#ff4d4d':(p===ctrl?'#4da6ff':'#ffffff');
        g.beginPath();g.arc(p.x,p.y,4,0,Math.PI*2);g.fill();g.stroke();
        g.fillStyle='#000';g.fillRect(p.x-2+p.fx*2,p.y-2+p.fy*2,1,1);
    });
    
    g.fillStyle='#fff';g.beginPath();g.arc(ball.x,ball.y,2,0,Math.PI*2);g.fill();g.stroke();
    
    $('sc').textContent=score[0]+' x '+score[1];
    let m=Math.floor(time/60),s=Math.floor(time%60);
    $('tm').textContent=m+':'+(s<10?'0':'')+s;
}

let lastT=performance.now();
function loop(t){
    let dt=(t-lastT)/1000;lastT=t;if(dt>.1)dt=.1;
    if(state==='play'){
        time-=dt;if(time<=0){time=0;endGame()}
        step(dt);
    }else if(state==='goal'){
        step(dt*0.2);gt-=dt;if(gt<=0){gl.hidden=true;state='play';reset(pk)}
    }
    draw();requestAnimationFrame(loop);
}

window.addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='Space')act.pass=true;if(e.code==='Escape')state='menu';});
window.addEventListener('keyup',e=>{keys[e.code]=false;});
cv.addEventListener('mousemove',e=>{const r=cv.getBoundingClientRect();mouse.x=(e.clientX-r.left)*(W/r.width);mouse.y=(e.clientY-r.top)*(H/r.height);});
cv.addEventListener('mousedown',e=>{if(e.button===0)act.shot=true;});

menu.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click',()=>{
        AP=LV[b.dataset.l];$('lv').textContent=AP.n;score=[0,0];time=120;
        build();reset(0);menu.hidden=true;state='play';cv.focus();
    });
});

$('fs-btn').addEventListener('click',()=>{if(cv.requestFullscreen){cv.requestFullscreen()}else if(cv.webkitRequestFullscreen){cv.webkitRequestFullscreen()}});
build();requestAnimationFrame(loop);
