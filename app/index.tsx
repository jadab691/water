import Text from "@/components/Text";
import { logo } from "@/utils/constants";
import { useAppAuth } from "@/utils/auth";
import { Link, router } from "expo-router";
import { useEffect } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { QuaDizIcon } from "../components/SVGIcons";

export default function Index() {
  const { isLoaded, isSignedIn } = useAppAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace("/home");
  }, [isLoaded, isSignedIn]);

  const handleGetStarted = () => {
    router.replace("/signup");
  };

  if (!isLoaded || isSignedIn) {
    return null;
  }

  return (
    <SafeAreaView className="flex flex-col flex-1 items-center justify-between bg-[#FAFAFA] p-6">
      <View className="flex-1 items-center justify-center">
        <Image source={logo} className="size-32 mb-6" resizeMode="contain" />

        <View className="flex flex-row text-center justify-center gap-1 mb-4">
          <Text className="text-center text-3xl" font="fredoka">
            Smarter
          </Text>
          <Text className=" text-cyan-500 text-3xl" font="fredoka">
            Hydrate
          </Text>
        </View>

        <Text className=" text-center text-base text-[#71717a] px-5">
          Track your daily water intake with offline insights. Stay healthy
          energized & focused.
        </Text>
      </View>
      <TouchableOpacity
        onPress={handleGetStarted}
        className="bg-[#0090C8] text-center py-4 w-full rounded-2xl mb-4"
      >
        <Text className=" text-center text-xl font-semibold text-white">
          Get Started
        </Text>
      </TouchableOpacity>
      <Link href="/login" className="text-center text-base text-[#71717A] mb-4">
        Already have an account? Log in
      </Link>
      <View className="flex flex-row items-center justify-center gap-2 mb-2">
        <Text className="text-center text-base text-[#71717A] justify-center text-Color-Solid-Color-Default-default-500 font-medium tracking-tight">
          Powered by:
        </Text>
        <QuaDizIcon />
      </View>
    </SafeAreaView>
  );
}
