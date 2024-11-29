//*Creating the database
use('MY_DATABASE')

//*Creating the collection
db.createCollection('users')

//*Inserting documents and collections
db.users.insertOne({name:'person'})
db.users.insertMany([
    {
        name:'person2',
        age:12
    },
    {
        name:'person3',
        age:45
    },
    {
        name:'person4',
        age:30,
        shop:'mechanic'
    }
])

//*Querying the data
db.users.find()
db.users.findOne({age:12})
db.users.findOne({age:{$gt:12}})
db.users.find({age:{$lte:30}})
db.users.find({name:{$in:['person','person2']}})
db.users.find({$and:[{name:'person4'},{shop:'mechanic'}]})
db.users.find({$nor:[{name:'person'}]})




