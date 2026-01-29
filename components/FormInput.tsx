import RNDateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import { TextInput, View } from "react-native";

type FormInputProps = {
  value: any;
  label: string;
  action?: Function;
  isPassword?: boolean;
  styles?: React.HTMLAttributes<HTMLElement>["className"];
  type?: string;
} & (
  | { type: "select"; selectItems: { label: string; value: any }[] }
  | { type?: Exclude<string, "select">; selectItems?: never }
);

const FormInput = ({
  value,
  label,
  action,
  isPassword,
  type,
  styles,
  selectItems = [],
}: FormInputProps) => {
  const [showTimePicker, setShowTimePicker] = useState(false);

  return (
    <View
      className={`rounded-2xl border border-[#E4E4E7] rounded-4 py-2 px-3 ${styles}`}
    >
      {type === "select" ? (
        <Picker
          selectedValue={value}
          onValueChange={(e) => action && action(e)}
        >
          <Picker.Item
            label="Please select an option"
            value=""
            enabled={false}
          />
          {selectItems.map((item, index) => (
            <Picker.Item key={index} label={item.label} value={item.value} />
          ))}
        </Picker>
      ) : type === "textarea" ? (
        <TextInput
          value={value}
          onChangeText={(e) => action && action(e)}
          multiline
          numberOfLines={4}
          style={{ textAlignVertical: "top" }}
        />
      ) : type === "time" ? (
        <>
          <TextInput
            value={value && value.toLocaleTimeString()}
            placeholder={`Enter time for ${label}`}
            onPress={() => setShowTimePicker(true)}
            className="cursor-pointer text-center bg-black/10"
          />
          {showTimePicker && (
            <RNDateTimePicker
              value={value && new Date(value)}
              mode="time"
              onChange={(e) => {
                const formatedTime = new Date(e.nativeEvent.timestamp)
                  .toLocaleTimeString("en-GB", { hour12: false })
                  .padStart(8, "0");
                action && action(formatedTime);
                setShowTimePicker(false);
              }}
            ></RNDateTimePicker>
          )}
        </>
      ) : (
        <TextInput
          value={value}
          keyboardType="default"
          onChangeText={(e) => action && action(e)}
          placeholder={`${label}`}
          secureTextEntry={isPassword}
        />
      )}
    </View>
    // {type === "textarea" && (
    //   <TextInput
    //     value={value}
    //     onChangeText={(e) => onChangeFn(e)}
    //     placeholder={`Enter your ${title}`}
    //     multiline
    //     numberOfLines={4}
    //     style={{ textAlignVertical: "top" }}
    //   />
    // )}
  );
};

export default FormInput;
