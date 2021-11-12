import React, { useState, useEffect } from 'react'
import { db } from '../../firebaseConfig'
import { collection, getDocs, getDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { useSelector, useDispatch } from 'react-redux'
import "./chat.css"
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import {
  loginOkey,
  logOutUserAction,
  getUserAction,
  sortJobsBy,
} from "../../redux/actions";
import tokenAuth from "../config/token";
import { useHistory } from "react-router-dom";

//
import {
  getJuniors,
  getCompanies,
  getTechnologies,
  emailVerificationAction,
} from "../../redux/actions";

import NavBar from "../NavBar/NavBar";
//

const Chat2 = () => {



  const user = useSelector(state => state.user)

  var [nameUser2, setNameUser2] = useState(null);

  var [message, setMessage] = useState('')
  var [state, setState] = useState({

    messages: [],
    owners: null,
    ownersNames: null
  })
  var [chat, setChat] = useState(null);
  var [idUser2, setIdUser2] = useState(null);
  var [loading, setLoading] = useState(false);
  var [idChat, setIdChat] = useState(false);
  var [cambio, setCambio] = useState(false);


  function onChangeState(e) {
    setMessage(e.target.value)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (message == '') return alert("No puedes enviar un mensaje vacio")
    const list = !state.messages ? [] : state.messages
    const newMessage = {
      from: user._id,
      to: idUser2,
      id: !state.messages ? 0 : state.messages.length,
      text: message
    }
    list.push(newMessage)
    setMessage('')

    // Envia los datos a la db
    try {

      await setDoc(doc(db, "messages", idChat), {
        chat: list,
        owners: state.owners,
        ownersNames: state.ownersNames
      });

      setCambio(true)
    }
    catch (err) {
      console.log(err.message)
    }
  }

  if (idChat && cambio) {

    const unsub = onSnapshot(doc(db, "messages", idChat), (doc) => {
      console.log("Current data: ", doc.data());
      setState({
        messages: (!doc.data() ? [] : doc.data().chat),
        owners: (!doc.data() ? null : doc.data().owners),
        ownersNames: (!doc.data() ? null : doc.data().ownersNames)
      })
    });

    setCambio(false)
  }

  async function getChat(chatId) {
    setLoading(true)

    const docRef = doc(db, "messages", chatId);
    const docSnap = await getDoc(docRef);

    setState({
      messages: (!docSnap.data() ? [] : docSnap.data().chat),
      owners: (!docSnap.data() ? null : docSnap.data().owners),
      ownersNames: (!docSnap.data() ? null : docSnap.data().ownersNames)
    })

    if (docSnap.data() !== undefined) {

      setNameUser2(docSnap.data().ownersNames.user1 !== user.name ? docSnap.data().ownersNames.user1 : docSnap.data().ownersNames.user2)
    }

    setLoading(false)
    setMessage('')
    setCambio(true)
  }

  useEffect(async () => {

    // Trae los datos de la db cundo se carga la pagina o el chat
    const querySnapshot = await getDocs(collection(db, "messages"));
    var arrChats = [];
    querySnapshot.forEach((doc) => {
      // console.log(`${doc.id} => ${doc.data()}`);
      // console.log(doc.data().owners);

      if (doc.data().owners.user1 == (user ? user._id : null) || doc.data().owners.user2 == (user ? user._id : null)) {

        let { chat } = doc.data()

        arrChats.push({
          id: doc.id,
          chat: chat,
          owners: doc.data().owners,
          ownersNames: doc.data().ownersNames
        })
      }
    });
    setChat(arrChats)

  }, [user]);


  //----------------Autenticacion-----------------

  const { emailVerification } = useSelector((state) => state);
  const dispatch = useDispatch();
  const history = useHistory();

  const token = localStorage.getItem("token");
  const userType = localStorage.getItem("userType");
  useEffect(() => {
    if (token && user) {
      tokenAuth(token);
    }
  }, [user]);

  useEffect(() => {
    if (userType === "null") history.push("/");
  }, []);

  onAuthStateChanged(auth, (userFirebase) => {
    if (userFirebase) {
      if (user && userFirebase.emailVerified) return;
      dispatch(getUserAction(userFirebase));
    } else {
      history.push(`/`);
    }
  });
  //----------------Autenticacion-----------------


  return (<>

    <NavBar />

    <div className="container">
      <div className="row clearfix ">
        <div className="col">

          <div className="card chat-app">
            <div id="plist" className="people-list h-100">
              <div className="input-group">
                <div className="input-group-prepend">
                  <i className="input-group-text fa fa-search"></i>
                </div>
                <input type="text" className="form-control" placeholder="Search..." />
              </div>
              <ul className="list-unstyled chat-list mt-2 mb-3">

                {/*Hacer un map aquí*/}
                {/*<li className="clearfix">
                  <img src="https://bootdey.com/img/Content/avatar/avatar1.png" alt="avatar" />
                  <div className="about">
                    <div className="name">Vincent Porter</div>
                    <div className="status"> <i className="fa fa-circle offline"></i> left 7 mins ago </div>
                  </div>
                </li>*/}

                {
                  chat ? chat.map((e, i) =>

                    <li className="clearfix" key={i} onClick={() => { setIdUser2(e.owners.user1 !== user._id ? e.owners.user1 : e.owners.user2); getChat(e.id); setIdChat(e.id) }}>
                      <img src="https://bootdey.com/img/Content/avatar/avatar1.png" alt="avatar" />
                      <div className="about">

                        <div className="name">{e.ownersNames.user1 !== user.name ? e.ownersNames.user1 : e.ownersNames.user2}</div>

                      </div>
                    </li>


                  ) : <h5>Cargando...</h5>
                }

              </ul>
            </div>

            <div className="chat px-2 scroll">
              <div className="chat-header clearfix">
                <div className="row">
                  <div className="col-lg-6">
                    <a href="javascript:void(0);" data-toggle="modal" data-target="#view_info">
                      <img src="https://bootdey.com/img/Content/avatar/avatar1.png" />
                    </a>
                    <div className="chat-about">
                      <h6 className="m-b-0">{nameUser2}</h6>
                    </div>
                  </div>
                  <div className="col-lg-6 hidden-sm text-right">
                    <a href="javascript:void(0);" className="btn btn-outline-secondary"><i className="fa fa-camera"></i></a>
                    <a href="javascript:void(0);" className="btn btn-outline-primary"><i className="fa fa-image"></i></a>
                    <a href="javascript:void(0);" className="btn btn-outline-info"><i className="fa fa-cogs"></i></a>
                    <a href="javascript:void(0);" className="btn btn-outline-warning"><i className="fa fa-question"></i></a>
                  </div>
                </div>
              </div>


              <div className="chat-history">
                <ul className="mb-3">

                  {
                    state.messages ? state.messages.map((e, i) => (

                      e.from == user._id

                        ? <li className="clearfix" key={i}>
                          <div className="message other-message float-right">{e.text}</div>
                        </li>

                        : <li className="clearfix" key={i}>
                          <div className="message my-message">{e.text}</div>
                        </li>
                    )

                    ) : <h5>Cargando...</h5>
                  }

                  {/*<li className="clearfix">
                    <div className="message-data">
                      <span className="message-data-time">10:12 AM, Today</span>
                    </div>
                    <div className="message my-message">Are we meeting today?</div>
                  </li>

                  <li className="clearfix">
                    <div className="message-data">
                      <span className="message-data-time">10:15 AM, Today</span>
                    </div>
                    <div className="message my-message">Project has been already finished and I have results to show you.</div>
                  </li>*/}

                </ul>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="chat-message clearfix">

                  <div className="input-group mb-3">

                    <div className="input-group-prepend">
                      <button type="submit" className="input-group-text"><i className="fa fa-send"></i></button>
                    </div>

                    <input type="text" className="form-control" value={message} placeholder="Escribe algo..." onChange={(e) => onChangeState(e)} />

                  </div>
                </div>
              </form>

            </div>
          </div>
        </div>
      </div>
    </div>

  </>)
}

export default Chat2
