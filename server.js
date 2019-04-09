const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
// mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )

const userSchema = new mongoose.Schema({
  username: String,
})

const exerciseLogSchema = new mongoose.Schema({
    description: String,
    duration: Number,
    date: {
      type: Date,
      default: Date.now()
    },
  userId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User"      
    }
  });

const ExerciseLog = mongoose.model('ExerciseLog', exerciseLogSchema);
const User = mongoose.model("User", userSchema);

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

app.post('/api/exercise/new-user', async (req, res)=>{
  try{
    let user = await User.create({username: req.body.username});
    return res.json({
      _id: user._id,
      username: user.username
    })
  }
  catch(err){
    return res.json({
      error: err.message
    })
  }
})

app.post('/api/exercise/add', async(req, res)=>{
  try{
    let {userId, duration, description, date} = req.body;
    await ExerciseLog.create({userId, duration, description, date});
    let userPromise = User.findById(userId);
    let exercisePromise = ExerciseLog.find({userId});
    let [user, exerciseLogs] = await Promise.all([userPromise, exercisePromise])
    return res.json({exerciseLogs: [...exerciseLogs], ...user});
  }
  catch(err){
    return res.json({
      error: err.message
    })
  }
})

app.get('/api/exercise/log', async (req, res)=>{
  try{
    let {userId, from, to, limit} = req.query;
    let exerciseLogs = await ExerciseLog.find({userId: userId, date: {$gt: from, $lte: to} }).limit(limit);
  }
  catch(err){
    return res.json({
      error: err.message
    })
  }
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
