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
import {
  getCenteredVisualIndex,
  getOptionIndex,
  getRecenteredVisualIndex,
  wrapIndex,
} from "../utils/cyclicWheel";

type Props = {
  value: string;
  onChange: (time: string) => void;
  label?: string;
};

const ITEM_HEIGHT = 52;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const WHEEL_PADDING = (PICKER_HEIGHT - ITEM_HEIGHT) / 2;
const CYCLE_COUNT = 5;

const HOURS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0")
);
const MINUTES = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0")
);

export function WheelTimePicker({ value, onChange, label }: Props) {
  const { hour, minute } = useMemo(() => parseTime(value), [value]);
  const pickerLabel = label || "Selecionar horário";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="small" style={styles.helper}>
          Role para ajustar o horário da dose.
        </AppText>
        <AppText
          accessibilityLabel={`Horário selecionado ${hour}:${minute}`}
          accessibilityLiveRegion="polite"
          variant="small"
          weight="bold"
          style={styles.value}
        >
          {hour}:{minute}
        </AppText>
      </View>

      <View style={styles.columnHeadings}>
        <AppText variant="caption" weight="semibold" muted style={styles.columnHeading}>Hora</AppText>
        <View style={styles.headingSpacer} />
        <AppText variant="caption" weight="semibold" muted style={styles.columnHeading}>Minuto</AppText>
      </View>
      <View style={styles.pickerShell}>
        <View pointerEvents="none" style={styles.selectionBand} />
        <WheelColumn
          accessibilityLabel={`${pickerLabel}, hora`}
          label="Hora"
          options={HOURS}
          selectedValue={hour}
          onSelect={(nextHour) => onChange(`${nextHour}:${minute}`)}
        />
        <View style={styles.separatorColumn} pointerEvents="none">
          <AppText variant="heading" style={styles.separator}>
            :
          </AppText>
        </View>
        <WheelColumn
          accessibilityLabel={`${pickerLabel}, minuto`}
          label="Minuto"
          options={MINUTES}
          selectedValue={minute}
          onSelect={(nextMinute) => onChange(`${hour}:${nextMinute}`)}
        />
      </View>
    </View>
  );
}

type WheelColumnProps = {
  accessibilityLabel: string;
  label: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
};

function WheelColumn({
  accessibilityLabel,
  label,
  options,
  selectedValue,
  onSelect,
}: WheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedIndex = Math.max(0, options.indexOf(selectedValue));
  const repeatedOptions = useMemo(
    () => Array.from({ length: CYCLE_COUNT }, () => options).flat(),
    [options]
  );

  function clearFallbackTimer() {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }

  function scrollToVisualIndex(visualIndex: number, animated: boolean) {
    scrollRef.current?.scrollTo({
      y: visualIndex * ITEM_HEIGHT,
      animated,
    });
  }

  useEffect(() => {
    const centeredIndex = getCenteredVisualIndex(
      selectedIndex,
      options.length,
      CYCLE_COUNT
    );
    requestAnimationFrame(() => scrollToVisualIndex(centeredIndex, false));
  }, [selectedIndex, options.length]);

  useEffect(() => clearFallbackTimer, []);

  function commitOffset(offsetY: number) {
    const visualIndex = Math.min(
      repeatedOptions.length - 1,
      Math.max(0, Math.round(offsetY / ITEM_HEIGHT))
    );
    const optionIndex = getOptionIndex(visualIndex, options.length);
    const nextValue = options[optionIndex];
    const recenteredIndex = getRecenteredVisualIndex(
      visualIndex,
      options.length,
      CYCLE_COUNT
    );

    if (nextValue !== selectedValue) onSelect(nextValue);
    if (recenteredIndex !== visualIndex) {
      requestAnimationFrame(() => scrollToVisualIndex(recenteredIndex, false));
    }
  }

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    clearFallbackTimer();
    commitOffset(event.nativeEvent.contentOffset.y);
  }

  function handleScrollEndDrag(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    const offsetY = event.nativeEvent.contentOffset.y;
    clearFallbackTimer();
    fallbackTimerRef.current = setTimeout(() => commitOffset(offsetY), 80);
  }

  function adjustValue(delta: number) {
    const nextIndex = wrapIndex(selectedIndex + delta, options.length);
    onSelect(options[nextIndex]);
    scrollToVisualIndex(
      getCenteredVisualIndex(nextIndex, options.length, CYCLE_COUNT),
      true
    );
  }

  return (
    <View style={styles.column}>
      <View
        accessible
        accessibilityActions={[
          { name: "increment", label: `Aumentar ${label.toLowerCase()}` },
          { name: "decrement", label: `Diminuir ${label.toLowerCase()}` },
        ]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="adjustable"
        accessibilityValue={{ text: selectedValue }}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "increment") adjustValue(1);
          if (event.nativeEvent.actionName === "decrement") adjustValue(-1);
        }}
        style={styles.adjustable}
      >
        <ScrollView
          ref={scrollRef}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          nestedScrollEnabled
          contentContainerStyle={styles.wheelContent}
          onMomentumScrollBegin={clearFallbackTimer}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEndDrag}
          style={styles.wheel}
        >
          {repeatedOptions.map((option, visualIndex) => {
            const isSelected = option === selectedValue;
            return (
              <Pressable
                key={`${visualIndex}-${option}`}
                accessible={false}
                onPress={() => onSelect(option)}
                style={styles.option}
              >
                <AppText
                  variant={isSelected ? "heading" : "subheading"}
                  weight={isSelected ? "bold" : "medium"}
                  style={[styles.optionText, isSelected && styles.selectedText]}
                >
                  {option}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
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
  container: { marginBottom: spacing.sm },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  helper: { color: colors.textMuted, flex: 1, marginRight: spacing.md },
  value: { color: colors.primaryDark },
  columnHeadings: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
  },
  columnHeading: { flex: 1, textAlign: "center" },
  headingSpacer: { marginHorizontal: spacing.sm, width: 14 },
  pickerShell: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.controlBorder,
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
    borderColor: colors.accentSelectionBorder,
    borderRadius: radii.md,
    borderWidth: 1,
    height: ITEM_HEIGHT,
    left: spacing.md,
    position: "absolute",
    right: spacing.md,
    top: WHEEL_PADDING,
  },
  column: { alignItems: "center", flex: 1, height: PICKER_HEIGHT },
  adjustable: { height: PICKER_HEIGHT, width: "100%" },
  wheel: { height: PICKER_HEIGHT, width: "100%" },
  wheelContent: { paddingBottom: WHEEL_PADDING, paddingTop: WHEEL_PADDING },
  option: { alignItems: "center", height: ITEM_HEIGHT, justifyContent: "center" },
  optionText: { color: colors.textMuted, opacity: 0.52 },
  selectedText: { color: colors.primaryDark, opacity: 1 },
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
    lineHeight: ITEM_HEIGHT,
    textAlign: "center",
  },
});
