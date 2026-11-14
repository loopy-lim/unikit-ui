/*
 * react-native-webview 14 호환 래퍼.
 *
 * webview 14의 cross-platform 타입(lib/WebView.d.ts)이 `FunctionComponent<WebViewProps>`
 * 로만 선언돼 ref 계약(forwardRef + injectJavaScript)을 타입에 노출하지 않는다
 * (도그푸딩 발견 — `useRef<WebView>` 패턴이 이 조합에서 무너진다).
 * 런타임 계약에 맞춰 사용하는 최소 인터페이스만 단언한다.
 */
import type { ComponentProps, FunctionComponent, Ref } from "react";
import WebViewDefault from "react-native-webview";

export type WebViewHandle = {
  injectJavaScript: (javaScript: string) => void;
  reload?: () => void;
};

export const WebView = WebViewDefault as unknown as FunctionComponent<
  ComponentProps<typeof WebViewDefault> & { ref?: Ref<WebViewHandle> }
>;

export type { WebViewMessageEvent } from "react-native-webview";
