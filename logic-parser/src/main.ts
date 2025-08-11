export class Text {
    public print(str:string):void {
        console.log(str);
    }
}
const text:Text = new Text();
text.print('Hello worlds');