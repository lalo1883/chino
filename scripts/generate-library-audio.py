import asyncio
import re
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "app" / "content.ts").read_text()
OUTPUT = ROOT / "public" / "audio"
OUTPUT.mkdir(parents=True, exist_ok=True)

word_block = re.search(r"const wordSource = `\n(.*?)\n`;", SOURCE, re.S).group(1)
words = [line.split("|")[0] for line in word_block.splitlines() if line.strip()][:200]
objects_block = re.search(r"const objects = \[(.*?)\] as const;", SOURCE, re.S).group(1)
objects = re.findall(r"\['([^']+)','([^']+)','([^']+)'\]", objects_block)

items = [(f"w-{index:03d}", text) for index, text in enumerate(words, 1)]
for object_index, (hanzi, _, _) in enumerate(objects):
    phrases = [f"我需要{hanzi}。", f"我在找{hanzi}。", f"这里有{hanzi}吗？", f"{hanzi}在哪里？", f"请给我{hanzi}。"]
    for template_index, text in enumerate(phrases):
        number = object_index * 5 + template_index + 1
        items.append((f"f-{number:03d}", text))

semaphore = None

async def generate(slug: str, text: str):
    path = OUTPUT / f"{slug}.mp3"
    if path.exists() and path.stat().st_size:
        return
    async with semaphore:
        for attempt in range(5):
            try:
                await edge_tts.Communicate(text, "zh-CN-XiaoxiaoNeural", rate="-15%").save(str(path))
                return
            except Exception:
                path.unlink(missing_ok=True)
                if attempt == 4:
                    raise
                await asyncio.sleep(1.5 * (attempt + 1))

async def main():
    global semaphore
    semaphore = asyncio.Semaphore(4)
    await asyncio.gather(*(generate(slug, text) for slug, text in items))
    print(f"Generated {len(items)} library audio files")

asyncio.run(main())
