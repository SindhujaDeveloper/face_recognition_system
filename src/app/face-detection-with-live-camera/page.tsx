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

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      await faceapi.nets.faceExpressionNet.loadFromUri("/models");
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      handleFaceDetection(videoRef.current);
    }
  }, [videoRef]);

  const startVideo = () => {
    if (!navigator.mediaDevices) {
      console.error("mediaDevices not supported");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: false,
      })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            snap();
          };
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  };

  const snap = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      const context = canvasRef.current.getContext("2d");
      context?.drawImage(videoRef.current, 0, 0);
    }
  }, []);

  const customDrawImage = (canvas: HTMLCanvasElement, detections: any) => {
    if (canvas && videoRef.current) {
      const context = canvas.getContext("2d");
      context?.drawImage(videoRef.current, 0, 0);
      faceapi.draw.drawDetections(canvas, detections);
      faceapi.draw.drawFaceLandmarks(canvas, detections);
    }
  };

  const handleFaceDetection = async (video: any) => {
    if (video) {
      video.onplay = async () => {
        const faceDetector = new faceapi.TinyFaceDetectorOptions({
          inputSize: 512,
          scoreThreshold: 0.5,
        });

        const detections = await faceapi
          .detectAllFaces(video, faceDetector)
          .withFaceLandmarks()
          .withFaceDescriptors()
          .withFaceExpressions();
        if (canvasRef.current) {
          const displaySize = {
            width: canvasRef.current.width,
            height: canvasRef.current.height,
          };

          faceapi.matchDimensions(canvasRef.current, displaySize);
          customDrawImage(canvasRef.current, detections);
          setResults(detections);
        }
      };
      return results;
    }
  };

  const handleCompareTwoFaces = async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
    if (videoRef.current) {
      if (originalFaceRef.current && canvasRef.current) {
        const faces = await handleFaceDetection(
          canvasRef.current.getContext("2d")
        );

        console.log(faces, "faces");
        const comparedFace = await faceapi
          .detectSingleFace(
            originalFaceRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (faces && comparedFace) {
          return faces?.map((it: any) => {
            const distance = faceapi.euclideanDistance(
              it?.descriptor,
              comparedFace.descriptor
            );
            let dummy = "";
            if (distance <= 0.5 && videoRef.current) {
              handleFaceDetection(videoRef.current);
              dummy = "Find A Match";
              setMessage(dummy);
            } else {
              if (canvasRef.current) {
                canvasRef.current.width = 0;
                canvasRef.current.height = 0;
              }
              if (dummy !== "Find A Match") {
                dummy = "There is no match";
              }
              setMessage(dummy);
              return faces;
            }
          });
        }
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const imgFile = e.target.files?.[0];
    if (imgFile) {
      const img = await faceapi.bufferToImage(imgFile);
      if (originalFaceRef.current) {
        originalFaceRef.current.src = img.src;
      }
    }
  };

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
          onChange={(e) => {
            handleImageUpload(e);
          }}
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
          <img ref={originalFaceRef} id="original" src="" />
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
        <video
          ref={videoRef}
          id="video"
          autoPlay
          muted
          // width="500"
          // height="500"
        ></video>
      </div>
      {canvasRef.current?.getContext("2d") && <h3>The Result Image</h3>}
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
      <div style={{ top: 0 }}>
        <canvas ref={canvasRef} id="canvas"></canvas>
      </div>
    </Container>
  );
};

export default Page;
