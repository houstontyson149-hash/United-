const express=require('express'),session=require('express-session'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const seed=require('./seed');
const E=process.env, PORT=E.PORT||3000;
const REDIRECT=E.DISCORD_REDIRECT_URI||`http://localhost:${PORT}/auth/discord/callback`;
const ENV_ADMINS=(E.ADMIN_DISCORD_IDS||'').split(',').map(s=>s.trim()).filter(Boolean);
const DIR=E.DATA_DIR||path.join(__dirname,'data');fs.mkdirSync(DIR,{recursive:true});
const FILE=path.join(DIR,'db.json');
let db=fs.existsSync(FILE)?JSON.parse(fs.readFileSync(FILE,'utf8')):{airports:seed.airports,fleet:seed.fleet,routes:[],admins:[]};
const save=()=>fs.writeFileSync(FILE,JSON.stringify(db,null,2));
save();

const app=express();
app.set('trust proxy',1);
app.use(express.json({limit:'1mb'}));
app.use(session({secret:E.SESSION_SECRET||'dev-secret',resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:'lax',secure:'auto',maxAge:7*864e5}}));
const isAdmin=id=>!!id&&(ENV_ADMINS.includes(id)||db.admins.includes(id));
const requireAdmin=(req,res,next)=>isAdmin(req.session.user?.id)?next():res.status(403).json({error:'Admins only'});

// ---- Discord OAuth: admin status is decided by the Discord user ID, never by anything the client sends
app.get('/auth/discord',(req,res)=>{
  if(!E.DISCORD_CLIENT_ID)return res.status(500).send('Set DISCORD_CLIENT_ID in .env');
  const state=crypto.randomBytes(16).toString('hex');req.session.state=state;req.session.next=req.query.next==='admin'?'/admin.html':'/';
  res.redirect('https://discord.com/oauth2/authorize?'+new URLSearchParams({client_id:E.DISCORD_CLIENT_ID,response_type:'code',redirect_uri:REDIRECT,scope:'identify',state}));
});
app.get('/auth/discord/callback',async(req,res)=>{
  try{
    if(!req.query.code||req.query.state!==req.session.state)return res.status(400).send('Login expired. Try again.');
    const t=await fetch('https://discord.com/api/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({client_id:E.DISCORD_CLIENT_ID,client_secret:E.DISCORD_CLIENT_SECRET,grant_type:'authorization_code',code:req.query.code,redirect_uri:REDIRECT})}).then(r=>r.json());
    if(!t.access_token)return res.status(400).send('Discord login failed.');
    const u=await fetch('https://discord.com/api/users/@me',{headers:{Authorization:'Bearer '+t.access_token}}).then(r=>r.json());
    const next=req.session.next||'/';
    req.session.regenerate(()=>{req.session.user={id:u.id,name:u.global_name||u.username,avatar:u.avatar?`https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64`:null};res.redirect(next)});
  }catch(e){res.status(500).send('Login error.')}
});
app.get('/auth/logout',(req,res)=>req.session.destroy(()=>res.redirect('/')));
app.get('/api/me',(req,res)=>{const u=req.session.user;res.json(u?{...u,admin:isAdmin(u.id)}:null)});

// ---- Public data
app.get('/api/airports',(q,r)=>r.json(db.airports));
app.get('/api/fleet',(q,r)=>r.json(db.fleet));
app.get('/api/routes',(q,r)=>r.json(db.routes));

// ---- Admin data
const kinds={airports:'iata',fleet:'id',routes:'id'};
const s=(v,n=60)=>String(v??'').trim().slice(0,n);
function clean(kind,b){
  if(kind==='airports'){const o={iata:s(b.iata,3).toUpperCase(),name:s(b.name),city:s(b.city),country:s(b.country,2).toUpperCase()||'US'};return /^[A-Z]{3}$/.test(o.iata)&&o.name?o:null}
  if(kind==='fleet'){const o={id:s(b.id,6).toUpperCase(),name:s(b.name),manufacturer:s(b.manufacturer),seats:Math.max(1,parseInt(b.seats)||0)};return o.id&&o.name&&o.seats?o:null}
  const o={id:s(b.id)||crypto.randomUUID(),flightNumber:s(b.flightNumber,8).toUpperCase(),from:s(b.from,3).toUpperCase(),to:s(b.to,3).toUpperCase(),aircraft:s(b.aircraft,6).toUpperCase(),depart:s(b.depart,5),arrive:s(b.arrive,5)};
  const ok=o.flightNumber&&o.from!==o.to&&db.airports.some(a=>a.iata===o.from)&&db.airports.some(a=>a.iata===o.to)&&db.fleet.some(f=>f.id===o.aircraft)&&/^\d{2}:\d{2}$/.test(o.depart)&&/^\d{2}:\d{2}$/.test(o.arrive);
  return ok?o:null;
}
function upsert(kind,o){const k=kinds[kind],i=db[kind].findIndex(x=>x[k]===o[k]);i<0?db[kind].push(o):db[kind][i]=o}
app.post('/api/admin/import-routes',requireAdmin,(req,res)=>{ // CSV: flightNumber,from,to,aircraft,depart,arrive
  let added=0,bad=[];
  String(req.body.csv||'').split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!/^flight/i.test(l)).forEach((l,i)=>{
    const [flightNumber,from,to,aircraft,depart,arrive]=l.split(',').map(x=>x.trim());
    const o=clean('routes',{flightNumber,from,to,aircraft,depart,arrive});o?(upsert('routes',o),added++):bad.push(i+1)});
  save();res.json({added,bad});
});
app.post('/api/admin/admins',requireAdmin,(req,res)=>{const id=s(req.body.id,25);if(!/^\d{15,25}$/.test(id))return res.status(400).json({error:'Enter a Discord user ID (numbers only)'});if(!db.admins.includes(id))db.admins.push(id);save();res.json(db.admins)});
app.delete('/api/admin/admins/:id',requireAdmin,(req,res)=>{db.admins=db.admins.filter(x=>x!==req.params.id);save();res.json(db.admins)});
app.get('/api/admin/admins',requireAdmin,(q,r)=>r.json({env:ENV_ADMINS,added:db.admins}));
app.post('/api/admin/:kind',requireAdmin,(req,res)=>{
  if(!kinds[req.params.kind])return res.sendStatus(404);
  const o=clean(req.params.kind,req.body);if(!o)return res.status(400).json({error:'Check the fields. Airports and aircraft used by a route must already exist.'});
  upsert(req.params.kind,o);save();res.json(o);
});
app.delete('/api/admin/:kind/:id',requireAdmin,(req,res)=>{
  const {kind,id}=req.params,k=kinds[kind];if(!k)return res.sendStatus(404);
  if(kind==='airports'&&db.routes.some(r=>r.from===id||r.to===id))return res.status(400).json({error:'Delete the routes that use this airport first.'});
  if(kind==='fleet'&&db.routes.some(r=>r.aircraft===id))return res.status(400).json({error:'Delete the routes that use this aircraft first.'});
  db[kind]=db[kind].filter(x=>x[k]!==id);save();res.json({ok:true});
});
app.use(express.static(path.join(__dirname,'public')));
app.listen(PORT,()=>console.log('Running on http://localhost:'+PORT));
