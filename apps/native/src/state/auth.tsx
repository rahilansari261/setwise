import {
	GoogleSignin,
	isErrorWithCode,
	isSuccessResponse,
	statusCodes,
} from "@react-native-google-signin/google-signin";
import type { Session } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { Platform } from "react-native";

import { deleteKV, getKV, setKV } from "@/src/db/database";
import { ENV } from "@/src/env";
import { supabase } from "@/src/lib/supabase";

const GUEST_KEY = "auth_guest";

export const secretLoginEnabled =
	__DEV__ || ENV.EXPO_PUBLIC_ENABLE_SECRET_LOGIN === true;

let googleConfigured = false;
function configureGoogle() {
	if (googleConfigured) return;
	GoogleSignin.configure({
		webClientId: ENV.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined,
		iosClientId: ENV.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined,
		scopes: ["email", "profile"],
	});
	googleConfigured = true;
}

export class AuthError extends Error {}

function useAuthValue() {
	const [ready, setReady] = useState(false);
	const [session, setSession] = useState<Session | null>(null);
	const [guest, setGuest] = useState(false);

	useEffect(() => {
		let mounted = true;
		(async () => {
			const isGuest =
				secretLoginEnabled && (await getKV<boolean>(GUEST_KEY)) === true;
			const current = supabase
				? (await supabase.auth.getSession()).data.session
				: null;
			if (!mounted) return;
			setGuest(isGuest);
			setSession(current);
			setReady(true);
		})().catch(() => setReady(true));

		const sub = supabase?.auth.onAuthStateChange((_event, next) =>
			setSession(next),
		);
		return () => {
			mounted = false;
			sub?.data.subscription.unsubscribe();
		};
	}, []);

	const signInWithGoogle = useCallback(async () => {
		if (!supabase || !ENV.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
			throw new AuthError(
				"Login isn't configured yet. Add the Supabase and Google keys to apps/native/.env.",
			);
		}
		configureGoogle();
		try {
			await GoogleSignin.hasPlayServices({
				showPlayServicesUpdateDialog: true,
			});
			const response = await GoogleSignin.signIn();
			if (!isSuccessResponse(response)) return false;
			const idToken = response.data.idToken;
			if (!idToken)
				throw new AuthError(
					"Google didn't return an ID token. Check the Web client ID.",
				);
			const { error } = await supabase.auth.signInWithIdToken({
				provider: "google",
				token: idToken,
			});
			if (error) throw new AuthError(error.message);
			return true;
		} catch (error) {
			if (isErrorWithCode(error)) {
				if (
					error.code === statusCodes.SIGN_IN_CANCELLED ||
					error.code === statusCodes.IN_PROGRESS
				)
					return false;
				if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
					throw new AuthError(
						"Google Play services is missing or out of date on this phone.",
					);
				}
				throw new AuthError(
					`Google sign-in failed (${error.code}). ${error.message}`,
				);
			}
			throw error;
		}
	}, []);

	const signInWithApple = useCallback(async () => {
		if (!supabase) throw new AuthError("Login isn't configured yet.");
		try {
			const credential = await AppleAuthentication.signInAsync({
				requestedScopes: [
					AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
					AppleAuthentication.AppleAuthenticationScope.EMAIL,
				],
			});
			if (!credential.identityToken)
				throw new AuthError("Apple didn't return an identity token.");
			const { error } = await supabase.auth.signInWithIdToken({
				provider: "apple",
				token: credential.identityToken,
			});
			if (error) throw new AuthError(error.message);
			return true;
		} catch (error) {
			if ((error as { code?: string }).code === "ERR_REQUEST_CANCELED")
				return false;
			throw error;
		}
	}, []);

	const enterAsGuest = useCallback(async () => {
		if (!secretLoginEnabled) return;
		await setKV(GUEST_KEY, true);
		setGuest(true);
	}, []);

	const signOut = useCallback(async () => {
		await deleteKV(GUEST_KEY);
		setGuest(false);
		if (supabase) await supabase.auth.signOut();
		if (Platform.OS !== "web" && googleConfigured)
			await GoogleSignin.signOut().catch(() => {});
	}, []);

	/** Deletes the Supabase user (via the delete-account Edge Function), then signs out. */
	const deleteAccount = useCallback(async () => {
		if (supabase && session) {
			const { error } = await supabase.functions.invoke("delete-account", {
				method: "POST",
			});
			if (error)
				throw new AuthError(`Couldn't delete the account: ${error.message}`);
		}
		await signOut();
	}, [session, signOut]);

	const user = session?.user ?? null;
	const displayName =
		(user?.user_metadata?.full_name as string | undefined) ??
		(user?.user_metadata?.name as string | undefined) ??
		"";

	return useMemo(
		() => ({
			ready,
			session,
			user,
			displayName,
			isGuest: guest && !session,
			signedIn: Boolean(session) || guest,
			appleAvailable: Platform.OS === "ios",
			signInWithGoogle,
			signInWithApple,
			enterAsGuest,
			signOut,
			deleteAccount,
		}),
		[
			ready,
			session,
			user,
			displayName,
			guest,
			signInWithGoogle,
			signInWithApple,
			enterAsGuest,
			signOut,
			deleteAccount,
		],
	);
}

type Auth = ReturnType<typeof useAuthValue>;
const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const value = useAuthValue();
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Auth {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
	return ctx;
}
