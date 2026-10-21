/** Every feature that needs Setwise Pro. The paywall lists these, `useProGate` checks them. */
export const PRO_FEATURES = {
	cloudSync: {
		title: "Cloud sync & backup",
		blurb: "Your workouts stay in sync across phones and survive a lost one.",
	},
	routineFolders: {
		title: "Routine folders",
		blurb: "Organise routines into folders.",
	},
	routineShare: {
		title: "Share routines",
		blurb: "Send a routine to a friend as a file.",
	},
	unlimitedRoutines: {
		title: "Unlimited routines",
		blurb: "Free accounts keep up to 3 custom routines.",
	},
	exerciseFolders: {
		title: "Exercise folders",
		blurb: "Group exercises into your own lists.",
	},
	gyms: {
		title: "Gym profiles",
		blurb: "Bar weight and plates per gym.",
	},
	measurements: {
		title: "Body measurements",
		blurb: "Weight, body fat and circumferences over time.",
	},
	photos: {
		title: "Progress photos",
		blurb: "Private photo timeline stored on your phone.",
	},
	goals: {
		title: "Goals",
		blurb: "Lift, bodyweight and weekly-workout targets.",
	},
	strength: {
		title: "Strength ranking",
		blurb: "See your level on the big lifts.",
	},
	recovery: {
		title: "Muscle recovery",
		blurb: "Know which muscles are ready to train.",
	},
	zones: {
		title: "Training zones",
		blurb: "Strength, size and endurance split of your sets.",
	},
	recap: {
		title: "Monthly recap",
		blurb: "Your month in numbers, compared to the last.",
	},
	advancedCharts: {
		title: "Advanced charts",
		blurb: "Volume and heaviest-set trends, plus 6-month and all-time ranges.",
	},
	biometric: {
		title: "Biometric lock",
		blurb: "Lock the app with fingerprint or face.",
	},
} as const;

export type ProFeature = keyof typeof PRO_FEATURES;

/** Free accounts can keep this many routines of their own. */
export const FREE_ROUTINE_LIMIT = 3;
