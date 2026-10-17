import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";

import { Toast } from "@/src/components/ui";

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
	const [message, setMessage] = useState<string | null>(null);
	const hide = useCallback(() => setMessage(null), []);
	return (
		<ToastContext.Provider value={setMessage}>
			{children}
			<Toast message={message} onHide={hide} />
		</ToastContext.Provider>
	);
}

export const useToast = () => useContext(ToastContext);
