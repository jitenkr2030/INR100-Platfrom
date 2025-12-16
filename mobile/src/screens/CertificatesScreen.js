/**
 * Certificates Screen for INR100 Mobile App
 * Displays course certificates, skill badges, and achievements
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
  Share,
  Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GlobalStyles } from '../styles/GlobalStyles';
import { APIService } from '../services/APIService';

const CertificatesScreen = ({ navigation }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadCertificates();
  }, [activeTab]);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      
      const endpoint = activeTab === 'all' 
        ? '/certificates' 
        : `/certificates?type=${activeTab}`;
      
      const response = await APIService.get(endpoint);
      
      if (response.success) {
        setCertificates(response.data.certificates || []);
      } else {
        Alert.alert('Error', response.message || 'Failed to load certificates');
      }
    } catch (error) {
      console.error('Certificates loading error:', error);
      Alert.alert('Error', 'Failed to load certificates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCertificates();
  };

  const shareCertificate = async (certificate) => {
    try {
      const shareOptions = {
        title: 'My Learning Achievement',
        message: `I just earned a ${certificate.type} certificate: ${certificate.title || certificate.badge?.name || certificate.skillBadge?.name}!`,
        url: certificate.shareUrl || `https://inr100.com/certificates/verify/${certificate.verificationCode}`,
      };

      await Share.share(shareOptions);
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const downloadCertificate = async (certificate) => {
    if (certificate.certificateUrl) {
      try {
        await Linking.openURL(certificate.certificateUrl);
      } catch (error) {
        Alert.alert('Error', 'Failed to download certificate');
      }
    } else {
      Alert.alert('Info', 'Certificate download not available yet');
    }
  };

  const verifyCertificate = async (certificate) => {
    try {
      const verificationCode = certificate.verificationCode || certificate.shareCode;
      if (verificationCode) {
        const verificationUrl = `https://inr100.com/certificates/verify/${verificationCode}`;
        await Linking.openURL(verificationUrl);
      } else {
        Alert.alert('Info', 'Verification code not available');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open verification page');
    }
  };

  const renderCertificateCard = (certificate, index) => {
    const getCertificateIcon = (type) => {
      switch (type) {
        case 'course':
          return 'school';
        case 'skill':
          return 'psychology';
        case 'achievement':
          return 'emoji-events';
        default:
          'verified';
      }
    };

    const getCertificateColor = (type) => {
      switch (type) {
        case 'course':
          return '#6366f1';
        case 'skill':
          return '#10b981';
        case 'achievement':
          return '#f59e0b';
        default:
          return '#6b7280';
      }
    };

    const getDate = (certificate) => {
      if (certificate.issuedAt) return certificate.issuedAt;
      if (certificate.earnedAt) return certificate.earnedAt;
      return certificate.createdAt;
    };

    return (
      <View key={index} style={styles.certificateCard}>
        <View style={styles.certificateHeader}>
          <View style={[styles.certificateIcon, { backgroundColor: getCertificateColor(certificate.type) }]}>
            <Icon name={getCertificateIcon(certificate.type)} size={24} color="#fff" />
          </View>
          <View style={styles.certificateInfo}>
            <Text style={styles.certificateTitle}>
              {certificate.course?.title || 
               certificate.badge?.name || 
               certificate.skillBadge?.name || 
               'Certificate'}
            </Text>
            <Text style={styles.certificateType}>
              {certificate.type?.toUpperCase() || 'CERTIFICATE'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => shareCertificate(certificate)}
          >
            <Icon name="share" size={20} color="#6366f1" />
          </TouchableOpacity>
        </View>

        <Text style={styles.certificateDescription}>
          {certificate.course?.description || 
           certificate.badge?.description || 
           certificate.skillBadge?.description || 
           'Achievement certificate'}
        </Text>

        <View style={styles.certificateDetails}>
          {certificate.score && (
            <View style={styles.detailItem}>
              <Icon name="grade" size={16} color="#f59e0b" />
              <Text style={styles.detailText}>Score: {certificate.score}%</Text>
            </View>
          )}
          
          {certificate.completionTime && (
            <View style={styles.detailItem}>
              <Icon name="schedule" size={16} color="#6366f1" />
              <Text style={styles.detailText}>Time: {Math.round(certificate.completionTime / 60)}h</Text>
            </View>
          )}
          
          <View style={styles.detailItem}>
            <Icon name="calendar-today" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {new Date(getDate(certificate)).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {certificate.verificationCode && (
          <View style={styles.verificationSection}>
            <Text style={styles.verificationLabel}>Verification Code:</Text>
            <Text style={styles.verificationCode}>{certificate.verificationCode}</Text>
          </View>
        )}

        <View style={styles.certificateActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => verifyCertificate(certificate)}
          >
            <Icon name="verified" size={16} color="#10b981" />
            <Text style={styles.actionText}>Verify</Text>
          </TouchableOpacity>
          
          {certificate.certificateUrl && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => downloadCertificate(certificate)}
            >
              <Icon name="download" size={16} color="#6366f1" />
              <Text style={styles.actionText}>Download</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {['all', 'course', 'skill', 'achievement'].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="card-giftcard" size={64} color="#d1d5db" />
      <Text style={styles.emptyStateText}>No certificates yet</Text>
      <Text style={styles.emptyStateSubtext}>
        Complete courses and challenges to earn certificates
      </Text>
      <TouchableOpacity style={styles.ctaButton}>
        <Text style={styles.ctaText}>Start Learning</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => {
    const stats = {
      total: certificates.length,
      course: certificates.filter(c => c.type === 'course').length,
      skill: certificates.filter(c => c.type === 'skill').length,
      achievement: certificates.filter(c => c.type === 'achievement').length,
    };

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Your Achievements</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.course}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.skill}</Text>
            <Text style={styles.statLabel}>Skills</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.achievement}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && certificates.length === 0) {
    return (
      <View style={[GlobalStyles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading certificates...</Text>
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
        <Text style={styles.headerTitle}>My Certificates</Text>
        <TouchableOpacity onPress={loadCertificates}>
          <Icon name="refresh" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      {renderTabs()}

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats */}
        {renderStats()}

        {/* Certificates List */}
        {certificates.length > 0 ? (
          <View style={styles.certificatesList}>
            {certificates.map((certificate, index) => 
              renderCertificateCard(certificate, index)
            )}
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
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
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  certificatesList: {
    padding: 16,
    gap: 12,
  },
  certificateCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  certificateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  certificateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  certificateInfo: {
    flex: 1,
  },
  certificateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  certificateType: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  shareButton: {
    padding: 8,
  },
  certificateDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  certificateDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  verificationSection: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  verificationLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  verificationCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'monospace',
  },
  certificateActions: {
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
  actionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  ctaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CertificatesScreen;