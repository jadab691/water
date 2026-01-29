// import { logo } from "@/utils/constant";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import { logo } from "@/utils/constants";
import { router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { QuaDizIcon } from "../components/SVGIcons";

export default function Index() {
  // useEffect(() => {
  //   const checkOnboardingStatus = async () => {
  //     const hasOnboarded = await AsyncStorage.getItem("hasOnboarded");
  //     if (hasOnboarded === "true") {
  //       router.replace("/home");
  //     }
  //   };

  //   checkOnboardingStatus();
  // }, []);

  // const handleGetStarted = async () => {
  //   // Save a flag in AsyncStorage to indicate that the user has completed onboarding
  //   await AsyncStorage.setItem("hasOnboarded", "true");
  //   router.replace("/home");
  // };

  return (
    <SafeAreaView className="flex flex-col flex-1 items-center justify-between bg-[#EEFAFF] p-6">
      <View className="flex-1 items-center justify-center">
        <Image source={logo} className="size-32 mb-6" resizeMode="contain" />

        <View className="flex flex-row text-center justify-center gap-1 mb-4">
          <Text className=" text-3xl font-bold tracking-tight">Smarter</Text>
          <Text className="text-cyan-500 text-3xl font-bold tracking-tight">
            Hydrate
          </Text>
        </View>

        <Text className="text-center text-base text-[#71717a] px-5">
          Track your daily water intake with AI-Powered insights. Stay healthy
          energized & focused.
        </Text>
      </View>
      <TouchableOpacity
        // onPress={() => handleGetStarted()}
        onPress={() => router.push("/signup")}
        className="bg-[#0090C8] text-center py-4 w-full rounded-2xl mb-4"
      >
        <Text className="text-center text-xl font-semibold text-white">
          Get Started
        </Text>
      </TouchableOpacity>
      <View className="flex flex-row items-center justify-center gap-2 mb-2">
        <Text className="text-center text-base text-[#71717A] justify-center text-Color-Solid-Color-Default-default-500 font-medium font-['Fustat'] tracking-tight">
          Powered by:
        </Text>
        <QuaDizIcon />
      </View>
    </SafeAreaView>
  );
}
