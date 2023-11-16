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
      .then((res) => (res ? sortmessages(res) : console.log("empty fetch useEffect")))
      .then((res) => users.value= res)
      .then((res) => console.log("im fetch", res))
      .catch((error) => console.error("Error:", error));
    

   
    document.querySelector('#sendMessage').addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        sendMessage()
        // code for enter
      }
  });
  
   
  });
  
  useEffect(() => {
    const connect = () => {
      let Sock = new SockJS("https://mindqubewhatsapp.onrender.com/ws");
      console.log("im sock", Sock);
      stompClient = over(Sock);
      stompClient.connect({}, onConnected, onError);
    };
    connect();
  },[]);

  //useEffect(() => {
    // let file = document.getElementsByName("file-input")[0]
    // file.addEventListener("change", (e) => {
    //   console.log(e);
    // });
  //}, []);

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
    console.log("im payloadData",payloadData);
    
    if (payloadData.type === "new user") {
      console.log("new user");
      if(!users.value.length){
        users.value = [payloadData.user]
      } else {
        // let updateUserList = [...users.value,payloadData.user]
        // users.value = sortmessages(updateUserList);
        // console.log("im new user result", users.value);
        users.value = [payloadData.user,...users.value]
        }
      }
    if (payloadData.type === "new message") {
      
      let messageAdded = [...users.value].map((e)=>
        {if(e.phone === payloadData.phone){
           e.whatsapp.push(payloadData.message) 
      }
    return e})
    users.value = sortmessages(messageAdded)
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
      .then((res) => {console.log("im fetch res",res) ;return res})
      .then((res) => res.json())
      .then((res) =>
        res
          ? saveMindqubeMessage(res)
          : console.log("empty fetch to chat/reenviar")
      )
     .catch((error) => console.error("Error:", error));
     inputMessage.value = ""
    
  };

  const saveMindqubeMessage = (payload) => { //need configure for the templates
    users.value = users.value.map(e=> {if(e.phone === payload.phone){
      e.whatsapp.push(payload.message)
    } return e})
   };

  const handleInput = (e) => {
    inputMessage.value = e.target.value;
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
                      e.name === "Mindqube" ? "rightMessageInside" : "marginLeft"
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
            {/* <input type="file" id="file-input" name="file-input" className="hidden"/>
            <label for="file-input">choose image</label> */}


          </div>
        </article>
      </div>
    </>
  );
		
	
}



render(<App />, document.getElementById('app'));
