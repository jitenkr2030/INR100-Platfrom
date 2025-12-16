import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlobalStyles } from '../../styles/GlobalStyles';

const { width } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    panNumber: '',
    aadharNumber: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    occupation: '',
    annualIncome: '',
    investmentExperience: '',
    riskProfile: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // Multi-step form: 1=Personal, 2=Financial, 3=Verification

  const investmentExperienceOptions = [
    'Beginner (0-2 years)',
    'Intermediate (2-5 years)',
    'Advanced (5-10 years)',
    'Expert (10+ years)'
  ];

  const riskProfileOptions = [
    'Conservative',
    'Moderately Conservative',
    'Moderate',
    'Moderately Aggressive',
    'Aggressive'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        return formData.firstName && 
               formData.lastName && 
               formData.email && 
               formData.phone && 
               formData.password && 
               formData.confirmPassword &&
               formData.password === formData.confirmPassword;
      
      case 2:
        return formData.panNumber && 
               formData.dateOfBirth && 
               formData.address && 
               formData.city && 
               formData.state && 
               formData.pincode && 
               formData.occupation && 
               formData.annualIncome &&
               formData.investmentExperience &&
               formData.riskProfile;
      
      case 3:
        return agreedToTerms;
      
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 3) {
        setStep(step + 1);
      } else {
        handleRegister();
      }
    } else {
      Alert.alert('Error', 'Please fill in all required fields correctly.');
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    
    try {
      const AuthService = require('../../services/AuthService').AuthService;
      const response = await AuthService.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email.toLowerCase(),
        phone: formData.phone,
        password: formData.password,
        panNumber: formData.panNumber.toUpperCase(),
        aadharNumber: formData.aadharNumber,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        occupation: formData.occupation,
        annualIncome: formData.annualIncome,
        investmentExperience: formData.investmentExperience,
        riskProfile: formData.riskProfile,
      });

      if (response.success) {
        Alert.alert(
          'Registration Successful!',
          'Please verify your email address to complete registration.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        Alert.alert('Registration Failed', response.message || 'Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPersonalInfoStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      
      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.firstName}
            onChangeText={(value) => handleInputChange('firstName', value)}
            placeholder="Enter first name"
            autoCapitalize="words"
          />
        </View>
        
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.lastName}
            onChangeText={(value) => handleInputChange('lastName', value)}
            placeholder="Enter last name"
            autoCapitalize="words"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email Address *</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          placeholder="Enter email address"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={formData.phone}
          onChangeText={(value) => handleInputChange('phone', value)}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          maxLength={10}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>Password *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              placeholder="Enter password"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-off" : "eye"} 
                size={20} 
                color={GlobalStyles.colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>Confirm Password *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              placeholder="Confirm password"
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons 
                name={showConfirmPassword ? "eye-off" : "eye"} 
                size={20} 
                color={GlobalStyles.colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderFinancialInfoStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Financial Information</Text>
      
      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>PAN Number *</Text>
          <TextInput
            style={styles.input}
            value={formData.panNumber}
            onChangeText={(value) => handleInputChange('panNumber', value.toUpperCase())}
            placeholder="ABCDE1234F"
            autoCapitalize="characters"
            maxLength={10}
          />
        </View>
        
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>Date of Birth *</Text>
          <TextInput
            style={styles.input}
            value={formData.dateOfBirth}
            onChangeText={(value) => handleInputChange('dateOfBirth', value)}
            placeholder="DD/MM/YYYY"
            keyboardType="numeric"
            maxLength={10}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Aadhar Number (Optional)</Text>
        <TextInput
          style={styles.input}
          value={formData.aadharNumber}
          onChangeText={(value) => handleInputChange('aadharNumber', value)}
          placeholder="1234 5678 9012"
          keyboardType="numeric"
          maxLength={12}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={formData.address}
          onChangeText={(value) => handleInputChange('address', value)}
          placeholder="Enter your address"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            value={formData.city}
            onChangeText={(value) => handleInputChange('city', value)}
            placeholder="Enter city"
            autoCapitalize="words"
          />
        </View>
        
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>State *</Text>
          <TextInput
            style={styles.input}
            value={formData.state}
            onChangeText={(value) => handleInputChange('state', value)}
            placeholder="Enter state"
            autoCapitalize="words"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>PIN Code *</Text>
        <TextInput
          style={styles.input}
          value={formData.pincode}
          onChangeText={(value) => handleInputChange('pincode', value)}
          placeholder="Enter PIN code"
          keyboardType="numeric"
          maxLength={6}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>Occupation *</Text>
          <TextInput
            style={styles.input}
            value={formData.occupation}
            onChangeText={(value) => handleInputChange('occupation', value)}
            placeholder="Enter occupation"
            autoCapitalize="words"
          />
        </View>
        
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>Annual Income *</Text>
          <TextInput
            style={styles.input}
            value={formData.annualIncome}
            onChangeText={(value) => handleInputChange('annualIncome', value)}
            placeholder="₹"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Investment Experience *</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.optionsScroll}
          contentContainerStyle={styles.optionsContainer}
        >
          {investmentExperienceOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionChip,
                formData.investmentExperience === option && styles.selectedOptionChip
              ]}
              onPress={() => handleInputChange('investmentExperience', option)}
            >
              <Text style={[
                styles.optionText,
                formData.investmentExperience === option && styles.selectedOptionText
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Risk Profile *</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.optionsScroll}
          contentContainerStyle={styles.optionsContainer}
        >
          {riskProfileOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionChip,
                formData.riskProfile === option && styles.selectedOptionChip
              ]}
              onPress={() => handleInputChange('riskProfile', option)}
            >
              <Text style={[
                styles.optionText,
                formData.riskProfile === option && styles.selectedOptionText
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderVerificationStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Terms & Conditions</Text>
      
      <View style={styles.termsContainer}>
        <Text style={styles.termsText}>
          By registering for an INR100 account, you agree to our Terms of Service and Privacy Policy. 
          You confirm that:
        </Text>
        
        <View style={styles.termsList}>
          <Text style={styles.termsItem}>• You are 18 years or older</Text>
          <Text style={styles.termsItem}>• The information provided is accurate and complete</Text>
          <Text style={styles.termsItem}>• You understand the risks associated with investments</Text>
          <Text style={styles.termsItem}>• You agree to comply with all applicable laws and regulations</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setAgreedToTerms(!agreedToTerms)}
      >
        <View style={[styles.checkbox, agreedToTerms && styles.checkedCheckbox]}>
          {agreedToTerms && (
            <Ionicons name="checkmark" size={16} color="#fff" />
          )}
        </View>
        <Text style={styles.checkboxText}>
          I agree to the Terms of Service and Privacy Policy *
        </Text>
      </TouchableOpacity>

      <View style={styles.verificationInfo}>
        <Ionicons name="shield-checkmark" size={24} color={GlobalStyles.colors.primary} />
        <Text style={styles.verificationText}>
          Your data is protected with bank-grade security and encrypted storage.
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={GlobalStyles.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((stepNumber) => (
          <View key={stepNumber} style={styles.progressItem}>
            <View style={[
              styles.progressCircle,
              step >= stepNumber && styles.progressCircleActive
            ]}>
              <Text style={[
                styles.progressNumber,
                step >= stepNumber && styles.progressNumberActive
              ]}>
                {stepNumber}
              </Text>
            </View>
            {stepNumber < 3 && (
              <View style={[
                styles.progressLine,
                step > stepNumber && styles.progressLineActive
              ]} />
            )}
          </View>
        ))}
      </View>

      {/* Form Content */}
      <ScrollView 
        style={styles.form}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && renderPersonalInfoStep()}
        {step === 2 && renderFinancialInfoStep()}
        {step === 3 && renderVerificationStep()}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {step > 1 && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handlePrevious}
          >
            <Text style={styles.secondaryButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            (!validateStep(step) || isLoading) && styles.disabledButton
          ]}
          onPress={handleNext}
          disabled={!validateStep(step) || isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Creating Account...' : step === 3 ? 'Create Account' : 'Next'}
          </Text>
          {!isLoading && (
            <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GlobalStyles.colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleActive: {
    backgroundColor: GlobalStyles.colors.primary,
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: GlobalStyles.colors.textSecondary,
  },
  progressNumberActive: {
    color: '#fff',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: GlobalStyles.colors.primary,
  },
  form: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GlobalStyles.colors.textPrimary,
    marginBottom: 24,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: 20,
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: GlobalStyles.colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: GlobalStyles.colors.textPrimary,
  },
  multilineInput: {
    textAlignVertical: 'top',
    height: 80,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  optionsScroll: {
    marginTop: 8,
  },
  optionsContainer: {
    paddingVertical: 8,
  },
  optionChip: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedOptionChip: {
    backgroundColor: GlobalStyles.colors.primary,
    borderColor: GlobalStyles.colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: GlobalStyles.colors.textPrimary,
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  termsContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  termsText: {
    fontSize: 14,
    color: GlobalStyles.colors.textPrimary,
    lineHeight: 20,
    marginBottom: 12,
  },
  termsList: {
    paddingLeft: 8,
  },
  termsItem: {
    fontSize: 14,
    color: GlobalStyles.colors.textSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: GlobalStyles.colors.primary,
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedCheckbox: {
    backgroundColor: GlobalStyles.colors.primary,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: GlobalStyles.colors.textPrimary,
    lineHeight: 20,
  },
  verificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 8,
  },
  verificationText: {
    flex: 1,
    fontSize: 14,
    color: GlobalStyles.colors.textPrimary,
    marginLeft: 12,
    lineHeight: 20,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: GlobalStyles.colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: GlobalStyles.colors.primary,
    marginRight: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: GlobalStyles.colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default RegisterScreen;