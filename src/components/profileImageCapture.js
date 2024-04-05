import React, { useState, useRef } from 'react';

const PhotoCaptureForm = ({ onCapture }) => {
  const videoRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    const video = videoRef.current;

    if (video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

      const photoDataUrl = canvas.toDataURL('image/png');
      setImageSrc(photoDataUrl);
      setIsCapturing(false);
      stopCamera();
      onCapture(photoDataUrl); // Pass captured image to the parent component
    }
  };

  const stopCamera = () => {
    const video = videoRef.current;

    if (video && video.srcObject) {
      const stream = video.srcObject;
      const tracks = stream.getTracks();

      tracks.forEach((track) => track.stop());
      video.srcObject = null;
    }
  };

  return (
    <div>
      {imageSrc ? (
        <div>
          <img src={imageSrc} alt="Captured Photo" />
          <button onClick={() => { setImageSrc(null); startCamera(); }}>Start Camera Capture</button>
        </div>
      ) : (
        <div>
          <video ref={videoRef} autoPlay />
          <button onClick={isCapturing ? capturePhoto : startCamera}>
            {isCapturing ? 'Capture Image' : 'Start Camera Capture'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoCaptureForm;
