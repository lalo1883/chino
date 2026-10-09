import { exampleSource } from './examples.ts';

export type Segment = { hanzi: string; pinyin: string; meaning: string };

export type LibraryItem = {
  id: string;
  type: 'word' | 'phrase';
  hanzi: string;
  pinyin: string;
  spanish: string;
  category: string;
  audio: string;
  /** Aparece en las lecciones del libro. */
  book: boolean;
  breakdown?: Segment[];
};

export type Example = {
  hanzi: string;
  pinyin: string;
  spanish: string;
  audio: string;
  breakdown: Segment[];
  /** Si el ejemplo es una tarjeta de la biblioteca, su id. */
  itemId?: string;
};

const wordSource = `
我|wǒ|yo / me|Personas
你|nǐ|tú|Personas
您|nín|usted (cortés)|Personas
他|tā|él|Personas
她|tā|ella|Personas
我们|wǒmen|nosotros|Personas
你们|nǐmen|ustedes|Personas
这|zhè|esto / este|Preguntas
那|nà|eso / aquel|Preguntas
哪|nǎ|cuál|Preguntas
谁|shéi|quién|Preguntas
什么|shénme|qué|Preguntas
怎么|zěnme|cómo|Preguntas
为什么|wèishénme|por qué|Preguntas
的|de|partícula posesiva|Gramática
了|le|acción completada / cambio|Gramática
吗|ma|partícula de pregunta|Gramática
呢|ne|partícula de continuación|Gramática
和|hé|y / con|Gramática
也|yě|también|Gramática
是|shì|ser / sí|Verbos
有|yǒu|tener / haber|Verbos
在|zài|estar en|Verbos
去|qù|ir|Verbos
来|lái|venir|Verbos
想|xiǎng|querer / pensar|Verbos
要|yào|querer / necesitar|Verbos
喜欢|xǐhuan|gustar|Verbos
爱|ài|amar / encantar|Verbos
吃|chī|comer|Verbos
喝|hē|beber|Verbos
看|kàn|mirar / leer|Verbos
听|tīng|escuchar|Verbos
说|shuō|hablar / decir|Verbos
读|dú|leer en voz alta|Verbos
写|xiě|escribir|Verbos
学习|xuéxí|estudiar / aprender|Verbos
工作|gōngzuò|trabajar / trabajo|Verbos
住|zhù|vivir / alojarse|Verbos
叫|jiào|llamarse|Verbos
认识|rènshi|conocer|Verbos
知道|zhīdào|saber|Verbos
明白|míngbai|entender|Verbos
会|huì|saber hacer / poder|Verbos
能|néng|poder / ser capaz|Verbos
可以|kěyǐ|poder / estar permitido|Verbos
给|gěi|dar / para|Verbos
买|mǎi|comprar|Verbos
卖|mài|vender|Verbos
做|zuò|hacer|Verbos
开|kāi|abrir / conducir|Verbos
关|guān|cerrar|Verbos
坐|zuò|sentarse / ir en|Verbos
走|zǒu|caminar / irse|Verbos
跑|pǎo|correr|Verbos
睡觉|shuìjiào|dormir|Verbos
起床|qǐchuáng|levantarse|Verbos
回|huí|volver|Verbos
等|děng|esperar|Verbos
问|wèn|preguntar|Verbos
回答|huídá|responder|Verbos
帮助|bāngzhù|ayudar / ayuda|Verbos
找|zhǎo|buscar / encontrar|Verbos
觉得|juéde|pensar / sentir que|Verbos
需要|xūyào|necesitar|Verbos
用|yòng|usar|Verbos
穿|chuān|vestir / llevar puesto|Verbos
带|dài|llevar / traer|Verbos
开始|kāishǐ|empezar|Verbos
结束|jiéshù|terminar|Verbos
好|hǎo|bueno / bien|Descripciones
坏|huài|malo / roto|Descripciones
大|dà|grande|Descripciones
小|xiǎo|pequeño|Descripciones
多|duō|mucho|Descripciones
少|shǎo|poco|Descripciones
高|gāo|alto|Descripciones
矮|ǎi|bajo de estatura|Descripciones
长|cháng|largo|Descripciones
短|duǎn|corto|Descripciones
新|xīn|nuevo|Descripciones
旧|jiù|viejo / usado|Descripciones
快|kuài|rápido|Descripciones
慢|màn|lento|Descripciones
热|rè|caliente|Descripciones
冷|lěng|frío|Descripciones
忙|máng|ocupado|Descripciones
累|lèi|cansado|Descripciones
饿|è|hambriento|Descripciones
渴|kě|sediento|Descripciones
漂亮|piàoliang|bonito|Descripciones
高兴|gāoxìng|contento|Descripciones
难|nán|difícil|Descripciones
容易|róngyì|fácil|Descripciones
贵|guì|caro|Descripciones
便宜|piányi|barato|Descripciones
一|yī|uno|Números
二|èr|dos|Números
三|sān|tres|Números
四|sì|cuatro|Números
五|wǔ|cinco|Números
六|liù|seis|Números
七|qī|siete|Números
八|bā|ocho|Números
九|jiǔ|nueve|Números
十|shí|diez|Números
百|bǎi|cien|Números
千|qiān|mil|Números
今天|jīntiān|hoy|Tiempo
明天|míngtiān|mañana|Tiempo
昨天|zuótiān|ayer|Tiempo
现在|xiànzài|ahora|Tiempo
时候|shíhou|momento / cuando|Tiempo
年|nián|año|Tiempo
月|yuè|mes / luna|Tiempo
日|rì|día (formal)|Tiempo
星期|xīngqī|semana|Tiempo
点|diǎn|hora en punto|Tiempo
分钟|fēnzhōng|minuto|Tiempo
早上|zǎoshang|mañana temprano|Tiempo
上午|shàngwǔ|mañana (a. m.)|Tiempo
中午|zhōngwǔ|mediodía|Tiempo
下午|xiàwǔ|tarde|Tiempo
晚上|wǎnshang|noche|Tiempo
每天|měitiān|cada día|Tiempo
时间|shíjiān|tiempo|Tiempo
人|rén|persona|Personas
名字|míngzi|nombre|Personas
朋友|péngyou|amigo/a|Personas
老师|lǎoshī|profesor/a|Personas
学生|xuésheng|estudiante|Personas
妈妈|māma|mamá|Familia
爸爸|bàba|papá|Familia
哥哥|gēge|hermano mayor|Familia
姐姐|jiějie|hermana mayor|Familia
弟弟|dìdi|hermano menor|Familia
妹妹|mèimei|hermana menor|Familia
孩子|háizi|niño/a|Familia
先生|xiānsheng|señor / esposo|Personas
小姐|xiǎojiě|señorita|Personas
医生|yīshēng|médico/a|Personas
同事|tóngshì|compañero de trabajo|Personas
家|jiā|casa / familia|Familia
中国|Zhōngguó|China|Lugares
西班牙|Xībānyá|España|Lugares
北京|Běijīng|Pekín|Lugares
学校|xuéxiào|escuela|Lugares
公司|gōngsī|empresa|Lugares
商店|shāngdiàn|tienda|Lugares
饭店|fàndiàn|restaurante / hotel|Lugares
医院|yīyuàn|hospital|Lugares
机场|jīchǎng|aeropuerto|Lugares
火车站|huǒchēzhàn|estación de tren|Lugares
房间|fángjiān|habitación|Objetos
厕所|cèsuǒ|baño|Lugares
桌子|zhuōzi|mesa|Objetos
椅子|yǐzi|silla|Objetos
手机|shǒujī|teléfono móvil|Objetos
电脑|diànnǎo|computadora|Objetos
书|shū|libro|Objetos
钱|qián|dinero|Compras
水|shuǐ|agua|Comida
茶|chá|té|Comida
咖啡|kāfēi|café|Comida
米饭|mǐfàn|arroz cocido|Comida
面条|miàntiáo|fideos|Comida
苹果|píngguǒ|manzana|Comida
车|chē|vehículo / coche|Transporte
出租车|chūzūchē|taxi|Transporte
公共汽车|gōnggòng qìchē|autobús|Transporte
地铁|dìtiě|metro|Transporte
飞机|fēijī|avión|Transporte
火车|huǒchē|tren|Transporte
票|piào|billete / entrada|Transporte
路|lù|camino / calle|Direcciones
左边|zuǒbian|lado izquierdo|Direcciones
右边|yòubian|lado derecho|Direcciones
里面|lǐmiàn|dentro|Direcciones
外面|wàimiàn|fuera|Direcciones
上面|shàngmiàn|encima|Direcciones
下面|xiàmiàn|debajo|Direcciones
这里|zhèlǐ|aquí|Direcciones
那里|nàlǐ|allí|Direcciones
天气|tiānqì|clima|Vida diaria
雨|yǔ|lluvia|Vida diaria
太阳|tàiyáng|sol|Vida diaria
衣服|yīfu|ropa|Vida diaria
东西|dōngxi|cosa / objeto|Vida diaria
菜|cài|plato / verdura|Comida
菜单|càidān|menú|Comida
号码|hàomǎ|número|Vida diaria
不|bù|no|Expresiones
没|méi|no haber / no tener|Expresiones
很|hěn|muy|Expresiones
太|tài|demasiado / muy|Expresiones
都|dōu|todos|Expresiones
还|hái|todavía / además|Expresiones
再|zài|otra vez / después|Expresiones
因为|yīnwèi|porque|Conectores
所以|suǒyǐ|por eso|Conectores
但是|dànshì|pero|Conectores
如果|rúguǒ|si (condición)|Conectores
对不起|duìbuqǐ|lo siento|Cortesía
谢谢|xièxie|gracias|Cortesía
请|qǐng|por favor|Cortesía
再见|zàijiàn|adiós|Cortesía
不客气|bú kèqi|de nada|Cortesía
没关系|méi guānxi|no pasa nada|Cortesía
留学生|liúxuéshēng|estudiante extranjero|Personas
同学|tóngxué|compañero de clase|Personas
他们|tāmen|ellos / ellas|Personas
大学生|dàxuéshēng|estudiante universitario|Personas
职员|zhíyuán|empleado/a de oficina|Personas
律师|lǜshī|abogado/a|Personas
班|bān|clase / grupo|Vida diaria
汉语|Hànyǔ|idioma chino|Vida diaria
上课|shàngkè|tener clase|Verbos
一起|yìqǐ|juntos|Expresiones
几|jǐ|cuántos (pocos)|Preguntas
多少|duōshao|cuánto / cuántos|Preguntas
个|gè|clasificador general|Gramática
口|kǒu|clasificador de personas de la familia|Gramática
两|liǎng|dos (para contar)|Números
法国|Fǎguó|Francia|Lugares
零|líng|cero|Números
半|bàn|medio / y media|Tiempo
块|kuài|yuan (dinero) / pieza|Compras
岁|suì|años de edad|Números
杯|bēi|vaso / taza (clasificador)|Gramática
本|běn|clasificador de libros|Gramática
哪里|nǎlǐ|dónde|Preguntas
怎么样|zěnmeyàng|¿qué tal? / ¿cómo está?|Preguntas
好吃|hǎochī|rico (de sabor)|Descripciones
饺子|jiǎozi|dumplings (empanadillas)|Comida
包子|bāozi|panecillo relleno|Comida
水果|shuǐguǒ|fruta|Comida
香蕉|xiāngjiāo|plátano|Comida
面包|miànbāo|pan|Comida
鸡蛋|jīdàn|huevo|Comida
牛奶|niúnǎi|leche|Comida
果汁|guǒzhī|zumo|Comida
啤酒|píjiǔ|cerveza|Comida
筷子|kuàizi|palillos|Comida
勺子|sháozi|cuchara|Comida
碗|wǎn|cuenco|Comida
杯子|bēizi|taza / vaso|Comida
纸巾|zhǐjīn|servilleta / pañuelo de papel|Objetos
袋子|dàizi|bolsa|Objetos
笔|bǐ|bolígrafo|Objetos
纸|zhǐ|papel|Objetos
充电器|chōngdiànqì|cargador|Objetos
鞋|xié|zapatos|Objetos
雨伞|yǔsǎn|paraguas|Objetos
毛巾|máojīn|toalla|Objetos
肥皂|féizào|jabón|Objetos
地图|dìtú|mapa|Viaje
护照|hùzhào|pasaporte|Viaje
钥匙|yàoshi|llaves|Viaje
药|yào|medicina|Vida diaria
发票|fāpiào|factura|Compras
`;

const objects = [
  ['水','shuǐ','agua'],['茶','chá','té'],['咖啡','kāfēi','café'],['米饭','mǐfàn','arroz'],
  ['面条','miàntiáo','fideos'],['饺子','jiǎozi','dumplings'],['包子','bāozi','panecillos rellenos'],['菜','cài','comida'],
  ['水果','shuǐguǒ','fruta'],['苹果','píngguǒ','manzana'],['香蕉','xiāngjiāo','plátano'],['面包','miànbāo','pan'],
  ['鸡蛋','jīdàn','huevo'],['牛奶','niúnǎi','leche'],['果汁','guǒzhī','zumo'],['啤酒','píjiǔ','cerveza'],
  ['菜单','càidān','menú'],['筷子','kuàizi','palillos'],['勺子','sháozi','cuchara'],['碗','wǎn','cuenco'],
  ['杯子','bēizi','taza'],['纸巾','zhǐjīn','servilleta'],['袋子','dàizi','bolsa'],['书','shū','libro'],
  ['笔','bǐ','bolígrafo'],['纸','zhǐ','papel'],['手机','shǒujī','teléfono'],['充电器','chōngdiànqì','cargador'],
  ['电脑','diànnǎo','computadora'],['衣服','yīfu','ropa'],['鞋','xié','zapatos'],['票','piào','billete'],
  ['地图','dìtú','mapa'],['护照','hùzhào','pasaporte'],['钥匙','yàoshi','llaves'],['药','yào','medicina'],
  ['雨伞','yǔsǎn','paraguas'],['毛巾','máojīn','toalla'],['肥皂','féizào','jabón'],['发票','fāpiào','factura'],
] as const;


type LessonRow = [string, string, string, Array<[string, string, string]>];

const lessonRows: LessonRow[] = [
  ['她是留学生。', 'Tā shì liúxuéshēng.', 'Ella es estudiante extranjera.', [['她','tā','ella'],['是','shì','ser'],['留学生','liúxuéshēng','estudiante extranjero']]],
  ['他们学习汉语。', 'Tāmen xuéxí Hànyǔ.', 'Ellos estudian chino.', [['他们','tāmen','ellos'],['学习','xuéxí','estudiar'],['汉语','Hànyǔ','idioma chino']]],
  ['你学习什么？', 'Nǐ xuéxí shénme?', '¿Qué estudias?', [['你','nǐ','tú'],['学习','xuéxí','estudiar'],['什么','shénme','qué']]],
  ['我们一起上课。', 'Wǒmen yìqǐ shàngkè.', 'Tenemos clase juntos.', [['我们','wǒmen','nosotros'],['一起','yìqǐ','juntos'],['上课','shàngkè','tener clase']]],
  ['我和同学一起说汉语。', 'Wǒ hé tóngxué yìqǐ shuō Hànyǔ.', 'Hablo chino junto con mis compañeros.', [['我','wǒ','yo'],['和','hé','y'],['同学','tóngxué','compañero de clase'],['一起','yìqǐ','juntos'],['说','shuō','hablar'],['汉语','Hànyǔ','idioma chino']]],
  ['你是中国人吗？', 'Nǐ shì Zhōngguó rén ma?', '¿Eres chino?', [['你','nǐ','tú'],['是','shì','ser'],['中国','Zhōngguó','China'],['人','rén','persona'],['吗','ma','partícula de pregunta']]],
  ['我不是中国人，我是法国留学生。', 'Wǒ bú shì Zhōngguó rén, wǒ shì Fǎguó liúxuéshēng.', 'No soy chino, soy estudiante extranjero de Francia.', [['不','bù','no'],['是','shì','ser'],['中国','Zhōngguó','China'],['法国','Fǎguó','Francia'],['留学生','liúxuéshēng','estudiante extranjero']]],
  ['你们班有多少个学生？', 'Nǐmen bān yǒu duōshao ge xuésheng?', '¿Cuántos estudiantes hay en vuestra clase?', [['你们','nǐmen','ustedes'],['班','bān','clase'],['有','yǒu','haber'],['多少','duōshao','cuántos'],['个','gè','clasificador'],['学生','xuésheng','estudiante']]],
  ['我们班有两个学生。', 'Wǒmen bān yǒu liǎng ge xuésheng.', 'En nuestra clase hay dos estudiantes.', [['我们','wǒmen','nosotros'],['班','bān','clase'],['有','yǒu','haber'],['两','liǎng','dos'],['个','gè','clasificador'],['学生','xuésheng','estudiante']]],
  ['她是谁？', 'Tā shì shéi?', '¿Quién es ella?', [['她','tā','ella'],['是','shì','ser'],['谁','shéi','quién']]],
  ['她是我的同学。', 'Tā shì wǒ de tóngxué.', 'Ella es mi compañera de clase.', [['她','tā','ella'],['是','shì','ser'],['我','wǒ','yo'],['的','de','partícula posesiva'],['同学','tóngxué','compañero de clase']]],
  ['他们都是我的同学。', 'Tāmen dōu shì wǒ de tóngxué.', 'Todos ellos son mis compañeros de clase.', [['他们','tāmen','ellos'],['都','dōu','todos'],['是','shì','ser'],['同学','tóngxué','compañero de clase']]],
  ['你家有几口人？', 'Nǐ jiā yǒu jǐ kǒu rén?', '¿Cuántas personas hay en tu familia?', [['你','nǐ','tú'],['家','jiā','familia'],['有','yǒu','haber'],['几','jǐ','cuántos'],['口','kǒu','clasificador de familiares'],['人','rén','persona']]],
  ['我家有四口人。', 'Wǒ jiā yǒu sì kǒu rén.', 'En mi familia somos cuatro.', [['我','wǒ','yo'],['家','jiā','familia'],['有','yǒu','haber'],['四','sì','cuatro'],['口','kǒu','clasificador de familiares'],['人','rén','persona']]],
  ['爸爸、妈妈、哥哥和我。', 'Bàba, māma, gēge hé wǒ.', 'Papá, mamá, mi hermano mayor y yo.', [['爸爸','bàba','papá'],['妈妈','māma','mamá'],['哥哥','gēge','hermano mayor'],['和','hé','y'],['我','wǒ','yo']]],
  ['你爸爸做什么工作？', 'Nǐ bàba zuò shénme gōngzuò?', '¿En qué trabaja tu papá?', [['你','nǐ','tú'],['爸爸','bàba','papá'],['做','zuò','hacer'],['什么','shénme','qué'],['工作','gōngzuò','trabajo']]],
  ['我爸爸是职员。', 'Wǒ bàba shì zhíyuán.', 'Mi papá es empleado de oficina.', [['我','wǒ','yo'],['爸爸','bàba','papá'],['是','shì','ser'],['职员','zhíyuán','empleado de oficina']]],
  ['我妈妈是老师。', 'Wǒ māma shì lǎoshī.', 'Mi mamá es profesora.', [['我','wǒ','yo'],['妈妈','māma','mamá'],['是','shì','ser'],['老师','lǎoshī','profesora']]],
  ['我哥哥是律师。', 'Wǒ gēge shì lǜshī.', 'Mi hermano mayor es abogado.', [['我','wǒ','yo'],['哥哥','gēge','hermano mayor'],['是','shì','ser'],['律师','lǜshī','abogado']]],
  ['她妈妈是医生。', 'Tā māma shì yīshēng.', 'Su mamá es médica.', [['她','tā','ella'],['妈妈','māma','mamá'],['是','shì','ser'],['医生','yīshēng','médica']]],
  ['哥哥和我都是大学生。', 'Gēge hé wǒ dōu shì dàxuéshēng.', 'Mi hermano mayor y yo somos universitarios.', [['哥哥','gēge','hermano mayor'],['和','hé','y'],['我','wǒ','yo'],['都','dōu','los dos'],['是','shì','ser'],['大学生','dàxuéshēng','estudiante universitario']]],
  ['你们都是大学生吗？', 'Nǐmen dōu shì dàxuéshēng ma?', '¿Sois todos universitarios?', [['你们','nǐmen','ustedes'],['都','dōu','todos'],['是','shì','ser'],['大学生','dàxuéshēng','estudiante universitario'],['吗','ma','partícula de pregunta']]],
];


const rawWords = wordSource.trim().split('\n').map((row) => row.split('|'));
const ORIGINAL_WORDS = 236;
// Vocabulario de las lecciones del libro: desde 留学生 hasta 法国 (palabras 221–236).
const BOOK_WORD_START = 220;

// Palabras que solo sirven para analizar frases (no son tarjetas).
const extraDictionary: Record<string, [string, string]> = {
  '安娜': ['Ānnà', 'Ana'],
  '得': ['de', 'partícula de complemento'],
  '见': ['jiàn', 'ver / encontrarse'],
};

const dictionary = new Map<string, { pinyin: string; meaning: string; category?: string }>();
for (const [hanzi, pinyin, spanish, category] of rawWords) if (!dictionary.has(hanzi)) dictionary.set(hanzi, { pinyin, meaning: spanish, category });
for (const [hanzi, [pinyin, meaning]] of Object.entries(extraDictionary)) dictionary.set(hanzi, { pinyin, meaning });
const MAX_WORD_LENGTH = Math.max(...[...dictionary.keys()].map((key) => key.length));

const PUNCTUATION: Record<string, string> = { '。': '.', '？': '?', '！': '!', '，': ',', '、': ',' };
const NUMERALS = new Set(['一', '二', '两', '三', '四', '五', '六', '七', '八', '九', '十', '几', '多少', '这', '那', '哪']);
const COUNTER_SANDHI: Record<string, string> = { '个': 'yí', '块': 'yí', '岁': 'yí', '杯': 'yì', '本': 'yì', '口': 'yì', '年': 'yì' };
const TONE_MARKS = 'āēīōūǖ|áéíóúǘ|ǎěǐǒǔǚ|àèìòùǜ';

function firstTone(pinyin: string) {
  for (const char of pinyin) {
    const tone = TONE_MARKS.split('|').findIndex((group) => group.includes(char));
    if (tone >= 0) return tone + 1;
  }
  return 5;
}

type Token = Segment & { punctuation?: string };

/** Divide una frase en palabras del diccionario (la más larga primero). */
export function segment(text: string): Token[] {
  const tokens: Token[] = [];
  for (let i = 0; i < text.length;) {
    const char = text[i];
    if (PUNCTUATION[char]) { tokens.push({ hanzi: char, pinyin: '', meaning: '', punctuation: PUNCTUATION[char] }); i++; continue; }
    let size = Math.min(MAX_WORD_LENGTH, text.length - i);
    while (size > 1 && !dictionary.has(text.slice(i, i + size))) size--;
    const word = text.slice(i, i + size);
    const entry = dictionary.get(word);
    tokens.push(entry ? { hanzi: word, pinyin: entry.pinyin, meaning: entry.meaning } : { hanzi: word, pinyin: '?', meaning: '?' });
    i += size;
  }
  return tokens;
}

/** Pinyin natural de una frase, con 不 / 一 y el clasificador 个 en tono neutro. */
function sentencePinyin(tokens: Token[]) {
  let result = '';
  tokens.forEach((token, index) => {
    if (token.punctuation) { result += token.punctuation; return; }
    const next = tokens[index + 1];
    const previous = tokens[index - 1];
    let pinyin = token.pinyin;
    if (token.hanzi === '不' && next && !next.punctuation && firstTone(next.pinyin) === 4) pinyin = 'bú';
    if (token.hanzi === '一' && next && COUNTER_SANDHI[next.hanzi]) pinyin = COUNTER_SANDHI[next.hanzi];
    if (token.hanzi === '个' && previous && NUMERALS.has(previous.hanzi)) pinyin = 'ge';
    result += (result ? ' ' : '') + pinyin;
  });
  return result.replace(/(^|[.?!] )(\p{L})/gu, (_, start: string, letter: string) => start + letter.toUpperCase());
}

function toSegments(tokens: Token[]): Segment[] {
  return tokens.filter((token) => !token.punctuation).map(({ hanzi, pinyin, meaning }) => ({ hanzi, pinyin, meaning }));
}

/** Caracteres sueltos de una palabra que también existen como palabra propia. */
export function characterParts(hanzi: string): Segment[] {
  const chars = [...hanzi];
  if (chars.length < 2) return [];
  return chars.flatMap((char) => { const entry = dictionary.get(char); return entry ? [{ hanzi: char, pinyin: entry.pinyin, meaning: entry.meaning }] : []; });
}

export function analyze(hanzi: string) {
  const tokens = segment(hanzi);
  return { pinyin: sentencePinyin(tokens), breakdown: toSegments(tokens), unknown: tokens.filter((token) => token.pinyin === '?').map((token) => token.hanzi) };
}

const lessonPhraseSource = lessonRows;
const bookHanzi = new Set(lessonPhraseSource.flatMap(([, , , parts]) => parts.map(([hanzi]) => hanzi)));

export const commonWords: LibraryItem[] = rawWords.map(([hanzi, pinyin, spanish, category], index) => {
  const number = String(index + 1).padStart(3, '0');
  return {
    id: `w-${number}`, type: 'word', hanzi, pinyin, spanish, category, audio: `w-${number}`,
    book: (index >= BOOK_WORD_START && index < ORIGINAL_WORDS) || bookHanzi.has(hanzi),
    breakdown: [{ hanzi, pinyin, meaning: spanish }],
  };
});

const objectPhrases: LibraryItem[] = objects.flatMap(([hanzi,pinyin,spanish], objectIndex) => {
  const category = dictionary.get(hanzi)?.category || 'Objetos';
  const templates = [
    [`我需要${hanzi}。`, `wǒ xūyào ${pinyin}`, `Necesito ${spanish}.`],
    [`我在找${hanzi}。`, `wǒ zài zhǎo ${pinyin}`, `Estoy buscando ${spanish}.`],
    [`这里有${hanzi}吗？`, `zhèlǐ yǒu ${pinyin} ma?`, `¿Hay ${spanish} aquí?`],
    [`${hanzi}在哪里？`, `${pinyin} zài nǎlǐ?`, `¿Dónde está ${spanish}?`],
    [`请给我${hanzi}。`, `qǐng gěi wǒ ${pinyin}`, `Dame ${spanish}, por favor.`],
  ];
  return templates.map(([phrase, phrasePinyin, phraseSpanish], templateIndex) => {
    const index = objectIndex * 5 + templateIndex + 1;
    const number = String(index).padStart(3, '0');
    const objectPart = { hanzi, pinyin, meaning: spanish };
    const breakdowns = [
      [{ hanzi:'我', pinyin:'wǒ', meaning:'yo' }, { hanzi:'需要', pinyin:'xūyào', meaning:'necesitar' }, objectPart],
      [{ hanzi:'我', pinyin:'wǒ', meaning:'yo' }, { hanzi:'在', pinyin:'zài', meaning:'estar en' }, { hanzi:'找', pinyin:'zhǎo', meaning:'buscar' }, objectPart],
      [{ hanzi:'这里', pinyin:'zhèlǐ', meaning:'aquí' }, { hanzi:'有', pinyin:'yǒu', meaning:'haber / tener' }, objectPart, { hanzi:'吗', pinyin:'ma', meaning:'partícula de pregunta' }],
      [objectPart, { hanzi:'在', pinyin:'zài', meaning:'estar en' }, { hanzi:'哪里', pinyin:'nǎlǐ', meaning:'dónde' }],
      [{ hanzi:'请', pinyin:'qǐng', meaning:'por favor' }, { hanzi:'给', pinyin:'gěi', meaning:'dar' }, { hanzi:'我', pinyin:'wǒ', meaning:'yo' }, objectPart],
    ] as Segment[][];
    return { id:`f-${number}`, type:'phrase' as const, hanzi:phrase, pinyin:phrasePinyin, spanish:phraseSpanish, category, audio:`f-${number}`, book:false, breakdown: breakdowns[templateIndex] };
  });
});

const NUMBER_HANZI = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const NUMBER_SPANISH = ['un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];

/** Frases de conteo del 1 al 10: personas, hora, dinero y bebidas. */
export const numberPhrases: LibraryItem[] = NUMBER_HANZI.flatMap((numeral, index) => {
  const n = index + 1;
  const counted = n === 2 ? '两' : numeral;
  const es = NUMBER_SPANISH[index];
  const rows = [
    [`我有${counted}个朋友。`, n === 1 ? 'Tengo un amigo.' : `Tengo ${es} amigos.`],
    [`现在${counted}点。`, n === 1 ? 'Es la una.' : `Son las ${es}.`],
    [`这个${counted}块钱。`, n === 1 ? 'Esto cuesta un yuan.' : `Esto cuesta ${es} yuanes.`],
    [`我要${counted}杯茶。`, n === 1 ? 'Quiero un té.' : `Quiero ${es} tés.`],
  ];
  return rows.map(([hanzi, spanish], rowIndex) => {
    const number = String(index * rows.length + rowIndex + 1).padStart(3, '0');
    const { pinyin, breakdown } = analyze(hanzi);
    return { id: `n-${number}`, type: 'phrase' as const, hanzi, pinyin, spanish, category: 'Números', audio: `n-${number}`, book: false, breakdown };
  });
});

const lessonTopics: Array<[number, string]> = [[5, 'Estudios'], [7, 'Nacionalidad'], [9, 'Mi clase'], [12, 'Compañeros'], [15, 'Mi familia'], [22, 'Trabajo y estudios']];
const topicFor = (index: number) => lessonTopics.find(([end]) => index < end)![1];

export const lessonPhrases: LibraryItem[] = lessonRows.map(([hanzi, pinyin, spanish, parts], index) => {
  const number = String(index + 1).padStart(3, '0');
  return {
    id: `l-${number}`,
    type: 'phrase' as const,
    hanzi,
    pinyin,
    spanish,
    category: topicFor(index),
    audio: `l-${number}`,
    book: true,
    breakdown: parts.map(([partHanzi, partPinyin, meaning]) => ({ hanzi: partHanzi, pinyin: partPinyin, meaning })),
  };
});

export const commonPhrases: LibraryItem[] = [...objectPhrases, ...numberPhrases, ...lessonPhrases];

export const library = [...commonWords, ...commonPhrases];

/** Ejemplos escritos a mano para cada palabra, con pinyin y desglose automáticos. */
export const handwrittenExamples: Array<Example & { word: string }> = exampleSource.trim().split('\n').map((row, index) => {
  const [word, hanzi, spanish] = row.split('|');
  const { pinyin, breakdown } = analyze(hanzi);
  return { word, hanzi, pinyin, spanish, breakdown, audio: `e-${String(index + 1).padStart(3, '0')}` };
});

const examplesByWord = new Map<string, Example[]>();
for (const { word, ...example } of handwrittenExamples) examplesByWord.set(word, [...(examplesByWord.get(word) || []), example]);

const phrasesByHanzi = new Map<string, LibraryItem[]>();
for (const phrase of commonPhrases) for (const part of new Set((phrase.breakdown || []).map((segmentPart) => segmentPart.hanzi))) phrasesByHanzi.set(part, [...(phrasesByHanzi.get(part) || []), phrase]);

// Palabras de enlace que no hacen "parecidas" a dos frases.
const FUNCTION_WORDS = new Set(['我', '你', '他', '她', '的', '了', '吗', '呢', '是', '有', '不', '在', '个', '口', '和', '也', '都', '很', '太', '什么', '这', '那', '这里', '请', '给', '哪里', '吧', '们']);

const asExample = (phrase: LibraryItem): Example => ({ hanzi: phrase.hanzi, pinyin: phrase.pinyin, spanish: phrase.spanish, audio: phrase.audio, breakdown: phrase.breakdown || [], itemId: phrase.id });

const exampleCache = new Map<string, Example[]>();

/** Frases que muestran una tarjeta en uso: ejemplos propios y frases de la biblioteca que la contienen. */
export function getExamples(item: LibraryItem, limit = 4): Example[] {
  const cached = exampleCache.get(item.id);
  if (cached) return cached;
  let result: Example[];
  if (item.type === 'word') {
    const own = examplesByWord.get(item.hanzi) || [];
    const related = (phrasesByHanzi.get(item.hanzi) || []).filter((phrase) => !own.some((example) => example.hanzi === phrase.hanzi)).sort((a, b) => a.hanzi.length - b.hanzi.length).map(asExample);
    result = [...own, ...related].slice(0, limit);
  } else {
    const keys = (item.breakdown || []).map((part) => part.hanzi).filter((hanzi) => !FUNCTION_WORDS.has(hanzi));
    const scores = new Map<string, number>();
    for (const key of keys) for (const phrase of phrasesByHanzi.get(key) || []) if (phrase.id !== item.id && phrase.hanzi !== item.hanzi) scores.set(phrase.id, (scores.get(phrase.id) || 0) + 1);
    const byId = new Map(commonPhrases.map((phrase) => [phrase.id, phrase]));
    result = [...scores.entries()].sort((a, b) => b[1] - a[1] || byId.get(a[0])!.hanzi.length - byId.get(b[0])!.hanzi.length).slice(0, limit).map(([id]) => asExample(byId.get(id)!));
  }
  exampleCache.set(item.id, result);
  return result;
}

export type LibraryFilter = { kind: 'all' | 'word' | 'phrase'; book: boolean; category: string; query?: string };
export const ALL_CATEGORIES = 'Todas';

export function filterLibrary(items: LibraryItem[], filter: LibraryFilter) {
  const query = (filter.query || '').trim().toLocaleLowerCase();
  return items.filter((item) =>
    (filter.kind === 'all' || item.type === filter.kind) &&
    (!filter.book || item.book) &&
    (filter.category === ALL_CATEGORIES || item.category === filter.category) &&
    (!query || `${item.hanzi} ${item.pinyin} ${item.spanish}`.toLocaleLowerCase().includes(query)));
}

/** Categorías disponibles (con cantidad) para un tipo de tarjeta y origen. */
export function categoriesFor(items: LibraryItem[], kind: LibraryFilter['kind'], book: boolean) {
  const counts = new Map<string, number>();
  for (const item of items) if ((kind === 'all' || item.type === kind) && (!book || item.book)) counts.set(item.category, (counts.get(item.category) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'));
}

const wordByHanzi = new Map(commonWords.map((word) => [word.hanzi, word]));

/** Tarjeta de palabra para un fragmento de frase (para escucharla). */
export function findWord(hanzi: string) { return wordByHanzi.get(hanzi); }
