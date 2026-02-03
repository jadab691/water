import React from "react";
import Text from "./Text";
import {  TouchableOpacity } from "react-native";

interface BtnProps {
  label: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  action?: Function;
  styles?: React.HTMLAttributes<HTMLElement>["className"];
  textStyles?: React.HTMLAttributes<HTMLElement>["className"];
}

const Btn = ({
  label,
  leftIcon,
  rightIcon,
  action,
  styles,
  textStyles,
}: BtnProps) => {
  return (
    <TouchableOpacity
      onPressIn={() => action && action()}
      className={`flex flex-row gap-2 items-center justify-center bg-primary px-6 py-4  text-center rounded-2xl ${styles}`}
    >
      {leftIcon && leftIcon}
      <Text className={textStyles}>{label}</Text>
      {rightIcon && rightIcon}
    </TouchableOpacity>
  );
};

export default Btn;
