import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const TermsScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header - matching Privacy page */}
      <View style={{ paddingTop: insets.top, backgroundColor: '#FFFFFF' }}>
        <View style={{ height: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>TERMS AND CONDITIONS</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#D1E7D2', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>Terms and Conditions</Text>
          <Text style={{ fontSize: 14, color: '#0F1724', lineHeight: 22 }}>
            These Terms and Conditions govern your use of the services provided by Native Roots Retail Private Limited ("Native Roots," "we," "us," or "our") through our website, mobile application, or any other platform (collectively, the "Services"). By using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not use our Services.
          </Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#D1E7D2', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>1. Use of Services</Text>
          <Text style={{ fontSize: 14, color: '#0F1724', lineHeight: 22 }}>
            a. You must be at least 18 years old to use our Services.
            {'\n'}b. You agree to provide accurate and complete information when placing orders through our Services.
            {'\n'}c. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your account.
          </Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#D1E7D2', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>2. Ordering and Delivery</Text>
          <Text style={{ fontSize: 14, color: '#0F1724', lineHeight: 22 }}>
            a. By placing an order through our Services, you agree to pay the specified price for the products and any applicable taxes and delivery fees.
            {'\n'}b. We reserve the right to refuse or cancel any order for any reason, including but not limited to product availability or errors in pricing.
            {'\n'}c. Delivery times provided are estimates only and may vary depending on factors such as traffic and weather conditions.
          </Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#D1E7D2', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>3. Payment</Text>
          <Text style={{ fontSize: 14, color: '#0F1724', lineHeight: 22 }}>
            a. Payment for orders placed through our Services must be made using the payment methods accepted by Native Roots.
            {'\n'}b. All payments are processed securely, and your payment information will be handled in accordance with our Privacy Policy.
          </Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#D1E7D2', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>4. Returns & refunds</Text>
          <Text style={{ fontSize: 14, color: '#0F1724', lineHeight: 22 }}>
            a. Products once delivered are non-returnable, except in case the same are damaged, defective, expired or incorrectly delivered and you are requested to read the return policy of each product listed at the Native Nest Platform before raising any request for return or refund.
            {'\n'}b. All refunds for returns and cancellations will be processed within seven (7) days from the date of return of the product subject to satisfactory checks and the refunds shall be processed in the same manner as they are received, unless refunds have been provided to You in the form of credits, refund amount will reflect in Your account based on respective banks policies. Refunds for products purchased on cash on delivery basis shall be refunded by way of promotional codes which shall expire after thirty (30) days from the date of issue of such promotional codes. Users can opt-in for a promotional code refund for online payments as well. Refund can not be transferred back to any other payment method once the promotional code is initiated.
            {'\n'}c. All other promotional codes issued by Company to Customers shall expire within seven (7) days from the date of its issue.
            {'\n'}d. Unless otherwise stated and/or as mutually agreed between the Company and Customer, for payments made through electronic means such as debit card, credit card, net banking, wallet etc. the refund shall be made using the same payment mode.
            {'\n'}e. All refunds shall be made in Indian Rupees only.
          </Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#D1E7D2', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>5. User Conduct</Text>
          <Text style={{ fontSize: 14, color: '#0F1724', lineHeight: 22 }}>
            a. You agree not to use our Services for any unlawful or prohibited purpose.
            {'\n'}b. You agree not to interfere with or disrupt the operation of our Services or the networks connected to them.
          </Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#D1E7D2', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>6. Intellectual Property</Text>
          <Text style={{ fontSize: 14, color: '#0F1724', lineHeight: 22 }}>
            a. All content included on our Services, such as text, graphics, logos, and images, is the property of Native Roots or its licensors and is protected by copyright laws.
            {'\n'}b. You may not reproduce, modify, distribute, or display any part of our Services without our prior written consent.
          </Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#D1E7D2', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>7. Disclaimer of Warranties</Text>
          <Text style={{ fontSize: 14, color: '#0F1724', lineHeight: 22 }}>
            a. Our Services are provided on an "as is" and "as available" basis without any warranties of any kind, express or implied.
            {'\n'}b. We do not warrant that our Services will be uninterrupted, secure, or error-free.
          </Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#D1E7D2', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>8. Limitation of Liability</Text>
          <Text style={{ fontSize: 14, color: '#0F1724', lineHeight: 22 }}>
            In no event shall Native Roots be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of our Services.
          </Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#D1E7D2', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>9. Indemnification</Text>
          <Text style={{ fontSize: 14, color: '#0F1724', lineHeight: 22 }}>
            You agree to indemnify and hold harmless Native Roots, its affiliates, and their respective officers, directors, employees, and agents from any claims, liabilities, damages, or expenses arising out of your use of our Services or your violation of these Terms.
          </Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#D1E7D2', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>10. Modification of Terms</Text>
          <Text style={{ fontSize: 14, color: '#0F1724', lineHeight: 22 }}>
            We reserve the right to modify these Terms at any time. Any changes will be effective immediately upon posting the updated Terms on our website or mobile application. Your continued use of our Services after the posting of any modified Terms constitutes your acceptance of the changes.
          </Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#D1E7D2', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>11. Governing Law</Text>
          <Text style={{ fontSize: 14, color: '#0F1724', lineHeight: 22 }}>
            These Terms shall be governed by and construed in accordance with the laws of India.
          </Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#D1E7D2', marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>12. Contact Us</Text>
          <Text style={{ fontSize: 14, color: '#0F1724', lineHeight: 22 }}>
            If you have any questions or concerns about these Terms, please contact us at (customercare@Nativeroots.in).
          </Text>
        </View>

      </ScrollView>
    </View>
  );
};

export default TermsScreen;
