#!/usr/bin/env bash
set -euo pipefail

mkdir -p public/audio
generate() {
  python3 -m edge_tts --voice zh-CN-XiaoxiaoNeural --rate=-15% --text "$2" --write-media "public/audio/$1.mp3"
}

generate begin-ni-hao '你好'
generate begin-wo '我'
generate begin-ni '你'
generate begin-shi '是'
generate begin-bu '不'
generate begin-xie-xie '谢谢'
generate begin-zai-jian '再见'
generate begin-qing '请'
generate begin-dui-bu-qi '对不起'
generate begin-mei-guan-xi '没关系'
generate begin-zao-shang-hao '早上好'
generate begin-wan-an '晚安'
generate begin-yi '一'
generate begin-er '二'
generate begin-san '三'
generate begin-si '四'
generate begin-wu '五'
generate begin-liu '六'
generate begin-wo-jiao '我叫安娜'
generate begin-ni-jiao-shen-me '你叫什么名字'
generate begin-wo-shi-xi-ban-ya-ren '我是西班牙人'
generate begin-wo-bu-ming-bai '我不明白'
generate begin-qing-zai-shuo '请再说一遍'
generate begin-wo-xiang-he-shui '我想喝水'
