//*toggle the classes based on intersection check
//*controls the circumstances that will invoke it
const options = {
    root:null,//*the container used to check for the visibilty of a target element.This will make the viewport the container
    rootMargin: "0px",//*extra space around the container used for calculations before the target element actually intersects it
    threshold: 1.0,//*The percentage of how much the target must intersect with the container before calling the callback.Using an array will allow you to specify thresholds at different levels
};
function loadImages(entries,observer) {
    for (let entry of entries) {
        if (entry.isIntersecting) {
            console.log(`${entry.target} is visible`);
        }
    }
}
const observer = new IntersectionObserver(loadImages,options)
const head = document.getElementById('head1');
observer.observe(head)

const head8 = document.getElementById('head8');
observer.observe(head8)