import { useEffect, useState } from "react";
import { Platform, type ImageStyle, type ImageSourcePropType } from "react-native";
import { Image } from "expo-image";
import { api, resolveMediaUrl, TOKEN_KEY } from "../api/client";
import { getToken } from "../utils/token-storage";

interface AuthenticatedImageProps {
  uri: string | null | undefined;
  label: string;
  style: ImageStyle;
  contentFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
}

export function AuthenticatedImage({
  uri,
  label,
  style,
  contentFit = "cover",
}: AuthenticatedImageProps) {
  const [source, setSource] = useState<ImageSourcePropType>();

  useEffect(() => {
    let disposed = false;
    let objectUrl: string | undefined;
    setSource(undefined);

    if (!uri)
      return () => {
        disposed = true;
      };
    const mediaUrl = resolveMediaUrl(uri);
    if (!mediaUrl)
      return () => {
        disposed = true;
      };

    if (Platform.OS === "web") {
      api
        .get<Blob>(mediaUrl, { responseType: "blob" })
        .then(({ data }) => {
          if (disposed) return;
          objectUrl = URL.createObjectURL(data);
          setSource({ uri: objectUrl });
        })
        .catch(() => {
          if (!disposed) setSource(undefined);
        });
    } else {
      getToken(TOKEN_KEY)
        .then((token) => {
          if (!disposed) {
            setSource({
              uri: mediaUrl,
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
          }
        })
        .catch(() => {
          if (!disposed) setSource(undefined);
        });
    }

    return () => {
      disposed = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [uri]);

  return <Image source={source} accessibilityLabel={label} contentFit={contentFit} style={style} />;
}
