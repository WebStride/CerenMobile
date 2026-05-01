import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface QuantitySelectorProps {
  quantity: number;
  minQuantity: number;
  productName: string;
  onIncrease: () => void;
  onDecrease: () => void;
  onSetQuantity: (qty: number) => void;
}

/**
 * Green pill quantity selector used on all product cards.
 * Tapping the quantity number opens a Modal with an isolated TextInput —
 * this eliminates the Android controlled-input race condition that occurs
 * when a TextInput is embedded directly inside a FlatList.
 */
export function QuantitySelector({
  quantity,
  minQuantity,
  productName,
  onIncrease,
  onDecrease,
  onSetQuantity,
}: QuantitySelectorProps) {
  const [showModal, setShowModal] = useState(false);
  const [inputVal, setInputVal] = useState("");

  const openModal = () => {
    setInputVal(String(quantity));
    setShowModal(true);
  };

  const handleConfirm = () => {
    const numVal = parseInt(inputVal, 10);

    if (isNaN(numVal) || numVal === 0) {
      Alert.alert(
        "Invalid Quantity",
        `Please enter a valid quantity. Minimum order quantity for ${productName} is ${minQuantity}.`,
        [{ text: "OK" }]
      );
      return;
    }

    if (numVal < minQuantity) {
      Alert.alert(
        "Minimum Order Quantity",
        `Minimum order quantity for ${productName} is ${minQuantity}.`,
        [{ text: "OK" }]
      );
      return;
    }

    setShowModal(false);
    if (numVal !== quantity) {
      onSetQuantity(numVal);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setInputVal("");
  };

  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#15803d",
          borderRadius: 25,
          paddingHorizontal: 4,
          paddingVertical: 6,
          height: 40,
        }}
      >
        {/* Decrease button */}
        <TouchableOpacity
          onPress={onDecrease}
          style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="remove" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Tappable quantity — opens modal */}
        <TouchableOpacity
          onPress={openModal}
          style={{
              width: 48,
            marginHorizontal: 4,
            height: 32,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: "white",
              textAlign: "center",
              minWidth: 40,
            }}
          >
            {quantity}
          </Text>
        </TouchableOpacity>

        {/* Increase button */}
        <TouchableOpacity
          onPress={onIncrease}
          style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Edit quantity modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={handleCancel}
        >
          {/* Inner card — stops tap propagation */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 24,
              width: 280,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text
              style={{ fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 }}
            >
              Update Quantity
            </Text>
            <Text
              style={{ fontSize: 13, color: "#666", marginBottom: 16 }}
              numberOfLines={2}
            >
              {productName}
            </Text>
            {minQuantity > 1 && (
              <Text style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
                Minimum order: {minQuantity}
              </Text>
            )}
            <TextInput
              value={inputVal}
              onChangeText={(val) => setInputVal(val.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
              autoFocus
              selectTextOnFocus
              style={{
                borderWidth: 1.5,
                borderColor: "#15803d",
                borderRadius: 8,
                padding: 12,
                fontSize: 22,
                fontWeight: "bold",
                textAlign: "center",
                color: "#1a1a1a",
                marginBottom: 20,
              }}
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={handleCancel}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 15, color: "#666", fontWeight: "600" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: "#15803d",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 15, color: "#fff", fontWeight: "700" }}>
                  Update
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
