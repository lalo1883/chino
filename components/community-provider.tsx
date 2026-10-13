'use client';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { library, type LibraryItem } from '@/app/content';
import { meaningFor, setPublishedMeanings } from '@/lib/translations';
import { sendProposal, trackVisit } from '@/lib/community-client';
import { type Proposal, type PublishedEntry } from '@/lib/community';
import { useLanguage } from './language-provider';

type Target = {hanzi:string; pinyin?:string; spanish?:string; meaning?:string};
const RevisionContext = createContext<LibraryItem[]>(library);
export function useCommunityContent(){return useContext(RevisionContext);}
const CommunityContext = createContext<(kind:Proposal['kind'], item?:Target)=>void>(()=>{});
export function CommunityProvider({children}:{children:ReactNode}) {
  const {language,t}=useLanguage();
  const [publishedLibrary,setPublishedLibrary]=useState<LibraryItem[]>(library);
  const [proposal,setProposal]=useState<Proposal|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [sent,setSent]=useState(false);
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    let active=true;
    void getDocs(collection(getFirebaseDb(),'publishedContent')).then(snapshot=>{
      if(!active) return;
      const entries=snapshot.docs.map(doc=>({...doc.data(),id:doc.id})) as (PublishedEntry & {id:string})[];
      setPublishedMeanings(entries);
      for(const entry of entries) {
        for(const item of library.filter(item=>item.hanzi===entry.hanzi)) { if(entry.language==='es') item.spanish=entry.meaning; }
        if(entry.kind!=='vocabulary' || library.some(item=>item.hanzi===entry.hanzi)) continue;
        const item:LibraryItem={id:`community-${entry.id}`,type:entry.vocabularyType,hanzi:entry.hanzi,pinyin:entry.pinyin,spanish:entry.meaning,category:'Comunidad',audio:`community-${entry.id}`,book:false};
        library.push(item);
      }
      if(entries.length) setPublishedLibrary([...library]);
    }).catch(()=>{});
    if(!window.location.pathname.startsWith('/admin')) trackVisit();
    return ()=>{active=false;};
  },[]);
  useEffect(()=>{if(proposal && !dialog.current?.open) dialog.current?.showModal();},[proposal]);
  const open=(kind:Proposal['kind'],item?:Target)=>{
    setError('');setSent(false);
    setProposal({kind,status:'pending',hanzi:item?.hanzi||'',pinyin:item?.pinyin||'',original:item?meaningFor(item,language):'',proposed:'',language,vocabularyType:'word',message:'',author:''});
  };
  const close=()=>{dialog.current?.close();setProposal(null);};
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();if(!proposal || busy)return;
    setBusy(true);setError('');
    try {await sendProposal(proposal);setSent(true);} catch(error){setError(error instanceof Error && !('code' in error)?error.message:t('No se pudo enviar. Revisa tu conexión e inténtalo otra vez.'));}
    finally{setBusy(false);}
  };
  const field=(key:keyof Proposal,value:string)=>setProposal(current=>current?{...current,[key]:value}:current);
  return <CommunityContext.Provider value={open}><RevisionContext.Provider value={publishedLibrary}>{children}</RevisionContext.Provider>
    <dialog ref={dialog} className="community-dialog" aria-labelledby="community-title" onCancel={close} onClose={()=>setProposal(null)}>
      <button className="dialog-close" onClick={close} aria-label={t('Cerrar')}>×</button>
      {sent?<div className="community-success"><span aria-hidden="true">✓</span><h2 id="community-title">{t('¡Gracias por aportar!')}</h2><p>{t('Tu propuesta llegó al buzón. La revisaremos antes de publicarla.')}</p><button className="community-primary" onClick={close}>{t('Seguir aprendiendo')}</button></div>:proposal && <>
        <p className="eyebrow">{t('CONSTRUIMOS ESTO JUNTOS')}</p><h2 id="community-title">{t(proposal.kind==='correction'?'Proponer una corrección':proposal.kind==='vocabulary'?'Agregar vocabulario':'Buzón de sugerencias')}</h2>
        <p className="community-intro">{t('Cada propuesta se revisa antes de publicarse.')}</p>
        <form onSubmit={submit}>
          {proposal.kind!=='suggestion' && <>
            <div className="community-fields"><label>{t('Chino')}<input value={proposal.hanzi} readOnly={proposal.kind==='correction'} onChange={e=>field('hanzi',e.target.value)} maxLength={150} required placeholder="你好" /></label><label>{t('Pinyin')}<input value={proposal.pinyin} readOnly={proposal.kind==='correction'} onChange={e=>field('pinyin',e.target.value)} maxLength={250} required={proposal.kind==='vocabulary'} placeholder="nǐ hǎo" /></label></div>
            {proposal.kind==='correction' && <div className="community-original"><small>{t('Traducción actual')}</small><p>{proposal.original}</p></div>}
            <div className="community-fields"><label>{t('Idioma')}<select value={proposal.language} onChange={e=>field('language',e.target.value)}><option value="es">Español</option><option value="en">English</option></select></label>{proposal.kind==='vocabulary' && <label>{t('Tipo')}<select value={proposal.vocabularyType} onChange={e=>field('vocabularyType',e.target.value)}><option value="word">{t('Palabra')}</option><option value="phrase">{t('Frase')}</option></select></label>}</div>
            <label>{t(proposal.kind==='correction'?'Tu traducción propuesta':'Traducción')}<textarea required value={proposal.proposed} onChange={e=>field('proposed',e.target.value)} maxLength={1000} rows={2} /></label>
          </>}
          <label>{t(proposal.kind==='suggestion'?'Tu sugerencia':'Contexto o explicación (opcional)')}<textarea value={proposal.message} onChange={e=>field('message',e.target.value)} required={proposal.kind==='suggestion'} maxLength={2000} rows={3} /></label>
          <label>{t('Tu nombre (opcional)')}<input value={proposal.author} onChange={e=>field('author',e.target.value)} maxLength={80} autoComplete="name" /></label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="community-primary" disabled={busy}>{t(busy?'Enviando…':'Enviar para revisión')}</button>
        </form></>}
    </dialog>
  </CommunityContext.Provider>;
}
export function CorrectTranslation({item}:{item:Target}) {
  const open=useContext(CommunityContext);const {t}=useLanguage();
  return <button type="button" className="translation-correct" onClick={event=>{event.stopPropagation();open('correction',item);}} aria-label={`${t('Corregir traducción')}: ${item.hanzi}`} title={t('Proponer una corrección')}>✎ <span>{t('Corregir')}</span></button>;
}
export function Translation({item}:{item:Target}) {
  const {language}=useLanguage();useCommunityContent();
  return <span className="translation-with-action">{meaningFor(item,language)}<CorrectTranslation item={item}/></span>;
}
export function CommunityLinks() {
  const open=useContext(CommunityContext);const {t}=useLanguage();
  return <div className="community-links"><span>{t('Ayúdanos a mejorar')}</span><button onClick={()=>open('vocabulary')}>{t('Agregar vocabulario')} +</button><button onClick={()=>open('suggestion')}>{t('Buzón de sugerencias')} →</button></div>;
}
