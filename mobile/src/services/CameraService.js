/**
 * Camera Service for INR100 Mobile App
 * Handles camera functionality for KYC document scanning and other features
 */

import { Camera } from 'react-native-vision-camera';
import { launchImageLibrary } from 'react-native-image-picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import ImageResizer from 'react-native-image-resizer';
import ImagePicker from 'react-native-image-crop-picker';
import DocumentPicker from 'react-native-document-picker';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

class CameraService {
  static instance = null;

  static getInstance() {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  // Permission Methods
  async requestCameraPermission() {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA 
        : PERMISSIONS.ANDROID.CAMERA;

      const result = await request(permission);
      
      switch (result) {
        case RESULTS.GRANTED:
          console.log('✅ Camera permission granted');
          return true;
        case RESULTS.DENIED:
          console.log('❌ Camera permission denied');
          return false;
        case RESULTS.BLOCKED:
          console.log('❌ Camera permission blocked');
          return false;
        case RESULTS.UNAVAILABLE:
          console.log('❌ Camera permission unavailable');
          return false;
        default:
          return false;
      }
    } catch (error) {
      console.error('Camera permission request error:', error);
      return false;
    }
  }

  async requestStoragePermission() {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.PHOTO_LIBRARY 
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

      const result = await request(permission);
      
      switch (result) {
        case RESULTS.GRANTED:
          console.log('✅ Storage permission granted');
          return true;
        case RESULTS.DENIED:
          console.log('❌ Storage permission denied');
          return false;
        case RESULTS.BLOCKED:
          console.log('❌ Storage permission blocked');
          return false;
        default:
          return false;
      }
    } catch (error) {
      console.error('Storage permission request error:', error);
      return false;
    }
  }

  async checkCameraPermission() {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA 
        : PERMISSIONS.ANDROID.CAMERA;

      const result = await check(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Camera permission check error:', error);
      return false;
    }
  }

  // Document Scanning Methods
  async scanDocument(documentType) {
    try {
      // Check permissions first
      const hasCameraPermission = await this.requestCameraPermission();
      if (!hasCameraPermission) {
        throw new Error('Camera permission required for document scanning');
      }

      // Launch camera with document scanning mode
      const image = await ImagePicker.openCamera({
        cropping: true,
        width: 800,
        height: 600,
        freeStyleCropEnabled: true,
        includeBase64: false,
        compressImageMaxWidth: 1200,
        compressImageMaxHeight: 1200,
        compressImageQuality: 0.8,
        showCropGuidelines: true,
        showCropFrame: true,
        hideBottomControls: false,
      });

      // Process and optimize the image
      const processedImage = await this.processDocumentImage(image, documentType);
      
      return {
        success: true,
        data: {
          uri: processedImage.uri,
          base64: processedImage.base64,
          width: processedImage.width,
          height: processedImage.height,
          size: processedImage.size,
          documentType,
          timestamp: new Date().toISOString(),
        }
      };

    } catch (error) {
      console.error('Document scanning error:', error);
      return {
        success: false,
        error: error.message || 'Document scanning failed'
      };
    }
  }

  async selectDocumentFromGallery(documentType) {
    try {
      // Check storage permission
      const hasStoragePermission = await this.requestStoragePermission();
      if (!hasStoragePermission) {
        throw new Error('Storage permission required for document selection');
      }

      const image = await ImagePicker.openPicker({
        width: 800,
        height: 600,
        cropping: true,
        freeStyleCropEnabled: true,
        showCropGuidelines: true,
        showCropFrame: true,
        mediaType: 'photo',
        compressImageMaxWidth: 1200,
        compressImageMaxHeight: 1200,
        compressImageQuality: 0.8,
      });

      const processedImage = await this.processDocumentImage(image, documentType);
      
      return {
        success: true,
        data: {
          uri: processedImage.uri,
          base64: processedImage.base64,
          width: processedImage.width,
          height: processedImage.height,
          size: processedImage.size,
          documentType,
          timestamp: new Date().toISOString(),
        }
      };

    } catch (error) {
      console.error('Document selection error:', error);
      return {
        success: false,
        error: error.message || 'Document selection failed'
      };
    }
  }

  async processDocumentImage(image, documentType) {
    try {
      // Resize and optimize image for document processing
      const resizedImage = await ImageResizer.createResizedImage(
        image.path,
        1200,
        800,
        'JPEG',
        80, // quality
        0, // rotation
        undefined,
        false,
        { mode: 'contain', onlyScaleDown: false }
      );

      // Convert to base64 for upload
      const base64 = await RNFS.readFile(resizedImage.uri, 'base64');

      return {
        uri: resizedImage.uri,
        base64: base64,
        width: resizedImage.width,
        height: resizedImage.height,
        size: resizedImage.size,
      };
    } catch (error) {
      console.error('Image processing error:', error);
      throw error;
    }
  }

  // Generic Camera Methods
  async takePhoto() {
    try {
      const hasCameraPermission = await this.requestCameraPermission();
      if (!hasCameraPermission) {
        throw new Error('Camera permission required');
      }

      const image = await ImagePicker.openCamera({
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
        cropping: false,
      });

      return {
        success: true,
        data: {
          uri: image.path,
          base64: image.data,
          width: image.width,
          height: image.height,
        }
      };

    } catch (error) {
      console.error('Take photo error:', error);
      return {
        success: false,
        error: error.message || 'Photo capture failed'
      };
    }
  }

  async selectPhoto() {
    try {
      const hasStoragePermission = await this.requestStoragePermission();
      if (!hasStoragePermission) {
        throw new Error('Storage permission required');
      }

      const image = await ImagePicker.openPicker({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
        cropping: true,
      });

      return {
        success: true,
        data: {
          uri: image.path,
          base64: image.data,
          width: image.width,
          height: image.height,
        }
      };

    } catch (error) {
      console.error('Photo selection error:', error);
      return {
        success: false,
        error: error.message || 'Photo selection failed'
      };
    }
  }

  // Document Picker for PDFs and other files
  async selectDocument() {
    try {
      const hasStoragePermission = await this.requestStoragePermission();
      if (!hasStoragePermission) {
        throw new Error('Storage permission required');
      }

      const document = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
        allowMultiSelection: false,
      });

      return {
        success: true,
        data: {
          uri: document.uri,
          name: document.name,
          type: document.type,
          size: document.size,
        }
      };

    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        return { success: false, error: 'Document selection cancelled' };
      }
      
      console.error('Document selection error:', error);
      return {
        success: false,
        error: error.message || 'Document selection failed'
      };
    }
  }

  // Selfie/Profile Picture Methods
  async takeSelfie() {
    try {
      const hasCameraPermission = await this.requestCameraPermission();
      if (!hasCameraPermission) {
        throw new Error('Camera permission required for selfie');
      }

      const image = await ImagePicker.openCamera({
        width: 400,
        height: 400,
        cropping: true,
        circleCrop: true,
        showCropFrame: false,
        showCropGuidelines: false,
        compressImageMaxWidth: 400,
        compressImageMaxHeight: 400,
        compressImageQuality: 0.8,
      });

      return {
        success: true,
        data: {
          uri: image.path,
          base64: image.data,
          width: image.width,
          height: image.height,
          type: 'selfie',
        }
      };

    } catch (error) {
      console.error('Selfie capture error:', error);
      return {
        success: false,
        error: error.message || 'Selfie capture failed'
      };
    }
  }

  async selectProfilePicture() {
    try {
      const hasStoragePermission = await this.requestStoragePermission();
      if (!hasStoragePermission) {
        throw new Error('Storage permission required');
      }

      const image = await ImagePicker.openPicker({
        width: 400,
        height: 400,
        cropping: true,
        circleCrop: true,
        mediaType: 'photo',
        compressImageMaxWidth: 400,
        compressImageMaxHeight: 400,
        compressImageQuality: 0.8,
      });

      return {
        success: true,
        data: {
          uri: image.path,
          base64: image.data,
          width: image.width,
          height: image.height,
          type: 'profile_picture',
        }
      };

    } catch (error) {
      console.error('Profile picture selection error:', error);
      return {
        success: false,
        error: error.message || 'Profile picture selection failed'
      };
    }
  }

  // Document Processing Utilities
  async validateDocument(documentData) {
    try {
      const { uri, documentType } = documentData;
      
      // Basic validation
      if (!uri) {
        throw new Error('Invalid document image');
      }

      // Get image dimensions
      const imageInfo = await RNFS.stat(uri);
      
      // Check minimum size requirements
      const minWidth = 300;
      const minHeight = 200;
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (imageInfo.size > maxSize) {
        throw new Error('Document image too large. Maximum size is 5MB');
      }

      // Document-specific validation
      const validationResult = await this.validateDocumentByType(documentData);
      
      return {
        success: true,
        data: {
          ...documentData,
          validated: true,
          validation: validationResult,
        }
      };

    } catch (error) {
      console.error('Document validation error:', error);
      return {
        success: false,
        error: error.message || 'Document validation failed'
      };
    }
  }

  async validateDocumentByType(documentData) {
    const { documentType, width, height } = documentData;
    
    const validation = {
      valid: true,
      warnings: [],
      errors: [],
    };

    switch (documentType) {
      case 'PAN_CARD':
        validation.warnings = this.validatePANCard(documentData);
        break;
      case 'AADHAAR_FRONT':
      case 'AADHAAR_BACK':
        validation.warnings = this.validateAadhaarCard(documentData);
        break;
      case 'PASSPORT':
        validation.warnings = this.validatePassport(documentData);
        break;
      default:
        // Generic validation
        if (width < 300 || height < 200) {
          validation.errors.push('Document image too small. Please capture a clearer image.');
        }
    }

    validation.valid = validation.errors.length === 0;
    return validation;
  }

  validatePANCard(documentData) {
    const warnings = [];
    
    if (documentData.width < 400 || documentData.height < 250) {
      warnings.push('PAN card image quality could be improved');
    }
    
    return warnings;
  }

  validateAadhaarCard(documentData) {
    const warnings = [];
    
    if (documentData.width < 400 || documentData.height < 600) {
      warnings.push('Aadhaar card image quality could be improved');
    }
    
    return warnings;
  }

  validatePassport(documentData) {
    const warnings = [];
    
    if (documentData.width < 400 || documentData.height < 400) {
      warnings.push('Passport image quality could be improved');
    }
    
    return warnings;
  }

  // Image Compression and Optimization
  async compressImage(uri, options = {}) {
    try {
      const {
        width = 1200,
        height = 800,
        quality = 0.8,
        format = 'JPEG',
      } = options;

      const compressedImage = await ImageResizer.createResizedImage(
        uri,
        width,
        height,
        format,
        quality * 100, // ImageResizer expects percentage
        0,
        undefined,
        false,
        { mode: 'contain', onlyScaleDown: false }
      );

      return compressedImage;
    } catch (error) {
      console.error('Image compression error:', error);
      throw error;
    }
  }

  // File Management
  async saveDocumentToCache(documentData) {
    try {
      const { uri, documentType, timestamp } = documentData;
      const fileName = `${documentType}_${timestamp}.jpg`;
      const cachePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
      
      await RNFS.copyFile(uri, cachePath);
      
      return {
        success: true,
        data: {
          cacheUri: cachePath,
          fileName,
        }
      };
    } catch (error) {
      console.error('Save document to cache error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async clearCache() {
    try {
      await RNFS.unlink(RNFS.CachesDirectoryPath);
      console.log('✅ Camera cache cleared');
    } catch (error) {
      console.error('Clear cache error:', error);
    }
  }
}

export default CameraService;