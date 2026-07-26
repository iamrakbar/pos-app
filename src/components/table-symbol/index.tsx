import { useThemeColor } from "heroui-native";
import Svg, { Circle, G, Rect, type SvgProps } from "react-native-svg";

export type TableSeatCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type Seat = {
  x: number;
  y: number;
  rotation?: number;
};

type RoundTable = {
  shape: "round";
  cx: number;
  cy: number;
  radius: number;
};

type RectangularTable = {
  shape: "rectangular";
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
};

type TableSymbolConfig = {
  viewBox: string;
  table: RoundTable | RectangularTable;
  seats: Seat[];
};

const TABLE_SYMBOLS: Record<TableSeatCount, TableSymbolConfig> = {
  1: {
    viewBox: "0 0 76 113",
    table: { shape: "round", cx: 38, cy: 38, radius: 35 },
    seats: [{ x: 38, y: 94 }],
  },
  2: {
    viewBox: "0 0 76 158",
    table: { shape: "rectangular", x: 3, y: 44, width: 70, height: 70, radius: 18 },
    seats: [
      { x: 38, y: 17 },
      { x: 38, y: 141 },
    ],
  },
  3: {
    viewBox: "0 0 168 147",
    table: { shape: "round", cx: 84, cy: 84, radius: 42 },
    seats: [
      { x: 84, y: 17 },
      { x: 143, y: 116, rotation: -60 },
      { x: 25, y: 116, rotation: 60 },
    ],
  },
  4: {
    viewBox: "0 0 168 168",
    table: { shape: "rectangular", x: 49, y: 49, width: 70, height: 70, radius: 16 },
    seats: [
      { x: 84, y: 16 },
      { x: 152, y: 84, rotation: 90 },
      { x: 84, y: 152 },
      { x: 16, y: 84, rotation: 90 },
    ],
  },
  5: {
    viewBox: "0 0 194 188",
    table: { shape: "round", cx: 97, cy: 94, radius: 48 },
    seats: [
      { x: 97, y: 17 },
      { x: 171, y: 70, rotation: 72 },
      { x: 143, y: 163, rotation: -36 },
      { x: 51, y: 163, rotation: 36 },
      { x: 23, y: 70, rotation: -72 },
    ],
  },
  6: {
    viewBox: "0 0 208 168",
    table: { shape: "rectangular", x: 49, y: 49, width: 110, height: 70, radius: 18 },
    seats: [
      { x: 74, y: 16 },
      { x: 134, y: 16 },
      { x: 192, y: 84, rotation: 90 },
      { x: 134, y: 152 },
      { x: 74, y: 152 },
      { x: 16, y: 84, rotation: 90 },
    ],
  },
  7: {
    viewBox: "0 0 228 178",
    table: { shape: "rectangular", x: 54, y: 49, width: 120, height: 80, radius: 22 },
    seats: [
      { x: 84, y: 16 },
      { x: 144, y: 16 },
      { x: 212, y: 67, rotation: 90 },
      { x: 212, y: 111, rotation: 90 },
      { x: 144, y: 162 },
      { x: 84, y: 162 },
      { x: 16, y: 89, rotation: 90 },
    ],
  },
  8: {
    viewBox: "0 0 238 188",
    table: { shape: "rectangular", x: 54, y: 52, width: 130, height: 84, radius: 22 },
    seats: [
      { x: 84, y: 16 },
      { x: 154, y: 16 },
      { x: 222, y: 72, rotation: 90 },
      { x: 222, y: 116, rotation: 90 },
      { x: 154, y: 172 },
      { x: 84, y: 172 },
      { x: 16, y: 116, rotation: 90 },
      { x: 16, y: 72, rotation: 90 },
    ],
  },
};

export type TableSymbolProps = Omit<SvgProps, "color"> & {
  seats: TableSeatCount;
  color?: string;
  tableColor?: string;
  chairColor?: string;
};

export default function TableSymbol({
  seats,
  color,
  tableColor,
  chairColor,
  width = 120,
  height = 96,
  accessibilityLabel,
  ...svgProps
}: TableSymbolProps) {
  const [foreground, surface, surfaceSecondary] = useThemeColor([
    "foreground",
    "surface",
    "surface-secondary",
  ]);
  const config = TABLE_SYMBOLS[seats];
  const stroke = color ?? foreground;
  const tableFill = tableColor ?? surfaceSecondary;
  const chairFill = chairColor ?? surface;

  return (
    <Svg
      {...svgProps}
      width={width}
      height={height}
      viewBox={config.viewBox}
      fill="none"
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? "image" : undefined}
    >
      {config.table.shape === "round" ? (
        <Circle
          cx={config.table.cx}
          cy={config.table.cy}
          r={config.table.radius}
          fill={tableFill}
          stroke={stroke}
          strokeWidth={6}
        />
      ) : (
        <Rect
          x={config.table.x}
          y={config.table.y}
          width={config.table.width}
          height={config.table.height}
          rx={config.table.radius}
          fill={tableFill}
          stroke={stroke}
          strokeWidth={6}
        />
      )}
      {config.seats.map((seat, index) => (
        <G
          key={`${seats}-${index}`}
          transform={seat.rotation ? `rotate(${seat.rotation} ${seat.x} ${seat.y})` : undefined}
        >
          <Rect
            x={seat.x - 22}
            y={seat.y - 16}
            width={44}
            height={32}
            rx={10}
            fill={chairFill}
            stroke={stroke}
            strokeWidth={5}
          />
        </G>
      ))}
    </Svg>
  );
}
