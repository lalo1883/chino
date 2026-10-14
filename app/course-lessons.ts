import { newCourseEntries } from './new-course-lessons.ts';
import { lessonSixSupplement } from './lesson-six-supplement.ts';
import bookReference from './book-reference.json' with { type: 'json' };

// Vocabulario del CSV y complemento verificado en el libro digital, lecciones 1–11.
export const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
export type LessonRange = { from: number; to: number };
type CourseEntry = { lesson: number; type: 'word' | 'phrase'; hanzi: string; pinyin: string; spanish: string };
const originalCourseEntries: CourseEntry[] = [
  {
    "lesson": 1,
    "type": "word",
    "hanzi": "你好",
    "pinyin": "nǐ hǎo",
    "spanish": "Hola"
  },
  {
    "lesson": 1,
    "type": "word",
    "hanzi": "您",
    "pinyin": "nín",
    "spanish": "Usted (formal)"
  },
  {
    "lesson": 1,
    "type": "word",
    "hanzi": "好",
    "pinyin": "hǎo",
    "spanish": "Bueno, bien"
  },
  {
    "lesson": 1,
    "type": "word",
    "hanzi": "早上",
    "pinyin": "zǎoshang",
    "spanish": "Mañana (temprano)"
  },
  {
    "lesson": 1,
    "type": "word",
    "hanzi": "早上好",
    "pinyin": "zǎoshang hǎo",
    "spanish": "Buenos días"
  },
  {
    "lesson": 1,
    "type": "word",
    "hanzi": "是",
    "pinyin": "shì",
    "spanish": "Ser, estar"
  },
  {
    "lesson": 1,
    "type": "word",
    "hanzi": "请问",
    "pinyin": "qǐngwèn",
    "spanish": "Disculpe, ¿podría...?"
  },
  {
    "lesson": 1,
    "type": "word",
    "hanzi": "我",
    "pinyin": "wǒ",
    "spanish": "Yo, me"
  },
  {
    "lesson": 1,
    "type": "word",
    "hanzi": "他",
    "pinyin": "tā",
    "spanish": "Él"
  },
  {
    "lesson": 1,
    "type": "word",
    "hanzi": "她",
    "pinyin": "tā",
    "spanish": "Ella"
  },
  {
    "lesson": 1,
    "type": "word",
    "hanzi": "零",
    "pinyin": "líng",
    "spanish": "Cero"
  },
  {
    "lesson": 1,
    "type": "word",
    "hanzi": "一",
    "pinyin": "yī",
    "spanish": "Uno"
  },
  {
    "lesson": 1,
    "type": "word",
    "hanzi": "二",
    "pinyin": "èr",
    "spanish": "Dos"
  },
  {
    "lesson": 1,
    "type": "word",
    "hanzi": "三",
    "pinyin": "sān",
    "spanish": "Tres"
  },
  {
    "lesson": 1,
    "type": "word",
    "hanzi": "四",
    "pinyin": "sì",
    "spanish": "Cuatro"
  },
  {
    "lesson": 1,
    "type": "word",
    "hanzi": "五",
    "pinyin": "wǔ",
    "spanish": "Cinco"
  },
  {
    "lesson": 1,
    "type": "word",
    "hanzi": "六",
    "pinyin": "liù",
    "spanish": "Seis"
  },
  {
    "lesson": 1,
    "type": "word",
    "hanzi": "七",
    "pinyin": "qī",
    "spanish": "Siete"
  },
  {
    "lesson": 1,
    "type": "word",
    "hanzi": "八",
    "pinyin": "bā",
    "spanish": "Ocho"
  },
  {
    "lesson": 1,
    "type": "word",
    "hanzi": "九",
    "pinyin": "jiǔ",
    "spanish": "Nueve"
  },
  {
    "lesson": 1,
    "type": "word",
    "hanzi": "十",
    "pinyin": "shí",
    "spanish": "Diez"
  },
  {
    "lesson": 1,
    "type": "phrase",
    "hanzi": "你好！",
    "pinyin": "Nǐ hǎo!",
    "spanish": "¡Hola!"
  },
  {
    "lesson": 1,
    "type": "phrase",
    "hanzi": "早上好！",
    "pinyin": "Zǎoshang hǎo!",
    "spanish": "¡Buenos días!"
  },
  {
    "lesson": 1,
    "type": "phrase",
    "hanzi": "请问，你叫什么名字？",
    "pinyin": "Qǐngwèn, nǐ jiào shénme míngzi?",
    "spanish": "Disculpe, ¿cómo se llama?"
  },
  {
    "lesson": 1,
    "type": "phrase",
    "hanzi": "认识你我很高兴。",
    "pinyin": "Rènshi nǐ wǒ hěn gāoxìng.",
    "spanish": "Encantado de conocerte."
  },
  {
    "lesson": 2,
    "type": "word",
    "hanzi": "哪",
    "pinyin": "nǎ",
    "spanish": "Cuál, qué"
  },
  {
    "lesson": 2,
    "type": "word",
    "hanzi": "国",
    "pinyin": "guó",
    "spanish": "País"
  },
  {
    "lesson": 2,
    "type": "word",
    "hanzi": "中国",
    "pinyin": "Zhōngguó",
    "spanish": "China"
  },
  {
    "lesson": 2,
    "type": "word",
    "hanzi": "美国",
    "pinyin": "Měiguó",
    "spanish": "Estados Unidos"
  },
  {
    "lesson": 2,
    "type": "word",
    "hanzi": "日本",
    "pinyin": "Rìběn",
    "spanish": "Japón"
  },
  {
    "lesson": 2,
    "type": "word",
    "hanzi": "韩国",
    "pinyin": "Hánguó",
    "spanish": "Corea"
  },
  {
    "lesson": 2,
    "type": "word",
    "hanzi": "人",
    "pinyin": "rén",
    "spanish": "Persona"
  },
  {
    "lesson": 2,
    "type": "word",
    "hanzi": "谁",
    "pinyin": "shuí / shéi",
    "spanish": "Quién"
  },
  {
    "lesson": 2,
    "type": "word",
    "hanzi": "朋友",
    "pinyin": "péngyou",
    "spanish": "Amigo/a"
  },
  {
    "lesson": 2,
    "type": "word",
    "hanzi": "同学",
    "pinyin": "tóngxué",
    "spanish": "Compañero/a de clase"
  },
  {
    "lesson": 2,
    "type": "word",
    "hanzi": "老师",
    "pinyin": "lǎoshī",
    "spanish": "Profesor/a"
  },
  {
    "lesson": 2,
    "type": "word",
    "hanzi": "留学生",
    "pinyin": "liúxuéshēng",
    "spanish": "Estudiante extranjero"
  },
  {
    "lesson": 2,
    "type": "phrase",
    "hanzi": "你是哪国人？",
    "pinyin": "Nǐ shì nǎ guó rén?",
    "spanish": "¿De qué país eres?"
  },
  {
    "lesson": 2,
    "type": "phrase",
    "hanzi": "我是中国人。",
    "pinyin": "Wǒ shì Zhōngguó rén.",
    "spanish": "Soy chino."
  },
  {
    "lesson": 2,
    "type": "phrase",
    "hanzi": "他是哪国人？",
    "pinyin": "Tā shì nǎ guó rén?",
    "spanish": "¿De qué país es él?"
  },
  {
    "lesson": 3,
    "type": "word",
    "hanzi": "叫",
    "pinyin": "jiào",
    "spanish": "Llamarse"
  },
  {
    "lesson": 3,
    "type": "word",
    "hanzi": "什么",
    "pinyin": "shénme",
    "spanish": "Qué"
  },
  {
    "lesson": 3,
    "type": "word",
    "hanzi": "名字",
    "pinyin": "míngzi",
    "spanish": "Nombre"
  },
  {
    "lesson": 3,
    "type": "word",
    "hanzi": "姓",
    "pinyin": "xìng",
    "spanish": "Apellido"
  },
  {
    "lesson": 3,
    "type": "word",
    "hanzi": "贵姓",
    "pinyin": "guìxìng",
    "spanish": "Su apellido (formal)"
  },
  {
    "lesson": 3,
    "type": "word",
    "hanzi": "认识",
    "pinyin": "rènshi",
    "spanish": "Conocer"
  },
  {
    "lesson": 3,
    "type": "word",
    "hanzi": "很",
    "pinyin": "hěn",
    "spanish": "Muy"
  },
  {
    "lesson": 3,
    "type": "word",
    "hanzi": "高兴",
    "pinyin": "gāoxìng",
    "spanish": "Contento, feliz"
  },
  {
    "lesson": 3,
    "type": "word",
    "hanzi": "也",
    "pinyin": "yě",
    "spanish": "También"
  },
  {
    "lesson": 3,
    "type": "phrase",
    "hanzi": "你叫什么名字？",
    "pinyin": "Nǐ jiào shénme míngzi?",
    "spanish": "¿Cómo te llamas?"
  },
  {
    "lesson": 3,
    "type": "phrase",
    "hanzi": "我叫杜丽。",
    "pinyin": "Wǒ jiào Dù Lì.",
    "spanish": "Me llamo Du Li."
  },
  {
    "lesson": 3,
    "type": "phrase",
    "hanzi": "您贵姓？",
    "pinyin": "Nín guìxìng?",
    "spanish": "¿Cuál es su apellido? (formal)"
  },
  {
    "lesson": 4,
    "type": "word",
    "hanzi": "学习",
    "pinyin": "xuéxí",
    "spanish": "Estudiar, aprender"
  },
  {
    "lesson": 4,
    "type": "word",
    "hanzi": "汉语",
    "pinyin": "Hànyǔ",
    "spanish": "Idioma chino"
  },
  {
    "lesson": 4,
    "type": "word",
    "hanzi": "英语",
    "pinyin": "Yīngyǔ",
    "spanish": "Inglés"
  },
  {
    "lesson": 4,
    "type": "word",
    "hanzi": "法语",
    "pinyin": "Fǎyǔ",
    "spanish": "Francés"
  },
  {
    "lesson": 4,
    "type": "word",
    "hanzi": "一起",
    "pinyin": "yìqǐ",
    "spanish": "Juntos"
  },
  {
    "lesson": 4,
    "type": "word",
    "hanzi": "上课",
    "pinyin": "shàngkè",
    "spanish": "Ir a clase, tener clase"
  },
  {
    "lesson": 4,
    "type": "word",
    "hanzi": "说",
    "pinyin": "shuō",
    "spanish": "Hablar, decir"
  },
  {
    "lesson": 4,
    "type": "word",
    "hanzi": "吗",
    "pinyin": "ma",
    "spanish": "Partícula interrogativa"
  },
  {
    "lesson": 4,
    "type": "word",
    "hanzi": "不",
    "pinyin": "bù",
    "spanish": "No"
  },
  {
    "lesson": 4,
    "type": "phrase",
    "hanzi": "你学习法语吗？",
    "pinyin": "Nǐ xuéxí Fǎyǔ ma?",
    "spanish": "¿Estudias francés?"
  },
  {
    "lesson": 4,
    "type": "phrase",
    "hanzi": "他学习汉语，也学习法语。",
    "pinyin": "Tā xuéxí Hànyǔ, yě xuéxí Fǎyǔ.",
    "spanish": "Él estudia chino y también estudia francés."
  },
  {
    "lesson": 5,
    "type": "word",
    "hanzi": "家",
    "pinyin": "jiā",
    "spanish": "Familia, casa"
  },
  {
    "lesson": 5,
    "type": "word",
    "hanzi": "有",
    "pinyin": "yǒu",
    "spanish": "Tener"
  },
  {
    "lesson": 5,
    "type": "word",
    "hanzi": "口",
    "pinyin": "kǒu",
    "spanish": "Medida para miembros de la familia"
  },
  {
    "lesson": 5,
    "type": "word",
    "hanzi": "几",
    "pinyin": "jǐ",
    "spanish": "Cuántos"
  },
  {
    "lesson": 5,
    "type": "word",
    "hanzi": "多少",
    "pinyin": "duōshao",
    "spanish": "Cuánto(s)"
  },
  {
    "lesson": 5,
    "type": "word",
    "hanzi": "爸爸",
    "pinyin": "bàba",
    "spanish": "Papá"
  },
  {
    "lesson": 5,
    "type": "word",
    "hanzi": "妈妈",
    "pinyin": "māma",
    "spanish": "Mamá"
  },
  {
    "lesson": 5,
    "type": "word",
    "hanzi": "哥哥",
    "pinyin": "gēge",
    "spanish": "Hermano mayor"
  },
  {
    "lesson": 5,
    "type": "word",
    "hanzi": "姐姐",
    "pinyin": "jiějie",
    "spanish": "Hermana mayor"
  },
  {
    "lesson": 5,
    "type": "word",
    "hanzi": "弟弟",
    "pinyin": "dìdi",
    "spanish": "Hermano menor"
  },
  {
    "lesson": 5,
    "type": "word",
    "hanzi": "妹妹",
    "pinyin": "mèimei",
    "spanish": "Hermana menor"
  },
  {
    "lesson": 5,
    "type": "word",
    "hanzi": "和",
    "pinyin": "hé",
    "spanish": "Y"
  },
  {
    "lesson": 5,
    "type": "word",
    "hanzi": "都",
    "pinyin": "dōu",
    "spanish": "Todos"
  },
  {
    "lesson": 5,
    "type": "word",
    "hanzi": "工作",
    "pinyin": "gōngzuò",
    "spanish": "Trabajo, trabajar"
  },
  {
    "lesson": 5,
    "type": "word",
    "hanzi": "医生",
    "pinyin": "yīshēng",
    "spanish": "Médico"
  },
  {
    "lesson": 5,
    "type": "word",
    "hanzi": "职员",
    "pinyin": "zhíyuán",
    "spanish": "Empleado/a"
  },
  {
    "lesson": 5,
    "type": "phrase",
    "hanzi": "你家有几口人？",
    "pinyin": "Nǐ jiā yǒu jǐ kǒu rén?",
    "spanish": "¿Cuántas personas hay en tu familia?"
  },
  {
    "lesson": 5,
    "type": "phrase",
    "hanzi": "我家有五口人。",
    "pinyin": "Wǒ jiā yǒu wǔ kǒu rén.",
    "spanish": "Mi familia tiene cinco personas."
  },
  {
    "lesson": 5,
    "type": "phrase",
    "hanzi": "爸爸、妈妈、哥哥、姐姐和我。",
    "pinyin": "Bàba, māma, gēge, jiějie hé wǒ.",
    "spanish": "Papá, mamá, hermano mayor, hermana mayor y yo."
  },
  ...newCourseEntries,
  ...lessonSixSupplement,
];

export function normalizeLessonHanzi(value: string) {
  return value.replace(/[\s\p{P}\p{S}]/gu, '');
}

// Agregar al final conserva los ids y audios derivados de los índices originales.
// Una misma tarjeta puede pertenecer a varias lecciones, sin duplicarse en la biblioteca.
const courseKey = (entry: CourseEntry) => `${entry.lesson}:${entry.type}:${normalizeLessonHanzi(entry.hanzi)}`;
const knownCourseEntries = new Set(originalCourseEntries.map(courseKey));
export const bookSupplementEntries: CourseEntry[] = bookReference.entries.flatMap(entry => {
  const item: CourseEntry = { lesson: entry.lesson, type: entry.type === 'phrase' ? 'phrase' : 'word', hanzi: entry.hanzi, pinyin: entry.pinyin, spanish: entry.spanish };
  if (knownCourseEntries.has(courseKey(item))) return [];
  knownCourseEntries.add(courseKey(item));
  return [item];
});
export const courseEntries: CourseEntry[] = [...originalCourseEntries, ...bookSupplementEntries];

const lessonsByEntry = new Map<string, number[]>();
for (const entry of courseEntries) {
  const key = `${entry.type}:${normalizeLessonHanzi(entry.hanzi)}`;
  lessonsByEntry.set(key, [...new Set([...(lessonsByEntry.get(key) || []), entry.lesson])]);
}
export function lessonsFor(hanzi: string, type: 'word' | 'phrase') {
  return lessonsByEntry.get(`${type}:${normalizeLessonHanzi(hanzi)}`) || [];
}
export function matchesLessonRange(item: { lessons?: number[] }, range?: LessonRange) {
  return !range || Boolean(item.lessons?.some(lesson => lesson >= range.from && lesson <= range.to));
}
export function lessonRangeLabel(range?: LessonRange) {
  return !range ? 'Todo el contenido' : range.from === range.to ? `Lección ${range.from}` : `Lecciones ${range.from} a ${range.to}`;
}
