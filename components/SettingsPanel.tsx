import { View, Text, TextInput, StyleSheet, useColorScheme } from "react-native";
import Colors from "@/constants/colors";

interface SettingsPanelProps {
  templateSize: number;
  setTemplateSize: (size: number) => void;
  padding: number;
  setPadding: (padding: number) => void;
  borderWidth: number;
  setBorderWidth: (width: number) => void;
  bottomPadding: number;
  setBottomPadding: (padding: number) => void;
}

export default function SettingsPanel({
  templateSize,
  setTemplateSize,
  padding,
  setPadding,
  borderWidth,
  setBorderWidth,
  bottomPadding,
  setBottomPadding,
}: SettingsPanelProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const handleNumberChange = (
    value: string,
    setter: (val: number) => void,
    min: number,
    max: number
  ) => {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      setter(Math.max(min, Math.min(max, num)));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Template Settings</Text>
      <View style={styles.grid}>
        <SettingInput
          label="Size"
          value={templateSize}
          onChange={(v) => handleNumberChange(v, setTemplateSize, 200, 500)}
          colors={colors}
          unit="px"
        />
        <SettingInput
          label="Padding"
          value={padding}
          onChange={(v) => handleNumberChange(v, setPadding, 5, 50)}
          colors={colors}
          unit="px"
        />
        <SettingInput
          label="Border"
          value={borderWidth}
          onChange={(v) => handleNumberChange(v, setBorderWidth, 0, 10)}
          colors={colors}
          unit="px"
        />
        <SettingInput
          label="Bottom"
          value={bottomPadding}
          onChange={(v) => handleNumberChange(v, setBottomPadding, 20, 100)}
          colors={colors}
          unit="px"
        />
      </View>
    </View>
  );
}

function SettingInput({
  label,
  value,
  onChange,
  colors,
  unit,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
  colors: typeof Colors.light;
  unit: string;
}) {
  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderLight }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value.toString()}
          onChangeText={onChange}
          keyboardType="number-pad"
          selectTextOnFocus
        />
        <Text style={[styles.unit, { color: colors.textMuted }]}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  inputContainer: {
    width: "47%",
  },
  label: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
  unit: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
});
