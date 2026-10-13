// Server-only OAuth credentials. Never import this module into a client component.
let cached:{token:string;until:number}|undefined;
const b64=(value:string)=>Buffer.from(value).toString('base64url');
export async function firebaseServerToken(){
  if(cached && cached.until>Date.now()+60000)return cached.token;
  let body:URLSearchParams;
  const json=process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if(json){
    const account=JSON.parse(json) as {client_email:string;private_key:string;project_id:string};
    if(account.project_id!=='chino-web')throw new Error('Wrong Firebase service account project');
    const now=Math.floor(Date.now()/1000);
    const header=b64(JSON.stringify({alg:'RS256',typ:'JWT'}));
    const payload=b64(JSON.stringify({iss:account.client_email,scope:'https://www.googleapis.com/auth/identitytoolkit',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
    const {createSign}=await import('node:crypto');
    const signer=createSign('RSA-SHA256');signer.update(`${header}.${payload}`);signer.end();
    const assertion=`${header}.${payload}.${signer.sign(account.private_key).toString('base64url')}`;
    body=new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion});
  }else if(process.env.NODE_ENV!=='production' && process.env.FIREBASE_SERVER_REFRESH_TOKEN){
    body=new URLSearchParams({grant_type:'refresh_token',refresh_token:process.env.FIREBASE_SERVER_REFRESH_TOKEN,client_id:'563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',client_secret:'j9iVZfS8kkCEFUPaAeJV0sAi'});
  }else throw new Error('Firebase server credentials are not configured');
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body,cache:'no-store'});
  if(!response.ok)throw new Error('Firebase server authorization failed');
  const result=await response.json() as {access_token:string;expires_in:number};cached={token:result.access_token,until:Date.now()+result.expires_in*1000};return cached.token;
}
