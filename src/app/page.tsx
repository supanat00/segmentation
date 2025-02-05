"use client"; // Ensure this is a Client Component in Next.js

import React, { useEffect, useRef } from "react";
import type { Results, SelfieSegmentation as SelfieSegmentationType } from "@mediapipe/selfie_segmentation";

export default function App() {
  const inputVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const selfieSegmentationRef = useRef<SelfieSegmentationType | null>(null);

  useEffect(() => {
    // Prevent running on the server
    if (typeof window === "undefined") return;

    // Set up the canvas context
    if (canvasRef.current) {
      contextRef.current = canvasRef.current.getContext("2d");
    }

    // Set up the background video
    if (bgVideoRef.current) {
      bgVideoRef.current.src = "https://www.w3schools.com/html/mov_bbb.mp4"; // Change this URL if needed
      bgVideoRef.current.loop = true;
      bgVideoRef.current.muted = true;
      bgVideoRef.current.autoplay = true;
      bgVideoRef.current.play();
    }

    const loadSelfieSegmentation = async () => {
      // Dynamically import the module inside useEffect (avoid top-level await)
      const { SelfieSegmentation } = await import("@mediapipe/selfie_segmentation");

      // Create the instance and store it in a ref
      selfieSegmentationRef.current = new SelfieSegmentation({
        locateFile: (file) =>
          `../../public/mediapipe/selfie_segmentation/${file}`,
      });

      selfieSegmentationRef.current.setOptions({
        modelSelection: 1,
        selfieMode: true,
      });

      // Set up the onResults callback using the correct type
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
        const xOffset = (canvasWidth - newWidth) / 1;
        const yOffset = (canvasHeight - newHeight) / 1;

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

      // Get camera stream and start processing
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

    // Define the function to continuously process frames
    const sendToMediaPipe = async () => {
      if (!inputVideoRef.current?.videoWidth) {
        requestAnimationFrame(sendToMediaPipe);
      } else if (selfieSegmentationRef.current) {
        await selfieSegmentationRef.current.send({ image: inputVideoRef.current });
        requestAnimationFrame(sendToMediaPipe);
      }
    };

    loadSelfieSegmentation();

    // Clean up when component unmounts
    return () => {
      if (selfieSegmentationRef.current) {
        selfieSegmentationRef.current.close();
      }
    };
  }, []);

  return (
    <main className="relative flex items-center justify-center min-h-screen bg-gray-900 text-white">
      {/* Hidden video element for the camera stream */}
      <video autoPlay ref={inputVideoRef} style={{ display: "none" }} />
      {/* Background video */}
      <video
        ref={bgVideoRef}
        className="absolute w-full h-full object-cover"
        muted
        playsInline
        loop
        autoPlay
      >
        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
      </video>
      {/* Canvas for segmentation output */}
      <canvas ref={canvasRef} width="720px" height="1280px" className="absolute top-0 left-0 w-full h-full" />
    </main>
  );
};
