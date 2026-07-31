export type DateFormatOption =
	| string
	| (Intl.DateTimeFormatOptions & { locale?: string })
	| ((date: Date) => string);

export default interface RecentChangesOptions {
	routeSlug?: string; // default: 'recent-changes'
	viewHistory?: boolean; // default: true
	dateFormat?: DateFormatOption;
}

export interface ChangeEntry {
	date: string | Date;
	kind?: string;
	author: string;
	message: string;
	pages: {
		title: string;
		slug: string;
	}[];
	commitUrl: string;
}
