import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { GlassIcon } from "./SVGIcons";

interface QuickaddProps {
  amount: string;
}

const Quickadd = ({ amount }: QuickaddProps) => {
  return (
    <TouchableOpacity className="flex-1 p-6 flex flex-col bg-white rounded-lg justify-center items-center border border-[#F4F4F5]">
      <GlassIcon
        style={{
          width: 21,
          height: 28,
        }}
      />
      <Text className="justify-center text-[#3F3F46] text-xl font-extrabold mt-4">
        {amount}
      </Text>
      <Text className="justify-center text-[#71717A] text-sm font-normal">
        Quick Add
      </Text>
    </TouchableOpacity>
  );
};

export default Quickadd;
