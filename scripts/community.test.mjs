import {test} from 'node:test';import assert from 'node:assert/strict';
import {validateProposal,summarizeEvents} from '../lib/community.ts';
import {meaningFor,setPublishedMeanings} from '../lib/translations.ts';
test('proposal validation requires vocabulary pinyin and text and limits payloads',()=>{
 const proposal={kind:'vocabulary',status:'pending',hanzi:'你好',pinyin:'',original:'',proposed:'Hola',language:'es',vocabularyType:'word',message:'',author:''};
 assert.ok(validateProposal(proposal));assert.equal(validateProposal({...proposal,pinyin:'nǐ hǎo'}),'');assert.ok(validateProposal({...proposal,kind:'suggestion',message:''}));assert.ok(validateProposal({...proposal,pinyin:'nǐ hǎo',proposed:'x'.repeat(1001)}));
});
test('analytics separates exercise sources and computes unique visitors and error rates',()=>{
 const visit={kind:'visit',source:'site',hanzi:'',correct:true,visitor:'a'};
 const stats=summarizeEvents([visit,visit,{...visit,visitor:'b'},{kind:'practice',source:'flashcards',hanzi:'水',correct:false,visitor:'a'},{kind:'practice',source:'flashcards',hanzi:'水',correct:true,visitor:'a'},{kind:'practice',source:'listening-tones',hanzi:'水',correct:false,visitor:'b'}]);
 assert.equal(stats.visitors,2);assert.equal(stats.attempts,3);assert.equal(stats.errors,2);assert.equal(stats.hardest.length,2);assert.equal(stats.hardest[0].attempts,2);
});
test('approved translations override only their language and preserve fallback meanings',()=>{
 setPublishedMeanings([{hanzi:'测试',language:'es',meaning:'Prueba aprobada'}]);assert.equal(meaningFor({hanzi:'测试',spanish:'Anterior'},'es'),'Prueba aprobada');assert.equal(meaningFor({hanzi:'其他',spanish:'Otro'},'es'),'Otro');setPublishedMeanings([]);
});
