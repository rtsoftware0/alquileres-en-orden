import { addDays as civilAddDays, differenceInCalendarDays, getDaysInMonth, parseISO, format } from 'date-fns';
import { isValidIsoDate } from '@/features/contracts/draft';
// date-fns civil arithmetic; ISO output never serializes a local instant.
export const validDate = isValidIsoDate;
export const nextDay = (iso: string, days = 1) => format(civilAddDays(parseISO(iso), days), 'yyyy-MM-dd');
export const dayCount = (start: string, end: string) => differenceInCalendarDays(parseISO(end), parseISO(start));
export function rangeErrors(start: string, end: string) {
 const e: Record<string,string> = {};
 if (!validDate(start)) e['startDate'] = 'Indica una entrada válida.';
 if (!validDate(end)) e['endDate'] = 'Indica una salida válida.';
 else if (!e['startDate'] && end <= start) e['endDate'] = 'La salida debe ser posterior a la entrada.';
 return e;
}
export const overlaps = (a: {startDate:string;endDate?:string}, b: {startDate:string;endDate?:string}) => a.startDate < (b.endDate ?? '9999-12-31') && b.startDate < (a.endDate ?? '9999-12-31');
/** Round once after adding monthly civil-day fractions. */
export function prorate(rentCents:number,start:string,end:string) {
 if (Object.keys(rangeErrors(start,end)).length || !Number.isSafeInteger(rentCents) || rentCents < 0) throw new Error('Periodo o renta no válidos');
 let total=0;
 for(let date=start;date<end;date=nextDay(date)) total += rentCents/getDaysInMonth(parseISO(date));
 return Math.round(total);
}
export function monthRange(month:string) {
 const startDate=`${month}-01`;
 if (!validDate(startDate)) return {startDate:'',endDate:''};
 return {startDate,endDate:nextDay(startDate,getDaysInMonth(parseISO(startDate)))};
}
