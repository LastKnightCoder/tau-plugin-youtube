import { useState } from "react";
import { Button, Input } from "@tau/ui";
import { definePlugin, type PluginSettingsProps } from "@tau/plugins";
import { createYoutubeInstance, readConfig } from "./provider";

declare const __PLUGIN_META__: { id: string; name: string; version: string };

function YoutubeSettings({ context, videoConfig }: PluginSettingsProps) {
  const [proxy, setProxy] = useState(readConfig(videoConfig?.value ?? {}).proxy ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  if (!videoConfig) return null;
  const save = async () => {
    const value = proxy.trim();
    if (value) {
      try {
        if (!/^(https?|socks5h?):$/.test(new URL(value).protocol)) throw new Error();
      } catch {
        setMessage("代理地址格式应为 http://主机:端口 或 socks5://主机:端口");
        return;
      }
    }
    setSaving(true);
    setMessage("");
    try {
      await videoConfig.save(value ? { proxy: value } : {});
      if (!context.signal.aborted) setMessage("已保存");
    } catch (error) {
      if (!context.signal.aborted) setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      if (!context.signal.aborted) setSaving(false);
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        代理地址（可选）
        <Input
          value={proxy}
          placeholder="http://127.0.0.1:7890"
          spellCheck={false}
          onChange={event => setProxy(event.target.value)}
        />
      </label>
      <p className="opacity-70">无法直接访问 YouTube 时填写本机代理，留空则直连。</p>
      <div>
        <Button size="sm" variant="primary" loading={saving} onClick={() => void save()}>
          保存
        </Button>
      </div>
      {message && <p role="status">{message}</p>}
    </div>
  );
}

export default definePlugin({
  id: __PLUGIN_META__.id,
  name: __PLUGIN_META__.name,
  version: __PLUGIN_META__.version,
  create: () => ({
    activate(context) {
      if (!context.video || !context.services.videoExtractor)
        throw new Error("当前客户端不支持视频网站插件，请升级 Tau");
      context.video.register({
        id: context.pluginId,
        name: "YouTube",
        create: config => createYoutubeInstance(config, context.services.videoExtractor.probe),
      });
      context.settings.register({
        id: "proxy",
        title: "YouTube",
        target: "video",
        component: YoutubeSettings,
      });
    },
  }),
});
