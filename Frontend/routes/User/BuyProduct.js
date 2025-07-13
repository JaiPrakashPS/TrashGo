import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, Alert, Linking, ActivityIndicator, StyleSheet, Platform, ScrollView, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import productImg from '../../assets/product.jpg';
import api from '../../api';

const BuyProduct = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [dustbinStatus, setDustbinStatus] = useState('');
  
  // Payment Configuration
  const upiId = 'sjkanish2006@oksbi';
  const productPrice = 399;
  const merchantName = 'MyShop';
  const transactionNote = 'Order123';
  const userId = 'user1'; // Replace with actual user ID from auth context

  const UPI_APPS = [
    {
      name: 'Google Pay',
      scheme: Platform.OS === 'android' ? 'upi://pay?pa=' : 'gpay://upi/pay?pa=',
      package: 'com.google.android.apps.nbu.paisa.user'
    },
    {
      name: 'PhonePe',
      scheme: 'phonepe://pay?pa=',
      package: 'com.phonepe.app'
    },
    {
      name: 'PayTM',
      scheme: 'paytmmp://pay?pa=',
      package: 'net.one97.paytm'
    },
    {
      name: 'BHIM',
      scheme: 'bhim://pay?pa=',
      package: 'in.org.npci.upiapp'
    }
  ];

  const verifyCode = async () => {
    if (!/^\d{5}$/.test(code)) {
      Alert.alert('Invalid Code', 'Please enter a 5-digit code');
      return;
    }

    setVerifyingCode(true);
    try {
      const response = await axios.post(`${api}/api/verify-code`, {
        code,
        userId
      });

      if (response.data.success) {
        setDustbinStatus(response.data.message);
      } else {
        setDustbinStatus(response.data.message || 'Invalid code or dustbin unavailable');
      }
    } catch (error) {
      setDustbinStatus('Could not verify code. Please try again.');
    } finally {
      setVerifyingCode(false);
    }
  };

  const generateUpiLink = (appScheme) => {
    return `${appScheme}${upiId}&pn=${encodeURIComponent(merchantName)}&am=${productPrice}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
  };

  const initiatePayment = async (app) => {
    try {
      const upiLink = generateUpiLink(app.scheme);
      
      if (Platform.OS === 'android') {
        const supported = await Linking.canOpenURL(`${app.package}://`);
        if (!supported) {
          throw new Error('App not installed');
        }
      }
      
      await Linking.openURL(upiLink);
    } catch (error) {
      const genericLink = generateUpiLink('upi://pay?pa=');
      Linking.openURL(genericLink).catch(() => {
        Alert.alert(
          'Payment Error',
          `Could not open ${app.name}. Please install a UPI app.`,
          [
            { text: 'OK' },
            {
              text: 'Install',
              onPress: () => {
                if (app.package) {
                  Linking.openURL(`market://details?id=${app.package}`);
                }
              }
            }
          ]
        );
      });
    }
  };

  const verifyPayment = async () => {
    if (!/^\d{10,12}$/.test(transactionId)) {
      Alert.alert('Invalid ID', 'Please enter a 10-12 digit transaction ID');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${api}/api/verify-payment`, {
        transactionId,
        amount: productPrice,
        upiId
      });

      if (response.data.success) {
        Alert.alert('Success', 'Payment verified successfully!');
        setModalVisible(false);
        setTransactionId('');
      } else {
        Alert.alert('Error', response.data.message || 'Payment verification failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not verify payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Dustbin</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image source={productImg} style={styles.productImage} />
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>₹{productPrice}</Text>
          </View>
        </View>

        {/* Product Title */}
        <Text style={styles.title}>Smart Dustbin</Text>
        <Text style={styles.subtitle}>Recycle Smart, Get Rewarded</Text>

        {/* Benefits List */}
        <View style={styles.benefitsContainer}>
          {[
            { icon: 'cash-outline', text: 'Earn cashback for recycling' },
            { icon: 'sync-outline', text: 'Smart waste sorting technology' },
            { icon: 'leaf-outline', text: 'Eco-friendly waste management' },
            { icon: 'phone-portrait-outline', text: 'Track impact via mobile app' }
          ].map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <Ionicons name={benefit.icon} size={22} color="#4CAF50" />
              <Text style={styles.benefitText}>{benefit.text}</Text>
            </View>
          ))}
        </View>

        {/* Code Verification */}
        <View style={styles.codeSection}>
          <Text style={styles.sectionTitle}>Check Availability</Text>
          <View style={styles.codeInputContainer}>
            <TextInput
              style={styles.codeInput}
              placeholder="Enter 5-digit code"
              placeholderTextColor="#999"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={5}
              editable={!verifyingCode}
            />
            <TouchableOpacity
              style={[styles.codeButton, verifyingCode && styles.disabledButton]}
              onPress={verifyCode}
              disabled={verifyingCode}
            >
              {verifyingCode ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.codeButtonText}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>
          {dustbinStatus ? (
            <Text style={[
              styles.statusText,
              dustbinStatus.includes('available') ? styles.successText : styles.errorText
            ]}>
              {dustbinStatus}
            </Text>
          ) : null}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.buyButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.buyButtonText}>Purchase Now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.infoButton} onPress={() => navigation.navigate('ProductDetails')}>
            <Text style={styles.infoButtonText}>Learn More</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => !submitting && setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complete Payment</Text>
              {!submitting && (
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.paymentDetails}>
              <Text style={styles.amountText}>Amount: ₹{productPrice}</Text>
              <Text style={styles.upiText}>UPI ID: {upiId}</Text>
            </View>

            <Text style={styles.modalSectionTitle}>Choose Payment App</Text>
            <View style={styles.paymentApps}>
              {UPI_APPS.map((app) => (
                <TouchableOpacity
                  key={app.name}
                  style={styles.paymentAppButton}
                  onPress={() => initiatePayment(app)}
                >
                  <Text style={styles.paymentAppText}>{app.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalSectionTitle}>Verify Payment</Text>
            <TextInput
              style={styles.transactionInput}
              placeholder="Enter UPI Transaction ID"
              placeholderTextColor="#999"
              value={transactionId}
              onChangeText={setTransactionId}
              keyboardType="number-pad"
              editable={!submitting}
            />

            <TouchableOpacity
              style={[styles.verifyButton, submitting && styles.disabledButton]}
              onPress={verifyPayment}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify Payment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    paddingBottom: 30,
  },
  imageContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  priceBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  priceText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 20,
    marginBottom: 5,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  benefitsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#444',
    marginLeft: 12,
  },
  codeSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  codeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  statusText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  successText: {
    color: '#4CAF50',
  },
  errorText: {
    color: '#F44336',
  },
  actionButtons: {
    paddingHorizontal: 20,
  },
  buyButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoButton: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  infoButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  paymentDetails: {
    backgroundColor: '#f0f8f1',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  upiText: {
    fontSize: 15,
    color: '#666',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  paymentApps: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  paymentAppButton: {
    backgroundColor: '#f0f0f0',
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  paymentAppText: {
    color: '#333',
    fontWeight: '500',
  },
  transactionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  verifyButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default BuyProduct;