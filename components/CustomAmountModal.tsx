import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
    Modal,
    Pressable,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Text from "./Text";

interface CustomAmountModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (amount: string, note?: string) => void;
  unit?: string;
  showNote?: boolean;
}

export default function CustomAmountModal({
  visible,
  onClose,
  onAdd,
  unit = "ml",
  showNote = true,
}: CustomAmountModalProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const handleAdd = () => {
    if (amount) {
      onAdd(amount, showNote ? note : undefined);
      setAmount("");
      setNote("");
      onClose();
    }
  };

  const handleCancel = () => {
    setAmount("");
    setNote("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/60 items-center justify-center"
        onPress={onClose}
      >
        <View className="w-full px-8">
          <Pressable
            className="bg-white rounded-2xl p-8 w-full gap-8"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              className="absolute right-4 top-4 z-10"
            >
              <Ionicons name="close-circle-outline" size={24} color="#A1A1AA" />
            </TouchableOpacity>

            {/* Title */}
            <Text
              className="text-[#27272A] text-xl text-center"
              font="fustat-bold"
            >
              Add Custom Amount
            </Text>

            {/* Form */}
            <View className="gap-5">
              {/* Amount Input */}
              <View className="border border-[#E4E4E7] rounded-2xl px-4 py-1 flex-row items-center justify-between bg-white">
                <TextInput
                  className="flex-1 text-[#52525B] text-base"
                  placeholder="Enter amount"
                  placeholderTextColor="#71717A"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
                <Text className="text-[#52525B] text-base">{unit}</Text>
              </View>

              {/* Note Input */}
              {showNote && (
                <View className="border border-[#E4E4E7] rounded-2xl px-4 py-2 h-[116px] bg-white">
                  <TextInput
                    className="flex-1 text-[#52525B] text-base "
                    placeholder="Add note (optional)"
                    placeholderTextColor="#71717A"
                    value={note}
                    onChangeText={setNote}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              )}

              {/* Buttons */}
              <View className="gap-3">
                {/* Add Water Button */}
                <TouchableOpacity
                  onPress={handleAdd}
                  className="bg-[#0090C8] rounded-2xl px-6 py-4 items-center"
                >
                  <Text className="text-white text-base" font="fustat-semibold">
                    Add Water
                  </Text>
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity
                  onPress={handleCancel}
                  className="border border-[#D4D4D8] rounded-2xl px-6 py-4 items-center"
                >
                  <Text
                    className="text-[#52525B] text-base"
                    font="fustat-semibold"
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
