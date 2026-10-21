import { View } from "react-native";

import { Chip, Row, Sheet, T } from "@/src/components/ui";
import { addDays, shortDate, todayISO } from "@/src/lib/dates";

/** Pick one of the next two weeks. */
export function DatePickSheet({
	visible,
	title,
	from = todayISO(),
	days = 14,
	onClose,
	onPick,
}: {
	visible: boolean;
	title: string;
	from?: string;
	days?: number;
	onClose: () => void;
	onPick: (date: string) => void;
}) {
	return (
		<Sheet visible={visible} title={title} onClose={onClose}>
			<View>
				<Row gap={6} style={{ flexWrap: "wrap" }}>
					{Array.from({ length: days }, (_, i) => addDays(from, i)).map((d) => (
						<Chip
							key={d}
							label={d === todayISO() ? "Today" : shortDate(d)}
							onPress={() => {
								onPick(d);
								onClose();
							}}
						/>
					))}
				</Row>
				<T variant="small" style={{ marginTop: 10 }}>
					Plans you don't do show up as missed after the day passes.
				</T>
			</View>
		</Sheet>
	);
}
