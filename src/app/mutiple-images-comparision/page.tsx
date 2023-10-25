"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

interface descriptorData {
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

  let dynamicCanvasRefs: React.RefObject<HTMLCanvasElement>[] = [];

  // const dynamicCanvasRefs = images.map(() => React.createRef());

  for (let i = 0; i < 5; i++) {
    dynamicCanvasRefs[i] = useRef<HTMLCanvasElement | null>(null);
  }

  const [filteredFaces1, setFilteredFaces1] = useState<any[]>([]);
  const [result, setResult] = useState<any[]>([]);
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

  const handleFaceDetection = useCallback(
    async (
      imageElement: HTMLImageElement | null,
      canvasRef: React.RefObject<HTMLCanvasElement>,
      imageIndex: number,
      isCompare?: boolean
    ) => {
      // const canvas =
      //   typeof window !== "undefined"
      //     ? dynamicCanvasRefs[imageIndex]?.current
      //     : null;

      // const canvas = imageIndex
      //   ? dynamicCanvasRefs[imageIndex]?.current
      //   : canvasRef?.current;

      const canvas = typeof window !== "undefined" ? canvasRef?.current : null;

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
              faceapi.draw.drawFaceLandmarks(canvas, detectedFaces);
              detectedFaces.map((face, i) => {
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  if (face && face.detection && face.detection.box) {
                    ctx.strokeStyle = "black";
                    ctx.strokeText(
                      `Face ${i + 1}`,
                      face.detection.box.x,
                      face.detection.box.y - 3,
                      100
                    );
                    ctx.strokeRect(
                      face.detection.box.x,
                      face.detection.box.y,
                      face.detection.box.width,
                      face.detection.box.height
                    );
                  }
                }
              });
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
    },
    []
  );

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
        // let minDistance = Infinity;
        // let matchedOriginalData1: FaceWithDescriptor | undefined;

        const data = originalImagesWithDescriptors.filter((original) => {
          const distance = faceapi.euclideanDistance(
            original.descriptor.descriptor,
            comparedFace.descriptor
          );
          return distance <= 0.5;
        });

        // data.forEach((original) => {
        //   const distance = faceapi.euclideanDistance(
        //     original.descriptor.descriptor,
        //     comparedFace.descriptor
        //   );
        //   if (distance <= 0.5) {
        //     if (distance < minDistance) {
        //       minDistance = distance;
        //       matchedOriginalData1 = original;
        //     }
        //   }
        // });

        if (data.length > 0) {
          setCount(originalImages.length);
          setComparedSrc(compareFaceRef.current);
          const results = await Promise.all(
            data.map(async (matchedOriginal, index) => {
              // if (matchedOriginalData1) {
              //   handleFaceDetection(matchedOriginal.image, null, false);
              //   // setFilteredFaces([matchedOriginal]);
              // }
              // handleFaceDetection(matchedOriginal.image, index, false);

              const faceExpression = await faceapi
                .detectSingleFace(
                  matchedOriginal.image,
                  new faceapi.TinyFaceDetectorOptions()
                )
                .withFaceLandmarks()
                .withFaceExpressions();

              const jsonData: FaceExpressions | undefined =
                faceExpression?.expressions;

              setFilteredFaces1([...filteredFaces1, faceExpression]);

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
                  expression: getKeyByValue(
                    formattedFaceExpressions,
                    highestvalue
                  ),
                });
              }

              return matchedOriginal; // Return the result of each async operation
            })
          );
          setMessage("Find A Match");
          setResult(results);
        } else {
          setFilteredFaces([]);
          setResult([]);
          setMessage("There is no match");
          dynamicCanvasRefs = [];
          if (canvasRef.current) {
            canvasRef.current.width = 0;
            canvasRef.current.height = 0;
          }
        }
      }
    }
  };

  console.log(filteredFaces1, "face1", result);

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
            onLoad={() => setResult([])}
            // onLoad={() => handleFaceDetection(img, index, false)}
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
            onLoad={() => setResult([])}
            // onLoad={() => handleImageLoad(originalFaceRef, "original")}
          />
        </div>
      ))}

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
      <h4
        style={{
          marginTop: "30px",
          marginBottom: "30px",
        }}
      >
        {message}
      </h4>

      {result.map((img, index) => (
        <div
          key={`result_${index}`}
          style={{
            marginTop: "30px",
            marginBottom: "30px",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-evenly",
          }}
        >
          <img
            src={img?.image.src}
            alt={`compare_${index}`}
            onLoad={() =>
              handleFaceDetection(
                img?.image,
                dynamicCanvasRefs[index],
                index,
                false
              )
            }
          />
          <canvas ref={dynamicCanvasRefs[index]} />
        </div>
      ))}
      {/* <canvas ref={canvasRef} /> */}
    </Container>
  );
};

export default MultipleImageUpload;
