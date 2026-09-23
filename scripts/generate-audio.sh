#!/usr/bin/env bash
set -euo pipefail

mkdir -p public/audio

generate() {
  python3 -m edge_tts --voice zh-CN-XiaoxiaoNeural --rate=-15% --text "$2" --write-media "public/audio/$1.mp3"
}

generate ni-hao '你好'
generate xie-xie '谢谢'
generate zai-jian '再见'
generate qing '请'
generate shui '水'
generate peng-you '朋友'
generate yin-wei '因为'
generate suo-yi '所以'
generate yi-jing '已经'
generate ke-neng '可能'
generate yi-si '意思'
generate jue-de '觉得'
generate jing-zheng '竞争'
generate jing-ji '经济'
generate jie-guo '结果'
generate shi-ying '适应'
generate yin-xiang '印象'
generate shou-ru '收入'
generate cheng-dan '承担'
generate gu-lv '顾虑'
generate chou-xiang '抽象'
generate ling-huo '灵活'
generate quan-wei '权威'
generate qu-shi '趋势'
