import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Button, Container } from "react-bootstrap";

const WebCamPage = () => {
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [originalImages, setOriginalImages] = useState<HTMLImageElement[]>([]);
  const [count, setCount] = useState(0);
  const [comparedSrc, setComparedSrc] = useState<HTMLImageElement | null>(null);
  const [faces, setFaces] = useState<{ detection: faceapi.FaceDetection }[]>(
    []
  );
  const [message, setMessage] = useState("");
  const [filteredFaces, setFilteredFaces] = useState<
    { detection: faceapi.FaceDetection }[]
  >([]);
  const [originalImagesWithDescriptors, setOriginalImagesWithDescriptors] =
    useState<
      {
        image: HTMLImageElement;
        descriptor: faceapi.WithFaceDescriptor<
          faceapi.WithFaceLandmarks<
            { detection: faceapi.FaceDetection },
            faceapi.FaceLandmarks68
          >
        >;
      }[]
    >([]);

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
    };
    loadModels();
  }, []);

  const handleFaceDetection = async (
    imageElement: HTMLImageElement | null,
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
    const canvas = canvasRef.current;
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
        let matchedOriginal: any;

        originalImagesWithDescriptors.forEach((original: any) => {
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
        console.log(minDistance, "minDistance",compareFaceRef.current);
        setCount(originalImages.length);
        setComparedSrc(compareFaceRef.current);
        if (matchedOriginal) {
          handleFaceDetection(matchedOriginal.image, false);
          setFilteredFaces([matchedOriginal.descriptor]);
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

  console.log(
    comparedSrc?.src === compareFaceRef.current?.src,
    "comparedSrc",
    count !== originalImages.length,
    compareFaceRef.current,
    comparedSrc,
    filteredFaces,
    "filteredFaces"
  );
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
          comparedSrc?.src === compareFaceRef.current?.src ||
          isDisabledFirst ||
          isDisabledSecond
        }
        onClick={handleCompareTwoFaces}
      >
        Compare Two Faces
      </Button>
      <Button
        variant="danger"
        style={{ marginLeft: "20px", marginTop: "20px" }}
        disabled={isDisabledFirst || isDisabledSecond}
        onClick={() => handleFaceDetection(compareFaceRef.current)}
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
              <p>Expression: {}</p>
            </div>
          ))}
        </div>
      )}
      <h4>{message}</h4>
      <canvas ref={canvasRef} />
    </Container>
  );
};

export default WebCamPage;
