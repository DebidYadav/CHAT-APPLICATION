const express = require('express');
const socketio=require('socket.io');
const http=require('http');
const cors=require('cors');

const PORT=process.env.PORT || 5000;

const {addUser,removeUser,getUser,getUserInRoom} =  require('./users');

const router=require('./router');

const app=express();
const server=http.createServer(app);
const io=socketio(server);
app.use(cors());
app.use(router);

io.on('connection',(socket)=>{

    socket.on('join',({name,room},callback)=>{
    const {error,user}=addUser({id:socket.id,name,room});
    if(error) return callback(error);

    socket.emit('message',{user:'admin',text:`${user.name},Welcome to the room ${user.room}.`});
    socket.broadcast.to(user.room).emit('message',{user:'admin', text:`${user.name} has joined!`});
    io.to(user.room).emit('roomData',{room:user.room,users:getUserInRoom(user.room)});

    socket.join(user.room);

    callback();
    }); 

    socket.on('sendMessage',(message,callback)=>{
        const user=getUser(socket.id);
        io.to(user.room).emit('message',{user:user.name, text:message});
        callback();
    });

    socket.on('disconnect',()=>{
        const user=removeUser(socket.id);

        if(user){
            io.to(user.room).emit('message',{user:'admin',text:`${user.name} has left`});
            io.to(user.room).emit('roomData',{room:user.room, users:getUserInRoom(user.room)});
        }
    })
});

server.listen(PORT, () =>console.log(`Server has started on ${PORT}`));
