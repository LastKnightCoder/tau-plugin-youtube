import type {
  JsonValue,
  PluginServices,
  VideoFormat,
  VideoInstance,
  VideoRef,
  VideoVariant,
} from "@tau/plugins";

export interface YoutubeConfig {
  proxy?: string;
}

type Probe = PluginServices["videoExtractor"]["probe"];

export function readConfig(value: JsonValue): YoutubeConfig {
  const proxy =
    value && typeof value === "object" && !Array.isArray(value) && typeof value.proxy === "string"
      ? value.proxy.trim()
      : "";
  return proxy ? { proxy } : {};
}

export function isYoutubeUrl(url: string): boolean {
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    return (
      host === "youtu.be" ||
      host === "youtube.com" ||
      host.endsWith(".youtube.com") ||
      host === "yewtu.be" ||
      host.endsWith(".yewtu.be")
    );
  } catch {
    return false;
  }
}

/** 历史数据中格式可能保存为对象（含 id）或格式 ID 字符串。 */
function formatId(value: JsonValue | undefined): string | undefined {
  if (typeof value === "string") return value || undefined;
  if (value && typeof value === "object" && !Array.isArray(value) && typeof value.id === "string")
    return value.id || undefined;
  return undefined;
}

function readRef(ref: VideoRef) {
  const url = typeof ref.url === "string" ? ref.url.trim() : "";
  if (!url) throw new Error("缺少 YouTube 视频链接，请重新添加视频");
  return { url, video: formatId(ref.videoStream), audio: formatId(ref.audioStream) };
}

const byQuality = (a: VideoFormat, b: VideoFormat) =>
  (b.height ?? 0) - (a.height ?? 0) || (b.fps ?? 0) - (a.fps ?? 0) || (b.bitrate ?? 0) - (a.bitrate ?? 0);

/** 每个分辨率保留帧率、码率最高的一个视频流，搭配码率最高的音频流。 */
export function buildVariants(url: string, formats: readonly VideoFormat[]): VideoVariant[] {
  const audio = formats
    .filter(format => format.audioOnly)
    .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))[0];
  const separate = formats.filter(format => format.videoOnly);
  const videos = (separate.length && audio ? separate : formats.filter(f => !f.audioOnly)).sort(
    byQuality
  );
  const seen = new Set<number>();
  const variants: VideoVariant[] = [];
  for (const video of videos) {
    const height = video.height ?? 0;
    if (seen.has(height)) continue;
    seen.add(height);
    const fps = video.fps && video.fps > 30 ? String(Math.round(video.fps)) : "";
    variants.push({
      label: height ? `${height}p${fps}` : video.note || video.id,
      hint: video.ext?.toUpperCase(),
      ref: {
        url,
        videoStream: video.id,
        ...(video.videoOnly && audio ? { audioStream: audio.id } : {}),
      },
    });
  }
  return variants;
}

export function createYoutubeInstance(value: JsonValue, probe: Probe): VideoInstance {
  const config = readConfig(value);
  return {
    matches: isYoutubeUrl,
    async resolve(url, signal) {
      const info = await probe(url, { proxy: config.proxy, signal });
      const variants = buildVariants(url, info.formats);
      if (!variants.length) throw new Error("未找到可下载的视频格式");
      return { title: info.title, cover: info.cover, variants, defaultVariant: 0 };
    },
    cacheKey(ref) {
      const { url, video, audio } = readRef(ref);
      return [url, video ?? "best", audio ?? ""].join("|");
    },
    async getPlayback(ref) {
      const { url, video, audio } = readRef(ref);
      return {
        kind: "extract",
        url,
        ...(video ? { videoFormat: video } : {}),
        ...(audio ? { audioFormat: audio } : {}),
        ...(config.proxy ? { proxy: config.proxy } : {}),
      };
    },
  };
}
