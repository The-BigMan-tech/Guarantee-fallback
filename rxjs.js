const {Obsevable} = 'rxjs';

const observable = new Observable(subscriber => {
    subscriber.next(1);
});
const observer = {
    next:(value) => {
        console.log(value);
    }
}