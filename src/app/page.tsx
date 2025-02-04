"use client"; // ✅ ทำให้เป็น Client Component ใน Next.js

import React, { useEffect, useRef } from "react";
import type { Results } from "@mediapipe/selfie_segmentation";


const Home: React.FC = () => {
  const inputVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);

  const onResults = (results: Results) => {
    const ctx = contextRef.current;
    if (!ctx || !canvasRef.current) return;

    ctx.save();
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // ✅ กำหนดอัตราส่วนของภาพจากกล้อง (เพื่อไม่ให้ขยายเกิน)
    const videoWidth = results.image.width;
    const videoHeight = results.image.height;
    const canvasWidth = canvasRef.current.width;
    const canvasHeight = canvasRef.current.height;

    // ✅ คำนวณสเกลที่เหมาะสม
    const scale = Math.min(canvasWidth / videoWidth, canvasHeight / videoHeight);
    const newWidth = videoWidth * scale;
    const newHeight = videoHeight * scale;

    // ✅ จัดตำแหน่งให้ตรงกลาง
    const xOffset = (canvasWidth - newWidth) / 1;
    const yOffset = (canvasHeight - newHeight) / 1;

    // 🔥 วาดบุคคลลงไปก่อน (ขนาดที่กำหนดเอง)
    ctx.drawImage(results.image, xOffset, yOffset, newWidth, newHeight);

    // 🔥 ใช้ segmentationMask เพื่อตัดพื้นหลังออก
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(results.segmentationMask, xOffset, yOffset, newWidth, newHeight);

    // 🔥 วาดพื้นหลังทับลงไป
    ctx.globalCompositeOperation = "destination-over";
    if (bgVideoRef.current && bgVideoRef.current.readyState >= 2) {
      ctx.drawImage(bgVideoRef.current, 0, 0, canvasWidth, canvasHeight);
    }

    ctx.restore();
  };


  useEffect(() => {
    const loadSelfieSegmentation = async () => {
      const { SelfieSegmentation } = await import("@mediapipe/selfie_segmentation"); // ✅ โหลด Mediapipe แบบ Dynamic
      if (!canvasRef.current) return;
      contextRef.current = canvasRef.current.getContext("2d");

      // 🔥 ใช้วิดีโอพื้นหลังจากลิงก์ออนไลน์
      if (bgVideoRef.current) {
        bgVideoRef.current.src = "https://www.w3schools.com/html/mov_bbb.mp4"; // เปลี่ยนลิงก์ได้
        bgVideoRef.current.loop = true;
        bgVideoRef.current.muted = true;
        bgVideoRef.current.autoplay = true;
        bgVideoRef.current.play();
      }

      const constraints: MediaStreamConstraints = {
        video: { width: { max: 1280 }, height: { max: 720 } },
      };

      navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        if (inputVideoRef.current) {
          inputVideoRef.current.srcObject = stream;
        }
        sendToMediaPipe();
      });

      const selfieSegmentation = new SelfieSegmentation({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
      });

      selfieSegmentation.setOptions({
        modelSelection: 1,
        selfieMode: true,
      });

      selfieSegmentation.onResults(onResults);

      const sendToMediaPipe = async () => {
        if (!inputVideoRef.current?.videoWidth) {
          requestAnimationFrame(sendToMediaPipe);
        } else {
          await selfieSegmentation.send({ image: inputVideoRef.current });
          requestAnimationFrame(sendToMediaPipe);
        }
      };
    }
    loadSelfieSegmentation(); // ✅ เรียกใช้งานฟังก์ชัน
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <video autoPlay ref={inputVideoRef} style={{ display: "none" }} />
      <video ref={bgVideoRef} style={{ display: "none" }} />
      {/* 🔥 แสดง Canvas แบบเต็มจอ */}
      <canvas ref={canvasRef} width={'720px'} height={'1280px'} className="absolute top-0 left-0 w-full h-full" />
    </main>
  );
};

export default Home;
