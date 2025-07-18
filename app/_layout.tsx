import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter: require("@expo-google-fonts/inter/Inter-Regular.ttf"),
    InterBold: require("@expo-google-fonts/inter/Inter-Bold.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
