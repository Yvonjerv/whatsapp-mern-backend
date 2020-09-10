//importing 
import express from "express";
import mongoose from 'mongoose';
import Messages from "./dbMessages.js";
import Pusher from "pusher"
import cors from "cors";

//app config
const app = express()
const port = process.env.PORT || 9000


var pusher = new Pusher({
  appId: "1070352",
  key: "078bf237a82097d98e5e",
  secret: "2b0b80f1896d1dc2d05c",
  cluster: "mt1",
  encrypted: true,
});




//middleware
app.use(express.json())
app.use((req, res, next) =>{
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
});

app.use(cors())


//DB config
const connection_url =
  "mongodb+srv://admin:wJXDiaRXDzq7MHij@cluster0.u546u.mongodb.net/whatsappdb?retryWrites=true&w=majority";

mongoose.connect(connection_url,{
    userCreateIndex: true,
    userNewUrlParser: true,
    useUnifiedTopology: true
})

//???

const db = mongoose.connection

db.once('open', ()=>{
    console.log('DB connect')

const msgCollection = db.collection("messagecontents");
const changeStream = msgCollection.watch();
changeStream.on('change', (change)=>{
    console.log('change occured', change);

if(change.operationType === 'insert'){
    const messageDetails = change.fullDocument;
    pusher.trigger("messages", "inserted", {
      name: messageDetails.user,
      message: messageDetails.message,
      timestamp: messageDetails.timestamp,
      received: messageDetails.received,
    });
}else{
    console.log('Error triggering Pusher')
}

});

});


//api routes
app.get('/', (req, res) => res.status(200).send('hello world'))


app.get("/messages/sync", (req, res) =>{
    Messages.find((err, data) =>{
        if (err){
            res.status(500).send(err);
        }else{
            res.status(200).send(data);
        }
    })
})


app.post('/messages/new', (req, res) =>{
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) =>{
        if(err){
            res.status(500).send(err)
        } else {
            res.status(201).send(`${data}`)
        }
    })
})


//listener
app.listen(port, ()=> console.log(`Listening on localhost:${port}`));