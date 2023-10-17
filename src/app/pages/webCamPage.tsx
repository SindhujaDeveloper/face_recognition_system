// import React, { useEffect, useState, useRef } from "react";
// import { Button } from "react-bootstrap";
// import * as faceapi from "face-api.js";

// const WebCamPage = () => {
//   const [isOpen, setIsOpen] = useState(false);
//   const canvasRef = useRef<HTMLCanvasElement | null>(null);
//   const totalCaptureTime = 5000; // 5 minutes in milliseconds
//   const [capturing, setCapturing] = useState(false);

//   const MODEL_URL = "/models";

//   const loadModels = async () => {
//     await faceapi.loadSsdMobilenetv1Model(MODEL_URL);
//     await faceapi.loadFaceLandmarkModel(MODEL_URL);
//     await faceapi.loadFaceRecognitionModel(MODEL_URL);
//   };

//   useEffect(() => {
//     loadModels();
//   }, []);

//   const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const imgFile = e.target.files?.[0];
//     if (imgFile) {
//       const img = await faceapi.bufferToImage(imgFile);
//       const imageTag = document.getElementById("myImg") as HTMLImageElement;
//       if (imageTag) {
//         imageTag.src = img.src;
//       }
//       if (canvasRef.current && imageTag.src !== "") {
//         const canvas = canvasRef.current;
//         const detections = await faceapi
//           .detectAllFaces(img)
//           .withFaceLandmarks();
//         console.log(detections, "detections");
//         const displaySize = { width: img.width, height: img.height };
//         faceapi.matchDimensions(canvas, img, true);

//         faceapi.draw.drawDetections(canvas, detections);
//         faceapi.draw.drawFaceLandmarks(canvas, detections);
//       }
//     }
//   };

//   const captureImage = async () => {
//     const videoElement = document.createElement("video");
//     const constraints = { video: true };
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia(constraints);
//       videoElement.srcObject = stream;
//       await videoElement.play();

//       const canvas = canvasRef.current;
//       if (canvas) {
//         await new Promise((resolve) => setTimeout(resolve, 1000));

//         const context = canvas.getContext("2d");
//         canvas.width = videoElement.videoWidth;
//         canvas.height = videoElement.videoHeight;
//         context?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
//         stream.getTracks().forEach((track) => track.stop());
//       }
//     } catch (error) {
//       console.error("Error capturing image:", error);
//     }
//   };

//   const startCapturing = () => {
//     if (!capturing) {
//       setCapturing(true);
//       captureImage();
//       setTimeout(stopCapturing, totalCaptureTime);
//     }
//   };

//   const stopCapturing = () => {
//     setCapturing(false);
//   };

//   return (
//     <div style={{ display: "flex", flexDirection: "row" }}>
//       <div style={{ width: "200px", height: "350px" }}>hi</div>
//       <div>
//         <img id="myImg" src="" alt="image for face recognition" />
//         <canvas
//           ref={canvasRef}
//           id="valid-canvas"
//           style={{
//             position: "absolute",
//             top: 0,
//             left: "200px",
//           }}
//         />
//       </div>

//       <input
//         id="myFileUpload"
//         type="file"
//         onChange={(e) => {
//           if (
//             faceapi.nets.ssdMobilenetv1.params &&
//             faceapi.nets.faceLandmark68Net.params &&
//             faceapi.nets.faceRecognitionNet.params
//           ) {
//             uploadImage(e);
//           }
//         }}
//         accept=".jpg, .jpeg, .png"
//       />
//       <Button
//         variant="danger"
//         onClick={() => setIsOpen(!isOpen)}
//         style={{ height: "50px" }}
//       >
//         {`${isOpen ? "Close" : "Open"} Web Cam`}
//       </Button>
//       <Button
//         variant="danger"
//         onClick={startCapturing}
//         style={{ height: "50px" }}
//       >
//         Start Capturing
//       </Button>
//       <Button
//         variant="danger"
//         onClick={stopCapturing}
//         style={{ height: "50px" }}
//       >
//         Stop Capturing
//       </Button>
//     </div>
//   );
// };

// export default WebCamPage;

import React, { useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Button, Container } from "react-bootstrap";

const WebCamPage = () => {
  const [faces, setFaces] = useState<{ detection: faceapi.FaceDetection }[]>(
    []
  );
  const [message, setMessage] = useState("");
  const [filteredFaces, setFilteredFaces] = useState<any[]>([]);
  const [isDisabledFirst, setIsDisabledFirst] = useState(true);
  const [isDisabledSecond, setIsDisabledSecond] = useState(true);

  const canvas = document.getElementById("canvas") as HTMLCanvasElement;

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
    setFaces([]);
    setFilteredFaces([]);
    // canvas.width = 0;
    // canvas.height = 0;
    const imgFile = e.target.files?.[0];
    if (imgFile) {
      const img = await faceapi.bufferToImage(imgFile);
      const imageTag = document.getElementById(imageName) as HTMLImageElement;
      if (imageTag) {
        imageTag.src = img.src;
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
    const imageElement = document.getElementById(imageName) as HTMLImageElement;

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
        setFaces(faces);

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
      // const originalFace = await faceapi
      //   .detectSingleFace(
      //     originalFaceRef.current,
      //     new faceapi.TinyFaceDetectorOptions()
      //   )
      //   .withFaceLandmarks()
      //   .withFaceDescriptor();

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
            console.log("Match");
            handleFaceDetection("original", false, it);
            setFilteredFaces([...filteredFaces, it]);
            dummy = "Find A Match";
          } else {
            setFaces([]);
            canvas.width = 0;
            canvas.height = 0;
            if (dummy !== "Find A Match") {
              dummy = "There is no match";
            }
            return faces;
          }
          setMessage(dummy);
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
      <Button
        variant="danger"
        style={{ marginLeft: "20px", marginTop: "20px" }}
        disabled={isDisabledFirst || isDisabledSecond}
        onClick={() => handleFaceDetection("com")}
      >
        Detect All Faces
      </Button>
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

export default WebCamPage;
