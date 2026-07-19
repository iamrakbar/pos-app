import { Text, View } from 'react-native';
import type { ItemInjectedProps, TimelineItemContextValue, TimelineRootContextValue } from './timeline.types';
declare function useRootContext(): TimelineRootContextValue;
declare function useItemContext(): TimelineItemContextValue;
declare const Root: import("react").ForwardRefExoticComponent<Omit<import("../../helpers/internal/types").SlottableViewProps, "children"> & {
    children: React.ReactNode;
    size?: import("./timeline.types").TimelineSize;
    density?: import("./timeline.types").TimelineDensity;
    itemAlign?: import("./timeline.types").TimelineItemAlign;
    skipInjectItemIndices?: boolean;
} & import("react").RefAttributes<View>>;
declare const Item: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
    asChild?: boolean;
} & {
    children?: React.ReactNode;
    status?: import("./timeline.types").TimelineStatus;
    align?: import("./timeline.types").TimelineItemAlign;
} & Partial<ItemInjectedProps> & import("react").RefAttributes<View>>;
declare const Leading: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
    asChild?: boolean;
} & import("react").RefAttributes<View>>;
declare const Rail: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
    asChild?: boolean;
} & import("react").RefAttributes<View>>;
declare const Marker: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
    asChild?: boolean;
} & import("react").RefAttributes<View>>;
declare const Connector: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
    asChild?: boolean;
} & {
    force?: boolean;
} & import("react").RefAttributes<View>>;
declare const Content: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
    asChild?: boolean;
} & {
    children?: React.ReactNode;
} & import("react").RefAttributes<View>>;
declare const Title: import("react").ForwardRefExoticComponent<import("react-native").TextProps & {
    asChild?: boolean;
} & {
    children?: React.ReactNode;
} & import("react").RefAttributes<Text>>;
declare const Description: import("react").ForwardRefExoticComponent<import("react-native").TextProps & {
    asChild?: boolean;
} & {
    children?: React.ReactNode;
} & import("react").RefAttributes<Text>>;
export { Connector, Content, Description, Item, Leading, Marker, Rail, Root, Title, useItemContext, useRootContext, };
//# sourceMappingURL=timeline.d.ts.map