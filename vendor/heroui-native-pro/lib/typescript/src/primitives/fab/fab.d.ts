import React from 'react';
import { View } from 'react-native';
import type { IRootContext, PortalProps, TriggerRef } from './fab.types';
declare const useRootContext: () => IRootContext;
declare const Root: React.ForwardRefExoticComponent<import("react-native").ViewProps & {
    asChild?: boolean;
} & {
    placement?: import("./fab.types").AutoPlacement;
    align?: import("./fab.types").AutoAlign;
    isOpen?: boolean;
    isDefaultOpen?: boolean;
    isDisabled?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
} & React.RefAttributes<View>>;
declare const Trigger: React.ForwardRefExoticComponent<Omit<import("../../helpers/internal/types").SlottablePressableProps, "disabled"> & {
    isDisabled?: boolean;
} & React.RefAttributes<TriggerRef>>;
/**
 * @warning when using a custom `<PortalHost />`, you might have to adjust the Content's offset to account for nav elements like headers.
 */
declare function Portal({ forceMount, hostName, children }: PortalProps): import("react/jsx-runtime").JSX.Element | null;
declare const Overlay: React.ForwardRefExoticComponent<import("../../helpers/internal/types").ForceMountable & Omit<import("react-native").PressableProps & React.RefAttributes<View>, "ref"> & {
    asChild?: boolean;
} & {
    closeOnPress?: boolean;
} & React.RefAttributes<View>>;
/**
 * @info `position`, `top`, `left`, and `maxWidth` style properties are controlled internally. Opt out of this behavior by setting `disablePositioningStyle` to `true`.
 */
declare const Content: React.ForwardRefExoticComponent<import("react-native").ViewProps & {
    asChild?: boolean;
} & import("../../helpers/internal/types").ForceMountable & {
    offset?: number;
    alignOffset?: number;
    insets?: import("../../helpers/internal/types").Insets;
    avoidCollisions?: boolean;
    disablePositioningStyle?: boolean;
} & React.RefAttributes<View>>;
declare const Item: React.ForwardRefExoticComponent<Omit<import("react-native").PressableProps & React.RefAttributes<View>, "ref"> & {
    asChild?: boolean;
} & {
    closeOnPress?: boolean;
} & React.RefAttributes<View>>;
export { Content, Item, Overlay, Portal, Root, Trigger, useRootContext };
//# sourceMappingURL=fab.d.ts.map