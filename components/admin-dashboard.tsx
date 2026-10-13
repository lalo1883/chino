'use client';
import Link from 'next/link';
import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {onAuthStateChanged,signInWithEmailAndPassword,signOut,browserSessionPersistence,setPersistence,type User} from 'firebase/auth';
import {collection,query,orderBy,limit,getDocs,getCountFromServer,where,Timestamp,startAfter,type QueryDocumentSnapshot} from 'firebase/firestore';
import {adminServices,moderateProposal} from '@/lib/admin-client';
import {summarizeEvents,type LearningEvent,type Proposal} from '@/lib/community';
import {BrandMark} from './brand-mark';

type Row=Proposal & {id:string;createdAt?:Timestamp;reviewNote?:string;approvedText?:string};
type Stats={accounts:number;accountsExact:boolean;pending:number;progressUsers:number;reviews:number;events:ReturnType<typeof summarizeEvents>;truncated:boolean;daily:Array<{date:string;attempts:number;errors:number}>};
const kinds={correction:'Correcciones',vocabulary:'Vocabulario',suggestion:'Sugerencias'};
const sources:Record<string,string>={flashcards:'Recuerdo declarado', 'listening-meaning':'Listening · significado','listening-tones':'Listening · tonos',writing:'Writing · sin errores',speaking:'Speaking · reconocimiento'};
export function AdminDashboard(){
  const [user,setUser]=useState<User|null>(null),[checking,setChecking]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [stats,setStats]=useState<Stats|null>(null),[rows,setRows]=useState<Row[]>([]),[selected,setSelected]=useState<Row|null>(null),[note,setNote]=useState(''),[notice,setNotice]=useState('');
  const [status,setStatus]=useState<'pending'|'approved'|'rejected'>('pending'),[kind,setKind]=useState<'all'|Proposal['kind']>('all'),[cursor,setCursor]=useState<QueryDocumentSnapshot|null>(null),[hasMore,setHasMore]=useState(false);
  const refresh=useCallback(async()=>{
    if(!user)return;
    setBusy(true);setError('');
    try{
      const {db}=adminServices();
      const since=Timestamp.fromMillis(Date.now()-30*86400000);
      const [profiles,pending,progress,events,accounts]=await Promise.all([
        getCountFromServer(collection(db,'communityProfiles')),
        getCountFromServer(query(collection(db,'communityInbox'),where('status','==','pending'))),
        getDocs(collection(db,'userProgress')),
        getDocs(query(collection(db,'learningEvents'),where('createdAt','>=',since),orderBy('createdAt','desc'),limit(10000))),
        user.getIdToken().then(token=>fetch('/api/admin/accounts',{headers:{Authorization:`Bearer ${token}`},cache:'no-store'})).then(async response=>response.ok?await response.json() as {count:number}:null).catch(()=>null),
      ]);
      let reviews=0;progress.forEach(doc=>{Object.values(doc.data().records || {}).forEach(value=>{reviews+=Number((value as {reviews?:number}).reviews)||0;});});
      const data=events.docs.map(doc=>doc.data() as LearningEvent & {createdAt:Timestamp});
      const daily=new Map<string,{date:string;attempts:number;errors:number}>();
      for(const event of data){if(event.kind!=='practice')continue;const date=event.createdAt.toDate().toISOString().slice(0,10);const day=daily.get(date)||{date,attempts:0,errors:0};day.attempts++;if(!event.correct)day.errors++;daily.set(date,day);}
      setStats({accounts:accounts?.count ?? profiles.data().count,accountsExact:Boolean(accounts),pending:pending.data().count,progressUsers:progress.size,reviews,events:summarizeEvents(data),truncated:events.size===10000,daily:[...daily.values()].sort((a,b)=>a.date.localeCompare(b.date)).slice(-14)});
    }catch{setError('No se pudieron cargar las estadísticas. Revisa tu conexión o los permisos de Firebase.');}
    finally{setBusy(false);}
  },[user]);
  const loadInbox=useCallback(async(more=false)=>{
    const {db}=adminServices();
    const constraints=[orderBy('createdAt','desc'),limit(200)];
    const snapshot=await getDocs(query(collection(db,'communityInbox'),...constraints,...(more&&cursor?[startAfter(cursor)]:[])));
    const next=snapshot.docs.map(doc=>({...doc.data(),id:doc.id}) as Row);
    setRows(current=>more?[...current,...next]:next);setCursor(snapshot.docs.at(-1)||null);setHasMore(snapshot.size===200);
  },[cursor]);
  useEffect(()=>onAuthStateChanged(adminServices().auth,async account=>{
    try{
      if(account && (await account.getIdTokenResult()).claims.admin===true)setUser(account);
      else {setUser(null);if(account)await signOut(adminServices().auth);}
    }catch{setUser(null);}finally{setChecking(false);}
  }),[]);
  // Load protected remote data when an authenticated administrator becomes available.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{if(!user)return;void refresh();void loadInbox().catch(()=>setError('No se pudo cargar el buzón.'));const timer=setTimeout(()=>void signOut(adminServices().auth),8*60*60*1000);return()=>clearTimeout(timer);},[user,refresh]); // eslint-disable-line react-hooks/exhaustive-deps
  const login=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();setBusy(true);setError('');const password=String(new FormData(event.currentTarget).get('password')||'');
    try{const {auth}=adminServices();await setPersistence(auth,browserSessionPersistence);const result=await signInWithEmailAndPassword(auth,'admin@chino-web.firebaseapp.com',password);if((await result.user.getIdTokenResult()).claims.admin!==true)throw new Error('not-admin');}
    catch{setError('No se pudo entrar. Revisa la contraseña o espera un momento si hiciste varios intentos.');}
    finally{setBusy(false);}
  };
  const review=async(decision:'approved'|'rejected')=>{
    if(!selected || busy)return;setBusy(true);setError('');
    try{await moderateProposal(selected.id,decision,selected,note);setNotice(decision==='approved'?'Propuesta aprobada. El contenido estará disponible al abrir o recargar la página.':'Propuesta rechazada. El contenido no se publicó.');setSelected(null);await loadInbox();await refresh();}
    catch(error){setError(error instanceof Error?error.message:'No se pudo revisar la propuesta.');}
    finally{setBusy(false);}
  };
  if(checking)return <main className="admin-login"><p role="status">Comprobando acceso…</p></main>;
  if(!user)return <main className="admin-login"><Link href="/" className="admin-back">← Volver a Chino</Link><section><p className="eyebrow">ACCESO PRIVADO</p><h1>Tu espacio de administración.</h1><p>Revisa propuestas, escucha a la comunidad y descubre qué necesita más práctica.</p><form onSubmit={login}><label>Contraseña<input name="password" type="password" autoComplete="current-password" required /></label>{error&&<p className="auth-error" role="alert">{error}</p>}<button className="community-primary" disabled={busy}>{busy?'Entrando…':'Entrar a administración →'}</button></form></section></main>;
  const visible=rows.filter(row=>row.status===status && (kind==='all'||row.kind===kind));
  return <main className="admin-shell"><header className="admin-top"><Link href="/" className="brand"><BrandMark className="brand-mark"/><span>Chino <small>Administración</small></span></Link><div><button disabled={busy} onClick={()=>{void refresh();void loadInbox().catch(()=>setError('No se pudo actualizar el buzón.'));}}>↻ Actualizar</button><button onClick={()=>void signOut(adminServices().auth)}>Salir</button></div></header>
    <div className="admin-heading"><div><p className="eyebrow">VISTA GENERAL</p><h1>Tu comunidad, de un vistazo.</h1><p>Lo que está pasando y lo que espera tu revisión.</p></div><span className="admin-period">Actividad · últimos 30 días</span></div>
    {error&&<p className="auth-error" role="alert">{error}</p>}{notice&&<p className="auth-notice" role="status">{notice}</p>}
    <section className="admin-metrics" aria-label="Estadísticas"><Metric value={stats?.accounts} label={stats?.accountsExact?'Cuentas registradas':'Perfiles sincronizados'}/><Metric value={stats?.events.visitors} label="Visitantes únicos · 30 días"/><Metric value={stats?.events.attempts} label="Intentos de práctica · 30 días"/><Metric value={stats?.pending} label="Propuestas por revisar"/></section>
    {!stats?.accountsExact && stats && <p className="admin-caption">El recuento muestra perfiles sincronizados. Configura las credenciales del servidor para consultar el total exacto de Firebase Authentication.</p>}
    <div className="admin-grid"><section className="admin-panel"><div className="admin-section-heading"><div><h2>Buzón de la comunidad</h2><p>Tú decides qué se publica.</p></div><span>{stats?.pending??'—'} pendientes</span></div>
      <div className="admin-filters"><select aria-label="Estado de las propuestas" value={status} onChange={e=>setStatus(e.target.value as typeof status)}><option value="pending">Pendientes</option><option value="approved">Aprobadas</option><option value="rejected">Rechazadas</option></select><select aria-label="Tipo de propuesta" value={kind} onChange={e=>setKind(e.target.value as typeof kind)}><option value="all">Todas las propuestas</option>{Object.entries(kinds).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>
      <div className="admin-inbox">{visible.map(row=><button key={row.id} className={`admin-inbox-row ${selected?.id===row.id?'selected':''}`} onClick={()=>{setSelected(row);setNote(row.reviewNote||'');setNotice('');}}><span className={`admin-kind ${row.kind}`}>{row.kind==='correction'?'✎':row.kind==='vocabulary'?'+':'☏'}</span><span><small>{kinds[row.kind]}</small><b>{row.hanzi || row.message.slice(0,70)}</b><em>{row.proposed || row.message}</em><small>{row.author||'Anónimo'} · {row.createdAt?.toDate().toLocaleDateString('es')}</small></span><span aria-hidden="true">→</span></button>)}{!visible.length&&<div className="admin-empty"><b>Todo despejado por aquí.</b><p>No hay propuestas {status==='pending'?'pendientes':status==='approved'?'aprobadas':'rechazadas'} en esta selección.</p></div>}</div>
      {hasMore&&<button className="admin-load" onClick={()=>void loadInbox(true).catch(()=>setError('No se pudieron cargar más propuestas.'))}>Cargar propuestas anteriores</button>}
    </section><section className="admin-panel admin-review" aria-labelledby="review-title"><h2 id="review-title">{selected?'Revisar propuesta':'Elige una propuesta'}</h2>{selected?<><p className="admin-caption">{kinds[selected.kind]} · {selected.language==='es'?'Español':'English'}</p>{selected.hanzi&&<div className="admin-review-hanzi">{selected.hanzi}<small>{selected.pinyin}</small></div>}{selected.original&&<div className="community-original"><small>Traducción actual</small><p>{selected.original}</p></div>}{selected.kind!=='suggestion'&&<label>Texto que se publicará<textarea maxLength={1000} rows={3} disabled={selected.status!=='pending'||busy} value={selected.status==='approved'?selected.approvedText||selected.proposed:selected.proposed} onChange={e=>setSelected({...selected,proposed:e.target.value})}/></label>}{selected.message&&<blockquote>{selected.message}</blockquote>}<label>Nota de revisión<textarea rows={2} maxLength={1000} disabled={selected.status!=='pending'||busy} value={note} onChange={e=>setNote(e.target.value)}/></label>{selected.status==='pending'?<div className="admin-review-actions"><button className="community-primary" disabled={busy} onClick={()=>void review('approved')}>{selected.kind==='suggestion'?'Marcar como revisada':'Aprobar y publicar'}</button><button className="admin-reject" disabled={busy} onClick={()=>void review('rejected')}>Rechazar</button></div>:<p className="auth-notice">Esta propuesta ya fue revisada. {selected.status==='approved'?'Aprobada':'Rechazada'}.</p>}</>:<div className="admin-empty"><span aria-hidden="true">✎</span><p>Compara la traducción, ajusta el texto si hace falta y aprueba su publicación.</p></div>}</section></div>
    <div className="admin-grid"><section className="admin-panel"><h2>Lo que más cuesta</h2><p className="admin-caption">Intentos registrados desde que se habilitó este panel. Speaking mide reconocimiento del navegador; flashcards recoge la valoración del estudiante.</p>{stats?.truncated&&<p className="auth-notice">Se muestran los últimos 10.000 eventos de los 30 días.</p>}<div className="admin-table-wrap"><table><thead><tr><th>Contenido</th><th>Ejercicio</th><th>Intentos</th><th>Fallos</th><th>Tasa</th></tr></thead><tbody>{stats?.events.hardest.slice(0,15).map(row=><tr key={`${row.source}:${row.hanzi}`}><td lang="zh-Hans">{row.hanzi}</td><td>{sources[row.source]||row.source}</td><td>{row.attempts}</td><td>{row.errors}</td><td>{Math.round(row.errors/row.attempts*100)}%</td></tr>)}</tbody></table></div>{!stats?.events.attempts&&<div className="admin-empty">Las próximas prácticas aparecerán aquí.</div>}</section><section className="admin-panel"><h2>Actividad reciente</h2><p className="admin-caption">Intentos por día (UTC) · últimos 14 días con actividad</p><div className="admin-chart">{stats?.daily.map(day=><div key={day.date}><span>{day.date.slice(5)}</span><div><i style={{width:`${day.attempts/Math.max(...stats.daily.map(d=>d.attempts),1)*100}%`}}/></div><b>{day.attempts}</b></div>)}</div><div className="admin-secondary-metrics"><Metric value={stats?.progressUsers} label="Cuentas con progreso"/><Metric value={stats?.reviews} label="Repasos acumulados guardados"/></div><p className="admin-caption">Las visitas usan un identificador aleatorio del navegador. No guardamos grabaciones, texto reconocido, correo ni dirección IP en los eventos.</p></section></div>
  </main>;
}
function Metric({value,label}:{value:number|undefined;label:string}){return <article><b>{value===undefined?'—':value.toLocaleString('es')}</b><span>{label}</span></article>;}
