import Btn from "@/components/Btn";
import { BellIcon, GlassIcon, TrashIcon } from "@/components/SVGIcons";
import Entypo from "@expo/vector-icons/Entypo";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Home = () => {
  return (
    <ScrollView>
      <SafeAreaView className="flex flex-col flex-1 items-center justify-start bg-[#FAFAFA] p-6 gap-10">
        <View className="flex flex-row w-full items-center justify-between mb-12">
          <View>
            <Text>Hi Smith!</Text>
            <Text>Jan 23, 2024 | Friday</Text>
          </View>
          <View className="bg-[#E6F6FA] flex p-4 size-140 items-center justify-center aspect-square rounded-2xl">
            <BellIcon style={{ width: 24, height: 24 }} />
          </View>
        </View>

        <View className="flex flex-col align-middle items-center gap-8p-6 w-full">
          <View className="bg-[#EEFAFF] flex justify-center items-center rounded-full size-60 shadow-2xl border-4 border-white  overflow-hidden">
            <Text className="text-center justify-center text-Color-Solid-Color-Default-default-800 text-4xl font-extrabold ">
              16%
            </Text>
            <Text className="self-stretch text-center justify-center text-Color-Solid-Color-Default-default-700 text-lg font-normal uppercase">
              HYDRATED
            </Text>
          </View>
          <Text className="text-[#71717A] text-2xl font-normal my-8">
            <Text className="text-[#3F3F46] text-2xl font-extrabold ">120</Text>{" "}
            / 2000 ml
          </Text>

          <View className="flex gap-4 w-full justify-around align-middle items-center flex-row mb-6">
            <TouchableOpacity className="w-1/2 p-6 flex flex-col bg-white rounded-lg justify-center items-center border border-[#F4F4F5]">
              <GlassIcon
                style={{
                  width: 21,
                  height: 28,
                }}
              />
              <Text className="justify-center text-[#3F3F46] text-xl font-extrabold mt-4">
                250ml
              </Text>
              <Text className="justify-center text-[#71717A] text-sm font-normal">
                Quick Add
              </Text>
            </TouchableOpacity>

            <TouchableOpacity className="w-1/2 p-6 flex flex-col bg-white rounded-lg justify-center items-center border border-[#F4F4F5]">
              <GlassIcon
                style={{
                  width: 21,
                  height: 28,
                }}
              />
              <Text className="justify-center text-[#3F3F46] text-xl font-extrabold mt-4">
                250ml
              </Text>
              <Text className="justify-center text-[#71717A] text-sm font-normal">
                Quick Add
              </Text>
            </TouchableOpacity>
          </View>

          <Btn
            label="Custom Amount"
            leftIcon={<Entypo name="plus" size={24} color="white" />}
            textStyles="text-white"
            styles="bg-[#0090C8] w-full"
          />
        </View>

        <View className="self-stretch p-6 bg-white rounded-2xl border border-[#E4E4E7] inline-flex flex-col justify-start items-start gap-6">
          <Text className="self-stretch justify-center text-Color-Solid-Color-Default-default-800 text-xl font-bold font-['Fustat']">
            Today's Activity
          </Text>

          <View>
            <View className="bg-[#FAFAFA]">
              <GlassIcon
                style={{
                  width: 17,
                  height: 24,
                }}
              />
              <Text>
                <Text>200 ml</Text> | 8:30 am
              </Text>
              <TrashIcon
                style={{
                  width: 12,
                  height: 12,
                }}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

export default Home;
