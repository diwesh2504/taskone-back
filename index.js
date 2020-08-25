const PORT=process.env.PORT || 4040;
const express=require('express');
const server=express().listen(PORT,()=>{console.log("listening")});
const mongodb=require('mongodb');
//const mongo_url="mongodb://localhost:27017";
const mongo_url="mongodb+srv://admin:admin123@cluster0.sln75.mongodb.net/taskone?retryWrites=true&w=majority";
const {Server}=require('ws');
const wss=new Server({server});

wss.on('connection',async (ws,req)=>{
    
    console.log("new client connected");
    //For SENDING Initial Button State
    try{
        let client=await mongodb.connect(mongo_url);
        let db=client.db("taskone");
        let initial=await db.collection("buttons").find().toArray();
        //console.log("INitial",initial);
        let status_1=initial[0].status;
        let status_2=initial[1].status;
        ws.send(JSON.stringify({type:"INITIAL",status_1,status_2}));

    }catch(err){
        console.log("Error sending initial");
    }
    ws.on("message",async (msg)=>{
        let received=JSON.parse(msg);
        
        //For Handling LOGIN 
        if(received.type==="LOGIN"){
            let ty="LOGIN"//For Letting the user know for what process the value is returned to Client.
            try{
                let client=await mongodb.connect(mongo_url);
                let db=client.db("taskone");
                let data=await db.collection("users").findOne({email:received.email});
                if(data===null){
                    ws.send(JSON.stringify({type:ty,message:"not found"}));
                }else{
                    if(data.password===received.pass)
                         ws.send(JSON.stringify({type:ty,message:"Success",user:data.email}));
                     else
                         ws.send(JSON.stringify({type:ty,message:"Incorrect password"}));
                }
            }catch(err){
                console.log("SOME ERROR IN BACKEND");
            }

        }
        //For Handling Enable and disable
        else if(received.type==="TOGGLE"){
            console.log("TOGGLE");
            console.log("received for toggling",received);
            try{
                let client=await mongodb.connect(mongo_url);
                let db=client.db("taskone");
                let data=await db.collection("buttons").findOne({name:received.button});
                if(data.status==="enabled")
                {
                    let new_data=await db.collection("buttons").findOneAndUpdate({name:received.button},{$set:{status:"disabled"}},{returnOriginal:false});
                    //console.log("new_data",new_data);
                    ws.send(JSON.stringify({type:"TOGGLE",button:new_data.value.name,status:new_data.value.status}));
                }
                else
                {
                    let new_data=await db.collection("buttons").findOneAndUpdate({name:received.button},{$set:{status:"enabled"}},{returnOriginal:false});
                    //console.log("new_data",new_data);
                    ws.send(JSON.stringify({type:"TOGGLE",button:new_data.value.name,status:new_data.value.status}));
                }
            }catch(err){
                console.log("ERROR TOGGLING");
            }
        }
    });
});
