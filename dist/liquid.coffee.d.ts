
declare module 'Liquid' {

    export const VERSION: string

    export function setPath(path: string)
    export function compile(template: string, options: any)

    export class Template {
        static fileSystem: any
        static tags: any
        static registerTag(name: string, klass: any)
        static registerFilter(mod: any)
        static parse(source: string): Template
        static tokenize(source: string): string[]
        constructor()
        parse(source: string): Template
        render(...args: any[]): string
        renderWithErrors(): string
    }
}
// declare namespace Liquid {

//     export const VERSION: string

//     export function setPath(path: string)
//     export function compile(template: string, options: any)


//     export abstract class Drop {
//         setContext(context: Context)
//         beforeMethod(method: ay)
//         invokeDrop(method: any)
//         hasKey(name: string): boolean
//     }

//     export abstract class Interrupt {
//         message: string
//         constructor(message: string)
//     }

//     export class BreakInterrupt extends Interrupt {}
//     export class ContinueInterrupt extends Interrupt {}

//     export class Strainer {
//         constructor(context: Context)
//         globalFilter(filter: any)
//         create(context: Context)
//         respondTo(methodName: string)
//         extend(mixin:any)
//     }

//     export class Context {
//         constructor(environments: any, outerScope: any, registers: any, rethrowErrors: any)
//         addFilters(filters: any)
//         hasInterrupt(): boolean
//         pushInterrupt(e: any)
//         popInterrupt(): any
//         handleError(e: any)
//         invoke(method:any, ...args: any[]): any
//         push(newScope: any)
//         merge(newScope: any)
//         pop(): any
//         stack($yield: any, newScope: any)
//         clearInstanceAssigns()
//         get(varname: string): any
//         set(varname: string, value: any)
//         hasKey(key: string): boolean
//         resolveKey(key: string): any
//         findVariable(key: string): any
//         variable(markup: string): any
//         lookupAndEvaluate(obj: any, key: string): any
//     }

//     export abstract class Tag {
//         constructor(tagName: string, markup: string, tokens: string[])
//         parse(tokens: string[])
//         render(context: Context): string
//     }

//     export abstract class Block extends Tag {
//         endTag()
//         unknownTag(tag: string, params: any, tokens: any)
//         createVariable(token: string): Variable
//         render(context: Context): string
//         renderAll(list: string[], context: Context): string
//         assertMissingDelimitation()
//     }

//     export abstract class Document extends Block {
//         constructor(tokens: string[])
//     }

//     export class Variable {
//         constructor(markup: string)
//         render(context: Context): string        
//     }

//     export class Template {
//         static fileSystem: any
//         static tags: any
//         static registerTag(name: string, klass: any)
//         static registerFilter(mod: any)
//         static parse(source: string): Template
//         static tokenize(source: string): string[]
//         constructor()
//         parse(source: string): Template
//         render(...args: any[]): string
//         renderWithErrors(): string
//     }

//     export class StandardFilters {
//         static size(iter: any): number
//         static downcase(input: any): string
//         static upcase(input: any): string
//         static capitalize(input: any): string
//         static escape(input: any): string
//         static h(input: any): string
//         static truncate(input: string, length: number, str:string): string
//         static truncatewords(input: string, length: number, str:string): string
//         static strip_html(input: any): string
//         static strip_newlines(input: any): string
//         static join(input: any, sep: any): string
//         static split(input: any, sep: any): string
//         static sort(input: any): string
//         static reverse(input: any): string
//         static replace(input: string, str:string, replacement: string): string
//         static replace_first(input: string, str:string, replacement: string): string
//         static newline_to_br(input: any): string
//         static date(input: any, format: string): string
//         static first(input: any): string
//         static last(input: any): string

//     }

//     export class Condition {
//         constructor(left: string, operator: string, right: string)
//         evaluate(context: Context): boolean
//         or(condition: Condition)
//         and(condition: Condition)
//         attach(attachment: any)
//         else(): boolean
//         toString(): string
//         interpretCondition(left: string, right: string, op: string, context: Context): any
//     }

//     export class ElseCondition extends Condition {
//     }

//     export namespace Tags {
//         export class Assign extends Tag {}
//         export class Block extends Liquid.Block {
//             addParent(nodelist)
//             callSuper(context): string
//         }
//         export class Break extends Tag{
//             interrupt(): BreakInterrupt
//         }
//         export class Capture extends Liquid.Block {}
//         export class Case extends Liquid.Block {
//             recordWhenCondition(markup: string)
//             recordElseCondition(markup: string)
//         }
//         export class Comment extends Liquid.Block {}
//         export class Continue extends Tag {
//             interrupt(): ContinueInterrupt
//         }
//         export class Cycle extends Tag {
//             variablesFromString(markup: string)
//         }
//         export class Decrement extends Tag {}
//         export class Extends extends Liquid.Block {
//             loadTemplate(context: Context): Template
//             findBlocks(node: Block, blocks) : any
//             isExtending(template:Template): boolean
//         }
//         export class For extends Liquid.Block {}
//         export class If extends Liquid.Block {}
//         export class IfChanged extends Liquid.Block {}
//         export class Include extends Tag {
//             readTemplateFromFileSystem(context: Context, templateName: string): Template
//         }
//         export class Increment extends Tag {}
//         export class Raw extends Liquid.Block {}
//         export class Unless extends If {}

//     }



// }