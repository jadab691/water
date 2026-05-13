import React from "react";
import { TouchableOpacity } from "react-native";
import Text from "./Text";

interface BtnProps {
  label: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  action?: Function;
  styles?: React.HTMLAttributes<HTMLElement>["className"];
  textStyles?: React.HTMLAttributes<HTMLElement>["className"];
  disabled?: boolean;
}

const Btn = ({
  label,
  leftIcon,
  rightIcon,
  action,
  styles,
  textStyles,
  disabled = false,
}: BtnProps) => {
  return (
    <TouchableOpacity
      onPressIn={() => !disabled && action && action()}
      disabled={disabled}
      className={`flex flex-row gap-2 items-center justify-center bg-primary px-6 py-4  text-center rounded-2xl ${styles} ${disabled ? "opacity-50" : ""}`}
    >
      {leftIcon && leftIcon}
      <Text className={textStyles}>{label}</Text>
      {rightIcon && rightIcon}
    </TouchableOpacity>
  );
};

export default Btn;
