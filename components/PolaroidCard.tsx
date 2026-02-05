import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  View,
  StyleSheet,
  useColorScheme,
  PanResponder,
  Dimensions,
  Pressable,
  Text,
} from "react-native";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import ViewShot from "react-native-view-shot";
import Colors from "@/constants/colors";

interface PolaroidCardProps {
  imageUri: string;
  templateSize: number;
  padding: number;
  borderWidth: number;
  bottomPadding: number;
}

export interface PolaroidCardRef {
  capture: () => Promise<string | undefined>;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const PolaroidCard = forwardRef<PolaroidCardRef, PolaroidCardProps>(
  ({ imageUri, templateSize, padding, borderWidth, bottomPadding }, ref) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

    const viewShotRef = useRef<ViewShot>(null);

    const scale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const [lastScale, setLastScale] = useState(1);
    const [lastTranslateX, setLastTranslateX] = useState(0);
    const [lastTranslateY, setLastTranslateY] = useState(0);

    const imageSize = templateSize - padding * 2 - borderWidth * 2;
    const totalHeight = templateSize + bottomPadding - padding;

    useImperativeHandle(ref, () => ({
      capture: async () => {
        if (viewShotRef.current) {
          return viewShotRef.current.capture?.();
        }
        return undefined;
      },
    }));

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {},
        onPanResponderMove: (_, gestureState) => {
          translateX.value = lastTranslateX + gestureState.dx * 0.5;
          translateY.value = lastTranslateY + gestureState.dy * 0.5;
        },
        onPanResponderRelease: () => {
          setLastTranslateX(translateX.value);
          setLastTranslateY(translateY.value);
        },
      })
    ).current;

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    }));

    const handleZoomIn = () => {
      const newScale = Math.min(lastScale + 0.2, 3);
      scale.value = withSpring(newScale);
      setLastScale(newScale);
    };

    const handleZoomOut = () => {
      const newScale = Math.max(lastScale - 0.2, 0.5);
      scale.value = withSpring(newScale);
      setLastScale(newScale);
    };

    const handleReset = () => {
      scale.value = withSpring(1);
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      setLastScale(1);
      setLastTranslateX(0);
      setLastTranslateY(0);
    };

    const cardScale = Math.min((SCREEN_WIDTH - 48) / templateSize, 1);

    return (
      <View style={styles.container}>
        <View style={{ transform: [{ scale: cardScale }] }}>
          <ViewShot
            ref={viewShotRef}
            options={{ format: "png", quality: 1 }}
            style={[
              styles.polaroid,
              {
                width: templateSize,
                height: totalHeight,
                backgroundColor: colors.polaroidBorder,
                padding: padding,
                borderWidth: borderWidth,
                borderColor: colors.border,
                shadowColor: colors.polaroidShadow,
              },
            ]}
          >
            <View
              style={[
                styles.imageContainer,
                {
                  width: imageSize,
                  height: imageSize,
                  backgroundColor: "#000",
                },
              ]}
            >
              <Animated.View
                style={[styles.imageWrapper, animatedStyle]}
                {...panResponder.panHandlers}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={{
                    width: imageSize * 1.5,
                    height: imageSize * 1.5,
                  }}
                  contentFit="cover"
                />
              </Animated.View>
            </View>
          </ViewShot>
        </View>
        <View style={styles.controls}>
          <Pressable
            onPress={handleZoomOut}
            style={[styles.controlButton, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.controlButtonText, { color: colors.text }]}>−</Text>
          </Pressable>
          <Pressable
            onPress={handleReset}
            style={[styles.controlButton, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.controlButtonText, { color: colors.text }]}>↺</Text>
          </Pressable>
          <Pressable
            onPress={handleZoomIn}
            style={[styles.controlButton, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.controlButtonText, { color: colors.text }]}>+</Text>
          </Pressable>
        </View>
      </View>
    );
  }
);

PolaroidCard.displayName = "PolaroidCard";

export default PolaroidCard;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 16,
  },
  polaroid: {
    borderRadius: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  imageContainer: {
    overflow: "hidden",
    borderRadius: 2,
  },
  imageWrapper: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -100,
    marginTop: -100,
  },
  controls: {
    flexDirection: "row",
    gap: 12,
  },
  controlButton: {
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
  controlButtonText: {
    fontSize: 24,
    fontFamily: "Poppins_600SemiBold",
  },
});
