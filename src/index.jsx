import { render } from 'preact';
import preactLogo from './assets/preact.svg';
import './style.css';
import { useSignal, useSignalEffect } from '@preact/signals';
import { SendHorizontal } from 'lucide-react';
import SockJS from 'sockjs-client/dist/sockjs.min.js'
import { over } from 'stompjs';
import { useEffect } from 'react';



//import{useEffect} from "react"
var stompClient = null;
export function App() {
	
const data = useSignal({ message: "", phoneNumber: "" });
  const chatMessages = useSignal(null);
  const users = useSignal([]);

  
  const inputMessage = useSignal("");

  useSignalEffect(() => {
    var url = "https://mindqubewhatsapp.onrender.com/webhook/users";
    //var data = { username: "example" };
    fetch(url, {
      method: "GET", // or 'PUT'
      //body: JSON.stringify(data), // data can be `string` or {object}!
      // headers: {
      //   "Content-Type": "application/json",
      // },
    })
      .then((res) => res.json())
      .then((res) => (res ? sortmessages(res) : console.log("empty")))
      .then((res) => users.value= res)
      .then((res) => console.log("soy users fetch", res))
      .catch((error) => console.error("Error:", error));
    console.log("soy users fetch", users);

   
    document.querySelector('#sendMessage').addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        sendMessage()
        // code for enter
      }
  });
  
   
  });
  let consola = ()=>{
    console.log("testeando input event")
  }
  useEffect(() => {
    const connect = () => {
      let Sock = new SockJS("https://mindqubewhatsapp.onrender.com/ws");
      console.log("soy sock", Sock);
      stompClient = over(Sock);
      stompClient.connect({}, onConnected, onError);
    };
    connect();
  },[]);

  const sortmessages = (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i].whatsapp.sort((a, b) => a.timestamp - b.timestamp);
    }
    array.sort(
      (a, b) =>
        b.whatsapp[b.whatsapp.length - 1].timestamp -
        a.whatsapp[a.whatsapp.length - 1].timestamp
    );
    return array;
  };

  const onConnected = () => {
    stompClient.subscribe("/topic/public", onMessageReceived);
  };

  const onMessageReceived = (payload) => {
    var payloadData = JSON.parse(payload.body);
    console.log("soy payloadData",payloadData);
    console.log("soy users not iterable2", users.value);
    if (payloadData.type === "new user") {
      console.log("new user");
      if(!users.value.length){
        users.value = [payloadData.user]
      } else {
        users.value = [...users.value].unshift(payloadData.user);
        }
      }
    if (payloadData.type === "new message") {
      console.log("soy users not iterable", users.value);
      users.value = users.value.map((e)=>
        {if(e.phone === payloadData.phone){
           e.whatsapp.push(payloadData.message) 
      }
    return e})
      // let userMessageToAdd = users.value.find((e) => e.phone === payloadData.phone);

      // console.log("soy user message", userMessageToAdd);
      // let test = userMessageToAdd.whatsapp.push(payloadData.message);
      // userMessageToAdd.whatsapp = test
      // console.log("soy user message2", userMessageToAdd);
      //let updateList = [...users.value, userMessageToAdd];
      //console.log("soy el problema", updateList);
      //users.value = updateList;
      console.log("soy user value",users.value);
    }
    if (payloadData.type === "update message") {
      console.log("update message");
      users.value = users.value.map(e=>{
        if(e.phone === payloadData.phone){
        e.whatsapp.map(a=>{
          if(a.whatsapp_id === payloadData.message_id){
             if(!a.timestamp){a.timestamp = payloadData.timestamps}
          a.status = payloadData.status
        } return a})
      }return e})
      console.log("soy user value2",users.value);
    }
  };
                 
  const onError = (err) => {
    console.log(err);
  };

  useEffect(() => {
    const element = document.getElementById("messages");
    element.scrollTop = element.scrollHeight;
  }, [chatMessages.value,users.value]);

  const changeChatuser = (e) => {
    const newChat = users.value.find((item) => item.id === e);
    console.log(newChat);
    chatMessages.value = newChat;
   
  };

  const sendMessage = () => {
    if(!inputMessage.value || !chatMessages.value )return;
    var url = "https://mindqubewhatsapp.onrender.com/chat/reenviar";
    var data = { message: inputMessage.value, phoneNumber: chatMessages.value.phone };

    fetch(url, {
      method: "POST", 
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => {console.log("soy res",res) ;return res})
      .then((res) => res.json())
      .then((res) =>
        res
          ? saveMindqubeMessage(res)
          : console.log("empty fetch to chat/reenviar")
      )
     .catch((error) => console.error("Error:", error));
     inputMessage.value = ""
    console.log("soy enviando", inputMessage);
  };

  const saveMindqubeMessage = (payload) => { //need to configure for the templates
    console.log("soy payload de savemindqubemessage", payload);
    
    users.value = users.value.map(e=> {if(e.phone === payload.phone){
      e.whatsapp.push(payload.message)
    } return e})
   
    
  };

  const handleInput = (e) => {
    inputMessage.value = e.target.value;
   
    console.log("soy state", inputMessage.value);
  };

  return (
    <>
	
      <div className="box">
        <div className="userList">
          <ul className="insideUserList">
			       {users.value.length? 
              users.value.map((e, i) => (
                <li key={i} onClick={() => changeChatuser(e.id)}>
                  {e.name}
                </li>
              )):""}
          </ul>
        </div>
        <article className="textInputBody">
          <div className="textMessages" id="messages">
          
            {chatMessages.value &&
              chatMessages.value.whatsapp.map((e, i) => (
                <div key={i} className="rightMessage">
                  <div
                    className={`background-white text ${
                      e.name === "Mindqube" ? "rightMessageInside" : ""
                    }`}
                  >
                    <div>{e.name}</div>
                    <div>{e.message}</div>
                    <div>{chatMessages.value.phone}</div>
                    <div>{e.timestamp}</div>
                    <div>{e.status}</div>
                  </div>
                </div>
              ))}
              
          </div>
          <div className="inputBody">
            <input
             id="sendMessage"
              className="input"
              placeholder="message to send"
              onChange={handleInput}
              value={inputMessage.value}
            />
            <button className="button" onClick={sendMessage}>
              <SendHorizontal size={50} />
            </button>
          </div>
        </article>
      </div>
    </>
  );
		
	
}



render(<App />, document.getElementById('app'));
