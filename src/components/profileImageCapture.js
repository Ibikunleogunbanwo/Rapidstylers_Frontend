import React, { useState, useRef } from 'react';
import { API_BASE_URL, API_HEADER, showErrorToastMessage } from '../utils/constant';

/**
 * Captures a photo from the camera, uploads it DIRECTLY to Cloudinary
 * (never proxying bytes through our backend), and hands the secure CDN
 * URL to the parent via onCapture(url) — the URL is what gets saved in
 * the DB and rendered by the frontend.
 *
 * Flow:
 *   1. backend  GET /rapid_stylers/get_upload_signature  → cloudName, apiKey, timestamp, folder, signature
 *   2. frontend POST https://api.cloudinary.com/v1_1/{cloudName}/image/upload (multipart, signed) → secure_url
 *   3. parent   onCapture(secure_url)
 */
const PhotoCaptureForm = ({ onCapture }) => {
  const videoRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      showErrorToastMessage('Could not access the camera. Please allow camera permission.');
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
    }
  };

  /** Fetch signed upload credentials from our backend, then upload to Cloudinary. */
  const uploadToCloudinary = async () => {
    if (!imageSrc) return;

    setIsUploading(true);
    try {
      const signatureResponse = await fetch(`${API_BASE_URL}/get_upload_signature`, {
        headers: API_HEADER,
      });
      const signatureData = await signatureResponse.json();
      const { cloudName, apiKey, timestamp, folder, signature } = signatureData.data || {};

      if (!cloudName || !signature) {
        // Cloudinary isn't configured — fall back to the raw data URL so the flow never blocks.
        showErrorToastMessage('Cloudinary is not configured. Uploaded locally instead.');
        onCapture(imageSrc);
        return;
      }

      const blob = await (await fetch(imageSrc)).blob();
      const formData = new FormData();
      formData.append('file', blob, 'profile.png');
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('folder', folder);
      formData.append('signature', signature);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );
      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadData.secure_url) {
        throw new Error(uploadData.error?.message || 'Cloudinary upload failed');
      }

      onCapture(uploadData.secure_url);
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      showErrorToastMessage(error.message || 'Failed to upload photo. Please try again.');
      onCapture(imageSrc); // degrade gracefully to the local data URL
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      {imageSrc ? (
        <div>
          <img src={imageSrc} alt="Captured Photo" style={{ maxWidth: '100%' }} />
          <button onClick={() => { setImageSrc(null); startCamera(); }}>Retake Photo</button>
          <button onClick={uploadToCloudinary} disabled={isUploading}>
            {isUploading ? 'Uploading…' : 'Save Photo'}
          </button>
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
