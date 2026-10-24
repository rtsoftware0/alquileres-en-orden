export type Scope = 'base' | 'didactico';
export type Kind = 'renta' | 'proveedor' | 'fianza';
export interface Account { id:string; name:string; scope:Scope; currency:'EUR' }
export interface Movement { id:string; accountId:string; origin:string; date:string; concept:string; reference:string; cents:number; currency:string; kind:Kind; scope:Scope; discarded?:boolean }
export interface RecordView { id:string; reference:string; date:string; cents:number; kind:Kind; scope:Scope; accountId:string; currency:string; base:boolean; temporary?:boolean; contactId?:string|undefined; contractId?:string; expenseId?:string }
export interface BankLink { id:string; movementId:string; recordId:string; cents:number; active:boolean }
export interface Event { id:string; action:string; reason:string; movementId?:string; recordId?:string; cents?:number; actor:string; date:string }
export interface BankState { movements:Movement[]; records:RecordView[]; links:BankLink[]; history:Event[]; batches:string[]; operations:Record<string,string> }
export interface CsvConfig { accountId:string; exampleId:string; separator:string; dateFormat:'es'|'iso'; decimal:','|'.'; date:string; concept:string; reference:string; amount:string; currency:string; kind:Kind }
export interface ImportRow { row:number; movement?:Movement; error?:string; disposition?:'nueva'|'duplicada'|'discrepancia'|'dudosa'; matches:string[] }
export interface ImportReview { key:string; rows:ImportRow[]; totalCents:number; valid:number }
export interface Decision { choice:'incluir'|'omitir'; reason:string }
