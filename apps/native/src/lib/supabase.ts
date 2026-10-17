import "expo-sqlite/localStorage/install";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

import { ENV } from "@/src/env";

const url = ENV.EXPO_PUBLIC_SUPABASE_URL;
const key = ENV.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** null until the Supabase keys are filled in apps/native/.env (see the setup guide). */
export const supabase: SupabaseClient | null =
	url && key
		? createClient(url, key, {
				auth: {
					storage: localStorage,
					autoRefreshToken: true,
					persistSession: true,
					detectSessionInUrl: false,
				},
			})
		: null;

if (supabase) {
	// Refresh tokens only while the app is in the foreground, as Supabase recommends for React Native.
	AppState.addEventListener("change", (state) => {
		if (state === "active") supabase.auth.startAutoRefresh();
		else supabase.auth.stopAutoRefresh();
	});
}
