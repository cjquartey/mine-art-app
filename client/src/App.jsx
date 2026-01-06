import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function testBackend(){
      const response = await axios.get('http://localhost:5000/api/health');
      setMessage(response.data.message);
    }

    testBackend();
  }, [])

  return (
    <div>
      <h1>Image Vectorisation App</h1>
      <p>Backend message: {message}</p>
    </div>
  )
}

export default App
