/** Decimal text to exact safe cents; reject precision loss and exponent notation. */
export function parseAmount(value:string):number {
 const match=/^(-?)(\d+)(?:[.,](\d{1,2}))?$/.exec(value.trim());
 if(!match)return NaN;
 const whole=match[2];if(!whole)return NaN;
 const result=(BigInt(whole)*100n+BigInt((match[3]??'').padEnd(2,'0')))*(match[1]==='-'?-1n:1n);
 return result>BigInt(Number.MAX_SAFE_INTEGER)||result<BigInt(Number.MIN_SAFE_INTEGER)?NaN:Number(result);
}