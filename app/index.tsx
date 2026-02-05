import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as Haptics from "expo-haptics";
import { Ionicons, Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import Colors from "@/constants/colors";
import PolaroidCard, { PolaroidCardRef } from "@/components/PolaroidCard";
import SettingsPanel from "@/components/SettingsPanel";

interface PolaroidImage {
  id: string;
  uri: string;
}

export default function PolaroidMakerScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const insets = useSafeAreaInsets();

  const [images, setImages] = useState<PolaroidImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [templateSize, setTemplateSize] = useState(300);
  const [padding, setPadding] = useState(12);
  const [borderWidth, setBorderWidth] = useState(1);
  const [bottomPadding, setBottomPadding] = useState(50);

  const polaroidRefs = useRef<Map<string, PolaroidCardRef>>(new Map());

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const newImages = result.assets.map((asset) => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          uri: asset.uri,
        }));
        setImages((prev) => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error("Error picking images:", error);
    }
  };

  const removeImage = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newImages = images.filter((img) => img.id !== id);
    setImages(newImages);
    polaroidRefs.current.delete(id);
    if (currentIndex >= newImages.length && currentIndex > 0) {
      setCurrentIndex(newImages.length - 1);
    }
  };

  const exportAllImages = async () => {
    if (images.length === 0) return;

    try {
      if (Platform.OS !== "web") {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission needed",
            "Please grant permission to save images to your gallery."
          );
          return;
        }
      }

      setIsExporting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      let savedCount = 0;

      for (const image of images) {
        const ref = polaroidRefs.current.get(image.id);
        if (ref) {
          try {
            const uri = await ref.capture();
            if (uri) {
              if (Platform.OS === "web") {
                const link = document.createElement("a");
                link.href = uri;
                link.download = `polaroid_${image.id}.png`;
                link.click();
              } else {
                await MediaLibrary.saveToLibraryAsync(uri);
              }
              savedCount++;
            }
          } catch (e) {
            console.error("Error capturing image:", e);
          }
        }
      }

      setIsExporting(false);

      if (savedCount > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Success!",
          `${savedCount} polaroid${savedCount > 1 ? "s" : ""} saved to your gallery.`
        );
      }
    } catch (error) {
      setIsExporting(false);
      console.error("Error exporting:", error);
      Alert.alert("Error", "Failed to export images. Please try again.");
    }
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      Haptics.selectionAsync();
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      Haptics.selectionAsync();
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentImage = images[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12),
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Polaroid Maker
        </Text>
        <View style={styles.headerButtons}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setShowSettings(!showSettings);
            }}
            style={[styles.iconButton, { backgroundColor: colors.surface }]}
          >
            <Feather
              name={showSettings ? "x" : "sliders"}
              size={20}
              color={colors.text}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {showSettings && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <SettingsPanel
              templateSize={templateSize}
              setTemplateSize={setTemplateSize}
              padding={padding}
              setPadding={setPadding}
              borderWidth={borderWidth}
              setBorderWidth={setBorderWidth}
              bottomPadding={bottomPadding}
              setBottomPadding={setBottomPadding}
            />
          </Animated.View>
        )}

        {images.length === 0 ? (
          <Animated.View
            entering={FadeIn}
            style={[styles.emptyState, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="images-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No images yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Add photos to create beautiful polaroid-style images
            </Text>
            <Pressable
              onPress={pickImages}
              style={[styles.addButton, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add" size={24} color="#FFF" />
              <Text style={styles.addButtonText}>Add Photos</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <>
            <View style={styles.previewSection}>
              <View style={styles.navigationRow}>
                <Pressable
                  onPress={goToPrev}
                  disabled={currentIndex === 0}
                  style={[
                    styles.navButton,
                    {
                      backgroundColor: colors.surface,
                      opacity: currentIndex === 0 ? 0.4 : 1,
                    },
                  ]}
                >
                  <Ionicons name="chevron-back" size={24} color={colors.text} />
                </Pressable>

                <Text style={[styles.counter, { color: colors.textSecondary }]}>
                  {currentIndex + 1} / {images.length}
                </Text>

                <Pressable
                  onPress={goToNext}
                  disabled={currentIndex === images.length - 1}
                  style={[
                    styles.navButton,
                    {
                      backgroundColor: colors.surface,
                      opacity: currentIndex === images.length - 1 ? 0.4 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={colors.text}
                  />
                </Pressable>
              </View>

              {currentImage && (
                <View style={styles.polaroidContainer}>
                  <PolaroidCard
                    key={currentImage.id}
                    ref={(ref) => {
                      if (ref) {
                        polaroidRefs.current.set(currentImage.id, ref);
                      }
                    }}
                    imageUri={currentImage.uri}
                    templateSize={templateSize}
                    padding={padding}
                    borderWidth={borderWidth}
                    bottomPadding={bottomPadding}
                  />
                  <Pressable
                    onPress={() => removeImage(currentImage.id)}
                    style={[
                      styles.removeButton,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <Ionicons name="trash-outline" size={18} color="#E74C3C" />
                  </Pressable>
                </View>
              )}

              <Text style={[styles.hint, { color: colors.textMuted }]}>
                Drag to reposition • Use +/- to zoom
              </Text>
            </View>

            <View style={styles.thumbnailSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailScroll}
              >
                {images.map((img, index) => (
                  <Pressable
                    key={img.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCurrentIndex(index);
                    }}
                    style={[
                      styles.thumbnail,
                      {
                        borderColor:
                          index === currentIndex
                            ? colors.primary
                            : colors.border,
                        borderWidth: index === currentIndex ? 2 : 1,
                      },
                    ]}
                  >
                    <Animated.Image
                      source={{ uri: img.uri }}
                      style={styles.thumbnailImage}
                    />
                  </Pressable>
                ))}
                <Pressable
                  onPress={pickImages}
                  style={[
                    styles.addThumbnail,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                  ]}
                >
                  <Ionicons name="add" size={24} color={colors.primary} />
                </Pressable>
              </ScrollView>
            </View>

            <Pressable
              onPress={exportAllImages}
              disabled={isExporting}
              style={[
                styles.exportButton,
                { backgroundColor: colors.primary, opacity: isExporting ? 0.7 : 1 },
              ]}
            >
              {isExporting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={22} color="#FFF" />
                  <Text style={styles.exportButtonText}>
                    Download All ({images.length})
                  </Text>
                </>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    borderRadius: 24,
    gap: 12,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    maxWidth: 250,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 12,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  previewSection: {
    alignItems: "center",
    gap: 16,
  },
  navigationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  counter: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
  polaroidContainer: {
    position: "relative",
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  hint: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  thumbnailSection: {
    marginTop: 8,
  },
  thumbnailScroll: {
    gap: 10,
    paddingHorizontal: 4,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: "hidden",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  addThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  exportButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
});
