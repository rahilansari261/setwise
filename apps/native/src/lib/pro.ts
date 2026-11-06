/** Every feature that needs Adonis Pro. The paywall lists these, `useProGate` checks them. */
export const PRO_FEATURES = {
	vtaperTrend: {
		title: "V-taper trend",
		blurb: "Track your shoulder-to-waist ratio over time.",
	},
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
		title: "Photo check-ins",
		blurb: "Front, side and back every two weeks, compared before and after.",
	},
	goals: {
		title: "Goals",
		blurb: "Lift, bodyweight and weekly-workout targets.",
	},
	recovery: {
		title: "Muscle recovery",
		blurb: "Know which muscles are ready to train.",
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

/** Paywall order: what a V-taper lifter cares about first. */
export const PAYWALL_ORDER: ProFeature[] = [
	"vtaperTrend",
	"photos",
	"cloudSync",
	"measurements",
	"goals",
	"recovery",
	"recap",
	"advancedCharts",
	"unlimitedRoutines",
	"routineFolders",
	"routineShare",
	"exerciseFolders",
	"gyms",
	"biometric",
];

/** Free accounts can keep this many routines of their own. */
export const FREE_ROUTINE_LIMIT = 3;
