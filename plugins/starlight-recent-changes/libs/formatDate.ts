import type { DateFormatOption } from '../common/types';

export function formatDate(dateInput: Date | string | number, format?: DateFormatOption): string {
	if (!dateInput) return '';

	const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
	if (Number.isNaN(date.getTime())) return String(dateInput);

	if (typeof format === 'function') {
		return format(date);
	}

	if (typeof format === 'object' && format !== null) {
		const { locale = 'pt-BR', ...options } = format;
		try {
			return new Intl.DateTimeFormat(locale, options).format(date);
		} catch {
			return date.toLocaleString(locale, options);
		}
	}

	if (typeof format === 'string' && format.trim().length > 0) {
		const strFormat = format.trim();
		// If string contains format tokens like YYYY, MM, DD, etc. (and is not just a locale string like 'pt-BR')
		if (/[YyMdDhHmMsS]/.test(strFormat) && !/^[a-z]{2}(-[a-z]{2,4})?$/i.test(strFormat)) {
			const year = date.getFullYear();
			const month = date.getMonth() + 1;
			const day = date.getDate();
			const hours = date.getHours();
			const minutes = date.getMinutes();
			const seconds = date.getSeconds();

			const pad = (n: number) => n.toString().padStart(2, '0');

			return strFormat
				.replace(/YYYY|yyyy/g, year.toString())
				.replace(/YY|yy/g, pad(year % 100))
				.replace(/MM/g, pad(month))
				.replace(/\bM\b/g, month.toString())
				.replace(/DD|dd/g, pad(day))
				.replace(/\bD\b|\bd\b/g, day.toString())
				.replace(/HH/g, pad(hours))
				.replace(/\bH\b/g, hours.toString())
				.replace(/mm/g, pad(minutes))
				.replace(/\bm\b/g, minutes.toString())
				.replace(/ss/g, pad(seconds))
				.replace(/\bs\b/g, seconds.toString());
		}

		// Locale string, e.g. "pt-BR" or "en-US"
		try {
			return date.toLocaleString(strFormat, {
				dateStyle: 'short',
				timeStyle: 'short',
			});
		} catch {
			return date.toLocaleString(strFormat);
		}
	}

	return date.toLocaleString();
}
