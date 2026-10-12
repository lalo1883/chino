export type ToneSyllable = { text: string; base: string; tone: number };
const toneMarks = ['\u0304', '\u0301', '\u030c', '\u0300'];
const syllables = new Set(('a ai an ang ao e ei en eng er o ou ba bai ban bang bao bei ben beng bi bian biao bie bin bing bo bu pa pai pan pang pao pei pen peng pi pian piao pie pin ping po pou pu ma mai man mang mao me mei men meng mi mian miao mie min ming miu mo mou mu fa fan fang fei fen feng fo fou fu da dai dan dang dao de dei den deng di dia dian diao die ding diu dong dou du duan dui dun duo ta tai tan tang tao te teng ti tian tiao tie ting tong tou tu tuan tui tun tuo na nai nan nang nao ne nei nen neng ni nian niang niao nie nin ning niu nong nou nu nü nuan nüe nuo la lai lan lang lao le lei leng li lia lian liang liao lie lin ling liu long lou lu lü luan lüe lun luo ga gai gan gang gao ge gei gen geng gong gou gu gua guai guan guang gui gun guo ka kai kan kang kao ke ken keng kong kou ku kua kuai kuan kuang kui kun kuo ha hai han hang hao he hei hen heng hong hou hu hua huai huan huang hui hun huo ji jia jian jiang jiao jie jin jing jiong jiu ju juan jue jun qi qia qian qiang qiao qie qin qing qiong qiu qu quan que qun xi xia xian xiang xiao xie xin xing xiong xiu xu xuan xue xun zha zhai zhan zhang zhao zhe zhei zhen zheng zhi zhong zhou zhu zhua zhuai zhuan zhuang zhui zhun zhuo cha chai chan chang chao che chen cheng chi chong chou chu chua chuai chuan chuang chui chun chuo sha shai shan shang shao she shei shen sheng shi shou shu shua shuai shuan shuang shui shun shuo ran rang rao re ren reng ri rong rou ru ruan rui run ruo za zai zan zang zao ze zei zen zeng zi zong zou zu zuan zui zun zuo ca cai can cang cao ce cen ceng ci cong cou cu cuan cui cun cuo sa sai san sang sao se sen seng si song sou su suan sui sun suo ya yan yang yao ye yi yin ying yo yong you yu yuan yue yun wa wai wan wang wei wen weng wo wu').split(' '));

function inspect(text: string): ToneSyllable | undefined {
  const decomposed = text.toLowerCase().normalize('NFD');
  const marks = [...decomposed].filter(char => toneMarks.includes(char));
  if (marks.length > 1) return;
  const base = decomposed.replace(/[\u0304\u0301\u030c\u0300]/g, '').normalize('NFC');
  if (!syllables.has(base)) return;
  return { text, base, tone: marks.length ? toneMarks.indexOf(marks[0]) + 1 : 5 };
}

/** Require a valid syllable for each character; omit ambiguous/nonstandard entries. */
export function splitToneSyllables(pinyin: string, hanzi: string): ToneSyllable[] {
  if (pinyin.includes('/')) return [];
  const target = [...hanzi].filter(char => /\p{Script=Han}/u.test(char)).length;
  if (!target || target > 8) return [];
  const chunks = pinyin.normalize('NFC').split(/[\s'’\p{P}]+/u).filter(Boolean);
  const text = chunks.join('');
  const boundaries = new Set<number>();
  let position = 0;
  for (const chunk of chunks.slice(0, -1)) { position += chunk.length; boundaries.add(position); }
  const failed = new Set<string>();
  function parse(start: number, remaining: number): ToneSyllable[] | undefined {
    if (!remaining) return start === text.length ? [] : undefined;
    const key = `${start}:${remaining}`;
    if (failed.has(key)) return;
    for (let end = Math.min(text.length, start + 6); end > start; end--) {
      if ([...boundaries].some(boundary => boundary > start && boundary < end)) continue;
      const syllable = inspect(text.slice(start, end));
      if (!syllable) continue;
      const tail = parse(end, remaining - 1);
      if (tail) return [syllable, ...tail];
    }
    failed.add(key);
  }
  return parse(0, target) || [];
}

export function withTone(base: string, tone: number) {
  if (tone === 5) return base;
  const lower = base.toLowerCase();
  let index = lower.indexOf('a');
  if (index < 0) index = lower.indexOf('e');
  if (index < 0 && lower.includes('ou')) index = lower.indexOf('o');
  if (index < 0) for (let i = lower.length - 1; i >= 0; i--) if ('iouü'.includes(lower[i])) { index = i; break; }
  if (index < 0) return base;
  return `${base.slice(0, index + 1)}${toneMarks[tone - 1] || ''}${base.slice(index + 1)}`.normalize('NFC');
}

export function stableHash(value: string) {
  return [...value].reduce((hash, char) => ((hash * 31 + char.charCodeAt(0)) >>> 0), 7);
}

export function listeningChoices<T extends { id: string }>(item: T, pool: T[], label: (item: T) => string) {
  const answer = label(item).trim().toLowerCase();
  const seen = new Set([answer]);
  const distractors = pool.filter(candidate => {
    const value = label(candidate).trim().toLowerCase();
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  }).sort((a, b) => stableHash(item.id + a.id) - stableHash(item.id + b.id)).slice(0, 3);
  return [item, ...distractors].sort((a, b) => stableHash(a.id + item.id) - stableHash(b.id + item.id));
}
