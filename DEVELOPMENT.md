# 开发与发布

需要 Node.js 22 或更高版本，以及 pnpm 11.9.0。SDK 使用 `@tau/plugins` 到 `@xiongtao.xt/tau-plugins@0.22.0` 的公开别名，不依赖 Tau 主仓库或本机目录。

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

构建生成 `dist/youtube-0.1.0.zip`。SDK、React 和 UI 由客户端提供，构建时保持 external。测试模拟视频解析服务，不访问网络。

插件 ID 为 `youtube`，与客户端已保存视频的来源类型一致，不要更改。`src/provider.ts` 通过 `context.services.videoExtractor.probe` 查询格式列表并组织清晰度，播放源返回 `kind: "extract"`，由客户端内置的解析器下载与合并。视频引用保存 `url / videoStream / audioStream`，兼容格式保存为对象或 ID 字符串的历史数据。

更新时同步修改 `package.json`、`manifest.json` 和 `CHANGELOG.md`，提交后推送同版本标签，GitHub Actions 会测试、构建并发布 ZIP 到 GitHub Release。
