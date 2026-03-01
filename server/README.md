# Koa App (TypeScript)

## 环境变量

复制 `.env.example` 并设置以下变量（或在启动前通过 shell 导出）：

- `BIGMODEL_API_KEY`：智谱语音 API Key（录入词汇时生成音频必填）
- `BIGMODEL_TTS_URL`：语音接口地址，默认 `https://open.bigmodel.cn/api/paas/v4/audio/speech`
- `BIGMODEL_TTS_MODEL`：默认 `glm-tts`
- `BIGMODEL_TTS_VOICE`：默认 `female`
- `BIGMODEL_TTS_SPEED`：默认 `1`
- `BIGMODEL_TTS_VOLUME`：默认 `1`
- `BIGMODEL_TTS_FORMAT`：默认 `wav`

## 词汇表接口

- `GET /api/vocabularies`：获取词汇表列表
- `POST /api/vocabularies`：新建词汇表（会为每个词生成音频并缓存）
- `PUT /api/vocabularies/:id`：更新词汇表（新增词会生成音频，已有词复用缓存）
- `DELETE /api/vocabularies/:id`：删除词汇表

## Client 听写接口

- `GET /api/client/books/tree`：返回 books 页面所需的年级/版本/单元/课文级联结构
- `GET /api/client/vocabularies`：返回可用于客户端词汇本选择的数据
- `GET /api/client/vocabularies/:id/dictation`：返回听写词汇与音频 URL，并附带 `repeatTimes=3`、`intervalSeconds=10`
- `GET /api/client/audio/:fileName`：读取本地词汇音频文件

## 音频存储

- 词汇音频文件：`server/data/audio/*.wav`
- 词汇与音频映射：`server/data/wordAudioMap.json`

同一词汇在请求前会先检查映射和音频文件，命中后不会重复调用外部语音接口。
