import React from "react";
import { TouchableOpacity } from "react-native";
import { GlassIcon } from "./SVGIcons";
import Text from "./Text";

interface QuickaddProps {
  amount: string;
  title?: string;
  onPress?: () => void;
}

const Quickadd = ({ amount, title, onPress }: QuickaddProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-1 p-6 flex flex-col bg-white rounded-lg justify-center items-center border border-[#F4F4F5]"
    >
      <GlassIcon
        style={{
          width: 21,
          height: 28,
        }}
      />
      <Text className="justify-center text-[#3F3F46] text-xl font-extrabold mt-4">
        {amount}
      </Text>
      <Text
        className="justify-center text-[#71717A] text-sm font-normal text-center px-1"
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {title || "Quick Add"}
      </Text>
    </TouchableOpacity>
  );
};

export default Quickadd;
