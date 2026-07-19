import { Card } from "heroui-native";
import { AreaChart, ChartCrosshair, ChartIndicator } from "heroui-native-pro";
import React from "react";
import { View } from "react-native";
import { useChartPressState } from "victory-native";

const REVENUE_DATA = [
  { month: "Jan", revenue: 4200 },
  { month: "Feb", revenue: 5800 },
  { month: "Mar", revenue: 3800 },
];

export default function DummyChart() {
  const [width, setWidth] = React.useState(0);
  const height = 200;
  const { state, isActive } = useChartPressState({
    x: "" as string,
    y: { revenue: 0 },
  });

  return (
    <View className="flex-1 w-full px-5 justify-center">
      <Card>
        <Card.Header className="mb-4">
          <Card.Title className="text-sm">Monthly Revenue</Card.Title>
        </Card.Header>
        <Card.Body>
          <View style={{ height }} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
            {width > 0 ? (
              <AreaChart
                data={REVENUE_DATA}
                xKey="month"
                yKeys={["revenue"]}
                orientation="vertical"
                chartPressState={state}
                wrapperClassName="h-[200px]"
                explicitSize={{ width, height }}
              >
                {({ points, chartBounds }) => (
                  <>
                    <AreaChart.Area
                      points={points.revenue}
                      y0={chartBounds.bottom}
                      curveType="monotoneX"
                    />
                    {isActive ? (
                      <>
                        <ChartCrosshair
                          bottom={chartBounds.bottom}
                          top={chartBounds.top}
                          x={state.x.position}
                        />
                        <ChartIndicator x={state.x.position} y={state.y.revenue.position} />
                      </>
                    ) : null}
                  </>
                )}
              </AreaChart>
            ) : null}
          </View>
        </Card.Body>
      </Card>
    </View>
  );
}
