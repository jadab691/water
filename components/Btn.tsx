import React from "react";
import { Text, TouchableOpacity } from "react-native";

interface BtnProps {
  label: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  textColor: string;
  action?: Function;
  styles?: React.HTMLAttributes<HTMLElement>["className"];
}

const Btn = ({
  label,
  leftIcon,
  rightIcon,
  textColor,
  action,
  styles,
}: BtnProps) => {
  return (
    <TouchableOpacity
      onPressIn={() => action && action()}
      className={`flex flex-row gap-2 items-center justify-center bg-primary px-6 py-4  text-center rounded-2xl ${styles}`}
    >
      {leftIcon && leftIcon}
      <Text className={`text-${textColor}`}>{label}</Text>
      {rightIcon && rightIcon}
    </TouchableOpacity>
  );
};

export default Btn;
