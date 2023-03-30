const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
let uri = "mongodb+srv://iis_blitz:tnizCAnUiiEEHM6@cluster0.hube4bm.mongodb.net/?retryWrites=true&w=majority" 

mongoose.connect(uri, {useNewUrlParser:true,useUnifiedTopology:true})

let userSchema = new mongoose.Schema({
  username:{type: String, required: true},
})

let exceSchema = new mongoose.Schema({
  user_id: {type:String, required:true},
  description:String,
  duration:Number,
  date:Date
})

let User = mongoose.model('User', userSchema)
let Exercise = mongoose.model('Exercise', exceSchema)

app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', async (req, res) => {
  try {
    const userList = await User.find();
    res.json(userList);
  } catch (err) {
    console.error(err);
    res.status(500).send("There was an error retrieving the user list");
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res.json(existingUser);
    }

    const newUser = new User({ username: req.body.username });
    const savedUser = await newUser.save();

    res.json(savedUser);
  } catch (error) {
    console.error(error);
    res.status(500).send("There was an error saving the user");
  }
});

app.post("/api/users/:_id/exercises", async (req,res)=>
{
  const id = req.params._id;
  const {description, duration, date} = req.body

  try{
    const user = await User.findById(id)
    if(!user){
      res.send("Could not find user")
    }else{
      const exerciseObj = new Exercise({
        user_id: user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      })

      const exercise = await exerciseObj.save()
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date (exercise.date).toDateString()
      })
    }
  }
  catch(err){
    console.log(err)
    res.send("there was an error saving the exercise")}
})

app.get("/api/users/:_id/logs", async (req, res)=>{
  const { from, to, limit} = req.query;
  const id = req.params._id
  const user = await User.findById(id);

  if(!user){res.send("Couldn't find user")
  return}

  let dateObj = {}
  if(from){
    dateObj["$gte"] = new Date (from)
  }
  if ( to) {
    dateObj["$lte"] = new Date (to)
  }
  let filter = {
    user_id: id
  }
  if(from || to){
    filter.date = dateObj;
  }


  const exercises = await Exercise.find(filter).limit(+limit ?? 500)

  const log = exercises.map ( e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }))

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log
  })
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
