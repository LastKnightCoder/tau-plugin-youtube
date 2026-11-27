import { messages } from "./i18n";
import { definePlugin } from "@tau/plugins";
import { createYoutubeInstance } from "./provider";
declare const __PLUGIN_META__: { id: string; name: string; version: string };

export default definePlugin({
  id: __PLUGIN_META__.id,
  name: __PLUGIN_META__.name,
  version: __PLUGIN_META__.version,
  i18n: messages,
  create: () => ({
    activate(context) {
      if (!context.video || !context.services.videoExtractor)
        throw new Error("当前客户端不支持视频网站插件，请升级 Tau");
      context.video.register({
        id: context.pluginId,
        name: "YouTube",
        create: config =>
          createYoutubeInstance(
            config,
            context.services.videoExtractor.probe,
            context.services.videoExtractor.getCaptions
          ),
      });
      context.settings.register({
        id: "proxy",
        title: "YouTube",
        target: "video",
        form: {
          groups: [
            {
              title: messages.ref("proxy.group.title"),
              fields: [
                {
                  key: "proxy",
                  label: messages.ref("proxy.address.label"),
                  type: "url",
                  optional: true,
                  placeholder: "http://127.0.0.1:7890",
                  description: messages.ref("proxy.address.description"),
                },
              ],
            },
          ],
          beforeSave: async values => {
            const proxy = values.proxy.trim();
            let protocol = "";
            try {
              protocol = proxy ? new URL(proxy).protocol : "";
            } catch {
              // 无法解析时按格式错误处理
            }
            if (proxy && !/^(https?|socks5h?):$/.test(protocol))
              throw new Error("代理地址格式应为 http://主机:端口 或 socks5://主机:端口");
            return { ...values, proxy };
          },
        },
      });
    },
  }),
});
