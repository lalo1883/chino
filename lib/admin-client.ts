'use client';
import {getApp,getApps,initializeApp} from 'firebase/app';
import {getAuth,connectAuthEmulator} from 'firebase/auth';
import {getFirestore,connectFirestoreEmulator,doc,runTransaction,serverTimestamp} from 'firebase/firestore';
import {firebaseConfig} from './firebase';
import {validateProposal,type Proposal} from './community';
const connected = new WeakSet();
export function adminServices(){
  const app=getApps().some(app=>app.name==='administration')?getApp('administration'):initializeApp(firebaseConfig,'administration');
  const auth=getAuth(app),db=getFirestore(app);
  if(process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS==='true' && ['localhost','127.0.0.1'].includes(window.location.hostname) && !connected.has(app)){
    connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8080);connected.add(app);
  }
  return {auth,db};
}
export async function moderateProposal(id:string,decision:'approved'|'rejected',edited:Proposal, note:string){
  if(decision==='approved') {const error=validateProposal(edited);if(error)throw new Error(error);}
  const {db}=adminServices();const ref=doc(db,'communityInbox',id);
  await runTransaction(db,async transaction=>{
    const snapshot=await transaction.get(ref);
    if(!snapshot.exists() || snapshot.data().status!=='pending')throw new Error('Esta propuesta ya fue revisada. Actualiza la bandeja.');
    const original=snapshot.data() as Proposal;
    if(original.kind!==edited.kind || original.hanzi!==edited.hanzi || original.language!==edited.language) throw new Error('No cambies el chino, idioma o tipo de una propuesta al revisarla.');
    if(decision==='approved' && edited.kind!=='suggestion'){
      const key=encodeURIComponent(`${edited.language}:${edited.hanzi}`);
      transaction.set(doc(db,'publishedContent',key),{hanzi:edited.hanzi,pinyin:edited.pinyin,meaning:edited.proposed.trim(),language:edited.language,vocabularyType:edited.vocabularyType,kind:edited.kind,proposalId:id,publishedAt:serverTimestamp()});
    }
    transaction.update(ref,{status:decision,reviewedAt:serverTimestamp(),reviewNote:note.slice(0,1000),approvedText:decision==='approved'?edited.proposed.trim():''});
  });
}
