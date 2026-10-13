import {firebaseServerToken} from '@/lib/firebase-server-token';
export const dynamic='force-dynamic';
export async function GET(request:Request){
  const headers={'Cache-Control':'no-store'};
  const authorization=request.headers.get('authorization')||'';
  if(!authorization.startsWith('Bearer '))return Response.json({error:'Unauthorized'},{status:401,headers});
  try{
    // Authentication's lookup validates the token with Firebase, including expiry.
    const lookup=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY||'AIzaSyBz41YqHp0zr1yCaoeYjtbtw4SPVnb_AnE'}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:authorization.slice(7)}),cache:'no-store'});
    if(!lookup.ok)return Response.json({error:'Unauthorized'},{status:401,headers});
    const account=(await lookup.json() as {users?:Array<{customAttributes?:string}>}).users?.[0];
    if(!account || JSON.parse(account.customAttributes||'{}').admin!==true)return Response.json({error:'Forbidden'},{status:403,headers});
    const token=await firebaseServerToken();let count=0,pageToken:string|undefined;
    do{
      const params=new URLSearchParams({maxResults:'1000'});if(pageToken)params.set('nextPageToken',pageToken);
      const response=await fetch(`https://identitytoolkit.googleapis.com/v1/projects/chino-web/accounts:batchGet?${params}`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
      if(!response.ok)throw new Error('Firebase account count failed');
      const data=await response.json() as {users?:Array<{customAttributes?:string}>;nextPageToken?:string};count+=(data.users||[]).filter((user:{customAttributes?:string})=>JSON.parse(user.customAttributes||'{}').admin!==true).length;pageToken=data.nextPageToken;
    }while(pageToken);
    return Response.json({count},{headers});
  }catch{return Response.json({error:'No se pudo consultar Firebase Authentication.'},{status:503,headers});}
}
