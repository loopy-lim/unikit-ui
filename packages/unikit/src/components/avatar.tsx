import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Image,
  Text,
  View,
  type BridgeImageRef,
  type BridgeViewRef,
  type ImageProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

export type AvatarSize = "default" | "sm" | "lg";

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full web:select-none",
  {
    variants: {
      size: {
        default: "size-8",
        sm: "size-6",
        lg: "size-10",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const AVATAR_FALLBACK_TEXT: Record<AvatarSize, string> = {
  default: "text-sm",
  sm: "text-xs",
  lg: "text-sm",
};
const AVATAR_BADGE_SIZE: Record<AvatarSize, string> = {
  default: "size-2.5",
  sm: "size-2",
  lg: "size-3",
};

type AvatarContextValue = {
  size: AvatarSize;

  hasImage: boolean;

  imageFailed: boolean;
  reportImageMounted: (mounted: boolean) => void;
  reportImageFailed: () => void;
};

const AvatarContext = createContext<AvatarContextValue | null>(null);

const AvatarGroupContext = createContext(false);

export type AvatarProps = ViewProps &
  VariantProps<typeof avatarVariants> & {
    children?: ReactNode;
  };

const Avatar = forwardRef<BridgeViewRef, AvatarProps>(
  ({ className, size, ...props }, ref) => {
    const [hasImage, setHasImage] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);
    const grouped = useContext(AvatarGroupContext);
    const resolvedSize = size ?? "default";
    const contextValue = useMemo<AvatarContextValue>(
      () => ({
        size: resolvedSize,
        hasImage,
        imageFailed,

        reportImageMounted: setHasImage,
        reportImageFailed: () => setImageFailed(true),
      }),
      [resolvedSize, hasImage, imageFailed],
    );
    return (
      <AvatarContext.Provider value={contextValue}>
        <View
          ref={ref}
          className={cn(
            avatarVariants({ size }),
            grouped && "ring-2 ring-background",
            className,
          )}
          {...props}
        />
      </AvatarContext.Provider>
    );
  },
);
Avatar.displayName = "Avatar";

export type AvatarImageProps = Omit<ImageProps, "onError">;

const AvatarImage = forwardRef<BridgeImageRef, AvatarImageProps>(
  ({ className, source, ...props }, ref) => {
    const avatar = useContext(AvatarContext);

    useEffect(() => {
      avatar?.reportImageMounted(true);
      return () => avatar?.reportImageMounted(false);
    }, [avatar]);

    if (avatar?.imageFailed) {
      return null;
    }
    return (
      <Image
        ref={ref}
        source={source}
        onError={avatar ? avatar.reportImageFailed : undefined}
        className={cn("aspect-square size-full", className)}
        {...props}
      />
    );
  },
);
AvatarImage.displayName = "AvatarImage";

export type AvatarFallbackProps = ViewProps & {
  children?: ReactNode;
};

const AvatarFallback = forwardRef<BridgeViewRef, AvatarFallbackProps>(
  ({ className, children, ...props }, ref) => {
    const avatar = useContext(AvatarContext);

    const visible = avatar ? !avatar.hasImage || avatar.imageFailed : true;
    if (!visible) {
      return null;
    }
    return (
      <View
        ref={ref}
        className={cn(
          "flex size-full items-center justify-center rounded-full bg-muted",
          className,
        )}
        {...props}
      >

        <Text
          className={cn(
            "font-sans text-muted-foreground",
            avatar && AVATAR_FALLBACK_TEXT[avatar.size],
          )}
        >
          {children}
        </Text>
      </View>
    );
  },
);
AvatarFallback.displayName = "AvatarFallback";

export type AvatarBadgeProps = ViewProps;

const AvatarBadge = forwardRef<BridgeViewRef, AvatarBadgeProps>(
  ({ className, ...props }, ref) => {
    const avatar = useContext(AvatarContext);
    return (
      <View
        ref={ref}
        className={cn(
          "absolute right-0 bottom-0 z-10 flex items-center justify-center rounded-full bg-primary ring-2 ring-background web:select-none",
          avatar && AVATAR_BADGE_SIZE[avatar.size],
          className,
        )}
        {...props}
      />
    );
  },
);
AvatarBadge.displayName = "AvatarBadge";

export type AvatarGroupProps = ViewProps;

const AvatarGroup = forwardRef<BridgeViewRef, AvatarGroupProps>(
  ({ className, children, ...props }, ref) => {
    const items = Children.toArray(children);
    const overlapped = items.map((child, index) => {
      if (index === 0 || !isValidElement(child)) return child;
      const typedChild = child as ReactElement<{ className?: string }>;
      return cloneElement(typedChild, {
        className: cn("native:-ml-2", typedChild.props.className),
      });
    });
    return (
      <AvatarGroupContext.Provider value={true}>
        <View
          ref={ref}
          className={cn("flex flex-row items-center web:-space-x-2", className)}
          {...props}
        >
          {overlapped}
        </View>
      </AvatarGroupContext.Provider>
    );
  },
);
AvatarGroup.displayName = "AvatarGroup";

export type AvatarGroupCountProps = ViewProps & {
  children?: ReactNode;
};

const AvatarGroupCount = forwardRef<BridgeViewRef, AvatarGroupCountProps>(
  ({ className, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted ring-2 ring-background",
        className,
      )}
      {...props}
    >

      <Text className="font-sans text-sm text-muted-foreground">
        {children}
      </Text>
    </View>
  ),
);
AvatarGroupCount.displayName = "AvatarGroupCount";

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
};
