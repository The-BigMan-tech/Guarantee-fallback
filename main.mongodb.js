db = connect('mongodb://localhost:27017/')
use ('me');
db.greetings.insertOne({ message: "Hello, World!" });
db.greetings.find().pretty();

