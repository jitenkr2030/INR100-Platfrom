---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 3046022100ed24a7aa73f010819309fce725a37b8ac30285e4092a3ec292c894a4b0748bf1022100b003ad33e88bcb6ea3c14eabe5826bb7220b3c92e972abbc481199d23ba45f37
    ReservedCode2: 304402206f1ff6bc25dee6c5c65632d71986728baeaafc5f76147198d045df23647fba54022054f79b1d59751e0ea0742855b6101234c13a1efec2ca822606f597ff97d14628
---

# 📱 INR100 Mobile App

## India's Premier Micro-Investing Mobile Platform

A comprehensive React Native mobile application that integrates seamlessly with the INR100 web platform, providing users with a complete mobile investing experience.

## ✨ Features

### 🔐 **Authentication & Security**
- **Multi-factor Authentication**: Email/phone + OTP verification
- **Biometric Authentication**: Fingerprint and Face ID support
- **Secure Session Management**: Automatic session refresh and validation
- **Bank-level Security**: 256-bit encryption for all sensitive data

### 💰 **Investment & Trading**
- **Real-time Portfolio Tracking**: Live portfolio updates and performance metrics
- **Investment Trading**: Buy/sell stocks, mutual funds, and ETFs with just ₹100
- **Market Data Integration**: Real-time market prices and charts
- **Order Management**: Track and manage all investment orders

### 💳 **Payment Integration**
- **UPI Payments**: Seamless UPI integration with all major apps
- **Multiple Payment Methods**: Net banking, cards, and digital wallets
- **Payment Security**: Biometric authentication for high-value transactions
- **Transaction History**: Complete payment and transaction records

### 📸 **Camera & Document Management**
- **KYC Document Scanning**: Camera integration for PAN, Aadhaar, and passport scanning
- **Image Processing**: Automatic image optimization and validation
- **Secure Document Storage**: Encrypted storage of sensitive documents
- **Selfie Authentication**: Biometric photo capture for identity verification

### 📚 **Learning Academy**
- **Mobile Learning Experience**: Interactive lessons and quizzes
- **Progress Tracking**: Learning streak and XP system
- **Video Content**: Mobile-optimized video tutorials
- **Offline Learning**: Download content for offline access

### 👥 **Social Features**
- **Community Feed**: Social investing community
- **Portfolio Sharing**: Share investment strategies
- **Expert Following**: Copy successful investor portfolios
- **Social Trading**: Follow and replicate trades

### 🔔 **Push Notifications**
- **Portfolio Updates**: Real-time portfolio performance notifications
- **Price Alerts**: Custom price notifications for investments
- **Order Status**: Transaction and order execution alerts
- **Learning Reminders**: Daily learning streak notifications
- **Social Activity**: Community interaction notifications

### 📱 **Mobile-Specific Features**
- **Offline Support**: Full offline functionality with data synchronization
- **Biometric Security**: Quick login with fingerprint/face recognition
- **Deep Linking**: Direct links to specific screens and features
- **Share Integration**: Share portfolio performance and achievements
- **Device Integration**: Camera, contacts, and device information access

## 🏗️ Architecture

### **Tech Stack**
- **Framework**: React Native 0.72.7
- **Navigation**: React Navigation v6
- **State Management**: React Context + AsyncStorage
- **UI Components**: Custom components + React Native Elements
- **Charts**: React Native Chart Kit
- **Animations**: React Native Reanimated + Lottie
- **Camera**: React Native Vision Camera + Image Picker
- **Notifications**: React Native Push Notification + Firebase
- **Biometrics**: React Native Biometrics + React Native Keychain
- **Storage**: AsyncStorage + MMKV for encrypted storage
- **Networking**: Axios for API communication
- **Analytics**: Firebase Analytics + Custom tracking

### **Service Architecture**
```
src/
├── components/           # Reusable UI components
├── screens/             # Screen components
│   ├── auth/           # Authentication screens
│   ├── dashboard/      # Main app screens
│   └── ...
├── navigation/         # Navigation configuration
├── services/           # Business logic services
│   ├── APIService.js      # Backend integration
│   ├── AuthService.js     # Authentication management
│   ├── BiometricService.js # Biometric authentication
│   ├── CameraService.js   # Camera and document handling
│   ├── PaymentService.js  # Payment processing
│   ├── NotificationService.js # Push notifications
│   ├── OfflineStorageService.js # Offline data management
│   └── AnalyticsService.js # User behavior tracking
├── utils/              # Utility functions
├── styles/             # Global styles and themes
└── assets/             # Images, fonts, animations
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)
- Firebase project setup

### Installation

1. **Clone the repository**
```bash
cd INR100-Platfrom/mobile
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup Firebase** (Required for notifications and analytics)
   - Create a Firebase project
   - Add Android and iOS apps
   - Download `google-services.json` and `GoogleService-Info.plist`
   - Place files in `android/app/` and `ios/` respectively

4. **Setup environment variables**
```bash
# Create .env file
cp .env.example .env
```

5. **iOS Setup**
```bash
cd ios && pod install
```

6. **Run the app**
```bash
# Android
npm run android

# iOS
npm run ios
```

### Environment Configuration

Create `.env` file with the following variables:
```env
API_BASE_URL=http://localhost:3000/api
FIREBASE_PROJECT_ID=your-firebase-project-id
BIOMETRIC_ENABLED=true
OFFLINE_MODE=true
ANALYTICS_ENABLED=true
```

## 📱 Key Services

### **APIService**
Handles all backend communication with the INR100 platform:
- Authentication (login, register, OTP)
- Portfolio management
- Investment trading
- Payment processing
- Market data
- User analytics

### **BiometricService**
Manages biometric authentication:
- Fingerprint and Face ID setup
- Secure credential storage
- Transaction authentication
- Device security validation

### **CameraService**
Camera and document management:
- Document scanning (PAN, Aadhaar, Passport)
- Image optimization and validation
- Selfie capture
- Secure file storage

### **PaymentService**
Payment processing integration:
- UPI payments (PhonePe, GPay, Paytm, etc.)
- QR code payments
- Payment verification
- Transaction tracking

### **NotificationService**
Push notification management:
- Portfolio updates
- Price alerts
- Order notifications
- Learning reminders
- Social activity

### **OfflineStorageService**
Offline data management:
- Data caching
- Offline queue management
- Background synchronization
- Storage optimization

### **AnalyticsService**
User behavior tracking:
- Screen views
- Feature usage
- Investment tracking
- Performance monitoring
- Custom analytics

## 🔧 Configuration

### **API Integration**
Update `src/utils/appInfo.js` with your backend API details:
```javascript
export const config = {
  api: {
    baseURL: 'https://your-api-domain.com/api',
    timeout: 30000,
  },
  firebase: {
    projectId: 'your-firebase-project-id',
  },
  notifications: {
    channelId: 'inr100-notifications',
    channelName: 'INR100 Notifications',
  },
};
```

### **Biometric Setup**
The app automatically detects and configures available biometric methods:
- Touch ID (iOS)
- Face ID (iOS)
- Fingerprint (Android)
- Iris scanning (Android)

### **Payment Configuration**
Supported UPI apps are automatically detected. Configure additional payment methods in `PaymentService.js`.

## 🎯 Features by User Journey

### **New User Onboarding**
1. Welcome screen with app introduction
2. Registration with email/phone
3. OTP verification
4. Biometric setup (optional)
5. KYC document scanning
6. First investment tutorial

### **Daily Usage**
1. Biometric authentication (if enabled)
2. Dashboard with portfolio overview
3. Quick investment actions
4. Learning content consumption
5. Social community interaction

### **Investment Flow**
1. Browse available assets
2. View detailed information and charts
3. Place buy/sell orders
4. Biometric authentication for security
5. Payment via UPI/other methods
6. Order confirmation and tracking

### **Learning Experience**
1. Personalized learning recommendations
2. Interactive lessons and quizzes
3. Progress tracking and XP rewards
4. Badge and achievement system
5. Social learning features

## 🔒 Security Features

### **Data Protection**
- End-to-end encryption for sensitive data
- Secure storage using React Native Keychain
- Automatic session management
- Biometric authentication for transactions

### **API Security**
- JWT token authentication
- Request/response encryption
- API rate limiting
- Secure payment processing

### **Device Security**
- Device binding and validation
- Root/jailbreak detection
- App tampering protection
- Secure element integration

## 📊 Analytics & Monitoring

### **User Analytics**
- Screen view tracking
- Feature usage analytics
- Investment behavior analysis
- Learning progress tracking

### **Performance Monitoring**
- App performance metrics
- Error tracking and reporting
- Crash analytics
- Network performance monitoring

### **Business Intelligence**
- User acquisition tracking
- Conversion funnel analysis
- Revenue analytics
- Feature adoption metrics

## 🧪 Testing

### **Unit Testing**
```bash
npm test
```

### **Integration Testing**
```bash
npm run test:integration
```

### **E2E Testing**
```bash
npm run test:e2e
```

## 📦 Building for Production

### **Android**
```bash
npm run build:android
```

### **iOS**
```bash
npm run build:ios
```

### **Code Push Updates**
```bash
npm run codepush:android
npm run codepush:ios
```

## 🔄 Offline Capabilities

The app provides full offline functionality:
- **Data Caching**: Portfolio, market data, and user preferences
- **Offline Queue**: Actions performed offline are synced when online
- **Background Sync**: Automatic data synchronization
- **Offline Learning**: Downloaded content for offline access

## 🌐 Multi-language Support

The app supports multiple languages:
- English (default)
- Hindi
- Tamil
- Telugu
- Bengali
- Marathi

## 📱 Platform Support

- **iOS**: 13.0+
- **Android**: API Level 23+ (Android 6.0+)
- **Tablets**: Optimized for both phone and tablet layouts

## 🤝 Integration with Web Platform

The mobile app seamlessly integrates with the INR100 web platform:
- **Shared Authentication**: Single sign-on across web and mobile
- **Data Synchronization**: Real-time sync between platforms
- **Feature Parity**: All web features available on mobile
- **Cross-platform Notifications**: Unified notification system

## 📈 Performance Optimization

- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Automatic image compression and caching
- **Bundle Splitting**: Code splitting for faster loading
- **Memory Management**: Efficient memory usage and cleanup
- **Battery Optimization**: Minimal battery usage in background

## 🔮 Future Enhancements

- **Voice Commands**: Voice-activated trading and queries
- **AI Chatbot**: In-app investment assistant
- **AR Features**: Augmented reality for document scanning
- **Advanced Analytics**: Personalized investment insights
- **Social Trading**: Enhanced social features and copy trading

## 📞 Support

For support and questions:
- **Email**: mobile-support@inr100.com
- **Documentation**: [docs.inr100.com/mobile](https://docs.inr100.com/mobile)
- **GitHub Issues**: [GitHub Repository](https://github.com/jitenkr2030/INR100-Platfrom/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Built with ❤️ for the Indian investment community** 🇮🇳

Start your wealth creation journey with just ₹100 on mobile!