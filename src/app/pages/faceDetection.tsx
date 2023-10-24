"use client";
import React, { useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Button, Container } from "react-bootstrap";

const FaceDetection = () => {
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

  const handleFaceDetection = async (imageName: string) => {
    const imageElement =
      typeof window !== "undefined"
        ? (document.getElementById(imageName) as HTMLImageElement)
        : null;

    if (canvas && imageElement) {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");

      canvas.width = imageElement.width;
      canvas.height = imageElement.height;

      if (imageElement.complete) {
        setIsDisabled(true);
        canvas.getContext("2d")?.drawImage(imageElement, 0, 0);

        const faceDetector = new faceapi.TinyFaceDetectorOptions({
          inputSize: 512,
          scoreThreshold: 0.5,
        });
        const faces = await faceapi
          .detectAllFaces(canvas, faceDetector)
          .withFaceLandmarks()
          .withFaceDescriptors();

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
        Detect All Faces
      </Button>
      {filteredFaces.length > 0 && (
        <div style={{ marginTop: "30px", marginBottom: "30px" }}>
          {filteredFaces.map((face, i) => (
            <div key={i}>
              <p>Face {i + 1}</p>
              <p>X: {face?.detection.box.x}</p>
              <p>Y: {face?.detection.box.y}</p>
              <p>Width: {face?.detection.box.width}</p>
              <p>Height: {face?.detection.box.height}</p>
            </div>
          ))}
        </div>
      )}
      <h4>{message}</h4>
      <canvas id="canvas" />
    </Container>
  );
};

export default FaceDetection;
