Round 11 持久化了发帖弹窗里的“回复选项”。

这轮改动：
- 在 `threads` 表新增 `reply_audience` 字段
- 在 `threads` 表新增 `review_replies` 字段
- 发帖时把当前选择写入数据库
- 保持现有 UI 和发帖流程不变

需要先在 Supabase SQL Editor 执行：
- `supabase/migrations/20260317_round11_post_reply_options.sql`

reply_audience 取值：
- `everyone`
- `followers`
- `following`
- `mentioned`

当前 `review_replies` 只是预留字段，UI 里仍为禁用展示态，发帖时固定写 `false`。
