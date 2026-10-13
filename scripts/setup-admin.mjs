// Uses the already authorized CLI account. No password or token is printed.
import {readFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {Firestore,FieldValue} from '@google-cloud/firestore';
import {OAuth2Client} from 'google-auth-library';
import * as cliAuth from 'firebase-tools/lib/auth.js';
import * as cliApi from 'firebase-tools/lib/api.js';
const config=JSON.parse(await readFile(`${homedir()}/.config/configstore/firebase-tools.json`,'utf8'));
const credential={async getAccessToken(){const result=await cliAuth.getAccessToken(config.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform','https://www.googleapis.com/auth/firebase']);return {access_token:result.access_token,expires_in:3600};}};
const app=initializeApp({projectId:'chino-web',credential});const auth=getAuth(app);
let admin;
try{admin=await auth.getUser('chino-site-admin');}catch(error){if(error.code!=='auth/user-not-found')throw error;
 if(!process.env.ADMIN_INITIAL_PASSWORD)throw new Error('ADMIN_INITIAL_PASSWORD is required to create the account');
 admin=await auth.createUser({uid:'chino-site-admin',email:'admin@chino-web.firebaseapp.com',password:process.env.ADMIN_INITIAL_PASSWORD,displayName:'Administración',emailVerified:true});
}
await auth.setCustomUserClaims(admin.uid,{...admin.customClaims,admin:true});
const client=new OAuth2Client(cliApi.clientId(),cliApi.clientSecret());client.setCredentials({refresh_token:config.tokens.refresh_token});
const db=new Firestore({projectId:'chino-web',authClient:client});
let pageToken,count=0;
do{const page=await auth.listUsers(1000,pageToken);for(const user of page.users){if(user.customClaims?.admin)continue;const ref=db.collection('communityProfiles').doc(user.uid);if(!(await ref.get()).exists)await ref.create({name:(user.displayName||'').slice(0,80),createdAt:FieldValue.serverTimestamp()});count++;}pageToken=page.pageToken;}while(pageToken);
console.log(JSON.stringify({adminConfigured:true,studentProfiles:count}));
await db.terminate();await deleteApp(app);process.exit(0);
