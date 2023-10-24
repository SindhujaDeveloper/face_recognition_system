"use client";
import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Button, Container } from "react-bootstrap";
import { useRouter } from "next/navigation";

interface FaceWithDescriptor {
  image: HTMLImageElement;
  descriptor: faceapi.WithFaceDescriptor<
    faceapi.WithFaceLandmarks<
      { detection: faceapi.FaceDetection },
      faceapi.FaceLandmarks68
    >
  >;
}

type FaceExpressions = {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
};

const MultipleImageUpload = () => {
  const router = useRouter();

  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [originalImages, setOriginalImages] = useState<HTMLImageElement[]>([]);
  const [count, setCount] = useState(0);
  const [comparedSrc, setComparedSrc] = useState<HTMLImageElement | null>(null);
  const [faceExpression, setFaceExpression] = useState<{
    highestvalue: number;
    expression: string | undefined;
  } | null>(null);
  const [faces, setFaces] = useState<{ detection: faceapi.FaceDetection }[]>(
    []
  );
  const [message, setMessage] = useState("");
  const [filteredFaces, setFilteredFaces] = useState<FaceWithDescriptor[]>([]);
  const [originalImagesWithDescriptors, setOriginalImagesWithDescriptors] =
    useState<FaceWithDescriptor[]>([]);
  const [isDisabledFirst, setIsDisabledFirst] = useState(true);
  const [isDisabledSecond, setIsDisabledSecond] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalFaceRef = useRef<HTMLImageElement | null>(null);
  const compareFaceRef = useRef<HTMLImageElement | null>(null);
  const originalInputRef = useRef<HTMLInputElement | null>(null);
  const compareInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = (refTemp: string) => {
    (refTemp === "original"
      ? originalInputRef
      : compareInputRef
    )?.current?.click();
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: string
  ) => {
    const uploadedFiles = e.target.files;
    if (uploadedFiles) {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const imgFile =
          type === "compare" ? uploadedFiles[0] : uploadedFiles[i];

        if (imgFile) {
          const img = await faceapi.bufferToImage(imgFile);
          if (type === "original") {
            const descriptor = await faceapi
              .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceDescriptor();

            if (descriptor) {
              setOriginalImagesWithDescriptors([
                ...originalImagesWithDescriptors,
                { image: img, descriptor },
              ]);
            }

            setOriginalImages((prevImages) => [...prevImages, img]);
          } else {
            setImages([img]);
          }
        }
      }
    }
  };

  // const handleImageLoad = (imageRef: { current: any }, type: string) => {
  //   const imageElement = imageRef.current;
  //   if (imageElement && canvasRef.current) {
  //     canvasRef.current.width = 0;
  //     canvasRef.current.height = 0;

  //      handleFaceDetection(imageElement, type === "compare");
  //   }
  // };

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      await faceapi.nets.faceExpressionNet.loadFromUri("/models");
    };
    loadModels();
  }, []);

  const handleFaceDetection = async (
    imageElement: HTMLImageElement | null,
    isCompare?: boolean,
    faceToDraw?: faceapi.WithFaceDescriptor<
      faceapi.WithFaceLandmarks<
        { detection: faceapi.FaceDetection },
        faceapi.FaceLandmarks68
      >
    >[]
  ) => {
    const canvas = typeof window !== "undefined" ? canvasRef.current : null;
    if (canvas && imageElement) {
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;

      if (imageElement.complete) {
        canvas.getContext("2d")?.drawImage(imageElement, 0, 0);

        const faceDetector = new faceapi.TinyFaceDetectorOptions({
          inputSize: 512,
          scoreThreshold: 0.5,
        });
        const detectedFaces = await faceapi
          .detectAllFaces(canvas, faceDetector)
          .withFaceLandmarks()
          .withFaceDescriptors();
        setFaces([...faces, ...detectedFaces]);

        if (detectedFaces.length) {
          if (!isCompare) {
            faceapi.draw.drawFaceLandmarks(
              canvas,
              faceToDraw ? faceToDraw : detectedFaces
            );
          } else {
            return detectedFaces;
          }
        } else {
          canvas.width = 0;
          canvas.height = 0;
          setMessage("There is no face detected");
        }
      } else {
        setMessage("Image element not completed");
      }
    } else {
      console.error("Canvas or image element not found");
    }
  };

  const formatPercentage = (value: number): number => {
    return Number((value * 100).toFixed(0));
  };

  const getKeyByValue = (object: { [x: string]: any }, value: number) => {
    return Object.keys(object).find((key) => object[key] === value);
  };

  const handleCompareTwoFaces = async () => {
    if (compareFaceRef?.current) {
      const comparedFace = await faceapi
        .detectSingleFace(
          compareFaceRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (
        originalFaceRef.current &&
        comparedFace &&
        originalImagesWithDescriptors.length > 0
      ) {
        let minDistance = Infinity;
        let matchedOriginal: FaceWithDescriptor | undefined;

        originalImagesWithDescriptors.forEach((original) => {
          const distance = faceapi.euclideanDistance(
            original.descriptor.descriptor,
            comparedFace.descriptor
          );
          if (distance <= 0.5) {
            if (distance < minDistance) {
              minDistance = distance;
              matchedOriginal = original;
            }
          }
        });
        setCount(originalImages.length);
        setComparedSrc(compareFaceRef.current);
        if (matchedOriginal) {
          handleFaceDetection(matchedOriginal.image, false);
          setFilteredFaces([matchedOriginal]);

          const faceExpression = await faceapi
            .detectSingleFace(
              matchedOriginal.image,
              new faceapi.TinyFaceDetectorOptions()
            )
            .withFaceLandmarks()
            .withFaceExpressions();

          const jsonData: FaceExpressions | undefined =
            faceExpression?.expressions;

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

            setFaceExpression({
              highestvalue,
              expression: getKeyByValue(formattedFaceExpressions, highestvalue),
            });
          }

          setMessage("Find A Match");
        } else {
          if (canvasRef.current) {
            setFilteredFaces([]);
            setMessage("");
            canvasRef.current.width = 0;
            canvasRef.current.height = 0;
          }
          if (message !== "Find A Match") {
            setMessage("There is no match");
          }
        }
      }
    }
  };

  return (
    <Container style={{ textAlign: "center" }}>
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
          multiple={false}
          onChange={(e) => {
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
      {images.map((img, index) => (
        <div
          key={`${img.src}_${index}`}
          style={{ marginTop: "30px", marginBottom: "30px" }}
        >
          <img
            ref={compareFaceRef}
            id={`compare_${index}`}
            src={img.src}
            alt={`compare_${index}`}
            // onLoad={() => handleImageLoad(compareFaceRef, "compare")}
          />
        </div>
      ))}

      <h4>Original Image</h4>
      <div className="m-3">
        <label className="mx-3">Choose file: </label>
        <input
          type="file"
          name="image"
          multiple
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
      {originalImages.map((img, index) => (
        <div
          key={`${img.src}_${index}`}
          style={{ marginTop: "30px", marginBottom: "30px" }}
        >
          <img
            ref={originalFaceRef}
            id={`original_${index}`}
            src={img.src}
            alt={`original_${index}`}
            // onLoad={() => handleImageLoad(originalFaceRef, "original")}
          />
        </div>
      ))}

      <div style={{ marginTop: "30px", marginBottom: "30px" }}>
        <img
          ref={compareFaceRef}
          id="compare"
          src=""
          onLoad={() => handleFaceDetection(compareFaceRef.current)}
        />
      </div>
      <Button
        variant="danger"
        style={{ marginLeft: "20px", marginTop: "20px" }}
        disabled={
          // count === originalImages.length ||
          // comparedSrc?.src === compareFaceRef.current?.src ||
          isDisabledFirst || isDisabledSecond
        }
        onClick={handleCompareTwoFaces}
      >
        Compare Two Faces
      </Button>
      {/* <Button
        variant="danger"
        style={{ marginLeft: "20px", marginTop: "20px" }}
        disabled={isDisabledFirst || isDisabledSecond}
        onClick={() => handleFaceDetection(compareFaceRef.current)}
      >
        Detect All Faces
      </Button> */}
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
              <p>X: {face?.descriptor.detection.box.x}</p>
              <p>Y: {face?.descriptor.detection.box.y}</p>
              <p>Width: {face?.descriptor.detection.box.width}</p>
              <p>Height: {face?.descriptor.detection.box.height}</p>
              <p>
                Expression:{faceExpression?.expression}{" "}
                {faceExpression?.highestvalue}%
              </p>
            </div>
          ))}
        </div>
      )}
      <h4>{message}</h4>
      <canvas ref={canvasRef} />
    </Container>
  );
};

export default MultipleImageUpload;
