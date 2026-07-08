export const expoBuildUrl =
  import.meta.env.VITE_EXPO_BUILD_URL ||
  "https://expo.dev/accounts/seya_ru/projects/dentconnect-mobile/builds/62341e64-7ae5-4976-b658-c9cef176c0df";

const defaultWebAppUrl =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : "http://localhost:3000";

export const mobileWebAppUrl =
  import.meta.env.VITE_MOBILE_WEB_APP_URL || defaultWebAppUrl;