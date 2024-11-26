//*Basic Type Annotations
let price:number = 10
let person:string = 'person'
let strong:boolean = true
let whatever:undefined;//Undefined and null are different in that an undefined var is declared but not initialized while null is initialized with an empty value or a value of none
let null_data:null = null
let animal:{name:string,age:number} = {name:'whatever',age:12}

function something():void {//Any function that doesnt return anything but only executes code is of type void
    console.log("A void function")
}
let price_array:number[] = [1,2,3]//a ts array can only be of one type
let person_array:string[] = ['John','Paul','Sam']
let price_tuple:[number,string,number] = [1,'two',3]//a ts tuple,not a pythin tuple,is an array that can hold different datatypes but the type of each element must be explicitly stated as they occur

//Function definition annotation
function anotherFunc(par:number,par2:string):boolean {
    return Boolean(par && par2)
}
console.log(anotherFunc(12,''))

//interface
interface Vehicle {
    brand:string,
    expensive:boolean
}

let car:Vehicle = {brand:'toyota',expensive:true}
console.log(car.expensive)
//there is also type inference but i wont use that

//default par
function add(a:number = 1,b:number = 2):number {
    return a + b
}
console.log(add())

//Union type or Common type.It can alos be used in function pars and return types
let food:number | string[] = ['1','2','3']

//Enums are the ideal structures for holding a set of constant numeric data.It auto sequences it by a cd of 1
enum Constant {
    pi = 10,
    second
}
console.log(Constant.pi,Constant.second)
let any_data:any = [1,2,3]//the any type tells ts to ignore type checking on that variable

//A function that is annotated with return type of never will never reach an end point.Either true an infinte loop or throwing an error.They are very uncommon
function err(val:number):never {
    while(true) {
        console.log(val)
    }
}
function err2():never {
    throw new Error('Will never return')
}

//*The type keyword is nothing but a way to create a type alias
//Literal or Exact types.They allow you to narrow down the exact values a type can take
type count = 1|2|3|4//We use the type keyword for anything with custom types
let one:count = 1
console.log(one)

//You can se type to alias.When you use type for values,it becomes a literal type else it becomes an alias
type aliasNum = number//aliasing primitives
let count:aliasNum = 10
console.log(count)

type nice = 'nice'
//*You can also use template literals
type NumberorString = number | string | `${nice}` //for better readability of union types
let str:NumberorString = 'nice'
console.log(str)

type aliasTuple = [number,string,boolean]//aliasing tuples
let tup:aliasTuple = [1,'s',true]
console.log(tup)

type aliasObj = {//The same as interfaces but interface is better
    age:number,
    tall:boolean
}
let obj:aliasObj = {age:20,tall:true}
console.log(obj)



//*Function Annotations
function optional(age:number,name?:string){ //It does the same thing as initializing to a default value except that it defaults to undefined
    console.log(age,name)
}
function args(...args:number[]){
    console.log(args)
}
args(1,2,3,3,3,4,44)

let new_map = [1,2,3].map((element:number):number=>element**2)
console.log(new_map)

//*Function overloading
function over(a:number,b:string):void;
function over(a:boolean):void;

function over(x:any,y?:any):void {
    console.log(x,y)
}
over(true)

//*Note.Anonymous functions arent parsed.Instead,they get executed at runtime as they come
let typed_func:(element:number)=>number = (element):number=>element ** 2//*function type.Ill never use the function type bercause i dont use variables to store functions so ill only use them as parameter annotations in hof
let sap = [1,2,3].map(typed_func)
console.log(sap)

function destructure({one,two}:{one:number,two:number}):void {//*You can destructure in ts but have to annotate it with the obj type annotation
    console.log(one,two)
}
destructure({one:1,two:2})


//*definition consists of a signature and optionally an implementation.Interfaces have zero runtime impact because they arent transpiled to js
interface Antivirus {//*An interface is a json object but implemented as a contract.That means in ts,you can only create objects by adhering to an interface,object type alias or object type annotation
    name:string;
    arr?:number[]
}
interface Soft {
    cool:boolean
}
interface Firewall extends Antivirus {
    protected:boolean
}
interface Cam extends Firewall,Antivirus {
    privacy:string
}
let avast:Antivirus = {name:'avast av'}
console.log(avast)
let fire:Firewall = {name:'windows',protected:true}
console.log(fire)
let cam:Cam = {name:'a',protected:true,privacy:'good'}
console.log(cam)

//*the intersection type inherits the characteristics of each type into one.You cannot intersect primitives
type combinedType = Antivirus & Soft
let combo:combinedType = {name:'yeah',cool:true}
console.log("COMBO",combo)

abstract class SomeObject {//*An abstract class can define concrete and abstarct methods.All abstract method must be implemented by inherited classes.You cant initialize an abstract class
    abstract printStuff():void//*You can only declare an abstract method not implement it
}
class Plant extends SomeObject {//*A class can implement an interface
    public static hydration:number = 0
    public name:string;//This declares an instance variable but not initialize it
    private money:number = 0
    public readonly id:number = 10
    constructor(name:string) {
        super()
        this.name = name//this initializes it
    }
    public printStuff(): void {
        console.log("some stuff")
    }
    public printName():void{
        console.log(this.name)
    }
    public static hydrate(plant:Plant):void {
        this.hydration = Plant.hydration + 1 
        console.log(`The plant,${plant.name} hydration level is: ${this.hydration}`)
    }
    get Money():number {
        return this.money
    }
    set Money(value:number) {
        this.money = value
    }
}

let flower:Plant = new Plant('hibiscus')
flower.printName()
Plant.hydrate(flower)
Plant.hydrate(flower)
console.log(flower.Money)
flower.Money = 10
console.log(flower.Money);
console.log(flower.id);
flower.printStuff()

//*Type guards
console.log(typeof 1)
console.log('name' in combo)
console.log(flower instanceof Plant)

//*Type assertion
let x:any = '10'
let y:number = x as number

//*It returns a union literal type of all the properties(keys) of the type specified.It allows us to acces properties in a type safe manner like using it to set a constraint on a generic type and also for mapping them to new types in a separate interface
type Key = keyof Cam;
let new_key:Key = 'name';//It has to be a key that already exists


type nameType = Cam['name']//*This assigns the type of name to the type alias,nameType


//!conditional types

//*Mapped types
interface Student {
    id:1090
    name:'Person',
    age:20
}
type NewStudent = {
    [key in keyof Student]?:Student[key]
}
type OptionalStudent = Pick<Student,'id'>//*Utility types

function printType<T extends number | string>(value:T):T {
    return value
}
console.log(printType<string>('person'))

interface SomeInterface<T> {
    name:T
}

let coin:SomeInterface<string> = {name:'ggag'}
console.log(coin);

//*Variable focused and type focused jsdoc tags
//*Structure:<tagname> {<type>} <variable name> - <description>
/**
 * TYPE TAG
 * @type {sometype}
 * 
 * PARAM TAG
 * @param {string} x-some description
 * 
 * TYPEDEF TAG.Must be in a separate js doc
 * @typedef {Object} Something
 * @property {number} id-Some description
 * 
 * TEMPLATE
 * @template T

 * RETURN
    @returns {string}

 * function
 * class
 * constructor
 * extends
 * implements
 * namespace
 * member of
 * example
 */