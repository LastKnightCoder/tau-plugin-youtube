import { expect, it, vi } from "vitest";
import type { VideoFormat } from "@tau/plugins";
import { buildVariants, createYoutubeInstance, isYoutubeUrl } from "./provider";

const signal = () => new AbortController().signal;
const url = "https://www.youtube.com/watch?v=abc";
const formats: VideoFormat[] = [
  {
    id: "137",
    videoOnly: true,
    audioOnly: false,
    ext: "mp4",
    height: 1080,
    fps: 30,
    bitrate: 4000,
  },
  {
    id: "299",
    videoOnly: true,
    audioOnly: false,
    ext: "mp4",
    height: 1080,
    fps: 60,
    bitrate: 6000,
  },
  { id: "136", videoOnly: true, audioOnly: false, ext: "mp4", height: 720, fps: 30, bitrate: 2000 },
  { id: "139", videoOnly: false, audioOnly: true, ext: "m4a", bitrate: 48 },
  { id: "140", videoOnly: false, audioOnly: true, ext: "m4a", bitrate: 128 },
];

it("识别 YouTube 与 yewtu.be 链接，不误判其他域名", () => {
  expect(isYoutubeUrl(url)).toBe(true);
  expect(isYoutubeUrl("https://youtu.be/abc")).toBe(true);
  expect(isYoutubeUrl("https://m.youtube.com/watch?v=abc")).toBe(true);
  expect(isYoutubeUrl("https://notyoutube.com.evil.test/watch")).toBe(false);
  expect(isYoutubeUrl("https://www.bilibili.com/video/BV1")).toBe(false);
});

it("每个分辨率保留最佳视频流并搭配最高码率音频，默认最高清晰度", async () => {
  const probe = vi.fn(async () => ({ title: "演讲", cover: "https://i.ytimg.com/a.jpg", formats }));
  const instance = createYoutubeInstance({ proxy: " http://127.0.0.1:7890 " }, probe, vi.fn());
  const result = await instance.resolve(url, signal());
  expect(probe).toHaveBeenCalledWith(
    url,
    expect.objectContaining({ proxy: "http://127.0.0.1:7890" })
  );
  expect(result.variants).toEqual([
    { label: "1080p60", hint: "MP4", ref: { url, videoStream: "299", audioStream: "140" } },
    { label: "720p", hint: "MP4", ref: { url, videoStream: "136", audioStream: "140" } },
  ]);
  expect(result.defaultVariant).toBe(0);
});

it("只有音视频合一格式时直接使用该格式", () => {
  expect(
    buildVariants(url, [{ id: "18", videoOnly: false, audioOnly: false, ext: "mp4", height: 360 }])
  ).toEqual([{ label: "360p", hint: "MP4", ref: { url, videoStream: "18" } }]);
  expect(buildVariants(url, [])).toEqual([]);
});

it("播放源交给宿主解析器，兼容历史数据中保存为对象的格式", async () => {
  const instance = createYoutubeInstance({ proxy: "socks5://127.0.0.1:1080" }, vi.fn(), vi.fn());
  const legacy = {
    url,
    videoStream: { id: "137", resolution: "1080p" },
    audioStream: { id: "140", resolution: "Audio" },
  };
  expect(instance.cacheKey(legacy)).toBe(`${url}|137|140`);
  await expect(instance.getPlayback(legacy, signal())).resolves.toEqual({
    kind: "extract",
    url,
    videoFormat: "137",
    audioFormat: "140",
    proxy: "socks5://127.0.0.1:1080",
  });
  await expect(
    createYoutubeInstance({}, vi.fn(), vi.fn()).getPlayback({ url }, signal())
  ).resolves.toEqual({ kind: "extract", url });
  expect(() => instance.cacheKey({})).toThrow("重新添加");
});

it("字幕读取透传视频地址、代理与取消，无字幕时返回 null", async () => {
  const captions = { language: "en", segments: [{ text: "hello", start: 100, end: 900 }] };
  const getCaptions = vi.fn(async () => captions as typeof captions | null);
  const instance = createYoutubeInstance(
    { proxy: " http://127.0.0.1:7890 " },
    vi.fn(),
    getCaptions
  );
  const scoped = signal();
  await expect(instance.getCaptions!({ url }, scoped)).resolves.toEqual(captions);
  expect(getCaptions).toHaveBeenCalledWith(url, { proxy: "http://127.0.0.1:7890", signal: scoped });
  getCaptions.mockResolvedValue(null);
  await expect(instance.getCaptions!({ url }, scoped)).resolves.toBeNull();
  getCaptions.mockRejectedValue(new DOMException("取消", "AbortError"));
  await expect(instance.getCaptions!({ url }, scoped)).rejects.toMatchObject({
    name: "AbortError",
  });
});
