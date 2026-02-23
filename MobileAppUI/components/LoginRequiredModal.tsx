import React from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

type LoginRequiredModalProps = {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
  title?: string;
  message?: string;
};

export default function LoginRequiredModal({
  visible,
  onClose,
  onLogin,
  title = "Login Required",
  message = "Please login to continue this action.",
}: LoginRequiredModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            paddingHorizontal: 20,
            paddingVertical: 22,
          }}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: "#EEF9DF",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <Text style={{ color: "#0A8F08", fontSize: 24, fontWeight: "700" }}>!</Text>
          </View>

          <Text style={{ fontSize: 20, fontWeight: "700", color: "#181725", marginBottom: 8 }}>
            {title}
          </Text>

          <Text style={{ fontSize: 14, color: "#6B7280", lineHeight: 20, marginBottom: 18 }}>
            {message}
          </Text>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#374151", fontWeight: "600" }}>Not Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onLogin}
              style={{
                flex: 1,
                backgroundColor: "#BCD042",
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Login</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
