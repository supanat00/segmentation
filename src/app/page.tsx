"use client"; // Ensure this is a Client Component in Next.js

import React, { useEffect, useRef, useState } from "react";
import type { Results, SelfieSegmentation as SelfieSegmentationType } from "@mediapipe/selfie_segmentation";
import liff from "@line/liff";

export default function App() {
  const [liffInitialized, setLiffInitialized] = useState(false);
  const [started, setStarted] = useState(false);
  const inputVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const selfieSegmentationRef = useRef<SelfieSegmentationType | null>(null);

  // Initialize LIFF
  useEffect(() => {
    liff
      .init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID as string })
      .then(() => {
        console.log("LIFF initialization succeeded.");
        setLiffInitialized(true);
      })
      .catch((error) => {
        console.error("LIFF initialization failed", error);
      });
  }, []);

  // Start segmentation and camera only when the user confirms (started becomes true)
  useEffect(() => {
    if (!started) return; // Only run when started === true
    if (typeof window === "undefined") return;
    if (!canvasRef.current) return;
    contextRef.current = canvasRef.current.getContext("2d");

    // Set up background video
    if (bgVideoRef.current) {
      bgVideoRef.current.src = "https://www.w3schools.com/html/mov_bbb.mp4"; // Change URL if needed
      bgVideoRef.current.loop = true;
      bgVideoRef.current.muted = true;
      bgVideoRef.current.playsInline = true;
      bgVideoRef.current.autoplay = true;
      bgVideoRef.current.play().catch((error) =>
        console.error("Background video play error:", error)
      );
    }

    const loadSelfieSegmentation = async () => {
      const { SelfieSegmentation } = await import("@mediapipe/selfie_segmentation");

      selfieSegmentationRef.current = new SelfieSegmentation({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
      });

      selfieSegmentationRef.current.setOptions({
        modelSelection: 1,
        selfieMode: true,
      });

      selfieSegmentationRef.current.onResults((results: Results) => {
        const ctx = contextRef.current;
        if (!ctx || !canvasRef.current) return;

        ctx.save();
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // Calculate proper scale and positioning
        const videoWidth = results.image.width;
        const videoHeight = results.image.height;
        const canvasWidth = canvasRef.current.width;
        const canvasHeight = canvasRef.current.height;
        const scale = Math.min(canvasWidth / videoWidth, canvasHeight / videoHeight);
        const newWidth = videoWidth * scale;
        const newHeight = videoHeight * scale;
        const xOffset = (canvasWidth - newWidth) / 2;
        const yOffset = (canvasHeight - newHeight) / 2;

        // Draw the segmented person image
        ctx.drawImage(results.image, xOffset, yOffset, newWidth, newHeight);

        // Apply the segmentation mask to cut out the background
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(results.segmentationMask, xOffset, yOffset, newWidth, newHeight);

        // Draw the background video behind the person
        ctx.globalCompositeOperation = "destination-over";
        if (bgVideoRef.current && bgVideoRef.current.readyState >= 2) {
          ctx.drawImage(bgVideoRef.current, 0, 0, canvasWidth, canvasHeight);
        }

        ctx.restore();
      });

      if (navigator.mediaDevices?.getUserMedia) {
        const constraints: MediaStreamConstraints = {
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        };

        navigator.mediaDevices.getUserMedia(constraints)
          .then((stream) => {
            if (inputVideoRef.current) {
              inputVideoRef.current.srcObject = stream;
            }
            sendToMediaPipe();
          })
          .catch((error) => {
            console.error("Error accessing camera:", error);
          });
      }
    };

    const sendToMediaPipe = async () => {
      if (!inputVideoRef.current?.videoWidth) {
        requestAnimationFrame(sendToMediaPipe);
      } else if (selfieSegmentationRef.current) {
        await selfieSegmentationRef.current.send({ image: inputVideoRef.current });
        requestAnimationFrame(sendToMediaPipe);
      }
    };

    loadSelfieSegmentation();

    return () => {
      if (selfieSegmentationRef.current) {
        selfieSegmentationRef.current.close();
      }
    };
  }, [started]);

  return (
    <>
      <main className="relative flex items-center justify-center w-full h-full bg-gray-900 text-white">
        {/* Overlay button: Show only if LIFF is initialized and not started */}
        {!started && liffInitialized && (
          <div className="absolute inset-0 flex items-center justify-center z-[9999]">
            <button
              onClick={() => setStarted(true)}
              className="px-6 py-3 text-xl font-bold text-white bg-blue-600 rounded"
            >
              กด ยืนยัน เพื่อเริ่มเล่น
            </button>
          </div>
        )}

        {/* Hidden video element for the camera stream */}
        <video playsInline autoPlay ref={inputVideoRef} style={{ display: "none" }} />

        {/* Background video */}
        <video
          ref={bgVideoRef}
          className="absolute w-full h-full object-cover z-0"
          muted
          playsInline
          loop
          autoPlay
        >
          <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
        </video>

        {/* Canvas for segmentation output */}
        <canvas
          ref={canvasRef}
          width="720px"
          height="1280px"
          className="absolute top-0 left-0 w-full h-full z-10"
        />
      </main>
    </>
  );
}
