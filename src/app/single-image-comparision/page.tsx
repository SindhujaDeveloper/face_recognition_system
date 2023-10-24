"use client";
import React, { useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Button, Container } from "react-bootstrap";
import { useRouter } from "next/navigation";

const SingleImageComparision = () => {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [filteredFaces, setFilteredFaces] = useState<any[]>([]);
  const [isDisabledFirst, setIsDisabledFirst] = useState(true);
  const [isDisabledSecond, setIsDisabledSecond] = useState(true);
  const [images, setImages] = useState<any>([]);

  const canvas =
    typeof window !== "undefined"
      ? (document.getElementById("canvas") as HTMLCanvasElement)
      : null;

  const originalFaceRef = useRef(null);
  const comparedFaceRef = useRef(null);
  const originalInputRef = useRef<HTMLInputElement>(null);
  const compareInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (refTemp: string) => {
    (refTemp === "original"
      ? originalInputRef
      : compareInputRef
    )?.current?.click();
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    imageName: string
  ) => {
    if (images.length && canvas !== null) {
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

  const handleFaceDetection = async (
    imageName: string,
    isCompare?: boolean,
    faceToDraw?: faceapi.WithFaceDescriptor<
      faceapi.WithFaceLandmarks<
        {
          detection: faceapi.FaceDetection;
        },
        faceapi.FaceLandmarks68
      >
    >[]
  ) => {
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
          if (!isCompare) {
            faceapi.draw.drawFaceLandmarks(
              canvas,
              faceToDraw ? faceToDraw : faces
            );
          } else {
            return faces;
          }
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

  const handleCompareTwoFaces = async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    await faceapi.nets.faceRecognitionNet.loadFromUri("/models");

    const faces = await handleFaceDetection("original", true);

    if (originalFaceRef.current && comparedFaceRef.current) {
      const comparedFace = await faceapi
        .detectSingleFace(
          comparedFaceRef.current,
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
          if (distance <= 0.5) {
            handleFaceDetection("original", false, it);
            setFilteredFaces([...filteredFaces, it]);
            dummy = "Find A Match";
            setMessage(dummy);
          } else {
            if (canvas) {
              canvas.width = 0;
              canvas.height = 0;
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
            setIsDisabledFirst(false);
          }}
        />
        <button
          onClick={() => handleUpload("original")}
          className="btn btn-outline-primary"
        >
          Upload
        </button>
      </div>
      <div style={{ marginTop: "30px", marginBottom: "30px" }}>
        <img ref={originalFaceRef} id="original" src="" />
      </div>
      <h4>Compare Image</h4>
      <div className="m-3">
        <label className="mx-3">Choose file: </label>
        <input
          type="file"
          name="image"
          id="image1"
          ref={compareInputRef}
          className="d-none"
          style={{ marginTop: "30px" }}
          accept=".jpg,.png,.jpeg"
          onChange={(e: any) => {
            handleImageUpload(e, "compare");
            setIsDisabledSecond(false);
          }}
        />
        <button
          onClick={() => handleUpload("compare")}
          className="btn btn-outline-primary"
        >
          Upload
        </button>
      </div>

      <div style={{ marginTop: "30px", marginBottom: "30px" }}>
        <img ref={comparedFaceRef} id="compare" src="" />
      </div>
      {/* <Button
        variant="danger"
        style={{ marginLeft: "20px", marginTop: "20px" }}
        disabled={isDisabledFirst || isDisabledSecond}
        onClick={() => handleFaceDetection("com")}
      >
        Detect All Faces
      </Button> */}
      <Button
        variant="danger"
        style={{ marginLeft: "20px", marginTop: "20px" }}
        disabled={
          filteredFaces.length > 0 || isDisabledFirst || isDisabledSecond
        }
        onClick={() => handleCompareTwoFaces()}
      >
        Compare Two Faces
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

export default SingleImageComparision;
