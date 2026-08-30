import { getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

export const initAnalytics = async () => {
  // التأكد من أن التطبيق تم تهيئته بالفعل في المتصفح
  if (typeof window !== "undefined" && getApps().length > 0) {
    const supported = await isSupported();
    if (supported) {
      return getAnalytics(getApps()[0]);
    }
  }
  return null;
};