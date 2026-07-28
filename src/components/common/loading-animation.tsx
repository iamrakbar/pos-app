import { Skia, Canvas, useClock, Group, Skottie } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";
import { Modal, View } from "react-native";

const legoAnimationJSON = require("../../../assets/soeat.json");
const animation = Skia.Skottie.Make(JSON.stringify(legoAnimationJSON));

type LoadingAnimationProps = {
  fullScreen?: boolean;
};

const LoadingAnimation = ({ fullScreen = false }: LoadingAnimationProps) => {
  const clock = useClock();
  const frame = useDerivedValue(() => {
    const fps = animation.fps();
    const duration = animation.duration();
    const currentFrame = ((clock.value / 1200) * fps) % (duration * fps);
    return currentFrame;
  });

  const canvas = (
    <Canvas style={{ width: 100, height: 100 }}>
      <Group transform={[{ scale: 1 }]}>
        <Skottie animation={animation} frame={frame} />
      </Group>
    </Canvas>
  );

  if (!fullScreen) return canvas;

  return (
    <Modal
      visible
      animationType="none"
      presentationStyle="fullScreen"
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View
        className="flex-1 items-center justify-center bg-background"
        accessibilityRole="progressbar"
        accessibilityLabel="Loading application"
      >
        {canvas}
      </View>
    </Modal>
  );
};

export default LoadingAnimation;
