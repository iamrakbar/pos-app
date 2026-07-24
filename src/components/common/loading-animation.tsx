import { Skia, Canvas, useClock, Group, Skottie } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

const legoAnimationJSON = require("../../../assets/soeat.json");
const animation = Skia.Skottie.Make(JSON.stringify(legoAnimationJSON));

const LoadingAnimation = () => {
  const clock = useClock();
  const frame = useDerivedValue(() => {
    const fps = animation.fps();
    const duration = animation.duration();
    const currentFrame = ((clock.value / 1200) * fps) % (duration * fps);
    return currentFrame;
  });

  return (
    <Canvas style={{ width: 100, height: 100 }}>
      <Group transform={[{ scale: 1 }]}>
        <Skottie animation={animation} frame={frame} />
      </Group>
    </Canvas>
  );
};

export default LoadingAnimation;
