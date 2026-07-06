import { useEffect, useMemo, useRef } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { AppText } from "./ui/AppText";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";

type Props = {
  value: string;
  onChange: (time: string) => void;
  label?: string;
};

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const WHEEL_PADDING = (PICKER_HEIGHT - ITEM_HEIGHT) / 2;

const HOURS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0")
);
const MINUTES = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0")
);

export function WheelTimePicker({ value, onChange, label }: Props) {
  const { hour, minute } = useMemo(() => parseTime(value), [value]);

  function updateHour(nextHour: string) {
    onChange(`${nextHour}:${minute}`);
  }

  function updateMinute(nextMinute: string) {
    onChange(`${hour}:${nextMinute}`);
  }

  return (
    <View
      accessibilityLabel={label || "Selecionar horário"}
      accessibilityRole="adjustable"
      style={styles.container}
    >
      <View style={styles.header}>
        <AppText variant="small" style={styles.helper}>
          Role para ajustar o horário da dose.
        </AppText>
        <AppText variant="small" style={styles.value}>
          {hour}:{minute}
        </AppText>
      </View>

      <View style={styles.pickerShell}>
        <View pointerEvents="none" style={styles.selectionBand} />
        <WheelColumn
          label="Hora"
          options={HOURS}
          selectedValue={hour}
          onSelect={updateHour}
        />
        <View style={styles.separatorColumn} pointerEvents="none">
          <AppText variant="heading" style={styles.separator}>
            :
          </AppText>
        </View>
        <WheelColumn
          label="Minuto"
          options={MINUTES}
          selectedValue={minute}
          onSelect={updateMinute}
        />
      </View>
    </View>
  );
}

type WheelColumnProps = {
  label: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
};

function WheelColumn({
  label,
  options,
  selectedValue,
  onSelect,
}: WheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = Math.max(0, options.indexOf(selectedValue));

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
    });
  }, [selectedIndex]);

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.min(
      options.length - 1,
      Math.max(0, Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT))
    );
    onSelect(options[nextIndex]);
  }

  return (
    <View style={styles.column}>
      <AppText variant="caption" style={styles.columnLabel}>
        {label}
      </AppText>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        nestedScrollEnabled
        contentContainerStyle={styles.wheelContent}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        style={styles.wheel}
      >
        {options.map((option) => {
          const isSelected = option === selectedValue;

          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={`${label} ${option}`}
              onPress={() => onSelect(option)}
              style={styles.option}
            >
              <AppText
                variant={isSelected ? "heading" : "subheading"}
                style={[styles.optionText, isSelected && styles.selectedText]}
              >
                {option}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function parseTime(value: string) {
  const [rawHour = "08", rawMinute = "00"] = value.split(":");
  const hourNumber = Number(rawHour);
  const minuteNumber = Number(rawMinute);
  const hour =
    Number.isInteger(hourNumber) && hourNumber >= 0 && hourNumber <= 23
      ? String(hourNumber).padStart(2, "0")
      : "08";
  const minute =
    Number.isInteger(minuteNumber) && minuteNumber >= 0 && minuteNumber <= 59
      ? String(minuteNumber).padStart(2, "0")
      : "00";

  return { hour, minute };
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  helper: {
    color: colors.textMuted,
    flex: 1,
    marginRight: spacing.md,
  },
  value: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  pickerShell: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#BFB5A8",
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    height: PICKER_HEIGHT,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: spacing.md,
  },
  selectionBand: {
    backgroundColor: colors.accentSoft,
    borderColor: "#F2C4A8",
    borderRadius: radii.md,
    borderWidth: 1,
    height: ITEM_HEIGHT,
    left: spacing.md,
    position: "absolute",
    right: spacing.md,
    top: WHEEL_PADDING,
  },
  column: {
    alignItems: "center",
    flex: 1,
    height: PICKER_HEIGHT,
  },
  columnLabel: {
    color: colors.textMuted,
    fontWeight: "800",
    paddingTop: spacing.sm,
    position: "absolute",
    textTransform: "uppercase",
    zIndex: 1,
  },
  wheel: {
    height: PICKER_HEIGHT,
    width: "100%",
  },
  wheelContent: {
    paddingBottom: WHEEL_PADDING,
    paddingTop: WHEEL_PADDING,
  },
  option: {
    alignItems: "center",
    height: ITEM_HEIGHT,
    justifyContent: "center",
  },
  optionText: {
    color: colors.textMuted,
    fontWeight: "700",
    opacity: 0.55,
  },
  selectedText: {
    color: colors.primaryDark,
    fontWeight: "900",
    opacity: 1,
  },
  separatorColumn: {
    alignItems: "center",
    height: PICKER_HEIGHT,
    justifyContent: "center",
    marginHorizontal: spacing.sm,
    paddingTop: 0,
    width: 14,
  },
  separator: {
    color: colors.primaryDark,
    fontWeight: "900",
    lineHeight: ITEM_HEIGHT,
    textAlign: "center",
  },
});
