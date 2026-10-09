import asyncio
import json
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "audio"
OUTPUT.mkdir(parents=True, exist_ok=True)

manifest = subprocess.run(["node", str(ROOT / "scripts" / "audio-manifest.mjs")], check=True, capture_output=True, text=True).stdout
items = [(entry["audio"], entry["text"]) for entry in json.loads(manifest)]

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
