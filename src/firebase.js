import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAOZOUP_DDeChaOpHflays2M6yde_iu_Cc",
  authDomain: "todo-app-duc-thanh.firebaseapp.com",
  projectId: "todo-app-duc-thanh",
  storageBucket: "todo-app-duc-thanh.firebasestorage.app",
  messagingSenderId: "421007912988",
  appId: "1:421007912988:web:1810a3ca59a3b1d710efd9",
  measurementId: "G-R55F8R5KQQ"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
