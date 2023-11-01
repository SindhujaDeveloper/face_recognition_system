"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Button, Container } from "react-bootstrap";
import { useRouter } from "next/navigation";

type FaceExpressions = {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
};

const Page = () => {
  const router = useRouter();

  const [message, setMessage] = useState<string>("");
  const [results, setResults] = useState<any[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalFaceRef = useRef<HTMLImageElement | null>(null);
  const originalInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      await faceapi.nets.faceExpressionNet.loadFromUri("/models");
    };
    loadModels();
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        videoRef.current.addEventListener("play", async () => {
          setInterval(async () => {
            await handleFaceDetection();
          }, 1);
        });
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  // const snap = () => {
  //   if (videoRef.current && liveCanvasRef.current) {
  //     const context = liveCanvasRef.current.getContext("2d");
  //     context?.clearRect(
  //       0,
  //       0,
  //       liveCanvasRef.current.width,
  //       liveCanvasRef.current.height
  //     );
  //     context?.drawImage(
  //       videoRef.current,
  //       0,
  //       0,
  //       liveCanvasRef.current.width,
  //       liveCanvasRef.current.height
  //     );
  //   }
  // };

  // const snap = useCallback(() => {
  //   if (videoRef.current && canvasRef.current) {
  //     canvasRef.current.width = videoRef.current.videoWidth;
  //     canvasRef.current.height = videoRef.current.videoHeight;
  //     const context = canvasRef.current.getContext("2d");
  //     context?.drawImage(videoRef.current, 0, 0);
  //   }
  // }, []);

  // const customDrawImage = (canvas: HTMLCanvasElement, detections: any) => {
  //   if (canvas && videoRef.current) {
  //     const context = canvas.getContext("2d");
  //     context?.drawImage(videoRef.current, 0, 0);
  //     faceapi.draw.drawDetections(canvas, detections);
  //     faceapi.draw.drawFaceLandmarks(canvas, detections);
  //   }
  // };

  const handleFaceDetection = async () => {
    if (videoRef.current && liveCanvasRef.current) {
      const faceDetector = new faceapi.TinyFaceDetectorOptions({
        inputSize: 512,
        scoreThreshold: 0.5,
      });

      const detections = await faceapi
        .detectAllFaces(videoRef.current, faceDetector)
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions();

      if (liveCanvasRef.current) {
        const displaySize = {
          width: 500,
          height: 600,
        };

        faceapi.matchDimensions(liveCanvasRef.current, displaySize);

        liveCanvasRef.current
          .getContext("2d")
          ?.clearRect(
            0,
            0,
            liveCanvasRef.current.width,
            liveCanvasRef.current.height
          );

        faceapi.draw.drawDetections(liveCanvasRef.current, detections);
        faceapi.draw.drawFaceLandmarks(liveCanvasRef.current, detections);

        setResults(detections);
      }
    }
  };

  const handleCompareTwoFaces = async () => {
    if (originalFaceRef.current && results.length > 0) {
      const comparedFace = await faceapi
        .detectSingleFace(
          originalFaceRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (comparedFace) {
        const distances = results.map((face: any) => {
          const distance = faceapi.euclideanDistance(
            face.descriptor,
            comparedFace.descriptor
          );
          return distance;
        });

        const isMatch = distances.some((distance) => distance <= 0.5);

        if (isMatch) {
          setMessage("Found a match");
        } else {
          setMessage("No match found");
        }
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const imgFile = e.target.files?.[0];
    if (imgFile && originalFaceRef.current) {
      originalFaceRef.current.src = URL.createObjectURL(imgFile);
    }
  };

  useEffect(() => {
    const animateVideo = () => {
      requestAnimationFrame(animateVideo);
      handleFaceDetection();
    };
    animateVideo();
  }, []);

  const formatPercentage = (value: number): number => {
    return Number((value * 100).toFixed(0));
  };

  const getKeyByValue = (object: { [x: string]: any }, value: number) => {
    return Object.keys(object).find((key) => object[key] === value);
  };

  const handleExpressionDetection = (data: any) => {
    const jsonData: FaceExpressions | undefined = data?.expressions;

    if (jsonData) {
      const formattedFaceExpressions = {
        neutral: formatPercentage(jsonData.neutral),
        happy: formatPercentage(jsonData.happy),
        sad: formatPercentage(jsonData.sad),
        angry: formatPercentage(jsonData.angry),
        fearful: formatPercentage(jsonData.fearful),
        disgusted: formatPercentage(jsonData.disgusted),
        surprised: formatPercentage(jsonData.surprised),
      };

      const convertedPercentages = Object.values(
        formattedFaceExpressions
      ).sort();
      const highestvalue =
        convertedPercentages[convertedPercentages.length - 1];
      return {
        highestvalue,
        expression: getKeyByValue(formattedFaceExpressions, highestvalue),
      };
    }
  };

  return (
    <Container style={{ textAlign: "center" }} id="faceDetection">
      <h4>Original Image</h4>
      <div className="m-3">
        <label className="mx-3">Choose file: </label>
        <input
          type="file"
          name="image"
          id="image"
          ref={originalInputRef}
          className="d-none"
          style={{ marginTop: "30px" }}
          accept=".jpg,.png,.jpeg"
          onChange={(e) => handleImageUpload(e)}
        />
        <button
          onClick={() => {
            if (originalInputRef.current) {
              originalInputRef.current.click();
            }
          }}
          className="btn btn-outline-primary"
        >
          Upload
        </button>
        <div style={{ marginTop: "30px", marginBottom: "30px" }}>
          <img ref={originalFaceRef} id="original" src="" alt="Original" />
        </div>
      </div>
      <Button
        variant="danger"
        style={{ marginTop: "20px" }}
        onClick={startVideo}
      >
        Start Video
      </Button>

      <Button
        variant="danger"
        style={{ marginLeft: "20px", marginTop: "20px" }}
        onClick={handleCompareTwoFaces}
      >
        Compare two faces
      </Button>
      <Button
        variant="danger"
        style={{ marginLeft: "20px", marginTop: "20px" }}
        onClick={() => router.push("/")}
      >
        Back
      </Button>
      <div id="video-container" className="video-container">
        <canvas
          ref={liveCanvasRef}
          id="liveCanvas"
          style={{
            position: "absolute",
            background: "transparent",
          }}
        ></canvas>
        <video ref={videoRef} id="video" autoPlay muted></video>
      </div>
      {results.length > 0 && (
        <div style={{ marginTop: "30px", marginBottom: "30px" }}>
          {results.map((face, i) => {
            const expressionFinal = handleExpressionDetection(face);
            return (
              <div key={i}>
                <p>Face</p>
                <p>X: {face.detection.box.x}</p>
                <p>Y: {face.detection.box.y}</p>
                <p>Width: {face.detection.box.width}</p>
                <p>Height: {face.detection.box.height}</p>
                <p>Expression: {expressionFinal?.expression}</p>
              </div>
            );
          })}
        </div>
      )}
      <h4>{message}</h4>
    </Container>
  );
};

export default Page;
