import { StyleSheet, View } from "react-native";
import { Info } from "lucide-react-native";
import { AppText } from "./ui/AppText";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";

type Props = {
  text: string;
};

export function CareInfoTip({ text }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Info color={colors.info} size={18} />
      </View>
      <AppText variant="small" style={styles.text}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.infoSoft,
    borderColor: "#A9C9E3",
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  icon: {
    alignItems: "center",
    borderColor: colors.info,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    marginRight: spacing.md,
    width: 32,
  },
  text: {
    color: colors.info,
    flex: 1,
  },
});
