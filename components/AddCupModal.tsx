import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GlassIcon } from "./SVGIcons";
import Text from "./Text";

interface AddCupModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, amount: string) => void;
  unit?: string;
  defaultCupNumber?: number;
}

export default function AddCupModal({
  visible,
  onClose,
  onAdd,
  unit = "ml",
  defaultCupNumber = 1,
}: AddCupModalProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmedAmount = amount.trim();
    if (!trimmedAmount) {
      setError("Please enter the cup capacity.");
      return;
    }

    const volume = parseInt(trimmedAmount, 10);
    if (Number.isNaN(volume) || volume <= 0) {
      setError("Please enter a valid positive number.");
      return;
    }

    const trimmedDesc = description.trim() || `Cup ${defaultCupNumber}`;
    setError(null);
    onAdd(trimmedDesc, trimmedAmount);
    setDescription("");
    setAmount("");
    onClose();
  };

  const handleCancel = () => {
    setError(null);
    setDescription("");
    setAmount("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <Pressable
        className="flex-1 bg-black/60 items-center justify-center"
        onPress={handleCancel}
      >
        <View className="w-full px-6">
          <Pressable
            className="bg-white rounded-2xl p-6 w-full gap-5 shadow-lg"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5">
                <View className="w-10 h-10 rounded-full bg-[#EEFAFF] items-center justify-center">
                  <GlassIcon width={20} height={24} color="#0090C8" />
                </View>
                <Text className="text-[#27272A] text-xl" font="fustat-bold">
                  Add New Cup
                </Text>
              </View>
              <TouchableOpacity onPress={handleCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle-outline" size={24} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View className="gap-4">
              {/* Cup Description / Name */}
              <View className="gap-1.5">
                <Text className="text-[#52525B] text-sm" font="fustat-medium">
                  Cup Description / Name
                </Text>
                <View className="border border-[#E4E4E7] rounded-xl px-4 py-3 bg-white">
                  <TextInput
                    className="text-[#27272A] text-base"
                    placeholder={`e.g. Office Mug, Gym Bottle (default: Cup ${defaultCupNumber})`}
                    placeholderTextColor="#A1A1AA"
                    value={description}
                    onChangeText={(t) => {
                      setDescription(t);
                      if (error) setError(null);
                    }}
                    maxLength={100}
                    autoCapitalize="sentences"
                  />
                </View>
              </View>

              {/* Amount / Capacity */}
              <View className="gap-1.5">
                <Text className="text-[#52525B] text-sm" font="fustat-medium">
                  Capacity ({unit})
                </Text>
                <View className="border border-[#E4E4E7] rounded-xl px-4 py-3 flex-row items-center justify-between bg-white">
                  <TextInput
                    className="flex-1 text-[#27272A] text-base"
                    placeholder="e.g. 250, 350, 500"
                    placeholderTextColor="#A1A1AA"
                    value={amount}
                    onChangeText={(t) => {
                      setAmount(t);
                      if (error) setError(null);
                    }}
                    keyboardType="numeric"
                  />
                  <Text className="text-[#71717A] text-base font-semibold">{unit}</Text>
                </View>
              </View>

              {error ? (
                <Text className="text-red-500 text-xs mt-1" font="fustat-medium">
                  {error}
                </Text>
              ) : null}

              {/* Action Buttons */}
              <View className="gap-2.5 mt-2">
                <TouchableOpacity
                  onPress={handleAdd}
                  className="bg-[#0090C8] rounded-xl py-3.5 items-center"
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-base" font="fustat-semibold">
                    Add Cup
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCancel}
                  className="border border-[#D4D4D8] rounded-xl py-3.5 items-center"
                  activeOpacity={0.8}
                >
                  <Text className="text-[#52525B] text-base" font="fustat-semibold">
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
