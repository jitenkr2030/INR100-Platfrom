/**
 * Offline Learning Screen for INR100 Mobile App
 * Manages offline content downloads and voice learning features
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Switch,
  Slider,
  Modal,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GlobalStyles } from '../styles/GlobalStyles';
import { APIService } from '../services/APIService';
import { OfflineStorageService } from '../services/OfflineStorageService';

const { width: screenWidth } = Dimensions.get('window');

const OfflineLearningScreen = ({ navigation }) => {
  const [offlineContent, setOfflineContent] = useState([]);
  const [voiceSettings, setVoiceSettings] = useState({
    voiceEnabled: true,
    voiceSpeed: 1.0,
    autoPlay: false
  });
  const [storageUsage, setStorageUsage] = useState({
    used: 0,
    total: 0,
    percentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);

  useEffect(() => {
    loadOfflineData();
    loadVoiceSettings();
  }, []);

  const loadOfflineData = async () => {
    try {
      setLoading(true);
      
      const response = await APIService.get('/mobile/offline-content');
      
      if (response.success) {
        setOfflineContent(response.data.offlineContent || []);
        setStorageUsage(response.data.storage || { used: 0, total: 0, percentage: 0 });
      } else {
        Alert.alert('Error', response.message || 'Failed to load offline content');
      }
    } catch (error) {
      console.error('Offline data loading error:', error);
      Alert.alert('Error', 'Failed to load offline content');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadVoiceSettings = async () => {
    try {
      const settings = await OfflineStorageService.getVoiceLearningSettings();
      setVoiceSettings(settings);
    } catch (error) {
      console.error('Voice settings loading error:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOfflineData();
  };

  const downloadContent = async (content) => {
    try {
      Alert.alert(
        'Download for Offline',
        `Download "${content.title}" for offline access?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Download',
            onPress: async () => {
              await OfflineStorageService.downloadContentForOffline(
                content.id,
                content.type,
                {
                  title: content.title,
                  expiresIn: 168 // 1 week
                }
              );
              loadOfflineData();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to start download');
    }
  };

  const removeContent = async (contentId) => {
    Alert.alert(
      'Remove Content',
      'Remove this content from offline storage?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await OfflineStorageService.removeOfflineContent(contentId);
              loadOfflineData();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove content');
            }
          }
        }
      ]
    );
  };

  const updateVoiceSetting = async (key, value) => {
    const newSettings = { ...voiceSettings, [key]: value };
    setVoiceSettings(newSettings);
    
    try {
      await OfflineStorageService.cacheVoiceLearningSettings(newSettings);
    } catch (error) {
      console.error('Voice settings save error:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return '#10b981';
      case 'DOWNLOADING':
        return '#f59e0b';
      case 'FAILED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const renderStorageCard = () => (
    <View style={styles.storageCard}>
      <View style={styles.storageHeader}>
        <Icon name="storage" size={24} color="#6366f1" />
        <Text style={styles.storageTitle}>Storage Usage</Text>
      </View>
      
      <View style={styles.storageInfo}>
        <Text style={styles.storageText}>
          {formatFileSize(storageUsage.used)} used
        </Text>
        <Text style={styles.storageSubtext}>
          {offlineContent.filter(c => c.downloadStatus === 'COMPLETED').length} files downloaded
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${Math.min(storageUsage.percentage || 0, 100)}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(storageUsage.percentage || 0)}% used
        </Text>
      </View>

      <View style={styles.storageActions}>
        <TouchableOpacity
          style={styles.storageAction}
          onPress={() => setShowVoiceSettings(true)}
        >
          <Icon name="settings-voice" size={20} color="#6366f1" />
          <Text style={styles.storageActionText}>Voice Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.storageAction}
          onPress={() => {
            Alert.alert(
              'Clear All',
              'Remove all offline content?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear All',
                  style: 'destructive',
                  onPress: async () => {
                    for (const content of offlineContent) {
                      await removeContent(content.contentId);
                    }
                  }
                }
              ]
            );
          }}
        >
          <Icon name="delete-sweep" size={20} color="#ef4444" />
          <Text style={[styles.storageActionText, { color: '#ef4444' }]}>Clear All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContentCard = (content, index) => (
    <View key={index} style={styles.contentCard}>
      <View style={styles.contentHeader}>
        <View style={styles.contentInfo}>
          <Text style={styles.contentTitle}>{content.title}</Text>
          <Text style={styles.contentType}>{content.contentType.toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(content.downloadStatus) }]}>
          <Text style={styles.statusText}>{content.downloadStatus}</Text>
        </View>
      </View>

      {content.downloadStatus === 'DOWNLOADING' && (
        <View style={styles.downloadProgress}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${content.progress || 0}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{Math.round(content.progress || 0)}%</Text>
        </View>
      )}

      <View style={styles.contentDetails}>
        <View style={styles.detailRow}>
          <Icon name="schedule" size={16} color="#6b7280" />
          <Text style={styles.detailText}>
            {content.downloadedAt 
              ? `Downloaded ${new Date(content.downloadedAt).toLocaleDateString()}`
              : 'Not downloaded'
            }
          </Text>
        </View>
        
        {content.fileSize > 0 && (
          <View style={styles.detailRow}>
            <Icon name="storage" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{formatFileSize(content.fileSize)}</Text>
          </View>
        )}
      </View>

      <View style={styles.contentActions}>
        {content.downloadStatus === 'COMPLETED' && (
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="play-arrow" size={16} color="#10b981" />
            <Text style={styles.actionText}>Play Offline</Text>
          </TouchableOpacity>
        )}
        
        {content.downloadStatus === 'PENDING' && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => downloadContent(content)}
          >
            <Icon name="download" size={16} color="#6366f1" />
            <Text style={styles.actionText}>Download</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeContent(content.contentId)}
        >
          <Icon name="delete" size={16} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderVoiceSettingsModal = () => (
    <Modal
      visible={showVoiceSettings}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowVoiceSettings(false)}
    >
      <View style={GlobalStyles.container}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowVoiceSettings(false)}>
            <Icon name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Voice Learning Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.settingSection}>
            <Text style={styles.sectionTitle}>Voice Features</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Enable Voice Learning</Text>
                <Text style={styles.settingDescription}>
                  Use text-to-speech for lesson content
                </Text>
              </View>
              <Switch
                value={voiceSettings.voiceEnabled}
                onValueChange={(value) => updateVoiceSetting('voiceEnabled', value)}
                trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                thumbColor={voiceSettings.voiceEnabled ? '#fff' : '#f3f4f6'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto Play</Text>
                <Text style={styles.settingDescription}>
                  Automatically start next lesson
                </Text>
              </View>
              <Switch
                value={voiceSettings.autoPlay}
                onValueChange={(value) => updateVoiceSetting('autoPlay', value)}
                trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                thumbColor={voiceSettings.autoPlay ? '#fff' : '#f3f4f6'}
              />
            </View>
          </View>

          <View style={styles.settingSection}>
            <Text style={styles.sectionTitle}>Playback Speed</Text>
            
            <View style={styles.speedControl}>
              <Text style={styles.speedLabel}>0.5x</Text>
              <Slider
                style={styles.speedSlider}
                minimumValue={0.5}
                maximumValue={2.0}
                step={0.1}
                value={voiceSettings.voiceSpeed}
                onValueChange={(value) => updateVoiceSetting('voiceSpeed', value)}
                minimumTrackTintColor="#6366f1"
                maximumTrackTintColor="#d1d5db"}
                thumbStyle={styles.sliderThumb}
              />
              <Text style={styles.speedLabel}>2.0x</Text>
            </View>
            
            <Text style={styles.currentSpeed}>
              Current: {voiceSettings.voiceSpeed.toFixed(1)}x
            </Text>
          </View>

          <View style={styles.settingSection}>
            <Text style={styles.sectionTitle}>Voice Options</Text>
            
            <TouchableOpacity style={styles.voiceOption}>
              <Text style={styles.voiceOptionText}>English (Male)</Text>
              <Icon name="chevron-right" size={20} color="#d1d5db" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.voiceOption}>
              <Text style={styles.voiceOptionText}>English (Female)</Text>
              <Icon name="chevron-right" size={20} color="#d1d5db" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.voiceOption}>
              <Text style={styles.voiceOptionText}>Hindi (Male)</Text>
              <Icon name="chevron-right" size={20} color="#d1d5db" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="cloud-off" size={64} color="#d1d5db" />
      <Text style={styles.emptyStateText}>No offline content</Text>
      <Text style={styles.emptyStateSubtext}>
        Download lessons to access them without internet
      </Text>
    </View>
  );

  if (loading && offlineContent.length === 0) {
    return (
      <View style={[GlobalStyles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading offline content...</Text>
      </View>
    );
  }

  return (
    <View style={GlobalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offline Learning</Text>
        <TouchableOpacity onPress={loadOfflineData}>
          <Icon name="refresh" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Storage Card */}
        {renderStorageCard()}

        {/* Offline Content List */}
        <View style={styles.contentList}>
          <Text style={styles.contentListTitle}>Downloaded Content</Text>
          
          {offlineContent.length > 0 ? (
            offlineContent.map((content, index) => 
              renderContentCard(content, index)
            )
          ) : (
            renderEmptyState()
          )}
        </View>
      </ScrollView>

      {/* Voice Settings Modal */}
      {renderVoiceSettingsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  storageCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  storageInfo: {
    marginBottom: 16,
  },
  storageText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  storageSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  storageActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  storageAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  storageActionText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  contentList: {
    padding: 16,
  },
  contentListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  contentCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  contentType: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  downloadProgress: {
    marginBottom: 8,
  },
  contentDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  contentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  actionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  settingSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  speedControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  speedLabel: {
    fontSize: 14,
    color: '#6b7280',
    width: 32,
  },
  speedSlider: {
    flex: 1,
    marginHorizontal: 16,
  },
  sliderThumb: {
    backgroundColor: '#6366f1',
  },
  currentSpeed: {
    fontSize: 14,
    color: '#6366f1',
    textAlign: 'center',
    fontWeight: '500',
  },
  voiceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  voiceOptionText: {
    fontSize: 16,
    color: '#000',
  },
});

export default OfflineLearningScreen;