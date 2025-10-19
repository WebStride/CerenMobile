import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PrivacyPolicyScreen = () => {
  const insets = useSafeAreaInsets();

  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header - matches app theme shown in screenshots */}
      <View style={{ paddingTop: insets.top, backgroundColor: '#FFFFFF' }}>
        <View style={{ height: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>PRIVACY POLICY</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>Privacy Policy</Text>
          <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>
            Native Roots Retail Private Limited ("we," "us," or "our") is committed to protecting the privacy and security of your personal information. This Privacy Policy describes how we collect, use, and disclose information when you use our website, mobile application, or any other services offered by Native Roots Retail Private Limited (collectively, the "Services").
          </Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>1. Information We Collect</Text>
          <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>
            We may collect the following types of information when you use our Services:
          </Text>
          <Text style={{ color: '#374151', marginTop: 8 }}>• Personal Information: This may include your name, email address, phone number, delivery address, payment information, and any other information you provide to us.</Text>
          <Text style={{ color: '#374151', marginTop: 8 }}>• Usage Information: We collect information about how you interact with our Services, including your IP address, browser type, device identifiers, pages viewed, and other usage data.</Text>
          <Text style={{ color: '#374151', marginTop: 8 }}>• Location Information: With your consent, we may collect precise location data when you use our mobile application or website.</Text>
          <Text style={{ color: '#374151', marginTop: 8 }}>• Cookies and Similar Technologies: We use cookies and similar technologies to collect information about your browsing activities and preferences.</Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>2. How We Use Your Information</Text>
          <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>
            We may use the information we collect for the following purposes:
          </Text>
          <Text style={{ color: '#374151', marginTop: 8 }}>• To provide and improve our Services.</Text>
          <Text style={{ color: '#374151', marginTop: 8 }}>• To process your orders and payments.</Text>
          <Text style={{ color: '#374151', marginTop: 8 }}>• To communicate with you about your orders, promotions, and other updates.</Text>
          <Text style={{ color: '#374151', marginTop: 8 }}>• To personalize your experience and customize content.</Text>
          <Text style={{ color: '#374151', marginTop: 8 }}>• To comply with legal obligations or to protect our rights and interests.</Text>
          <Text style={{ color: '#374151', marginTop: 8 }}>• For analytics and research purposes.</Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>3. Information Sharing and Disclosure</Text>
          <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>
            We may share your information with third parties in the following circumstances:
          </Text>
          <Text style={{ color: '#374151', marginTop: 8 }}>• With our service providers, vendors, and other partners who assist us in operating our Services.</Text>
          <Text style={{ color: '#374151', marginTop: 8 }}>• With third-party delivery partners to fulfill your orders.</Text>
          <Text style={{ color: '#374151', marginTop: 8 }}>• With your consent or at your direction.</Text>
          <Text style={{ color: '#374151', marginTop: 8 }}>• To comply with legal obligations or to protect our rights and interests.</Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>4. Data Security</Text>
          <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>
            We take reasonable measures to protect your personal information from unauthorized access, use, or disclosure. However, no method of transmission over the internet or electronic storage is completely secure.
          </Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>5. Your Choices</Text>
          <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>
            You may choose not to provide certain information, but this may limit your ability to use certain features of our Services. You can also opt-out of receiving promotional emails and other communications from us.
          </Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>6. Updates to this Privacy Policy</Text>
          <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page.
          </Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>7. Contact Us</Text>
          <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>
            If you have any questions or concerns about this Privacy Policy, please contact us at (customercare@nativeroots.in).
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default PrivacyPolicyScreen;
