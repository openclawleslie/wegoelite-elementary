"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, Check, X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (imageBlob: Blob) => void;
  onCancel: () => void;
}

type CaptureState = "camera" | "checking" | "preview" | "failed";

interface QualityResult {
  passed: boolean;
  message: string;
}

function checkImageQuality(canvas: HTMLCanvasElement): QualityResult {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { passed: false, message: "無法分析圖片" };

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  let totalLum = 0;
  const pixelCount = pixels.length / 4;
  for (let i = 0; i < pixels.length; i += 4) {
    totalLum +=
      0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
  }
  const avgLum = totalLum / pixelCount;

  if (avgLum < 40)
    return { passed: false, message: "光線不足，請移到較亮的地方" };
  if (avgLum > 240) return { passed: false, message: "光線過亮，請避開強光" };

  const w = canvas.width;
  const h = canvas.height;
  const startX = Math.floor(w * 0.2);
  const endX = Math.floor(w * 0.8);
  const startY = Math.floor(h * 0.2);
  const endY = Math.floor(h * 0.8);

  let laplacianSum = 0;
  let count = 0;
  for (let y = startY + 1; y < endY - 1; y++) {
    for (let x = startX + 1; x < endX - 1; x++) {
      const idx = (y * w + x) * 4;
      const gray =
        0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];

      const top =
        0.299 * pixels[((y - 1) * w + x) * 4] +
        0.587 * pixels[((y - 1) * w + x) * 4 + 1] +
        0.114 * pixels[((y - 1) * w + x) * 4 + 2];
      const bottom =
        0.299 * pixels[((y + 1) * w + x) * 4] +
        0.587 * pixels[((y + 1) * w + x) * 4 + 1] +
        0.114 * pixels[((y + 1) * w + x) * 4 + 2];
      const left =
        0.299 * pixels[(y * w + (x - 1)) * 4] +
        0.587 * pixels[(y * w + (x - 1)) * 4 + 1] +
        0.114 * pixels[(y * w + (x - 1)) * 4 + 2];
      const right =
        0.299 * pixels[(y * w + (x + 1)) * 4] +
        0.587 * pixels[(y * w + (x + 1)) * 4 + 1] +
        0.114 * pixels[(y * w + (x + 1)) * 4 + 2];

      const laplacian = top + bottom + left + right - 4 * gray;
      laplacianSum += laplacian * laplacian;
      count++;
    }
  }
  const laplacianVariance = laplacianSum / count;

  if (laplacianVariance < 100)
    return { passed: false, message: "畫面模糊，請對焦後再拍" };

  return { passed: true, message: "品質通過" };
}

export default function CameraCapture({
  onCapture,
  onCancel,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CaptureState>("camera");
  const [failMessage, setFailMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const capturedBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1440 },
          },
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    }

    startCamera();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setState("checking");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);

    const quality = checkImageQuality(canvas);

    if (!quality.passed) {
      setState("failed");
      setFailMessage(quality.message);
      return;
    }

    canvas.toBlob(
      (blob) => {
        if (blob) {
          capturedBlobRef.current = blob;
          setPreviewUrl(URL.createObjectURL(blob));
          setState("preview");
        }
      },
      "image/jpeg",
      0.92,
    );
  }, []);

  const retake = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    capturedBlobRef.current = null;
    setState("camera");
  }, [previewUrl]);

  const confirm = useCallback(() => {
    if (capturedBlobRef.current) {
      onCapture(capturedBlobRef.current);
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, [onCapture]);

  return (
    <div className="relative flex h-[100dvh] w-full flex-col bg-black">
      {(state === "camera" || state === "checking") && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className="border-2 border-white/60 rounded-lg"
              style={{ width: "85%", aspectRatio: "3/4" }}
            />
          </div>

          <div className="absolute bottom-0 inset-x-0 p-6 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent">
            <Button
              variant="ghost"
              size="icon"
              className="text-white h-12 w-12"
              onClick={onCancel}
            >
              <X className="h-6 w-6" />
            </Button>

            <button
              onClick={capture}
              className="h-18 w-18 rounded-full border-4 border-white bg-white/20 active:bg-white/50 transition-colors"
              aria-label="拍照"
            />

            <div className="h-12 w-12" />
          </div>

          <p className="absolute top-12 inset-x-0 text-center text-white text-lg font-medium">
            對準聯絡簿拍攝
          </p>
        </>
      )}

      {state === "failed" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
          <div className="text-center">
            <p className="text-red-400 text-xl font-medium mb-2">
              拍攝品質不佳
            </p>
            <p className="text-white/80 text-lg">{failMessage}</p>
          </div>
          <Button
            onClick={retake}
            variant="outline"
            className="text-white border-white"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            重新拍攝
          </Button>
        </div>
      )}

      {state === "preview" && previewUrl && (
        <div className="flex flex-1 flex-col">
          <img
            src={previewUrl}
            alt="拍攝預覽"
            className="flex-1 object-contain"
          />

          <div className="flex gap-4 p-6 bg-black">
            <Button
              onClick={retake}
              variant="outline"
              className="flex-1 h-14 text-lg text-white border-white"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              重拍
            </Button>
            <Button
              onClick={confirm}
              className="flex-1 h-14 text-lg bg-green-600 hover:bg-green-700"
            >
              <Check className="mr-2 h-5 w-5" />
              確認
            </Button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
