import React from "react";
import { TouchableOpacity, View } from "react-native";
import { GlassIcon, TrashIcon } from "./SVGIcons";
import Text from "./Text";

interface ActivityProps {
  amount: string;
  time: string;
  onDelete?: () => void;
}

const Activity = ({ amount, time, onDelete }: ActivityProps) => {
  return (
    <View className="bg-[#FAFAFA] flex flex-row justify-between items-center p-3 rounded-lg w-full">
      <View className="flex flex-row gap-3 items-center">
        <GlassIcon
          style={{
            width: 17,
            height: 24,
          }}
        />

        <Text className="text-[#27272A] font-bold">{amount}</Text>
        <Text className="text-[#D4D4D8]">|</Text>
        <Text className="text-[#52525B]">{time}</Text>
      </View>
      {onDelete ? (
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.6}
        >
          <TrashIcon
            style={{
              width: 18,
              height: 18,
            }}
          />
        </TouchableOpacity>
      ) : (
        <TrashIcon
          style={{
            width: 18,
            height: 18,
          }}
        />
      )}
    </View>
  );
};

export default Activity;
