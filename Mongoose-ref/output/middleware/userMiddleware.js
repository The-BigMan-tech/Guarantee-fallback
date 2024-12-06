export function validateUser(request, response, next) {
    let userpassword = request.headers['authorization'];
    const validpassword = 'password1234';
    if (userpassword == validpassword) {
        console.log("password matches", userpassword);
        next();
    }
    else {
        console.log(userpassword);
        response.status(401).send('Unauthorized');
    }
}
