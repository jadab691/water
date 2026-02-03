import React from "react";
import Text from "./Text";
import {  View } from "react-native";
import { GlassIcon, TrashIcon } from "./SVGIcons";

interface ActivityProps {
  amount: string;
  time: string;
}

const Activity = ({ amount, time }: ActivityProps) => {
  return (
    <View className="bg-[#FAFAFA] flex flex-row justify-between items-center p-3 rounded-lg  w-full">
      <View className="flex flex-row gap-3">
        <GlassIcon
          style={{
            width: 17,
            height: 24,
          }}
        />

        <Text className="text-[#27272A] font-bold">{amount}</Text>
        <Text className="font-bungee">|</Text>
        <Text className="text-[#52525B]">{time}</Text>
      </View>
      <TrashIcon
        style={{
          width: 18,
          height: 18,
        }}
      />
    </View>
  );
};

export default Activity;
