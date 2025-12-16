'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Camera, 
  Upload, 
  RotateCw, 
  Check, 
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface CameraCaptureProps {
  onCapture?: (imageBlob: Blob, fileName: string) => void;
  onError?: (error: string) => void;
  documentType?: 'PAN_CARD' | 'AADHAAR_FRONT' | 'AADHAAR_BACK' | 'SELFIE';
  className?: string;
}

interface CapturedImage {
  blob: Blob;
  url: string;
  fileName: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onError,
  documentType = 'SELFIE',
  className = ''
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isOnline, addOfflineData } = useOfflineSync();

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsCapturing(true);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err) {
      const errorMessage = 'Camera access denied or not available';
      setError(errorMessage);
      onError?.(errorMessage);
      setIsCapturing(false);
    }
  }, [facingMode, onError]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const fileName = `${documentType}_${Date.now()}.jpg`;
          const url = URL.createObjectURL(blob);
          
          const capturedImage: CapturedImage = {
            blob,
            url,
            fileName
          };

          setCapturedImage(capturedImage);
          stopCamera();
          
          // Handle capture
          if (isOnline) {
            onCapture?.(blob, fileName);
          } else {
            // Queue for offline sync
            addOfflineData({
              type: 'kyc-document',
              action: 'create',
              data: {
                type: documentType,
                imageBlob: blob,
                fileName,
                queuedAt: new Date()
              }
            });
            alert('Document queued for upload when online');
          }
        }
      },
      'image/jpeg',
      0.8
    );
  }, [documentType, onCapture, isOnline, addOfflineData, stopCamera]);

  const retakePhoto = useCallback(() => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.url);
      setCapturedImage(null);
    }
    startCamera();
  }, [capturedImage, startCamera]);

  const switchCamera = useCallback(() => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    if (stream) {
      stopCamera();
      setTimeout(() => {
        setFacingMode(newFacingMode);
        startCamera();
      }, 100);
    }
  }, [facingMode, stream, stopCamera, startCamera]);

  const uploadFromGallery = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    const fileName = `${documentType}_${Date.now()}_${file.name}`;
    
    if (isOnline) {
      onCapture?.(file, fileName);
    } else {
      // Queue for offline sync
      addOfflineData({
        type: 'kyc-document',
        action: 'create',
        data: {
          type: documentType,
          imageBlob: file,
          fileName,
          queuedAt: new Date()
        }
      });
      alert('Document queued for upload when online');
    }
  }, [documentType, onCapture, isOnline, addOfflineData]);

  const getDocumentTypeLabel = () => {
    const labels = {
      PAN_CARD: 'PAN Card',
      AADHAAR_FRONT: 'Aadhaar Card (Front)',
      AADHAAR_BACK: 'Aadhaar Card (Back)',
      SELFIE: 'Selfie'
    };
    return labels[documentType] || 'Document';
  };

  if (capturedImage) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold text-lg">{getDocumentTypeLabel()}</h3>
              <p className="text-sm text-gray-600">Captured successfully</p>
            </div>

            <div className="relative">
              <img
                src={capturedImage.url}
                alt="Captured document"
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="absolute top-2 right-2">
                <Check className="h-6 w-6 text-green-600 bg-white rounded-full p-1" />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={retakePhoto}
                className="flex-1"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Retake
              </Button>
              <Button
                onClick={() => {
                  if (capturedImage) {
                    URL.revokeObjectURL(capturedImage.url);
                    setCapturedImage(null);
                  }
                }}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-semibold text-lg">{getDocumentTypeLabel()}</h3>
            <p className="text-sm text-gray-600">
              {isOnline ? 'Capture or upload your document' : 'Camera unavailable offline'}
            </p>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {isCapturing ? (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover rounded-lg bg-black"
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                <Button
                  onClick={capturePhoto}
                  size="lg"
                  className="rounded-full w-16 h-16"
                >
                  <Camera className="h-6 w-6" />
                </Button>
              </div>

              <div className="absolute top-4 right-4">
                <Button
                  onClick={switchCamera}
                  size="sm"
                  variant="secondary"
                  className="rounded-full"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="absolute top-4 left-4">
                <Button
                  onClick={stopCamera}
                  size="sm"
                  variant="secondary"
                  className="rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={startCamera}
                disabled={!isOnline}
                className="flex flex-col items-center space-y-2 h-20"
              >
                <Camera className="h-6 w-6" />
                <span className="text-sm">Camera</span>
              </Button>

              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                disabled={!isOnline}
                className="flex flex-col items-center space-y-2 h-20"
              >
                <Upload className="h-6 w-6" />
                <span className="text-sm">Gallery</span>
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={uploadFromGallery}
            className="hidden"
          />

          {!isOnline && (
            <div className="text-center text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
              Documents will be queued for upload when you're back online
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CameraCapture;