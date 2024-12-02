const { subscribe } = require("diagnostics_channel")

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
    },
    {
        name:'donkey',
        animal:'donkey',
        parents:'donkeys'
    }
])

//*Querying/Returning the data
db.users.find()
db.users.findOne({age:12})
db.users.findOne({age:{$gt:12}})
db.users.find({age:{$lte:30}})
db.users.find({name:{$in:['person','person2']}})
db.users.find({$and:[{name:'person4'},{shop:'mechanic'}]})
db.users.find({$nor:[{name:'person'}]})


//*Updating the document
//?first par is selection criteria,second is the updated doc 
db.users.updateOne({name:'person2'},{$set:{name:'Not a person'}})
db.users.updateMany({name:'person'},{$set:{name:'A new person'}})
db.users.replaceOne({name:'person3'},{name:'not implemented'})//*same as update but completely overwrites the doument as opposed to just updating it


//*Deleteing data from the document
db.users.deleteMany({name:'person4'})//*removes documents that follows the selection criteria
//db.users.deleteMany({})

//*Projection
db.users.find({name:'donkey'},{parents:1})//*1 means include,0 means exclude

//*limit and skip return
db.users.find({name:'donkey'}).limit(4).skip(8)

//*sorting 
db.users.find({}).sort({name:1})//*the number reps the order


//*Indexing
db.users.createIndex({name:1})//*means indexing all the name properties in ascending order
db.users.find({name:'donkey'}).explain('executionStats')
db.users.getIndexes()
//db.users.dropIndex("name_1")//*drop index by name
db.users.dropIndexes({name:1})//*drop index by field
//*it is mongo db that will benefit from the indexes when you perform ops on the document


//*aggregation which is a map for documents
db.createCollection('Gamers')
db.gamers.insertMany([{
    name: "GamerSteve",
    subscribers: 15000,
    gameMode: "Survival",
    excelAt: "Building elaborate structures",
    hatesCreepers: true
  },
  {
    name: "PixelWarrior",
    subscribers: 25000,
    gameMode: "Creative",
    excelAt: "Redstone engineering",
    hatesCreepers: false
  },
  {
    name: "CraftyNinja",
    subscribers: 12000,
    gameMode: "Hardcore",
    excelAt: "Survival challenges",
    hatesCreepers: true
  },
  {
    name: "BlockBuilder",
    subscribers: 18000,
    gameMode: "Survival",
    excelAt: "Architecture and design",
    hatesCreepers: true
  },
  {
    name: "MineMaster",
    subscribers: 30000,
    gameMode: "Adventure",
    excelAt: "Exploring and combat",
    hatesCreepers: false
  }
])
db.gamers.insertOne({
    name:'CraftyNinja',
    hatesCreepers:true,
    subscribers:100
})

//*an object will have to bypass each stage to reaches to a later stage
db.gamers.aggregate([
    {
        $match: {
            hatesCreepers:true
        }
    },
    {
        $project: {
            gameMode:0,
            excelAt:0
        }
    },
    {
        $group: {
            _id:'$name',
            total_subs: {
                $sum:'$subscribers'
            }
        }
    },
    {
        $sort:{
            _id:1
        }
    }
])

//*learn about replica set and sharding,creating backup
//*reference relationship,dbref
//*analyzing query performance using $explain and $hint
//*using text search and regex for search bar
//*transactions
//*Grid fs for file with multer
//*capped collection for cache data and logs


db.createCollection('capped',{capped:true,size:1024 * 1024,max:20})
db.gamers.stats().size
