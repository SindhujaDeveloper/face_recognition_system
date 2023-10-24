"use client";
import React, { useRef, useState } from "react";
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

const FaceExpressionDetectionPage = () => {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [filteredFaces, setFilteredFaces] = useState<any[]>([]);
  const [isDisabled, setIsDisabled] = useState(true);
  const [images, setImages] = useState<any>([]);

  const canvas =
    typeof window !== "undefined"
      ? (document.getElementById("canvas") as HTMLCanvasElement)
      : null;

  const originalFaceRef = useRef<HTMLImageElement>(null);
  const originalInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (refTemp: string) => {
    originalInputRef.current?.click();
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    imageName: string
  ) => {
    if (images.length && canvas) {
      setFilteredFaces([]);
      setMessage("");
      canvas.height = 0;
      canvas.width = 0;
    }
    const imgFile = e.target.files?.[0];
    if (imgFile) {
      const img = await faceapi.bufferToImage(imgFile);
      const imageTag =
        typeof window !== "undefined"
          ? (document.getElementById(imageName) as HTMLImageElement)
          : null;
      if (imageTag) {
        imageTag.src = img.src;
        setImages([...images, img]);
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

  const handleFaceDetection = async (imageName: string) => {
    const imageElement =
      typeof window !== "undefined"
        ? (document.getElementById(imageName) as HTMLImageElement)
        : null;

    if (canvas && imageElement) {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      await faceapi.nets.faceExpressionNet.loadFromUri("/models");

      canvas.width = imageElement.width;
      canvas.height = imageElement.height;

      if (imageElement.complete) {
        setIsDisabled(true);
        canvas.getContext("2d")?.drawImage(imageElement, 0, 0);

        const faceDetector = new faceapi.TinyFaceDetectorOptions({
          inputSize: 512,
          scoreThreshold: 0.5,
        });
        const facesData = faceapi
          .detectAllFaces(canvas, faceDetector)
          .withFaceLandmarks();

        const faces = await facesData.withFaceDescriptors();
        const faceExpressionData: any = await facesData.withFaceExpressions();

        setFilteredFaces(faceExpressionData);
        if (faces.length) {
          faceapi.draw.drawFaceLandmarks(canvas, faces);
        } else {
          canvas.width = 0;
          canvas.height = 0;
          setMessage("There is no face detected");
        }
      } else {
        setMessage("image element not completed");
      }
    } else {
      console.error("Canvas or image element not found");
    }
  };

  return (
    <Container style={{ textAlign: "center" }}>
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
            handleImageUpload(e, "original");
            setIsDisabled(false);
          }}
        />
        <button
          onClick={() => handleUpload("original")}
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
        style={{ marginLeft: "20px", marginTop: "20px" }}
        disabled={isDisabled}
        onClick={() => handleFaceDetection("original")}
      >
        Detect All Faces with Expression
      </Button>
      <Button
        variant="danger"
        style={{ marginLeft: "20px", marginTop: "20px" }}
        onClick={() => router.push("/")}
      >
        Back
      </Button>
      {filteredFaces.length > 0 && (
        <div style={{ marginTop: "30px", marginBottom: "30px" }}>
          {filteredFaces.map((face, i) => {
            const expressionFinal = handleExpressionDetection(face);
            return (
              <div key={i}>
                <p>Face {i + 1}</p>
                {/* <p>X: {face?.detection.box.x}</p>
                <p>Y: {face?.detection.box.y}</p>
                <p>Width: {face?.detection.box.width}</p>
                <p>Height: {face?.detection.box.height}</p> */}
                <p>
                  Expression:{" "}
                  <b>{expressionFinal?.expression?.toUpperCase()}</b>
                </p>
                <p>
                  Expression Value:
                  <b> {expressionFinal?.highestvalue}%</b>
                </p>
              </div>
            );
          })}
        </div>
      )}
      <h4>{message}</h4>
      <canvas id="canvas" />
    </Container>
  );
};

export default FaceExpressionDetectionPage;
