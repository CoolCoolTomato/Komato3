# 视频拆分 WebP 序列帧

## 输入文件

```txt
public/16p9.mov
```

## 输出目录

```txt
public/frames-16p9/
  frame_0001.webp
  frame_0002.webp
  ...
```

## 清空旧帧

PowerShell:

```powershell
New-Item -ItemType Directory -Force public\frames-16p9
Get-ChildItem -LiteralPath public\frames-16p9 -Filter *.webp | Remove-Item -Force
```

## 拆分命令

```bash
ffmpeg -y -i public/16p9.mov -an -vf "fps=24,scale=3840:2160:force_original_aspect_ratio=increase,crop=3840:2160" -c:v libwebp -lossless 0 -compression_level 4 -q:v 75 public/frames-16p9/frame_%04d.webp
```

## 参数说明
3840 2160
- `fps=24`: 导出为 24fps 序列帧。
- `scale=1280:720:force_original_aspect_ratio=increase`: 保持比例缩放到可以覆盖 1280x720。
- `crop=1280:720`: 裁切为标准 16:9。
- `-c:v libwebp`: 强制输出静态 WebP 帧。
- `-q:v 75`: WebP 质量，数值越高质量越好、文件越大。
- `public/frames-16p9/frame_%04d.webp`: 输出 `frame_0001.webp` 这种四位编号文件。

## 更新前端帧数

执行 ffmpeg 后，看日志最后一行的帧数:

```txt
frame=  285 ...
```

然后更新 `src/App.tsx`:

```tsx
<ScrollFrameCanvas
  frameCount={285}
  getFrameSrc={backgroundFrameSrc}
  mode="fullscreen"
  objectFit="cover"
  sourceAspectRatio={16 / 9}
/>
```

## 验证

```bash
pnpm run build
pnpm run dev
```
